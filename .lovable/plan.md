# Plano — Vulnerabilidades + Hardening (12 entregas)

Aplico exatamente as 12 entregas do prompt, na ordem obrigatória. Nenhuma migration SQL, nenhuma policy RLS, nenhuma função SECURITY DEFINER alteradas.

## 1. Dependências (CVE crítico)
- `package.json`: `vite ^5.4.19 → ^5.4.21`, `vitest ^3.2.4 → ^3.2.6`.
- Rodar `npm install` para atualizar lockfile.

## 2. Módulo CORS compartilhado
- Criar `supabase/functions/_shared/cors.ts` com `buildCorsHeaders(req)` baseado em allow-list:
  - Domínio de produção + `ALLOWED_ORIGIN`/`ORIGEM_PERMITIDA`.
  - HTTPS-only para `*.lovable.app` e `*.lovableproject.com`.
  - `localhost`/`127.0.0.1` somente se secret `ALLOW_LOCAL_DEV=true` (default agora é **false** — fail-closed).
- Inclui headers extras (`x-seed-token`, plataforma/runtime do Supabase) e `Vary: Origin`.

## 3–10. Substituir wildcard `*` pelo allow-list em 8 Edge Functions
Cada function importa `buildCorsHeaders` do módulo novo e move `const corsHeaders = buildCorsHeaders(req)` para dentro do handler. Lógica de negócio intacta.

| # | Function | Observação |
|---|---|---|
| 3 | `rate-limited-login` | Remove duplicação local; passa a importar do shared |
| 4 | `locador-assistant` | PII pseudonimizada — alta prioridade |
| 5 | `generate-notifications` | — |
| 6 | `check-cnh-expiry` | — |
| 7 | `suggest-vehicle-price` | — |
| 8 | `record-consent` | — |
| 9 | `export-user-data` | LGPD portabilidade |
| 10 | `log-inconsistency-review` | Move helper `json()` para dentro do handler (fecha sobre `corsHeaders` por request) |

**Não tocar**: `seed-test-*` e `cleanup-test-motoristas` (protegidos por `x-seed-token`/service-role, custo desproporcional).

## 11. Revogar sessão ativa de usuário bloqueado
`src/hooks/useAuth.tsx`:
- Adicionar `checkBlockedAndSignOut()` que chama RPC `is_current_user_blocked`, força `signOut` e exibe toast.
- Disparar na carga inicial (`getSession`), em cada `onAuthStateChange`, e a cada 3 minutos via `setInterval` enquanto houver `user`.
- **Não alterar** `signIn()` existente.

## 12. Novo E2E `e2e/driver-invite-claim.spec.ts`
5 cenários cobrindo `get_driver_invite_preview` / `claim_driver_invite`:
1. Preview de token válido retorna nomes corretos.
2. Preview de token inexistente → inválido.
3. Anônimo bloqueado (401/403) por falta de GRANT.
4. Locador autenticado → `wrong_role`.
5. Motorista confirma vínculo, conversa-lead é promovida (`driver_id` setado, `interested_user_id` zerado), reclaim retorna `invalid_or_expired`.

Helper `generateValidCnh()` replicando algoritmo do trigger `validate_driver_cnh`.

## Validação final
- `tsc --noEmit`, ESLint e Vitest devem continuar limpos.

## Efeito colateral operacional
Após deploy, chamadas de localhost às Edge Functions hardenizadas serão bloqueadas por CORS, a menos que o secret `ALLOW_LOCAL_DEV=true` esteja configurado no projeto Supabase. Comportamento desejado em produção.
