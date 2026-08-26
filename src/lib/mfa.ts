export type MfaRole = 'admin' | 'locador' | 'motorista' | null;

/**
 * Verificação em duas etapas é sempre OPCIONAL, para todas as roles.
 * Nenhuma role é obrigada a usar — cada usuário decide em Configurações.
 * (Antes admin/locador eram obrigatórios por padrão; alterado porque o
 * fluxo de e-mail com link de verificação ainda não é confiável.)
 */
export const MFA_MANDATORY_ROLES: MfaRole[] = [];

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
export const MAGIC_LINK_TYPES = ['magiclink', 'email', 'signup', 'recovery', 'invite'];

export interface MagicLinkTokens {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  type?: string;
}

/** Extrai os tokens do retorno do link (hash implícito ou `?code=` do PKCE). */
export function parseMagicLinkTokens(hash: string, search = ''): MagicLinkTokens | null {
  const h = new URLSearchParams((hash || '').replace(/^#/, ''));
  const q = new URLSearchParams(search || '');
  const accessToken = h.get('access_token') || q.get('access_token') || undefined;
  const refreshToken = h.get('refresh_token') || q.get('refresh_token') || undefined;
  const code = q.get('code') || h.get('code') || undefined;
  const type = h.get('type') || q.get('type') || undefined;
  if (!accessToken && !code) return null;
  return { accessToken, refreshToken, code, type };
}

export function isMagicLinkReturn(hash: string, search = ''): boolean {
  if (parseMagicLinkTokens(hash, search)) return true;
  const h = new URLSearchParams((hash || '').replace(/^#/, ''));
  const q = new URLSearchParams(search || '');
  const type = h.get('type') || q.get('type');
  if (type && MAGIC_LINK_TYPES.includes(type)) return true;
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
export const MFA_LINK_HYDRATION_TIMEOUT_MS = 8000;

export const MFA_RESEND_SECONDS = 60;

