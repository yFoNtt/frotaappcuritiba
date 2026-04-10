import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock useAuth at module level
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function filterMotionProps(props: Record<string, any>) {
  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'variants'].includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Lazy import after mocks
const AuthPageModule = await import('@/pages/Auth');
const AuthPage = AuthPageModule.default;

function renderAuthPage(route: string = '/login') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/cadastro" element={<AuthPage />} />
        <Route path="/admin" element={<div data-testid="admin-dashboard">Admin Dashboard</div>} />
        <Route path="/locador" element={<div data-testid="locador-dashboard">Locador Dashboard</div>} />
        <Route path="/motorista" element={<div data-testid="motorista-dashboard">Motorista Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Auth page - role-based redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ user: null, role: null, loading: true, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() });
    renderAuthPage();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows login form when no user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, role: null, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() });
    renderAuthPage();
    expect(screen.getByText('Entrar no FrotaApp')).toBeInTheDocument();
  });

  it('redirects admin user to /admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@test.com' },
      role: 'admin',
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    renderAuthPage();
    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('redirects locador user to /locador', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'loc@test.com' },
      role: 'locador',
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    renderAuthPage();
    await waitFor(() => {
      expect(screen.getByTestId('locador-dashboard')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('redirects motorista user to /motorista', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '3', email: 'mot@test.com' },
      role: 'motorista',
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    renderAuthPage();
    await waitFor(() => {
      expect(screen.getByTestId('motorista-dashboard')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('stays on auth page when user exists but role is null', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '4', email: 'norole@test.com' },
      role: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshRole: vi.fn(),
    });
    renderAuthPage();
    // Should NOT redirect — shows role selection redirect state
    expect(screen.getByText('Redirecionando para seleção de perfil...')).toBeInTheDocument();
  });
});
