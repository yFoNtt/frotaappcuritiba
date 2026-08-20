export type MfaRole = 'admin' | 'locador' | 'motorista' | null;

/** Roles em que a verificação em duas etapas é obrigatória. */
export const MFA_MANDATORY_ROLES: MfaRole[] = ['admin', 'locador'];

export function isMfaMandatory(role: MfaRole): boolean {
  return MFA_MANDATORY_ROLES.includes(role);
}

/** Decide se o usuário precisa passar pela verificação em duas etapas. */
export function isMfaRequired(role: MfaRole, mfaEnabled: boolean): boolean {
  return isMfaMandatory(role) || mfaEnabled === true;
}

const STORAGE_PREFIX = 'frotaapp:mfa-ok:';

function key(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

/** A verificação vale enquanto a aba/sessão do navegador estiver aberta. */
export function isMfaVerified(userId: string | null | undefined): boolean {
  if (!userId || typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(key(userId)) === '1';
  } catch {
    return false;
  }
}

export function setMfaVerified(userId: string) {
  try {
    window.sessionStorage.setItem(key(userId), '1');
  } catch {
    /* storage indisponível */
  }
}

export function clearMfaVerified(userId?: string | null) {
  try {
    if (userId) {
      window.sessionStorage.removeItem(key(userId));
      return;
    }
    Object.keys(window.sessionStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* storage indisponível */
  }
}

/** Códigos são de 6 dígitos numéricos. */
export function isValidMfaCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

/**
 * Detecta o retorno pelo link mágico enviado por e-mail.
 * O Supabase devolve o token no hash (`#access_token=...&type=magiclink`)
 * ou, no fluxo PKCE, um `?code=` na query string.
 */
export function isMagicLinkReturn(hash: string, search = ''): boolean {
  const h = (hash || '').replace(/^#/, '');
  const params = new URLSearchParams(h);
  if (params.get('access_token') || params.get('type') === 'magiclink') return true;
  const q = new URLSearchParams(search || '');
  if (q.has('code')) return true;
  return !!parseMagicLinkError(hash, search);
}

/**
 * Erros devolvidos pelo provedor no retorno do link
 * (`#error=access_denied&error_code=otp_expired&error_description=...`).
 * Também cobre o caso de scanners corporativos que "pré-carregam" o link
 * e consomem o token antes do clique real do usuário.
 */
export function parseMagicLinkError(hash: string, search = ''): string | null {
  const sources = [new URLSearchParams((hash || '').replace(/^#/, '')), new URLSearchParams(search || '')];
  for (const p of sources) {
    const code = p.get('error_code');
    const err = p.get('error');
    if (code || err) return code || err;
  }
  return null;
}

/** Mensagem em pt-BR para o erro do link. */
export function magicLinkErrorMessage(code: string | null): string {
  if (code === 'otp_expired' || code === 'access_denied') {
    return 'Este link expirou ou já foi utilizado. Toque em “Reenviar e-mail” para receber um novo.';
  }
  return 'Não foi possível concluir a verificação por este link. Toque em “Reenviar e-mail” para receber um novo.';
}

/**
 * Enquanto não houver domínio de e-mail próprio, o e-mail entregue traz apenas
 * o botão de acesso — sem código de 6 dígitos. Ative esta flag quando os
 * modelos em pt-BR com `{{ .Token }}` estiverem no ar.
 */
export const MFA_CODE_INPUT_ENABLED = false;

/** Tempo máximo de espera pela hidratação da sessão no retorno pelo link. */
export const MFA_LINK_HYDRATION_TIMEOUT_MS = 5000;

export const MFA_RESEND_SECONDS = 60;

