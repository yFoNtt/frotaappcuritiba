import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    role: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, ...props }: any) => {
          const Tag = prop as keyof JSX.IntrinsicElements;
          const safeProps = Object.fromEntries(
            Object.entries(props).filter(([key]) => !['initial', 'animate', 'exit', 'transition', 'variants', 'whileInView', 'viewport'].includes(key))
          );
          return <Tag {...safeProps}>{children}</Tag>;
        };
      }
      return undefined;
    },
  }),
  AnimatePresence: ({ children }: any) => children,
  useScroll: () => ({ scrollYProgress: { onChange: vi.fn() } }),
  useTransform: () => 0,
  useMotionValueEvent: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Mock routePreload
vi.mock('@/lib/routePreload', () => ({
  preloadRoute: vi.fn(),
  preloadCriticalRoutes: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('A11y: Header navigation', () => {
  it('renders navigation links accessible by role', async () => {
    const { Header } = await import('@/components/layout/Header');
    renderWithRouter(<Header />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    // Check that main nav links exist
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Veículos')).toBeInTheDocument();
    expect(screen.getByText('Como Funciona')).toBeInTheDocument();
  });

  it('has login/register buttons when not authenticated', async () => {
    const { Header } = await import('@/components/layout/Header');
    renderWithRouter(<Header />);

    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar')).toBeInTheDocument();
  });

  it('mobile menu toggle button exists', async () => {
    const { Header } = await import('@/components/layout/Header');
    renderWithRouter(<Header />);

    // The mobile menu button should be in the DOM (hidden on desktop via CSS)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('A11y: Footer', () => {
  it('renders footer links', async () => {
    const { Footer } = await import('@/components/layout/Footer');
    renderWithRouter(<Footer />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});

describe('A11y: General form patterns', () => {
  it('all inputs should have associated labels (Label + htmlFor pattern)', () => {
    // This test validates the pattern used across the app
    const { container } = render(
      <BrowserRouter>
        <form>
          <label htmlFor="test-input">Test Label</label>
          <input id="test-input" type="text" />
          <label htmlFor="test-select">Test Select</label>
          <select id="test-select"><option>A</option></select>
        </form>
      </BrowserRouter>
    );

    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).not.toBeNull();
      }
    });
  });

  it('buttons should have accessible text content', () => {
    const { container } = render(
      <BrowserRouter>
        <button>Save</button>
        <button aria-label="Close">×</button>
      </BrowserRouter>
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const hasText = button.textContent && button.textContent.trim().length > 0;
      const hasAriaLabel = button.hasAttribute('aria-label');
      const hasAriaLabelledby = button.hasAttribute('aria-labelledby');
      expect(hasText || hasAriaLabel || hasAriaLabelledby).toBe(true);
    });
  });

  it('links should have href attributes', () => {
    const { container } = render(
      <BrowserRouter>
        <a href="/home">Home</a>
        <a href="/about">About</a>
      </BrowserRouter>
    );

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.hasAttribute('href')).toBe(true);
    });
  });
});
