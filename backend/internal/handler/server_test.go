package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/tiers-undiknas/capstone-group07-2026/backend/api"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/auth"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/repository"
)

type mockUserRepo struct {
	users map[string]*repository.User
}

func (m *mockUserRepo) FindByEmail(email string) (*repository.User, error) {
	return m.users[email], nil
}

func setupTestRouter() (*gin.Engine, *auth.LoginLockManager) {
	gin.SetMode(gin.TestMode)

	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	userRepo := &mockUserRepo{
		users: map[string]*repository.User{
			"owner@ontrack.id": {
				ID:           "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
				TenantID:     "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
				Email:        "owner@ontrack.id",
				PasswordHash: string(hash),
				FullName:     "Owner OnTrack",
				Role:         "owner",
				IsActive:     true,
			},
		},
	}

	jwtManager, _ := auth.NewJWTManager("", "")
	loginLock := auth.NewLoginLockManager()
	srv := NewServer(userRepo, jwtManager, loginLock)

	r := gin.New()
	api.RegisterHandlers(r, srv)
	return r, loginLock
}

func TestPostAuthLogin_Success(t *testing.T) {
	r, _ := setupTestRouter()

	body, _ := json.Marshal(map[string]string{
		"email":    "owner@ontrack.id",
		"password": "password123",
	})

	req, _ := http.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp api.LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.AccessToken == "" {
		t.Error("Expected non-empty access_token")
	}
	if resp.TokenType != "Bearer" {
		t.Errorf("Expected token_type Bearer, got %s", resp.TokenType)
	}
	if resp.ExpiresIn != 900 {
		t.Errorf("Expected expires_in 900, got %d", resp.ExpiresIn)
	}
}

func TestPostAuthLogin_InvalidPassword(t *testing.T) {
	r, _ := setupTestRouter()

	body, _ := json.Marshal(map[string]string{
		"email":    "owner@ontrack.id",
		"password": "wrongpassword",
	})

	req, _ := http.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized, got %d", w.Code)
	}
}

func TestPostAuthLogin_AccountLockoutAfterFiveAttempts(t *testing.T) {
	r, _ := setupTestRouter()

	body, _ := json.Marshal(map[string]string{
		"email":    "owner@ontrack.id",
		"password": "wrongpassword",
	})

	// 5 failed attempts
	for i := 1; i <= 5; i++ {
		req, _ := http.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if i < 5 && w.Code != http.StatusUnauthorized {
			t.Fatalf("Attempt %d: expected 401, got %d", i, w.Code)
		}
		if i == 5 && w.Code != http.StatusLocked {
			t.Fatalf("Attempt 5: expected 423 Locked, got %d", w.Code)
		}
	}

	// 6th attempt (even with right password) must be locked (HTTP 423)
	validBody, _ := json.Marshal(map[string]string{
		"email":    "owner@ontrack.id",
		"password": "password123",
	})
	req, _ := http.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(validBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusLocked {
		t.Fatalf("Attempt after lock: expected 423 Locked, got %d", w.Code)
	}
}

func TestPostAuthLogout(t *testing.T) {
	r, _ := setupTestRouter()

	req, _ := http.NewRequest(http.MethodPost, "/auth/logout", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}
}

