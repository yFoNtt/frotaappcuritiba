## Plano — Reforço LGPD (3 itens)

### 1. Bloquear acesso quando consentimento está revogado ou desatualizado

Criar um "gate" de re-aceite que intercepta usuários autenticados sem consentimento válido e os força a aceitar antes de continuar usando a plataforma.

- **Hook `useConsentStatus`** (novo, `src/hooks/useConsentStatus.tsx`): reaproveita `useLatestConsent` e retorna `{ status: 'valid' | 'missing' | 'revoked' | 'outdated', consent, isLoading }` comparando contra `TERMS_VERSION`/`PRIVACY_VERSION`.
- **Página `ConsentGate`** (novo, `src/pages/ConsentGate.tsx`): tela full-screen, fora dos layouts de role, com:
  - Mensagem explicando por que o acesso está bloqueado (revogado / nova versão / nunca aceito).
  - Resumo dos Termos e Política com links para `/termos` e `/privacidade`.
  - Checkbox "Li e aceito" + botão "Aceitar e continuar" (chama `useRecordConsent`).
  - Botão secundário "Sair" (chama `signOut`).
- **Integração em `ProtectedRoute.tsx`**: depois de validar `user` e `role`, se `useConsentStatus()` retornar diferente de `valid` e a rota atual não for `/consent-required`, redireciona para `/consent-required`. Admin fica isento (pode operar mesmo sem aceite, evita lockout).
- **Rota** registrada em `src/routes/publicRoutes.tsx` (ou um arquivo de rotas protegidas neutro) como `/consent-required`, sem layout de role.
- **PrivacySection**: após revogar, mostrar aviso "Você será redirecionado para reaceitar os termos ao navegar".

### 2. Captura de `ip_address` via Edge Function

A coluna `consents.ip_address` existe mas hoje só `user_agent` é preenchido. Mover a inserção para uma Edge Function que lê o IP do cabeçalho da requisição.

- **Nova Edge Function `record-consent`** (`supabase/functions/record-consent/index.ts`):
  - Valida JWT (`supabase.auth.getUser()` com header Authorization).
  - Extrai IP de `x-forwarded-for` (primeiro valor) → fallback `cf-connecting-ip` → `null`.
  - Lê `user_agent` do header `user-agent`.
  - Insere em `consents` com `user_id`, `terms_version`, `privacy_version` (recebidos no body, validados com Zod contra as constantes esperadas), `ip_address`, `user_agent`.
  - `verify_jwt = true` em `supabase/config.toml`.
- **Atualizar `useRecordConsent`**: trocar `supabase.from('consents').insert(...)` por `supabase.functions.invoke('record-consent', { body: { terms_version, privacy_version } })`.
- **Atualizar `useAuth.signUp`**: trocar o insert pós-signup pela mesma função (ou manter o insert direto somente como fallback, já que pode rodar antes da sessão estar totalmente pronta — usaremos a Edge Function após o login efetivo, ou seja, no `ConsentGate` e no `RegisterForm` chamada após autenticação).
- **Sem alteração de RLS**: a função usa o cliente com JWT do usuário, então a policy de INSERT existente continua valendo.

### 3. Teste E2E do fluxo LGPD

Criar `e2e/lgpd-flow.spec.ts` cobrindo o ciclo completo, usando contas de teste já disponíveis (`TEST_ACCOUNTS`).

Cenários:
- **Cadastro com checkbox obrigatório**: submit bloqueado quando checkbox não marcado; toast de erro visível.
- **Exportar dados**: login → Settings → clicar "Exportar meus dados" → aguardar download de `meus-dados-frotaapp.json` e validar que é JSON válido com chave `profile`.
- **Revogar consentimento → ConsentGate**: login → Settings → "Revogar consentimento" → confirmar → navegar para `/locador` → esperar redirecionamento para `/consent-required` → reaceitar → voltar ao dashboard normal.
- **Excluir conta**: usa uma conta seed dedicada (criada via Edge Function `seed-test-motoristas` ou similar), exclui, confirma que login subsequente falha.

A spec usa `test.describe.serial` para garantir ordem na conta de teste descartável e `test.skip` quando `E2E_SEED_TOKEN` não estiver disponível.

### Arquivos

**Criar**
- `src/hooks/useConsentStatus.tsx`
- `src/pages/ConsentGate.tsx`
- `supabase/functions/record-consent/index.ts`
- `e2e/lgpd-flow.spec.ts`

**Editar**
- `src/components/auth/ProtectedRoute.tsx` — gate de consentimento
- `src/routes/publicRoutes.tsx` (ou equivalente) — rota `/consent-required`
- `src/hooks/useConsents.tsx` — `useRecordConsent` chama Edge Function
- `src/hooks/useAuth.tsx` — registro pós-signup via Edge Function
- `supabase/config.toml` — registrar `record-consent` com `verify_jwt = true`

**Sem alteração**
- RLS da tabela `consents` (a função usa JWT do usuário, policy existente cobre)
- Migrations já aplicadas

### Pontos de atenção

- Admin fica fora do gate para evitar lockout em manutenção.
- A página `/consent-required` precisa estar acessível mesmo com consentimento inválido (não pode entrar em loop).
- A Edge Function `record-consent` valida que `terms_version`/`privacy_version` enviados batem com os esperados pelo servidor (constantes hardcoded na função), evitando que o cliente "aceite" uma versão arbitrária.
