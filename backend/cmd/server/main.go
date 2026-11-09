package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/tiers-undiknas/capstone-group07-2026/backend/api"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/auth"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/config"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/database"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/handler"
	"github.com/tiers-undiknas/capstone-group07-2026/backend/internal/repository"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Inisialisasi Database PostgreSQL
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		log.Printf("Peringatan: Gagal terhubung ke database: %v", err)
	} else {
		defer db.Close()
		log.Println("Berhasil terhubung ke database PostgreSQL")
	}

	// 2. Inisialisasi Repository & Manager
	userRepo := repository.NewUserRepository(db)

	jwtManager, err := auth.NewJWTManager(cfg.JWTPrivateKey, cfg.JWTPublicKey)
	if err != nil {
		log.Fatalf("Gagal inisialisasi JWT Manager: %v", err)
	}

	loginLock := auth.NewLoginLockManager()

	// 3. Inisialisasi Server Handler
	srv := handler.NewServer(userRepo, jwtManager, loginLock)

	// 4. Inisialisasi Gin Router
	r := gin.Default()
	api.RegisterHandlers(r, srv)

	port := ":" + cfg.ServerPort
	log.Printf("Server OnTrack berjalan pada port %s", port)
	if err := r.Run(port); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}
