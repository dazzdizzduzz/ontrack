package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type CustomClaims struct {
	Tid  string `json:"tid"`
	Role string `json:"role"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
}

func NewJWTManager(privateKeyPEM, publicKeyPEM string) (*JWTManager, error) {
	if privateKeyPEM != "" {
		block, _ := pem.Decode([]byte(privateKeyPEM))
		if block == nil {
			return nil, errors.New("failed to parse PEM block containing private key")
		}

		privKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			pkcs8Key, err2 := x509.ParsePKCS8PrivateKey(block.Bytes)
			if err2 != nil {
				return nil, fmt.Errorf("failed to parse RSA private key: %w (pkcs8: %v)", err, err2)
			}
			var ok bool
			privKey, ok = pkcs8Key.(*rsa.PrivateKey)
			if !ok {
				return nil, errors.New("provided key is not an RSA private key")
			}
		}

		var pubKey *rsa.PublicKey
		if publicKeyPEM != "" {
			pubBlock, _ := pem.Decode([]byte(publicKeyPEM))
			if pubBlock != nil {
				parsedPub, err := x509.ParsePKIXPublicKey(pubBlock.Bytes)
				if err == nil {
					pubKey, _ = parsedPub.(*rsa.PublicKey)
				}
			}
		}
		if pubKey == nil {
			pubKey = &privKey.PublicKey
		}

		return &JWTManager{
			privateKey: privKey,
			publicKey:  pubKey,
		}, nil
	}

	// Otomatis buat keypair RSA 2048-bit jika belum diset di environment
	generatedKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, fmt.Errorf("failed to generate RSA keypair: %w", err)
	}

	return &JWTManager{
		privateKey: generatedKey,
		publicKey:  &generatedKey.PublicKey,
	}, nil
}

func (m *JWTManager) GenerateToken(userID, tenantID, role string) (string, int, error) {
	const ttl = 15 * time.Minute
	expirationTime := time.Now().Add(ttl)

	claims := CustomClaims{
		Tid:  tenantID,
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenString, err := token.SignedString(m.privateKey)
	if err != nil {
		return "", 0, fmt.Errorf("failed to sign token with RS256: %w", err)
	}

	return tokenString, int(ttl.Seconds()), nil
}

func (m *JWTManager) ValidateToken(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.publicKey, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

