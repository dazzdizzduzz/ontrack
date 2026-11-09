package auth

import (
	"sync"
	"time"
)

const (
	MaxFailedAttempts = 5
	LockDuration      = 15 * time.Minute
)

type lockEntry struct {
	failedAttempts int
	lockedUntil    time.Time
}

type LoginLockManager struct {
	mu      sync.RWMutex
	entries map[string]*lockEntry
}

func NewLoginLockManager() *LoginLockManager {
	return &LoginLockManager{
		entries: make(map[string]*lockEntry),
	}
}

// IsLocked memeriksa apakah akun sedang dalam kondisi terblokir.
func (m *LoginLockManager) IsLocked(email string) (bool, time.Duration) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	entry, exists := m.entries[email]
	if !exists {
		return false, 0
	}

	if time.Now().Before(entry.lockedUntil) {
		remaining := time.Until(entry.lockedUntil)
		return true, remaining
	}

	return false, 0
}

// RecordFailure mencatat percobaan login yang gagal.
// Mengembalikan (locked, attemptsLeft).
func (m *LoginLockManager) RecordFailure(email string) (bool, int) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, exists := m.entries[email]
	now := time.Now()

	if !exists {
		entry = &lockEntry{}
		m.entries[email] = entry
	}

	// Jika lock sebelumnya sudah lewat, reset counter
	if !entry.lockedUntil.IsZero() && now.After(entry.lockedUntil) {
		entry.failedAttempts = 0
		entry.lockedUntil = time.Time{}
	}

	entry.failedAttempts++

	if entry.failedAttempts >= MaxFailedAttempts {
		entry.lockedUntil = now.Add(LockDuration)
		return true, 0
	}

	attemptsLeft := MaxFailedAttempts - entry.failedAttempts
	return false, attemptsLeft
}

// RecordSuccess mereset status gagal saat login berhasil.
func (m *LoginLockManager) RecordSuccess(email string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.entries, email)
}

