

# Abrir PR de teste para validar seed + rls-isolation no CI

## Objetivo

Disparar o workflow `e2e-tests.yml` no GitHub Actions através de um Pull Request trivial, para validar end-to-end que:
1. O job `seed-test-accounts` recria as contas `motorista.teste.a/b` via Edge Function.
2. O job `rls-isolation` autentica nessas contas e confirma o isolamento por RLS no bucket `documents`.
3. O job `e2e` completo continua passando.

## Limitação importante

Eu **não consigo** abrir Pull Requests no GitHub diretamente — não tenho acesso à API do GitHub nem permissão para executar comandos `git`. O que posso fazer é gerar uma alteração trivial no repositório (um commit "no-op") que, ao ser sincronizada via integração Lovable↔GitHub, dispara o workflow no branch padrão. Para um **PR real** (rodando em `pull_request`), você precisa criar o branch e abrir o PR manualmente no GitHub.

## Pré-requisitos (você precisa confirmar antes)

1. **Secret `E2E_SEED_TOKEN` configurado no GitHub** em `Settings → Secrets and variables → Actions`, com o **mesmo valor** salvo no Lovable Cloud.
2. **Secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`** já configurados (necessários para o build no job `e2e`).

Se algum desses faltar, o workflow falha imediatamente com 401 ou erro de build.

## Abordagens possíveis

### Opção A — Commit trivial no `main` (rápido, sem PR)

Eu adiciono um comentário inócuo em `.github/workflows/e2e-tests.yml` (ex.: `# trigger CI run` no topo). O sync com GitHub gera um commit em `main`, e o workflow roda em `push`. Você consegue ver o resultado em `Actions` poucos segundos depois.

- ✅ Não exige ação manual sua.
- ❌ Não testa o caminho `pull_request` (mas a config dispara nos dois eventos, então cobre o mesmo workflow).
- ❌ Polui o histórico do `main` com 1 commit.

### Opção B — Você abre o PR manualmente (recomendado)

Eu preparo um arquivo trivial novo (ex.: `.github/workflows/.ci-trigger`) com um timestamp. Depois você:
1. No GitHub, cria branch `test/seed-validation` a partir de `main`.
2. Cherry-picka esse commit ou faz uma alteração trivial na branch.
3. Abre PR contra `main`.
4. Observa os 3 jobs rodando em ordem: `seed-test-accounts → rls-isolation → e2e`.

- ✅ Testa o caminho `pull_request` de verdade.
- ✅ Não suja o `main`.
- ❌ Exige ~2 minutos de ação manual sua.

### Opção C — Acionar o workflow via `workflow_dispatch`

Adicionar `workflow_dispatch:` aos triggers do workflow para permitir que você dispare manualmente em `Actions → E2E Tests (Playwright) → Run workflow` sem precisar de PR nem commit.

- ✅ Reutilizável para futuros testes manuais.
- ✅ Não suja histórico nem exige PR.
- ❌ Não simula o fluxo real de PR (mas como o `seed → isolation → e2e` é idêntico, valida o mesmo).

## Recomendação

**Opção C + Opção A combinadas**: adicionar `workflow_dispatch` ao workflow (mudança útil permanente) e, na mesma alteração, validar que o trigger funciona. Você ganha:
- Capacidade futura de re-rodar testes manualmente sem PRs.
- A própria mudança no YAML já dispara o `push` em `main`, validando o fluxo agora.

## Alteração técnica proposta

Adicionar 2 linhas no início do bloco `on:` em `.github/workflows/e2e-tests.yml`:

```yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:
```

Nada mais muda. Os jobs, dependências (`needs:`) e secrets continuam idênticos.

## Como você valida o sucesso

Após o sync GitHub:
1. Vá em `Actions → E2E Tests (Playwright)`.
2. A run mais recente deve ter 3 jobs verdes em sequência:
   - `seed-test-accounts` (~10s, retorna HTTP 200 com `results[]` contendo os 2 motoristas).
   - `rls-isolation` (~1-2 min, valida que A não lê arquivos de B e vice-versa).
   - `e2e` (~5-10 min, suite completa).
3. Se `seed-test-accounts` falhar com **401**, o secret `E2E_SEED_TOKEN` no GitHub não bate com o do Lovable.
4. Se `rls-isolation` falhar com **"No driver row for user"**, o seed não criou o driver — verifique logs do step de seed.

## O que faço quando aprovar

1. Editar `.github/workflows/e2e-tests.yml` adicionando `workflow_dispatch:`.
2. Esperar o sync com GitHub propagar (alguns segundos).
3. Te informar onde clicar no GitHub para acompanhar a run.

