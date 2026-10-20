import { createHash } from 'node:crypto';

/**
 * Mirrors `derivePassword` in the seed-test-locadores / seed-test-motoristas
 * edge functions: `S!` + first 24 hex chars of SHA-256("<token>:<email>") + `Aa9`.
 * The token comes from the E2E_SEED_TOKEN env var (CI secret).
 */
export function derivePassword(email: string): string {
  const token = process.env.E2E_SEED_TOKEN;
  if (!token) {
    throw new Error(
      'E2E_SEED_TOKEN não definido: as senhas das contas de teste são derivadas desse segredo. ' +
        'Defina a variável de ambiente antes de rodar os testes E2E.',
    );
  }
  const hex = createHash('sha256').update(`${token}:${email}`, 'utf8').digest('hex');
  return `S!${hex.slice(0, 24)}Aa9`;
}

/** Builds a test account object whose password is derived lazily on access. */
export function testAccount(email: string) {
  return {
    email,
    get password() {
      return derivePassword(email);
    },
  };
}
