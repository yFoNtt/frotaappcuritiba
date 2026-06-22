## Escopo
Três entregas independentes, todas com instruções literais já fornecidas. Aplicar exatamente como especificado, sem desvios.

## Entrega 1 — Corrigir FK `conversations.driver_id`
**Arquivo novo:** `supabase/migrations/<timestamp>_fix_conversations_driver_fk.sql`

Bloco `DO $$ ... END $$` idempotente que:
1. `DROP CONSTRAINT fk_conversations_driver` se existir (apontava errado para `auth.users`).
2. Recria apontando para `public.drivers(id) ON DELETE CASCADE`.

Sem alteração em código TS — as RLS e `useChat.ts` já tratam `driver_id` como PK de `drivers`.

## Entrega 2 — Fortalecer `delete_own_account()`
**Arquivo novo:** `supabase/migrations/<timestamp>_harden_delete_own_account.sql`

`CREATE OR REPLACE FUNCTION public.delete_own_account()` exatamente como no spec:
1. Anonimiza `audit_logs.changed_by`.
2. Redige conteúdo + anexos das `messages` do usuário (preserva thread).
3. `DELETE` em `conversations` lead (`interested_user_id = v_user_id AND driver_id IS NULL`).
4. `DELETE` em `user_roles`, `cnh_alerts`, `notifications`, `consents`, `profiles`.
5. `DELETE FROM auth.users WHERE id = v_user_id` para disparar todas as FKs cascade já existentes.

Se a migration falhar com "permission denied for table users", paro e aviso — não tento contornar com GRANT em `auth.users`. Próximo passo seria Edge Function com service role.

## Entrega 3 — Patch de dependências
**Arquivo:** `package.json`
- `jspdf`: `^4.0.0` → `^4.2.1`
- `react-router-dom`: `^6.30.1` → `^6.30.4`

Após edição, `npm install` (auto pelo harness) regenera lockfile. Vitest roda automaticamente para confirmar 439/439.

## Fora de escopo (não tocar)
- Outros componentes UI, hooks, rotas, specs Playwright, suíte Vitest.
- vitest UI CVE, deps transitivas moderate/high.
- Billing/planos, novas tabelas.

## Ordem de execução
Entregas 1, 2 e 3 são independentes — aplico em paralelo (duas migrations + um edit de package.json).

## Verificação manual (pelo usuário, pós-merge)
- Ent.1: enviar 1ª mensagem como motorista vinculado em `/motorista/mensagens`; testar `claim_driver_invite` migrando conversa-lead.
- Ent.2: excluir conta de motorista → conversa permanece com mensagem redigida, driver sem `user_id`; excluir conta de locador → vehicles/drivers/contracts/conversations dele somem.
- Ent.3: rodar `npm run test` (439/439).
