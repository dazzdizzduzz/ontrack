package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type User struct {
	ID           string
	TenantID     string
	DepartmentID sql.NullString
	PositionID   sql.NullString
	Email        string
	PasswordHash string
	FullName     string
	Role         string
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type UserRepository interface {
	FindByEmail(email string) (*User, error)
}

type postgresUserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) FindByEmail(email string) (*User, error) {
	query := `
		SELECT id, tenant_id, department_id, position_id, email, password_hash, full_name, role, is_active, created_at, updated_at
		FROM users
		WHERE email = $1
		LIMIT 1;
	`
	row := r.db.QueryRow(query, email)

	var u User
	err := row.Scan(
		&u.ID,
		&u.TenantID,
		&u.DepartmentID,
		&u.PositionID,
		&u.Email,
		&u.PasswordHash,
		&u.FullName,
		&u.Role,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query user by email: %w", err)
	}

	return &u, nil
}
