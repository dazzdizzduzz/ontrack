package auth

import (
	"testing"
)

func TestLoginLockManager_FiveFailuresLocksAccount(t *testing.T) {
	lock := NewLoginLockManager()
	email := "test@ontrack.id"

	// 1-4 failures: not locked
	for i := 1; i <= 4; i++ {
		locked, attemptsLeft := lock.RecordFailure(email)
		if locked {
			t.Errorf("Attempt %d: expected not locked", i)
		}
		if attemptsLeft != 5-i {
			t.Errorf("Attempt %d: expected %d attempts left, got %d", i, 5-i, attemptsLeft)
		}
	}

	// 5th failure: must lock
	locked, attemptsLeft := lock.RecordFailure(email)
	if !locked {
		t.Error("Attempt 5: expected account to be locked")
	}
	if attemptsLeft != 0 {
		t.Errorf("Attempt 5: expected 0 attempts left, got %d", attemptsLeft)
	}

	// IsLocked should report true
	isLocked, remaining := lock.IsLocked(email)
	if !isLocked {
		t.Error("Expected IsLocked to return true")
	}
	if remaining <= 0 {
		t.Error("Expected positive remaining duration")
	}

	// RecordSuccess resets
	lock.RecordSuccess(email)
	isLocked, _ = lock.IsLocked(email)
	if isLocked {
		t.Error("Expected account not locked after RecordSuccess")
	}
}

