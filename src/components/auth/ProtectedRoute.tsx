import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConsentStatus } from '@/hooks/useConsentStatus';
import { Loader2 } from 'lucide-react';

type AppRole = 'admin' | 'locador' | 'motorista';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const { status: consentStatus, isLoading: consentLoading } = useConsentStatus();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    if (!role || !allowedRoles.includes(role)) {
      // Redirect to appropriate dashboard based on role, or login if no role
      const redirectPath = role === 'admin' ? '/admin' : role === 'locador' ? '/locador' : role === 'motorista' ? '/motorista' : '/login';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // LGPD gate — admins ficam isentos para evitar lockout em manutenção.
  if (role !== 'admin' && !consentLoading && consentStatus !== 'valid') {
    return <Navigate to="/consent-required" replace />;
  }

  return <>{children}</>;
}

