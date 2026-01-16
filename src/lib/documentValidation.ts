/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
 * @param cpf - CPF string (with or without formatting)
 * @returns boolean indicating if CPF is valid
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // CPF must have 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Validates Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * @param cnpj - CNPJ string (with or without formatting)
 * @returns boolean indicating if CNPJ is valid
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // CNPJ must have 14 digits
  if (cleanCNPJ.length !== 14) return false;

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validate first check digit
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validate second check digit
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Validates either CPF or CNPJ based on length
 * @param document - Document string (CPF or CNPJ)
 * @returns object with validation result and document type
 */
export function validateDocument(document: string): { isValid: boolean; type: 'cpf' | 'cnpj' | null; message: string } {
  const cleanDoc = document.replace(/\D/g, '');

  if (cleanDoc.length === 0) {
    return { isValid: false, type: null, message: 'Documento é obrigatório' };
  }

  if (cleanDoc.length === 11) {
    const isValid = validateCPF(cleanDoc);
    return {
      isValid,
      type: 'cpf',
      message: isValid ? 'CPF válido' : 'CPF inválido'
    };
  }

  if (cleanDoc.length === 14) {
    const isValid = validateCNPJ(cleanDoc);
    return {
      isValid,
      type: 'cnpj',
      message: isValid ? 'CNPJ válido' : 'CNPJ inválido'
    };
  }

  return {
    isValid: false,
    type: null,
    message: 'Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido'
  };
}

/**
 * Formats CPF with mask (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '').slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Formats CNPJ with mask (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '').slice(0, 14);
  return clean
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Formats document (CPF or CNPJ) based on length
 */
export function formatDocument(document: string): string {
  const clean = document.replace(/\D/g, '');
  if (clean.length <= 11) {
    return formatCPF(clean);
  }
  return formatCNPJ(clean);
}

/**
 * Validates Brazilian CNH (Carteira Nacional de Habilitação)
 * CNH has 11 digits with 2 check digits
 * @param cnh - CNH string (with or without formatting)
 * @returns boolean indicating if CNH is valid
 */
export function validateCNH(cnh: string): boolean {
  // Remove non-numeric characters
  const cleanCNH = cnh.replace(/\D/g, '');

  // CNH must have 11 digits
  if (cleanCNH.length !== 11) return false;

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCNH)) return false;

  // CNH validation algorithm
  let dsc = 0;
  let v1 = 0;
  let v2 = 0;

  // Calculate first check digit
  for (let i = 0, j = 9; i < 9; i++, j--) {
    v1 += parseInt(cleanCNH.charAt(i)) * j;
  }

  let resto1 = v1 % 11;
  if (resto1 >= 10) {
    resto1 = 0;
    dsc = 2;
  }

  // Calculate second check digit
  for (let i = 0, j = 1; i < 9; i++, j++) {
    v2 += parseInt(cleanCNH.charAt(i)) * j;
  }

  let resto2 = (v2 % 11) - dsc;
  if (resto2 < 0) resto2 = 0;
  if (resto2 >= 10) resto2 = 0;

  // Compare calculated digits with the actual check digits
  const digit1 = parseInt(cleanCNH.charAt(9));
  const digit2 = parseInt(cleanCNH.charAt(10));

  return resto1 === digit1 && resto2 === digit2;
}

/**
 * Validates CNH and returns detailed result
 * @param cnh - CNH string
 * @returns object with validation result
 */
export function validateCNHDocument(cnh: string): { isValid: boolean; message: string } {
  const cleanCNH = cnh.replace(/\D/g, '');

  if (cleanCNH.length === 0) {
    return { isValid: false, message: 'CNH é obrigatória' };
  }

  if (cleanCNH.length !== 11) {
    return { isValid: false, message: 'CNH deve ter 11 dígitos' };
  }

  const isValid = validateCNH(cleanCNH);
  return {
    isValid,
    message: isValid ? 'CNH válida' : 'CNH inválida'
  };
}

/**
 * Formats CNH with mask (XXX XXXX XXXX)
 */
export function formatCNH(cnh: string): string {
  const clean = cnh.replace(/\D/g, '').slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2');
}
