// Utilitários LGPD: mascara PII antes de enviar a serviços externos (LLMs, etc.)
// Substitui CPF, CNPJ, CNH, telefones BR e e-mails por placeholders.

export interface MaskStats {
  cpf: number;
  cnpj: number;
  cnh: number;
  phone: number;
  email: number;
  plate: number;
}

const PATTERNS = {
  email:
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  cnpj:
    /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
  cpf:
    /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  // Telefone BR: opcional +55, opcional (DDD), 8 ou 9 dígitos com hífen/espaço opcional
  phone:
    /(?:\+?55[\s-]?)?(?:\(\d{2}\)|\d{2})[\s-]?9?\d{4}[\s-]?\d{4}/g,
  // CNH brasileira tem 11 dígitos; também cobrimos 9 dígitos isolados conforme spec
  cnh11: /\b\d{11}\b/g,
  cnh9: /\b\d{9}\b/g,
  // Placa BR: legado (AAA-1234 / AAA1234) ou Mercosul (AAA1A23), com hífen opcional
  plate: /\b[A-Z]{3}-?\d[A-Z0-9]\d{2}\b/g,
};


export function maskPII(input: string, stats?: MaskStats): string {
  if (!input) return input;
  let out = input;
  // Ordem importa: e-mail e CNPJ antes do CPF (overlap de dígitos); CPF/CNH antes de telefone.
  out = out.replace(PATTERNS.email, () => {
    if (stats) stats.email++;
    return "[EMAIL OMITIDO]";
  });
  out = out.replace(PATTERNS.cnpj, () => {
    if (stats) stats.cnpj++;
    return "[CNPJ OMITIDO]";
  });
  out = out.replace(PATTERNS.cpf, () => {
    if (stats) stats.cpf++;
    return "[CPF OMITIDO]";
  });
  out = out.replace(PATTERNS.cnh11, () => {
    if (stats) stats.cnh++;
    return "[CNH OMITIDA]";
  });
  out = out.replace(PATTERNS.cnh9, () => {
    if (stats) stats.cnh++;
    return "[CNH OMITIDA]";
  });
  out = out.replace(PATTERNS.phone, () => {
    if (stats) stats.phone++;
    return "[TELEFONE OMITIDO]";
  });
  out = out.replace(PATTERNS.plate, () => {
    if (stats) stats.plate++;
    return "[PLACA OMITIDA]";
  });
  return out;
}

export function newStats(): MaskStats {
  return { cpf: 0, cnpj: 0, cnh: 0, phone: 0, email: 0, plate: 0 };
}


// Recursivamente aplica maskPII a strings dentro de objetos/arrays.
// Não toca em chaves, números, booleanos, nulls — apenas valores string.
export function maskPIIDeep<T>(value: T, stats?: MaskStats): T {
  if (value == null) return value;
  if (typeof value === "string") {
    return maskPII(value, stats) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => maskPIIDeep(v, stats)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = maskPIIDeep(v, stats);
    }
    return out as unknown as T;
  }
  return value;
}
