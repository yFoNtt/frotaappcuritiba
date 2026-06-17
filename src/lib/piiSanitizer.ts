/**
 * Frontend PII masking utilities (LGPD).
 *
 * Use these to display sensitive data in a redacted form (logs, screenshots,
 * support tickets, embedded into AI prompts client-side, etc.).
 *
 * NOTE: The Edge Function `locador-assistant` performs server-side masking via
 * `supabase/functions/_shared/maskPII.ts` (`maskPIIDeep`) before any data
 * reaches the LLM. This module is a complementary frontend helper.
 */

export const maskCPF = (cpf: string): string => {
  if (!cpf) return cpf;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  // Mask first 9 digits, keep separators-style readability, expose only last 2.
  const last2 = digits.slice(9);
  return `XXX.XXX.XXX.${last2}`;
};


export const maskCNH = (cnh: string): string => {
  if (!cnh) return cnh;
  const clean = cnh.trim();
  if (clean.length < 5) return clean;
  return clean.slice(0, 5) + '*'.repeat(Math.max(0, clean.length - 5));
};

export const maskPhone = (phone: string): string => {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  return `(${digits.slice(0, 2)}) XXXXX-${digits.slice(-4)}`;
};

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (!local || local.length < 2) return email;
  return `${local.slice(0, 2)}****@${domain}`;
};

export const maskPlate = (plate: string): string => {
  if (!plate) return plate;
  const clean = plate.replace(/\s+/g, '').toUpperCase();
  if (clean.length < 4) return plate;
  return `${clean.slice(0, 3)}-****`;
};

export interface SanitizableContext {
  cpf?: string | null;
  cnh?: string | null;
  phone?: string | null;
  email?: string | null;
  plate?: string | null;
  [k: string]: unknown;
}

export const sanitizeContextForAI = <T extends SanitizableContext>(context: T): T => {
  return {
    ...context,
    cpf: context.cpf ? maskCPF(context.cpf) : context.cpf,
    cnh: context.cnh ? maskCNH(context.cnh) : context.cnh,
    phone: context.phone ? maskPhone(context.phone) : context.phone,
    email: context.email ? maskEmail(context.email) : context.email,
    plate: context.plate ? maskPlate(context.plate) : context.plate,
  };
};
