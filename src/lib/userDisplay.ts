import type { User } from '@supabase/supabase-js';

/**
 * Nome exibido do usuário logado.
 * Fonte, em ordem: profiles.full_name → metadados do provedor (Google) → e-mail.
 * Não depende de nenhum fluxo de MFA/verificação.
 */
export function getDisplayName(
  user: Pick<User, 'email' | 'user_metadata'> | null | undefined,
  fullName?: string | null,
): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metaName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    '';
  const email = user?.email ?? '';
  return (fullName?.trim() || metaName.trim() || email.split('@')[0] || 'Usuário');
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
