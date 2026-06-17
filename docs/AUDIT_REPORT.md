# FrotaApp — Relatório de Auditoria (Fase 1)

**Data:** 17/06/2026
**Modo:** somente leitura, nenhum arquivo de aplicação foi alterado.
**Stack auditada:** React 18 + Vite 5 + TS 5 + Tailwind v3 + shadcn/ui + Supabase (Lovable Cloud).

Severidade: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🟢 Baixo

---

## Resumo executivo

| Categoria | Crítico | Alto | Médio | Baixo |
|---|---|---|---|---|
| Segurança backend (RLS/RPC/Edge) | 0 | 3 | 7 | 0 |
| Segurança frontend (XSS/Storage/Auth) | 0 | 0 | 2 | 1 |
| Dependências (CVE) | 0 | 0 | 0 | 0 |
| Tipos / Lint | 0 | 1 | 1 | 1 |
| Testes (vitest) | 0 | 2 | 1 | 0 |
| React anti-patterns | 0 | 2 | 1 | 0 |
| Performance | 0 | 0 | 3 | 2 |
| Arquitetura / refactor | 0 | 0 | 4 | 2 |

**Build:** ✅ TypeScript compila limpo (`tsc --noEmit` sem erros).
**Vitest:** ❌ 12 testes falhando em 3 arquivos (439 totais, 427 passando).
**ESLint:** ❌ 83 erros + 19 warnings (102 problemas).
**`npm audit` / dependency scan:** ✅ 0 vulnerabilidades high/critical.
**Color guard:** ✅ sem cores cruas Tailwind.
**Supabase linter:** ⚠️ 10 warnings (todos sobre `SECURITY DEFINER` executáveis — ver §1).

---

## 1. Segurança Backend

### 🟠 1.1 — Funções `SECURITY DEFINER` executáveis por anon/authenticated sem necessidade
Supabase linter levantou 10 warnings. Funções a revisar (revogar EXECUTE de quem não precisa):

- **Públicas (anon + authenticated) intencionais — manter:** `get_public_vehicles`, `get_public_vehicles_by_locador`, `get_public_vehicle` (alimentam marketplace anônimo). Apenas documentar.
- **Devem ser só `authenticated`, hoje abertas a `anon` — REVOGAR de anon:** confirmar caso a caso, candidatas: `has_role`, `get_user_role`, `assign_initial_role`, `delete_own_account`.
- **Devem ser só `service_role`, hoje executáveis por `authenticated`:** `insert_cnh_alert` (já valida internamente, ok), `cleanup_old_login_attempts`, `audit_trigger_func`, `update_conversation_on_message`, `notify_locador_on_driver_change`, `update_vehicle_current_km`, `validate_*` triggers — várias delas são triggers e não deveriam ter EXECUTE para `authenticated`.
- **Admin-only — restringir a `authenticated` com check interno (já tem) mas REVOGAR de `anon`:** `get_user_emails_for_admin`.

**Ação Fase 2:** migration que faz `REVOKE EXECUTE ... FROM PUBLIC, anon` por função, mantendo `GRANT EXECUTE TO authenticated` somente onde necessário e `service_role` para o resto.

### 🟠 1.2 — Edge Function `rate-limited-login` aceita origens curinga
Em `supabase/functions/rate-limited-login/index.ts` o `isAllowedOrigin()` aceita qualquer `*.lovable.app` / `*.lovableproject.com`. Isso é necessário para preview, mas em produção amplia a superfície CSRF de login. Mitigação Fase 2: restringir a `*.lovable.app` específicos + domínio publicado, e adicionar uma allowlist explícita via secret se possível.

### 🟠 1.3 — Edge Functions sem validação Zod no body
Checar: `seed-test-motoristas`, `seed-test-locadores`, `cleanup-test-motoristas`, `record-consent`, `log-inconsistency-review`, `suggest-vehicle-price`, `locador-assistant`, `export-user-data`, `generate-notifications`, `check-cnh-expiry`. Algumas validam, outras não. Levantar caso a caso em Fase 2.

### 🟡 1.4 — RLS por tabela
RLS habilitado em todas as 19 tabelas (auditado via `supabase-tables`). Pendências a confirmar individualmente em Fase 2:
- `UPDATE` policies devem ter `WITH CHECK` além de `USING` (regra do projeto). Validar em `vehicles`, `contracts`, `payments`, `drivers`, `documents`, `maintenances`.
- Confirmar que `motoristas` não conseguem ler dados de outros motoristas do mesmo locador (cross-driver isolation).
- `login_attempts`: garantir que `anon` só consegue `INSERT` (não `SELECT`).

### 🟡 1.5 — Tabela `conversations` com `driver_id NOT NULL`
Já discutido em sessão anterior. Impede o fluxo "interesse via chat" pelo motorista. Não é vulnerabilidade — é dívida de produto. Fora do escopo da auditoria de segurança.

---

## 2. Segurança Frontend

### 🟡 2.1 — `dangerouslySetInnerHTML` em `src/components/ui/chart.tsx:70`
Único ponto da base. O conteúdo é gerado internamente (CSS vars do chart), não recebe input do usuário. **Risco baixo, mas validar em Fase 2** se o `id` chega sanitizado — se for atribuído por consumidor da lib, podemos ter injeção de CSS arbitrário.

### 🟡 2.2 — `localStorage` para flags de onboarding
`OnboardingTour.tsx` e `OnboardingChecklist.tsx` gravam `seen=1`. Não há dado sensível, apenas UX flag. ✅ aceitável.

### 🟢 2.3 — Sem `eval`, sem `innerHTML` cru, sem `window.open` com input do usuário não sanitizado
Grep limpo.

### 🟢 2.4 — Tokens de auth ficam em `localStorage` (gerenciado pelo Supabase client)
Padrão da lib; mitigação seria cookie httpOnly via SSR — fora do alcance no setup atual (SPA cliente). Aceitável.

---

## 3. Dependências

`npm audit` e `bun audit` (via dependency_scan) retornam **0 vulnerabilidades high/critical**. Versões principais conferidas:

| Pacote | Versão atual | CVE? | Ação |
|---|---|---|---|
| react / react-dom | 18.x | não | manter |
| react-router-dom | 6.x | não | manter (v7 é major sem CVE — não atualizar) |
| @supabase/supabase-js | 2.x | não | manter |
| vite | 5.x | não | manter |
| tailwindcss | 3.x | não | manter (v4 é major sem CVE — não atualizar) |
| zod | 3.x | não | manter |
| react-hook-form | 7.x | não | manter |
| xlsx-js-style | atual | não | manter (regra do projeto) |

**Nada a atualizar nesta auditoria.** Se você quiser bumps de minor/patch oportunistas, Fase 3 pode incluir; sem urgência.

---

## 4. Tipos & Lint (102 problemas)

### 🟠 4.1 — 83 erros ESLint, majoritariamente `@typescript-eslint/no-explicit-any`
Hotspots:
- `src/hooks/useDocumentRequests.tsx` — 14 ocorrências de `any`
- `src/hooks/useDocuments.tsx` — 5 ocorrências
- `src/hooks/useChat.ts` — 1 `any` + 1 `no-async-promise-executor`
- `src/components/inspections/InspectionFormDialog.tsx` — 5 `any`
- `src/components/chat/ChatWindow.tsx` — 1 `any`
- `src/components/auth/utils.ts` — 1 `any`
- `src/components/ui/{command,textarea}.tsx` — 2 `no-empty-object-type` (vindo do template shadcn; trivial)

Fase 4: substituir por tipos derivados do `Database['public']['Tables']`.

### 🟡 4.2 — 19 warnings ESLint
- `react-hooks/exhaustive-deps`: `useCnhAlerts.tsx:28`, `InspectionFormDialog.tsx:214`, `useChat.ts:87`.
- `react-refresh/only-export-components`: vários `ui/*.tsx` (impacto só em HMR; cosmético).

### 🟢 4.3 — `tsc --noEmit` sem erros
Build TypeScript limpo.

---

## 5. Testes Automatizados

### 🟠 5.1 — `src/test/protected-route.test.tsx` — 9/9 falhando
Todos os testes do `ProtectedRoute` falham. Indica que o mock de `useAuth` ou o setup mudou e o teste não acompanhou. **Investigar Fase 5** — pode ser teste desatualizado ou regressão real no componente.

### 🟠 5.2 — `src/test/react-antipatterns.test.ts` — 2 falhas reais que apontam bugs no app
- **`LocadorInsights.tsx:16` chama `setState` dentro de `useMemo`** — bug clássico que pode causar re-render infinito. Confirmar e mover para `useEffect`.
- **`ForRenters.tsx:104` usa `document.getElementById(id)?.scrollIntoView()`** — substituir por `useRef`.

### 🟡 5.3 — `src/test/piiSanitizer.test.ts` — 1 falha
`maskCPF` está deixando dígitos visíveis (`X23.X56.X89-09` em vez de mascarar tudo). **Bug real na máscara de PII**, mascarando mal CPFs antes de enviar para a IA. Fase 5: corrigir.

---

## 6. React Anti-patterns / Hooks

### 🟠 6.1 — `setState` em `useMemo` (já citado em 5.2)
`src/components/locador/LocadorInsights.tsx:16`.

### 🟠 6.2 — `document.getElementById` direto (já citado em 5.2)
`src/pages/ForRenters.tsx:104`.

### 🟡 6.3 — Deps faltando em hooks
`useCnhAlerts`, `useChat`, `InspectionFormDialog` (ver §4.2).

---

## 7. Performance

### 🟡 7.1 — Componentes muito grandes
Top 10 (excluindo `types.ts` auto-gerado e sidebar shadcn):

| Arquivo | Linhas |
|---|---|
| `src/pages/locador/Contracts.tsx` | 876 |
| `src/pages/admin/Metrics.tsx` | 786 |
| `src/pages/locador/Drivers.tsx` | 780 |
| `src/pages/locador/Payments.tsx` | 756 |
| `src/components/inspections/InspectionFormDialog.tsx` | 745 |
| `src/pages/motorista/Documents.tsx` | 732 |
| `src/components/vehicles/VehicleForm.tsx` | 697 |
| `src/pages/locador/Documents.tsx` | 625 |
| `src/components/contracts/InspectionComparison.tsx` | 517 |
| `src/pages/locador/Mileage.tsx` | 515 |

Impacto: re-render caro, lazy chunks grandes, manutenção difícil. **Fase 8 (refactor)** — quebrar em subcomponentes sem mudar comportamento.

### 🟡 7.2 — Hooks de fetch sem `select` no TanStack Query
Vários hooks devolvem o registro inteiro quando a tela usa só 3 campos. Otimizar com `select` ou `.select(...)` Supabase.

### 🟡 7.3 — Realtime sem `removeChannel` em alguns hooks
Confirmar em Fase 6 (`useChat`, `useNotifications`).

### 🟢 7.4 — Rotas já estão em `React.lazy`/`Suspense`
Bem feito. Manter.

### 🟢 7.5 — Bundle splitting funcional
Sem páginas síncronas penduradas.

---

## 8. Arquitetura / Refactor

### 🟡 8.1 — Duplicação de lógica de export Excel
`useInspectionExport`, `useAuditLogsExport`, `useMaintenanceExport`, `useMetricsExport`, `useReportExport` repetem boilerplate de `xlsx-js-style`. Extrair helper `exportToXlsx(rows, sheetName, columns)`.

### 🟡 8.2 — `useAuth.tsx` com 269+ linhas mistura provider + hooks utilitários
Quebrar em `AuthProvider`, `useAuth`, `useRole` se a refatoração não quebrar consumidores (warning de fast-refresh confirma).

### 🟡 8.3 — `src/hooks/useChat.ts` (458 linhas) com `async Promise executor`
Anti-pattern. Refatorar (Fase 4 ou 8).

### 🟡 8.4 — Falta um `RouteErrorBoundary` por rota lazy
Verificar se cada rota protegida tem fallback de erro (apenas `LazyFallback` para suspense não cobre erro de runtime).

### 🟢 8.5 — Estrutura de pastas coerente
`pages/`, `components/`, `hooks/`, `routes/`, `integrations/supabase/` — boa separação.

---

## 9. UX / Console
Não rodei Playwright nesta fase para economizar tempo. Será incluído no checklist da Fase 7. Grep não encontrou `console.log` esquecidos em código de produção (`src/test/*` é o único hit).

---

## 10. Permissões / Rotas

A revisar via Playwright na Fase 9:
- admin acessando `/locador/*` e `/motorista/*` → deve redirecionar
- motorista acessando `/locador/*` e `/admin/*` → deve redirecionar
- locador acessando `/motorista/*` e `/admin/*` → deve redirecionar
- anônimo acessando qualquer `/locador/*`, `/motorista/*`, `/admin/*` → vai para `/login`
- testar com tokens expirados / sem `user_roles` row → estado já tratado por `useAuth`?

---

## 11. Funcionalidades que **NÃO devo tocar** (regras de negócio)

- Geração de pagamentos semanais e prevenção de duplicatas
- Cálculo de KM excedente e cobrança
- Validação de CPF/CNPJ/CNH (triggers DB + Zod frontend)
- Status automático do veículo (disponível ↔ locado ↔ manutenção)
- Lógica de alertas de CNH (30/15/7 dias)
- Filtro do marketplace por plano ativo (mesmo quando billing não está implementado)
- Mascaramento de PII antes de IA (corrigir bug do `maskCPF` mas manter a regra)
- Remoção automática de anúncios para locador suspenso
- RPCs `get_public_vehicle*` (estrutura, manter campos atuais)

---

## 12. Plano de execução proposto (resumo)

| Fase | Foco | Risco | Esforço |
|---|---|---|---|
| **2** | Segurança: REVOKE EXECUTE seletivo, CORS rate-limited-login, RLS UPDATE WITH CHECK, Zod nas Edge Functions sem validação | Médio (migrations) | Médio |
| **3** | Bumps de minor/patch oportunistas (sem CVE, sem urgência) | Baixo | Baixo |
| **4** | Zerar 83 erros ESLint (tipar `any` em hooks), corrigir `async Promise executor`, remover `empty-object-type` | Baixo | Alto |
| **5** | Corrigir `maskCPF`, mover `setState` de `useMemo` em `LocadorInsights`, trocar `getElementById` por `useRef` em `ForRenters`, consertar 9 testes de `ProtectedRoute` | Médio (testes podem revelar regressão) | Médio |
| **6** | Cleanup de realtime channels, `select` em TanStack Query, deps faltando em hooks | Baixo | Médio |
| **7** | UX: rodar Playwright em todos os fluxos, capturar warnings, ajustar feedback | Baixo | Alto |
| **8** | Refactor componentes > 500 linhas em subcomponentes, extrair helper Excel, dividir `useAuth.tsx` | Médio | Alto |
| **9** | Verificação final + Playwright completo + linter + changelog | Baixo | Médio |

---

## 13. Próxima decisão

Aprove qual fase devo executar a seguir. Recomendação: **Fase 2 (segurança crítica)** primeiro, depois **Fase 5 (bugs reais detectados pelos testes)** porque são alto-impacto/baixo-escopo, e só então o restante.
