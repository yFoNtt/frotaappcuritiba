# Rodada: Reverter GRANT de has_role + MFA cross-tab + lint

## Entrega 1 — Migration SQL (segurança)

Reverter o GRANT de `EXECUTE` em `public.has_role(uuid, app_role)` para `anon`/`PUBLIC`, mantendo apenas `authenticated`:

```sql
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
```

**Risco a validar após aplicar:** políticas RLS de tabelas públicas (ex.: marketplace/`vehicles`) que chamam `has_role()` passarão a falhar para visitantes anônimos — foi exatamente por isso que o GRANT para `anon` foi adicionado antes (correção do erro 500 em consultas anônimas). Após a migration, rodarei os testes `e2e/rls-anon-expired-session.spec.ts` para confirmar se o marketplace público continua retornando 200 para anon. Se quebrar, a alternativa segura é manter o GRANT mas reescrever `has_role` para ignorar `_user_id` diferente de `auth.uid()` (fail-closed por dentro da função). Reporto o resultado antes de seguir.

## Entrega 2 — src/lib/mfa.ts

Trocar `sessionStorage` por `localStorage` em `isMfaVerified`, `setMfaVerified`, `clearMfaVerified` (a verificação feita na aba do link mágico precisa ser vista pela aba original). Adicionar `watchMfaVerified(userId, onVerified)` com listener de `storage` e cleanup. Nenhuma outra função do arquivo muda.

## Entrega 3 — src/hooks/useAuth.tsx

- Importar `watchMfaVerified` de `@/lib/mfa`.
- Adicionar `useEffect` que assina `watchMfaVerified(user.id, () => setMfaVerifiedState(true))` enquanto houver usuário logado, com cleanup.

## Entrega 4 — eslint.config.js

Adicionar `src/integrations/supabase/previewAuthStorage.ts` à lista de `ignores` (arquivo autogerado com erro `prefer-const` do gerador).

## Fora de escopo

- `supabase/functions/mcp/index.ts`, `_shared/cors.ts`, `admin_set_user_blocked`, `delete_own_account`, `consents`, `site_visits`.
- Qualquer outra lógica de e-mail/magic link.

## Validação

1. Testes unitários de MFA (`src/test/mfa.test.ts`) — podem precisar de ajuste mínimo se referenciarem sessionStorage (verifico antes de alterar; só ajusto se quebrar).
2. Lint nos arquivos editados.
3. Build OK + testes E2E de RLS anon após a migration (Entrega 1).
