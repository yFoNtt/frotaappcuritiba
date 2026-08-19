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
  return new URLSearchParams(search || '').has('code');
}

export const MFA_RESEND_SECONDS = 60;
