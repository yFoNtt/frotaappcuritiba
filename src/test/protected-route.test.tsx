import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(initialRoute: string, allowedRoles?: ('admin' | 'locador' | 'motorista')[]) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div data-testid="protected-content">Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route path="/admin" element={<div data-testid="admin-page">Admin</div>} />
        <Route path="/locador" element={<div data-testid="locador-page">Locador</div>} />
        <Route path="/motorista" element={<div data-testid="motorista-page">Motorista</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ user: null, role: null, loading: true });
    renderWithRouter('/protected');
    // Loader2 renders an SVG with animate-spin class
    expect(document.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('redirects to /login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, role: null, loading: false });
    renderWithRouter('/protected');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('renders children when user is authenticated and no role restriction', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      role: 'locador',
      loading: false,
    });
    renderWithRouter('/protected');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders children when user has an allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      role: 'locador',
      loading: false,
    });
    renderWithRouter('/protected', ['locador', 'admin']);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects admin to /admin when role not in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@test.com' },
      role: 'admin',
      loading: false,
    });
    renderWithRouter('/protected', ['locador']);
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
  });

  it('redirects locador to /locador when role not in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'loc@test.com' },
      role: 'locador',
      loading: false,
    });
    renderWithRouter('/protected', ['admin']);
    expect(screen.getByTestId('locador-page')).toBeInTheDocument();
  });

  it('redirects motorista to /motorista when role not in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'mot@test.com' },
      role: 'motorista',
      loading: false,
    });
    renderWithRouter('/protected', ['admin']);
    expect(screen.getByTestId('motorista-page')).toBeInTheDocument();
  });

  it('redirects to /login when user exists but has no role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'norole@test.com' },
      role: null,
      loading: false,
    });
    renderWithRouter('/protected', ['locador']);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
