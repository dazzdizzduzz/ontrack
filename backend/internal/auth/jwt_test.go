package auth

import (
	"testing"
	"time"
)

func TestJWTManager_GenerateAndValidateToken(t *testing.T) {
	manager, err := NewJWTManager("", "")
	if err != nil {
		t.Fatalf("Failed to create JWTManager: %v", err)
	}

	userID := "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44"
	tenantID := "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
	role := "owner"

	tokenString, expiresIn, err := manager.GenerateToken(userID, tenantID, role)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	if tokenString == "" {
		t.Error("Expected non-empty token")
	}

	if expiresIn != int((15 * time.Minute).Seconds()) {
		t.Errorf("Expected expires_in 900, got %d", expiresIn)
	}

	claims, err := manager.ValidateToken(tokenString)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if claims.Subject != userID {
		t.Errorf("Expected sub %s, got %s", userID, claims.Subject)
	}
	if claims.Tid != tenantID {
		t.Errorf("Expected tid %s, got %s", tenantID, claims.Tid)
	}
	if claims.Role != role {
		t.Errorf("Expected role %s, got %s", role, claims.Role)
	}
}

