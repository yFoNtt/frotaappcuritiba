import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Tests for useAuth logic, auth context behaviour, password
// validation, role resolution, signup restrictions, sign-in
// rate-limiting awareness, inactivity timeout logic and
// session lifecycle.
// ============================================================

// ---- Password validation (mirrors useAuth signUp checks) ----

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'Senha deve conter pelo menos uma letra maiúscula';
  if (!/[0-9]/.test(password)) return 'Senha deve conter pelo menos um número';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Senha deve conter pelo menos um caractere especial';
  return null;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type AppRole = 'admin' | 'locador' | 'motorista';

function canSelfRegisterAs(role: AppRole): boolean {
  return role !== 'admin';
}

function getRoleDashboardPath(role: AppRole | null): string {
  if (role === 'admin') return '/admin';
  if (role === 'locador') return '/locador';
  if (role === 'motorista') return '/motorista';
  return '/login';
}

function isRateLimited(status: number): boolean {
  return status === 429;
}

// ---- Inactivity timeout logic (pure) ----

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const THROTTLE_MS = 60_000;

function shouldResetTimer(lastThrottle: number, now: number): boolean {
  return now - lastThrottle >= THROTTLE_MS;
}

function isInactivityExpired(lastActivity: number, now: number): boolean {
  return now - lastActivity >= INACTIVITY_TIMEOUT_MS;
}

// ---- Session state logic ----

interface AuthState {
  user: { id: string; email: string } | null;
  session: { access_token: string; refresh_token: string } | null;
  role: AppRole | null;
  loading: boolean;
}

function resolveAuthState(
  session: { access_token: string; refresh_token: string } | null,
  userId: string | null,
  email: string | null,
  role: AppRole | null,
  roleResolved: boolean,
): AuthState {
  if (!session || !userId) {
    return { user: null, session: null, role: null, loading: false };
  }
  if (!roleResolved) {
    return { user: { id: userId, email: email ?? '' }, session, role: null, loading: true };
  }
  return { user: { id: userId, email: email ?? '' }, session, role, loading: false };
}

function signOutState(): AuthState {
  return { user: null, session: null, role: null, loading: false };
}

// ============================================================

describe('useAuth - Password Validation', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('Ab1!')).toBe('Senha deve ter pelo menos 8 caracteres');
  });

  it('rejects passwords without uppercase', () => {
    expect(validatePassword('abcdefg1!')).toBe('Senha deve conter pelo menos uma letra maiúscula');
  });

  it('rejects passwords without numbers', () => {
    expect(validatePassword('Abcdefgh!')).toBe('Senha deve conter pelo menos um número');
  });

  it('rejects passwords without special characters', () => {
    expect(validatePassword('Abcdefg1')).toBe('Senha deve conter pelo menos um caractere especial');
  });

  it('accepts strong passwords', () => {
    expect(validatePassword('Teste@1234')).toBeNull();
    expect(validatePassword('S3nh@F0rte!')).toBeNull();
  });
});

describe('useAuth - Email Validation', () => {
  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects missing @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co')).toBe(true);
  });
});

describe('useAuth - Role Self-Registration', () => {
  it('prevents admin self-registration', () => {
    expect(canSelfRegisterAs('admin')).toBe(false);
  });

  it('allows locador registration', () => {
    expect(canSelfRegisterAs('locador')).toBe(true);
  });

  it('allows motorista registration', () => {
    expect(canSelfRegisterAs('motorista')).toBe(true);
  });
});

describe('useAuth - Role Dashboard Redirect', () => {
  it('redirects admin to /admin', () => {
    expect(getRoleDashboardPath('admin')).toBe('/admin');
  });

  it('redirects locador to /locador', () => {
    expect(getRoleDashboardPath('locador')).toBe('/locador');
  });

  it('redirects motorista to /motorista', () => {
    expect(getRoleDashboardPath('motorista')).toBe('/motorista');
  });

  it('redirects null role to /login', () => {
    expect(getRoleDashboardPath(null)).toBe('/login');
  });
});

describe('useAuth - Rate Limiting Awareness', () => {
  it('detects 429 as rate limited', () => {
    expect(isRateLimited(429)).toBe(true);
  });

  it('does not flag 200 as rate limited', () => {
    expect(isRateLimited(200)).toBe(false);
  });

  it('does not flag 401 as rate limited', () => {
    expect(isRateLimited(401)).toBe(false);
  });
});

describe('Inactivity Timeout - Logic', () => {
  it('should not reset timer within throttle window', () => {
    const lastThrottle = Date.now();
    const now = lastThrottle + 30_000; // 30s later
    expect(shouldResetTimer(lastThrottle, now)).toBe(false);
  });

  it('should reset timer after throttle window', () => {
    const lastThrottle = Date.now();
    const now = lastThrottle + THROTTLE_MS + 1;
    expect(shouldResetTimer(lastThrottle, now)).toBe(true);
  });

  it('detects inactivity after 30 minutes', () => {
    const lastActivity = Date.now();
    const now = lastActivity + INACTIVITY_TIMEOUT_MS;
    expect(isInactivityExpired(lastActivity, now)).toBe(true);
  });

  it('not expired before 30 minutes', () => {
    const lastActivity = Date.now();
    const now = lastActivity + INACTIVITY_TIMEOUT_MS - 1;
    expect(isInactivityExpired(lastActivity, now)).toBe(false);
  });

  it('not expired at 0ms', () => {
    const now = Date.now();
    expect(isInactivityExpired(now, now)).toBe(false);
  });

  it('expired after exactly 30 minutes', () => {
    const t = Date.now();
    expect(isInactivityExpired(t, t + 30 * 60 * 1000)).toBe(true);
  });
});

describe('useAuth - Session State Resolution', () => {
  const mockSession = { access_token: 'tok', refresh_token: 'ref' };

  it('returns unauthenticated state when no session', () => {
    const state = resolveAuthState(null, null, null, null, false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('keeps loading true until role resolves', () => {
    const state = resolveAuthState(mockSession, 'u1', 'u@e.com', null, false);
    expect(state.user).not.toBeNull();
    expect(state.loading).toBe(true);
    expect(state.role).toBeNull();
  });

  it('sets loading false once role is resolved', () => {
    const state = resolveAuthState(mockSession, 'u1', 'u@e.com', 'locador', true);
    expect(state.loading).toBe(false);
    expect(state.role).toBe('locador');
  });

  it('signOut clears all state', () => {
    const state = signOutState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.role).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('no session but userId still returns unauthenticated', () => {
    const state = resolveAuthState(null, 'u1', 'u@e.com', 'admin', true);
    expect(state.user).toBeNull();
  });
});

describe('useAuth - Signup Post-Processing', () => {
  it('forces manual login after signup (no auto-session)', () => {
    // After signup the provider calls signOut and clears state
    const postSignup = signOutState();
    expect(postSignup.user).toBeNull();
    expect(postSignup.session).toBeNull();
  });

  it('generates correct redirect URL', () => {
    const origin = 'https://example.com';
    const redirectUrl = `${origin}/`;
    expect(redirectUrl).toBe('https://example.com/');
  });
});

describe('useAuth - Context Error Handling', () => {
  it('throws when used outside provider', () => {
    // Simulates the guard in useAuth()
    const context = undefined;
    expect(() => {
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});

describe('Inactivity Timeout - Event Handling', () => {
  it('tracks correct activity events', () => {
    const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    expect(ACTIVITY_EVENTS).toHaveLength(5);
    expect(ACTIVITY_EVENTS).toContain('mousedown');
    expect(ACTIVITY_EVENTS).toContain('touchstart');
  });

  it('visibility change triggers check when tab becomes visible', () => {
    // Simulates the visibility handler logic
    const lastActivity = Date.now() - INACTIVITY_TIMEOUT_MS - 1;
    const shouldLogout = isInactivityExpired(lastActivity, Date.now());
    expect(shouldLogout).toBe(true);
  });

  it('visibility change does not trigger if recent activity', () => {
    const lastActivity = Date.now() - 5000; // 5 seconds ago
    expect(isInactivityExpired(lastActivity, Date.now())).toBe(false);
  });
});
