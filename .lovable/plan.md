# Plano LGPD — FrotaApp

Implementação aditiva (sem alterar lógica existente). Os arquivos de configurações no projeto chamam-se `Settings.tsx` (não `Configuracoes.tsx`) — usarei os existentes: `src/pages/locador/Settings.tsx` e `src/pages/motorista/Settings.tsx`.

## Entrega 1 — Mascaramento de PII em `locador-assistant`

- Criar `supabase/functions/_shared/maskPII.ts` exportando `maskPII(text)` e `maskPIIDeep(value)` (recursivo em objetos/arrays).
- Regex: CPF, CNPJ, CNH (9 dígitos isolados — observação: o snapshot atual usa CNH brasileira de 11 dígitos; aplicarei também variante 11 dígitos para cobrir o caso real), telefones BR (com/sem DDI), e-mail.
- Em `supabase/functions/locador-assistant/index.ts`: aplicar `maskPIIDeep(snapshot)` antes de serializar para o LLM. Manter datas, valores, status, placa, marca/modelo, cidade (não são PII direta).
- Log de auditoria contando substituições quando `Deno.env.get("ENVIRONMENT") !== "production"`.

## Entrega 2 — Tabela `consents` + checkbox no cadastro

Migration (idempotente com `if not exists` / `do $$`):

- `create table if not exists public.consents (...)` conforme spec.
- `grant select, insert on public.consents to authenticated; grant all to service_role;`
- `alter table ... enable row level security;`
- Policies `select` (own) e `insert` (`with check auth.uid()=user_id`) criadas via bloco `do $$ if not exists`.

Frontend:

- Novo arquivo `src/lib/consentVersions.ts` com `TERMS_VERSION='1.0'`, `PRIVACY_VERSION='1.0'`.
- `src/components/auth/RegisterForm.tsx`: adicionar `Checkbox` shadcn obrigatório com links para `/termos` e `/privacidade` (target=`_blank`, `rel="noopener"`). Botão "Criar conta" desabilitado até marcar. Validação local (não há schema Zod hoje no form — manterei o padrão atual com guard `if (!acceptedTerms) toast.error(...)`).
- Após `signUp` bem-sucedido: `supabase.from('consents').insert({ user_id, terms_version, privacy_version, user_agent: navigator.userAgent })`. Aguardar `user` retornar antes do insert; se o insert falhar, não bloquear o cadastro (log silencioso).

## Entrega 3 — Edge Function `export-user-data`

- `supabase/functions/export-user-data/index.ts` com CORS, JWT validation in-code, `verify_jwt = true` em `supabase/config.toml`.
- Cliente Supabase criado com `Authorization` header do usuário → RLS aplica-se naturalmente.
- Coletar em paralelo: `profiles`, `drivers`, `contracts`, `payments`, `maintenances`, `mileage_records`, `vehicle_inspections`, `documents`, `document_requests`, `conversations`, `messages`, `notifications`, `cnh_alerts`, `consents` filtrados pelo `user_id`/`locador_id`/`driver_id` conforme a tabela; `audit_logs` filtrado por `changed_by = user_id` (usar service client só para audit_logs, pois RLS pode bloquear leitura ampla — manter escopo `changed_by = userId`).
- Retornar JSON com `Content-Disposition: attachment; filename="meus-dados-frotaapp.json"`.

## Entrega 4 — RPC `delete_own_account` + UI

- Migration cria função `SECURITY DEFINER` conforme spec (com `grant execute ... to authenticated`).
- Observação importante: o `update auth.users` da spec só funciona com FKs `ON DELETE CASCADE` (Entrega 5) ou via anonimização explícita. Implementarei conforme escrito; profiles é apagado e a conta de auth é "tombada" (email renomeado + metadata `{deleted:true}`).
- Após Entrega 5, a remoção do profile/cascade limpa relações.

UI (nas duas Settings):

- `AlertDialog` shadcn com aviso, campo `Input` exigindo digitar `EXCLUIR` para habilitar botão destrutivo.
- Ao confirmar: `supabase.rpc('delete_own_account')` → `supabase.auth.signOut()` → `navigate('/')` → toast.

## Entrega 5 — Foreign keys físicas

Migration idempotente (verifica `pg_constraint` antes de criar). Já existem várias FKs (ver investigação):

- Existem: `profiles_user_id_fkey`, `user_roles_user_id_fkey`, `cnh_alerts_user_id_fkey`, `vehicles_locador_id_fkey`, `drivers_vehicle_id_fkey`, `drivers_user_id_fkey`, `contracts_driver_id_fkey`, `contracts_vehicle_id_fkey`, `payments_*_fkey`, `maintenances_vehicle_id_fkey`, `mileage_records_*`, `documents_*` (parciais), `vehicle_inspections_*`, `messages_conversation_id_fkey`.
- Faltam (vou adicionar): `drivers.locador_id → auth.users(cascade)`, `documents.locador_id → auth.users(cascade)`, `notifications.user_id → auth.users(cascade)`, `payments.contract_id ON DELETE CASCADE` (existe sem cascade — vou recriar com cascade), `maintenances.vehicle_id ON DELETE CASCADE` (idem), `mileage_records.vehicle_id`, `vehicle_inspections.vehicle_id`, `contracts.driver_id ON DELETE SET NULL` (alterar nullable se necessário — atualmente NOT NULL, então manterei FK existente sem mudar comportamento e adicionarei nota; alternativa segura: deixar FK atual, não converter para SET NULL para não violar NOT NULL).
- Estratégia: para FKs existentes sem cascade desejado, `alter table drop constraint ... ; add constraint ... on delete cascade`. Para colunas `NOT NULL` onde a spec pede `SET NULL`, manter `CASCADE` (e documentar) para não quebrar schema.

## Entrega 6 — Seção "Privacidade e seus dados"

Criar componente reutilizável `src/components/settings/PrivacySection.tsx` usando tokens semânticos (`text-foreground`, `text-muted-foreground`, `bg-card`, `text-destructive`):

- Consentimento ativo: hook `useLatestConsent()` (TanStack Query v5) lê `consents` mais recente do usuário; mostra versão + data formatada `dd 'de' MMMM 'de' yyyy` (date-fns/locale pt-BR). Fallback: aviso "Confirme seu aceite atualizando seu perfil".
- Botão "Exportar meus dados" → chama `supabase.functions.invoke('export-user-data')`, recebe JSON, dispara download via `Blob` + `a[download]`, toast.
- Botão "Excluir minha conta" (variant=`destructive`) → AlertDialog conforme Entrega 4.
- Links rápidos para `/privacidade` e `/termos` (`target="_blank"`).

Importar `<PrivacySection />` em `src/pages/locador/Settings.tsx` e `src/pages/motorista/Settings.tsx`.

## Detalhes técnicos

- Stack: TanStack Query v5, sonner, shadcn (`Card`, `Button`, `AlertDialog`, `Checkbox`, `Input`, `Label`).
- Migrations: 3 arquivos (consents, delete_own_account, fks) — todas idempotentes.
- Edge Functions: 1 nova (`export-user-data`, `verify_jwt = true`) + alteração em `locador-assistant`.
- Sem alteração de RLS existente; apenas novas policies para `consents`.
- Respeitar CI guard de cores: somente tokens semânticos.

## Arquivos a criar

- `supabase/functions/_shared/maskPII.ts`
- `supabase/functions/export-user-data/index.ts`
- `src/lib/consentVersions.ts`
- `src/hooks/useConsents.tsx`
- `src/components/settings/PrivacySection.tsx`
- 3 migrations Supabase

## Arquivos a editar

- `supabase/functions/locador-assistant/index.ts`
- `supabase/config.toml` (adicionar `export-user-data`)
- `src/components/auth/RegisterForm.tsx`
- `src/pages/locador/Settings.tsx`
- `src/pages/motorista/Settings.tsx`
