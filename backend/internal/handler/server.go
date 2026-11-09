package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/tiers-undiknas/capstone-group07-2026/backend/api"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/auth"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/repository"
)

type Server struct {
	userRepo   repository.UserRepository
	jwtManager *auth.JWTManager
	loginLock  *auth.LoginLockManager
}

func NewServer(
	userRepo repository.UserRepository,
	jwtManager *auth.JWTManager,
	loginLock *auth.LoginLockManager,
) *Server {
	return &Server{
		userRepo:   userRepo,
		jwtManager: jwtManager,
		loginLock:  loginLock,
	}
}

// GetHealth melayani GET /health
func (s *Server) GetHealth(c *gin.Context) {
	c.JSON(http.StatusOK, api.HealthResponse{
		Status: "ok",
	})
}

// PostAuthLogin melayani POST /auth/login
// - Verifikasi email dan password hash
// - LoginLock (blokir 15 menit jika salah 5 kali) -> HTTP 423
// - Penerbitan JWT RS256 dengan klaim sub, tid, dan role (15 menit) -> HTTP 200
func (s *Server) PostAuthLogin(c *gin.Context) {
	var req api.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.ErrorResponse{
			Message: "Permintaan login tidak valid, periksa format email dan kata sandi",
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(string(req.Email)))
	if email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, api.ErrorResponse{
			Message: "Email dan kata sandi wajib diisi",
		})
		return
	}

	// 1. Cek apakah akun sedang terkunci karena limit percobaan
	if locked, remaining := s.loginLock.IsLocked(email); locked {
		c.JSON(http.StatusLocked, api.ErrorResponse{
			Message: fmt.Sprintf("Akun Anda terkunci sementara karena 5 kali percobaan login gagal. Silakan coba lagi dalam %d menit.", int(remaining.Minutes())+1),
		})
		return
	}

	// 2. Cari user di database berdasarkan email
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.ErrorResponse{
			Message: "Terjadi kesalahan internal pada server",
		})
		return
	}

	if user == nil {
		locked, attemptsLeft := s.loginLock.RecordFailure(email)
		if locked {
			c.JSON(http.StatusLocked, api.ErrorResponse{
				Message: "Akun Anda terkunci selama 15 menit karena mencapai batas 5 kali percobaan login gagal.",
			})
			return
		}
		c.JSON(http.StatusUnauthorized, api.ErrorResponse{
			Message: fmt.Sprintf("Email atau kata sandi tidak valid. Sisa percobaan: %d", attemptsLeft),
		})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, api.ErrorResponse{
			Message: "Akun Anda sedang dinonaktifkan, hubungi administrator",
		})
		return
	}

	// 3. Verifikasi hash password (bcrypt)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		locked, attemptsLeft := s.loginLock.RecordFailure(email)
		if locked {
			c.JSON(http.StatusLocked, api.ErrorResponse{
				Message: "Akun Anda terkunci selama 15 menit karena mencapai batas 5 kali percobaan login gagal.",
			})
			return
		}
		c.JSON(http.StatusUnauthorized, api.ErrorResponse{
			Message: fmt.Sprintf("Email atau kata sandi tidak valid. Sisa percobaan: %d", attemptsLeft),
		})
		return
	}

	// 4. Reset counter percobaan saat login berhasil
	s.loginLock.RecordSuccess(email)

	// 5. Terbitkan token JWT RS256 (klaim: sub, tid, role, masa berlaku 15 menit)
	tokenString, expiresIn, err := s.jwtManager.GenerateToken(user.ID, user.TenantID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.ErrorResponse{
			Message: "Gagal menerbitkan token otentikasi",
		})
		return
	}

	c.JSON(http.StatusOK, api.LoginResponse{
		AccessToken: tokenString,
		TokenType:   "Bearer",
		ExpiresIn:   expiresIn,
	})
}

// PostAuthLogout melayani POST /auth/logout
func (s *Server) PostAuthLogout(c *gin.Context) {
	c.JSON(http.StatusOK, api.MessageResponse{
		Message: "Logout berhasil",
	})
}
