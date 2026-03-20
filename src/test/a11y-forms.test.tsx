import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EmailField } from '@/components/auth/EmailField';
import { PasswordField } from '@/components/auth/PasswordField';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, role: null, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('A11y: EmailField', () => {
  it('has a label linked to the input via htmlFor/id', () => {
    renderWithRouter(<EmailField email="" onEmailChange={vi.fn()} />);
    const input = screen.getByLabelText('E-mail');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('input has required attribute', () => {
    renderWithRouter(<EmailField email="" onEmailChange={vi.fn()} />);
    expect(screen.getByLabelText('E-mail')).toBeRequired();
  });

  it('is disabled when loading', () => {
    renderWithRouter(<EmailField email="" onEmailChange={vi.fn()} loading />);
    expect(screen.getByLabelText('E-mail')).toBeDisabled();
  });

  it('has placeholder text for guidance', () => {
    renderWithRouter(<EmailField email="" onEmailChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
  });
});

describe('A11y: PasswordField', () => {
  it('has a label linked to the password input', () => {
    renderWithRouter(<PasswordField password="" onPasswordChange={vi.fn()} />);
    const input = screen.getByLabelText('Senha');
    expect(input).toBeInTheDocument();
  });

  it('password input has required attribute', () => {
    renderWithRouter(<PasswordField password="" onPasswordChange={vi.fn()} />);
    expect(screen.getByLabelText('Senha')).toBeRequired();
  });

  it('toggle visibility button is accessible (type=button)', () => {
    renderWithRouter(<PasswordField password="test" onPasswordChange={vi.fn()} />);
    const toggleBtn = screen.getByRole('button');
    expect(toggleBtn).toHaveAttribute('type', 'button');
  });

  it('starts as password type (hidden)', () => {
    renderWithRouter(<PasswordField password="secret" onPasswordChange={vi.fn()} />);
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });

  it('confirm password field has label when showConfirm', () => {
    renderWithRouter(
      <PasswordField
        password=""
        onPasswordChange={vi.fn()}
        confirmPassword=""
        onConfirmPasswordChange={vi.fn()}
        showConfirm
      />
    );
    expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Senha')).toBeRequired();
  });

  it('shows strength indicator with semantic checks when enabled', () => {
    renderWithRouter(
      <PasswordField password="Test1234!" onPasswordChange={vi.fn()} showStrength />
    );
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Letra maiúscula')).toBeInTheDocument();
    expect(screen.getByText('Número')).toBeInTheDocument();
    expect(screen.getByText('Caractere especial')).toBeInTheDocument();
  });

  it('password warning uses semantic alert styling', () => {
    renderWithRouter(
      <PasswordField password="" onPasswordChange={vi.fn()} passwordWarning="Senha comprometida" />
    );
    const warning = screen.getByText('Senha comprometida');
    expect(warning).toBeInTheDocument();
    expect(warning.closest('div')).toHaveClass('border-destructive/50');
  });

  it('forgot password link is accessible', () => {
    renderWithRouter(<PasswordField password="" onPasswordChange={vi.fn()} showForgotLink />);
    const link = screen.getByText('Esqueci minha senha');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/esqueci-senha');
  });
});

describe('A11y: ForgotPassword page', () => {
  it('form elements have proper labels', async () => {
    // Dynamic import to avoid heavy mocking
    const { default: ForgotPassword } = await import('@/pages/ForgotPassword');
    renderWithRouter(<ForgotPassword />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument();
  });

  it('back to login link is accessible', async () => {
    const { default: ForgotPassword } = await import('@/pages/ForgotPassword');
    renderWithRouter(<ForgotPassword />);
    
    const backLink = screen.getByText('Voltar para o login');
    expect(backLink.closest('a')).toHaveAttribute('href', '/login');
  });
});
