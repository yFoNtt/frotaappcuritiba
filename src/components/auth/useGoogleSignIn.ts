import { useState } from 'react';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable/index';
import { translateAuthError } from './authErrors';

export type GoogleSignInOutcome = 'redirected' | 'session' | 'error';

/**
 * Fluxo único de login com Google usado no login e no cadastro.
 * Trata os três retornos possíveis do helper oficial:
 * - error: mostra mensagem traduzida
 * - redirected: navegador sai da página (mantém o estado de carregando)
 * - sessão definida: usuário autenticado
 */
export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  try {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });

    if (result?.error) {
      console.error('Google OAuth error:', result.error);
      toast.error(translateAuthError(result.error, 'oauth'));
      return 'error';
    }

    if (result?.redirected) return 'redirected';

    return 'session';
  } catch (err) {
    console.error('Google OAuth error:', err);
    toast.error(translateAuthError(err, 'oauth'));
    return 'error';
  }
}

export function useGoogleSignIn() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const outcome = await signInWithGoogle();
    // Em caso de redirecionamento o navegador deixa a página:
    // manter o estado de carregando evita um "piscar" do botão.
    if (outcome !== 'redirected') setGoogleLoading(false);
  };

  return { googleLoading, handleGoogleSignIn };
}
