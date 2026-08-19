/**
 * Traduz mensagens de erro de autenticação (backend em inglês)
 * para textos claros em português para o usuário final.
 */

export type AuthErrorContext = 'login' | 'signup' | 'reset' | 'update' | 'oauth';

function normalize(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error.toLowerCase();
  const anyErr = error as { message?: string; error_description?: string; code?: string; name?: string };
  return [anyErr.code, anyErr.message, anyErr.error_description, anyErr.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

const GENERIC: Record<AuthErrorContext, string> = {
  login: 'Não foi possível entrar. Tente novamente em instantes.',
  signup: 'Não foi possível criar a conta. Tente novamente em instantes.',
  reset: 'Não foi possível enviar o link de recuperação. Tente novamente em instantes.',
  update: 'Não foi possível atualizar a senha. Tente novamente em instantes.',
  oauth: 'Não foi possível entrar com o Google. Tente novamente.',
};

export function translateAuthError(error: unknown, context: AuthErrorContext = 'login'): string {
  const msg = normalize(error);

  if (!msg) return GENERIC[context];

  // Rede / conexão
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed') || msg.includes('load failed')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }

  // Limite de tentativas / envios
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('over_email_send_rate_limit') || msg.includes('429')) {
    return 'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.';
  }

  // Credenciais
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
  }
  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
  }
  if (msg.includes('user not found') || msg.includes('user_not_found')) {
    return 'Não encontramos uma conta com esses dados.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('user_already_exists')) {
    return 'Já existe uma conta com este e-mail. Faça login ou recupere sua senha.';
  }

  // E-mail inválido
  if (msg.includes('unable to validate email address') || msg.includes('invalid email') || msg.includes('validation_failed')) {
    return 'Digite um e-mail válido.';
  }

  // Link de recuperação
  if (msg.includes('expired') || msg.includes('otp_expired')) {
    return 'Este link expirou. Solicite um novo link de recuperação.';
  }
  if (msg.includes('invalid token') || msg.includes('token not found') || msg.includes('access_denied') || msg.includes('bad_jwt')) {
    return 'Este link não é mais válido. Solicite um novo link de recuperação.';
  }
  if (msg.includes('auth session missing') || msg.includes('session_not_found')) {
    return 'Sua sessão expirou. Solicite um novo link de recuperação.';
  }

  // Senhas
  if (msg.includes('pwned') || msg.includes('leaked') || msg.includes('data breach')) {
    return 'Esta senha foi encontrada em vazamentos de dados conhecidos. Escolha uma senha diferente.';
  }
  if (msg.includes('should be different from the old password') || msg.includes('same_password')) {
    return 'A nova senha precisa ser diferente da senha atual.';
  }
  if (msg.includes('weak_password') || msg.includes('password should be') || msg.includes('too short') || msg.includes('too common') || msg.includes('weak')) {
    return 'Senha muito fraca. Use ao menos 8 caracteres com maiúscula, minúscula, número e caractere especial.';
  }

  // OAuth
  if (msg.includes('popup') && (msg.includes('block') || msg.includes('closed'))) {
    return 'A janela do Google foi bloqueada ou fechada. Permita pop-ups e tente novamente.';
  }
  if (msg.includes('popup_closed') || msg.includes('user closed') || msg.includes('window closed')) {
    return 'Você fechou a janela do Google antes de concluir. Tente novamente.';
  }
  if (msg.includes('unsupported provider') || msg.includes('provider is not enabled')) {
    return 'O login com Google está temporariamente indisponível. Use e-mail e senha.';
  }
  if (msg.includes('access_denied') || msg.includes('consent')) {
    return 'O acesso pela conta Google não foi autorizado. Tente novamente.';
  }

  // Conta bloqueada
  if (msg.includes('blocked') || msg.includes('banned')) {
    return 'Esta conta está bloqueada. Entre em contato com o suporte.';
  }

  return GENERIC[context];
}
