import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useInactivityTimeout } from './useInactivityTimeout';
import { InactivityWarningDialog } from '@/components/auth/InactivityWarningDialog';
import { isMfaRequired } from '@/lib/mfa';

type AppRole = 'admin' | 'locador' | 'motorista';

interface ProfileData {
  documentType?: 'cpf' | 'cnpj';
  documentNumber?: string;
  cnhNumber?: string;
  cnhExpiry?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
  roleError: string | null;
  markMfaVerified: () => Promise<boolean>;
  refreshMfaSettings: () => Promise<void>;
  signUp: (email: string, password: string, role: AppRole, profileData?: ProfileData) => Promise<{ error: Error | null; confirmationRequired?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaVerified, setMfaVerifiedState] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);


  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_role');

      if (error) {
        console.error('Error fetching role:', error);
        throw error;
      }
      return data as AppRole | null;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  };

  const fetchMfaStatus = async (): Promise<{ enabled: boolean; verified: boolean }> => {
    try {
      const { data, error } = await supabase.functions.invoke('mfa-session', {
        body: { action: 'status' },
      });
      if (error) throw error;
      return { enabled: data?.enabled === true, verified: data?.verified === true };
    } catch (error) {
      console.error('Error fetching MFA settings:', error);
      return { enabled: false, verified: false };
    }
  };


  // Checa is_current_user_blocked() e força logout se a conta foi
  // bloqueada pelo admin. Chamado na carga inicial, em toda mudança de
  // auth state, e periodicamente enquanto o app fica aberto.
  const checkBlockedAndSignOut = useCallback(async (): Promise<boolean> => {
    try {
      const { data: blocked } = await supabase.rpc('is_current_user_blocked');
      if (blocked === true) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        toast.error(
          'Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte.',
          { duration: 10000 }
        );
        return true;
      }
    } catch (error) {
      console.error('Error checking blocked status:', error);
    }
    return false;
  }, []);

  useEffect(() => {
    let initialized = false;

    const resolveUser = async () => {
      setLoading(true);
      setRoleError(null);
      try {
        await supabase.rpc('initialize_own_account', { _role: null });
        const [resolvedRole, mfaStatus] = await Promise.all([
          fetchUserRole(),
          fetchMfaStatus(),
        ]);
        setRole(resolvedRole);
        setMfaEnabled(mfaStatus.enabled);
        setMfaVerifiedState(mfaStatus.verified);
        await checkBlockedAndSignOut();
      } catch (error) {
        console.error('Error resolving account:', error);
        setRole(null);
        setRoleError('Não foi possível carregar o tipo da sua conta.');
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        initialized = true;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setLoading(true);
          setTimeout(() => {
            resolveUser();
          }, 0);
        } else {
          setRole(null);
          setMfaEnabled(false);
          setMfaVerifiedState(false);
          setRoleError(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initialized) return; // onAuthStateChange já tratou
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        resolveUser();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkBlockedAndSignOut]);


  // Revalidação periódica: se o admin bloquear o usuário enquanto a aba já
  // está aberta com sessão válida, o logout acontece em até 3 minutos —
  // não depende de fechar a aba ou o token expirar.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      checkBlockedAndSignOut();
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, checkBlockedAndSignOut]);

  const signUp = async (email: string, password: string, selectedRole: AppRole, profileData?: ProfileData) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: new Error('Email inválido') };
      }

      // Validate password strength
      if (password.length < 8) {
        return { error: new Error('Senha deve ter pelo menos 8 caracteres') };
      }
      if (!/[A-Z]/.test(password)) {
        return { error: new Error('Senha deve conter pelo menos uma letra maiúscula') };
      }
      if (!/[a-z]/.test(password)) {
        return { error: new Error('Senha deve conter pelo menos uma letra minúscula') };
      }
      if (!/[0-9]/.test(password)) {
        return { error: new Error('Senha deve conter pelo menos um número') };
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        return { error: new Error('Senha deve conter pelo menos um caractere especial') };
      }

      // Prevent self-registration as admin
      if (selectedRole === 'admin') {
        return { error: new Error('Não é possível se cadastrar como administrador') };
      }

      const redirectUrl = `${window.location.origin}/login`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { role: selectedRole },
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: new Error('Este email já está cadastrado') };
        }
        return { error };
      }

      if (data.user?.identities?.length === 0) {
        return { error: new Error('Este email já está cadastrado') };
      }

      if (!data.session) {
        return { error: null, confirmationRequired: true };
      }

      if (data.user) {
        const { error: bootstrapError } = await supabase.rpc('initialize_own_account', {
          _role: selectedRole,
        });
        if (bootstrapError) {
          console.error('Error initializing account:', bootstrapError);
          await supabase.auth.signOut();
          return { error: new Error('Não foi possível configurar sua conta. Tente entrar novamente.') };
        }

        if (profileData) {
          const { error: profileError } = await supabase.from('profiles').update({
            document_type: profileData.documentType,
            document_number: profileData.documentNumber,
            cnh_number: profileData.cnhNumber,
            cnh_expiry: profileData.cnhExpiry,
          }).eq('user_id', data.user.id);
          if (profileError) {
            console.error('Error completing profile:', profileError);
            await supabase.auth.signOut();
            return { error: new Error('Sua conta foi criada, mas faltou concluir o perfil. Entre novamente para continuar.') };
          }
        }

        // LGPD: registrar consentimento via Edge Function (captura IP + UA)
        try {
          const { TERMS_VERSION, PRIVACY_VERSION } = await import('@/lib/consentVersions');
          await supabase.functions.invoke('record-consent', {
            body: {
              terms_version: TERMS_VERSION,
              privacy_version: PRIVACY_VERSION,
            },
          });
        } catch (consentErr) {
          console.warn('Falha ao registrar consentimento:', consentErr);
        }


        // Sign out immediately after signup so user needs to login manually
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Use rate-limited edge function for login (URL resolvida pelo cliente)
      const { data, error: invokeError } = await supabase.functions.invoke('rate-limited-login', {
        body: { email, password },
      });

      if (invokeError) {
        let payload: { error?: string } | null = null;
        let status = 0;
        const ctx = (invokeError as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          status = ctx.status;
          try {
            payload = await ctx.json();
          } catch {
            payload = null;
          }
        }
        if (status === 429) {
          return { error: new Error(payload?.error || 'Muitas tentativas. Tente novamente mais tarde.') };
        }
        return { error: new Error(payload?.error || 'Email ou senha incorretos') };
      }

      // Credenciais inválidas e rate limit são resultados esperados da função,
      // não falhas de runtime. O status original vem no payload para que a UI
      // preserve as mensagens e o bloqueio temporário.
      const loginResult = data as {
        error?: string;
        status?: number;
        session?: Session;
      } | null;

      if (loginResult?.error) {
        const fallback = loginResult.status === 429
          ? 'Muitas tentativas. Tente novamente mais tarde.'
          : 'Email ou senha incorretos';
        return { error: new Error(loginResult.error || fallback) };
      }

      // Set session from edge function response
      if (loginResult?.session) {
        await supabase.auth.setSession({
          access_token: loginResult.session.access_token,
          refresh_token: loginResult.session.refresh_token,
        });

        // Enforce admin-applied block: if the account is blocked, sign out
        // immediately and surface a clear message to the user.
        const { data: blocked } = await supabase.rpc('is_current_user_blocked');
        if (blocked === true) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setRole(null);
          return { error: new Error('Conta bloqueada pelo administrador. Entre em contato com o suporte.') };
        }
      } else {
        return { error: new Error('Não foi possível iniciar a sessão. Tente novamente.') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshRole = useCallback(async () => {
    if (user) {
      setRoleError(null);
      try {
        const r = await fetchUserRole();
        setRole(r);
      } catch {
        setRole(null);
        setRoleError('Não foi possível carregar o tipo da sua conta.');
      }
    }
  }, [user]);

  const refreshMfaSettings = useCallback(async () => {
    if (user) {
      const status = await fetchMfaStatus();
      setMfaEnabled(status.enabled);
      setMfaVerifiedState(status.verified);
    }
  }, [user]);

  const markMfaVerified = useCallback(async () => {
    if (!user) return false;
    const { data, error } = await supabase.functions.invoke('mfa-session', {
      body: { action: 'complete' },
    });
    const verified = !error && data?.success === true;
    setMfaVerifiedState(verified);
    if (verified) setRole(await fetchUserRole(user.id));
    return verified;
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setMfaEnabled(false);
    setMfaVerifiedState(false);
  }, [user]);

  // Auto-logout após 60 minutos de inatividade, com aviso 1 minuto antes
  const [inactivityWarning, setInactivityWarning] = useState(false);

  const handleInactivityTimeout = useCallback(async () => {
    setInactivityWarning(false);
    if (user) {
      await signOut();
      toast.info('Sua sessão expirou por inatividade. Faça login novamente.', {
        duration: 8000,
      });
    }
  }, [user, signOut]);

  const handleInactivityWarning = useCallback(() => {
    if (user) setInactivityWarning(true);
  }, [user]);

  const { reset: resetInactivity } = useInactivityTimeout(handleInactivityTimeout, !!user, {
    onWarning: handleInactivityWarning,
  });

  const continueSession = useCallback(() => {
    setInactivityWarning(false);
    resetInactivity();
  }, [resetInactivity]);

  const logoutNow = useCallback(async () => {
    setInactivityWarning(false);
    await signOut();
  }, [signOut]);


  const mfaRequired = !!user && isMfaRequired(role, mfaEnabled);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        mfaRequired,
        mfaVerified,
        roleError,
        markMfaVerified,
        refreshMfaSettings,
        signUp,
        signIn,
        signOut,
        refreshRole,
      }}
    >
      {children}
      <InactivityWarningDialog
        open={inactivityWarning}
        onContinue={continueSession}
        onLogout={logoutNow}
      />
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
