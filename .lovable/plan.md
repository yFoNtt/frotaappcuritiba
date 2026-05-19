## Objetivo

Adicionar um conjunto **mínimo e confiável** de testes automatizados que validem:

1. **Isolamento RLS por tenant** — um locador (ou motorista) não consegue ler/alterar dados de outro, em todas as tabelas críticas.
2. **Fluxos de autenticação** — login, signup com seleção de papel, logout, reset de senha, proteção de rotas e bloqueio de roles.

O projeto já tem Vitest + Playwright configurados e contas de teste seedadas (`locador.teste@frotaapp.com`, `motorista.teste.a/b@frotaapp.dev`). O plano se apoia nessa base e **fecha as lacunas** sem reinventar infra.

---

## O que já existe (não duplicar)

- `e2e/auth.spec.ts` — login UI, alternância login/cadastro, logout, Google button visível.
- `e2e/motorista-isolation.spec.ts` — RLS de **storage** (bucket `documents`) entre dois motoristas.
- `e2e/role-redirect.spec.ts` + `src/test/protected-route.test.tsx` — redirecionamento por papel.
- `src/test/auth-redirect.test.tsx`, `auth-validation.test.ts`, `hooks-auth.test.ts` — unidade do fluxo de auth.

**Lacuna principal:** não há testes de RLS a nível de **tabelas do Postgres** (contracts, vehicles, drivers, payments, documents, audit_logs) entre dois **locadores** distintos. É o vetor mais crítico de vazamento.

---

## Arquivos novos

### 1. Seed de segundo locador (edge function)
`supabase/functions/seed-test-locadores/index.ts`

- Protegida por `E2E_SEED_TOKEN` (igual a `seed-test-motoristas`).
- Cria/garante dois locadores idempotentes:
  - `locador.teste.a@frotaapp.dev` / `Teste@123456`
  - `locador.teste.b@frotaapp.dev` / `Teste@123456`
- Para cada um insere: 1 `profile`, role `locador` em `user_roles`, 1 `vehicle`, 1 `driver`, 1 `contract`, 1 `payment`, 1 `document` (linha apenas, sem objeto no storage), 1 `maintenance`.
- Retorna IDs criados para uso nos testes (`{ locadorA: {...}, locadorB: {...} }`).

### 2. Teste RLS multi-tenant — locador vs locador
`e2e/rls-locador-isolation.spec.ts`

Usa REST do PostgREST diretamente (mesmo padrão de `motorista-isolation.spec.ts`):

Para cada tabela em `['vehicles', 'drivers', 'contracts', 'payments', 'documents', 'maintenances', 'mileage_records', 'vehicle_inspections']`:
- **SELECT cross-tenant** → Locador A faz `GET /rest/v1/<tabela>?id=eq.<id_de_B>` ⇒ resposta **vazia** (não 403, pois RLS filtra silenciosamente).
- **UPDATE cross-tenant** → A faz `PATCH ?id=eq.<id_de_B>` com qualquer campo ⇒ `0 rows affected` (`Content-Range: */0` ou body vazio).
- **DELETE cross-tenant** → A faz `DELETE ?id=eq.<id_de_B>` ⇒ `0 rows affected`.
- **INSERT com locador_id alheio** → A insere registro com `locador_id = B.userId` ⇒ **403/401** por `WITH CHECK`.

Asserções escritas com mensagens claras (`RLS LEAK: locador A leu <tabela> de B`).

### 3. Teste RLS — motorista não vê dados de outro locador
`e2e/rls-motorista-cross-locador.spec.ts`

- Login como `motorista.teste.a` (vinculado ao locador X via seed existente).
- Tenta `GET /rest/v1/contracts?select=*` e `GET /rest/v1/payments?select=*`.
- Confirma que só vem registros cujo `driver_id` pertence ao próprio motorista. Tenta `id=eq.<contrato_de_outro_locador>` → vazio.

### 4. Teste RLS — anon não acessa nada
`e2e/rls-anon-blocked.spec.ts`

Faz `GET` sem `Authorization` (apenas `apikey`) em `vehicles`, `contracts`, `payments`, `profiles`, `audit_logs`, `user_roles` ⇒ todos devem retornar `[]` ou 401. Exceto a RPC `get_public_vehicles` que **deve** funcionar.

### 5. Teste fluxos de autenticação — cobertura ampliada
`e2e/auth-flows.spec.ts`

Casos que faltam:
- **Signup novo locador**: cria email aleatório `+e2e-${ts}@frotaapp.dev`, escolhe role `locador`, confirma redirect para `/locador`. (Cleanup via service role no `afterAll`.)
- **Signup novo motorista**: idem para `motorista`.
- **Rate limit / senha errada 5x**: confirma mensagem "Muitas tentativas".
- **Acesso a rota protegida sem login**: `goto('/locador')` ⇒ redireciona para `/login`.
- **Locador tentando acessar `/admin`**: redireciona para `/locador`.
- **Motorista tentando acessar `/locador`**: redireciona para `/motorista`.
- **Reset de senha**: clica em "Esqueci a senha", submete email, espera toast de sucesso (sem inbox check; só valida que o RPC não falhou).
- **Logout** invalida sessão: após logout, tentar `goto('/locador')` redireciona para `/login`.

### 6. Helpers compartilhados
`e2e/helpers/supabase-rest.ts`

Pequena lib com:
- `loginViaApi(email, password)` → `{ accessToken, userId }` (extraído de `motorista-isolation`).
- `restGet/Patch/Delete/Post(table, query, token, body?)`.
- `expectRlsBlocked(response)` → asserts comuns.

Refatorar `motorista-isolation.spec.ts` para usar esses helpers (sem mudar comportamento).

### 7. Teste unitário — `ProtectedRoute` com role admin
Já existe cobertura de locador/motorista. Adicionar caso `admin` em `src/test/protected-route.test.tsx` (1 `it` extra).

---

## Detalhes técnicos

- **Idempotência do seed**: o script deve usar `upsert` por email e `ON CONFLICT DO NOTHING` para os relacionamentos. Não recriar IDs entre runs.
- **Cleanup**: NÃO apagar entre runs — os IDs ficam estáveis e os testes só leem/tentam ações cross-tenant (não destrutivas no próprio tenant). Para signup, sim apagar no `afterAll` via service role.
- **CI**: já existe `.github/workflows/e2e-tests.yml`. Adicionar passo antes do `playwright test`:
  ```
  curl -X POST $SUPABASE_URL/functions/v1/seed-test-locadores \
    -H "Authorization: Bearer $E2E_SEED_TOKEN"
  ```
- **Determinismo**: usar `test.describe.serial` apenas nos blocos de signup (para evitar colisão de emails).
- **Timeout do PostgREST**: usar `expect.poll` quando necessário para tolerar latência.
- **Sem mocks**: estes testes batem no Supabase real do projeto. Aceitável porque já é a abordagem usada hoje.

---

## Critérios de aceite

- Todos os novos arquivos passam localmente (`bunx playwright test e2e/rls-*.spec.ts e2e/auth-flows.spec.ts`) e em CI.
- Um vazamento real de RLS (ex.: remover `locador_id = auth.uid()` de uma policy) **quebra** pelo menos um teste com mensagem clara apontando a tabela.
- Cobertura mínima por tabela crítica listada acima.
- Nenhum teste depende de UI específica de admin (admin não tem conta seedada e fica fora do escopo desta entrega).

---

## Fora de escopo (sugestões para depois)

- Testes de RLS para `messages`/`conversations` (precisam de seed de chat).
- Testes de RLS para `audit_logs` cross-tenant (envolve insert via trigger, mais complexo).
- Testes de admin (precisariam de conta admin seedada com cuidado).
- Property-based / fuzzing nas policies.