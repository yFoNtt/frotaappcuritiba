# Auditoria Final de Produção — Plano por Fases

O projeto já passou pelas Fases 1–5 + ESLint zerado. Esta nova rodada foca no que ainda não foi coberto: bundle, runtime warnings, performance, E2E, responsividade/UX e validação final. Cada fase é independente e aprovada antes da próxima. **Nenhuma regra de negócio será alterada.**

---

## Fase A — Limpeza de runtime warnings e console (rápida, ~15 min)

Console atual mostra avisos reais que precisam sumir antes de prod:

1. **`fetchPriority` em `<img>`** (HeroSection) — React 18 ainda não reconhece a prop camelCase do React 19. Trocar para `fetchpriority` minúsculo via atributo ou remover.
2. **React Router v6 future flags** — adicionar `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` no `BrowserRouter` para silenciar e já preparar v7.
3. **Varredura `console.log/warn/error`** em `src/` — remover logs de debug residuais (manter apenas `console.error` em ErrorBoundary/catch críticos).
4. **Promises sem `.catch`** — auditar `void`/floating promises em handlers.

Validação: abrir as principais rotas via Playwright e confirmar console limpo.

---

## Fase B — Bundle e code splitting (~30 min)

1. Rodar `vite build` e analisar chunks > 500 KB.
2. Garantir `React.lazy` em rotas pesadas que ainda sejam estáticas: relatórios, exportação Excel (`xlsx-js-style`), exportação PDF (se houver), admin, métricas, audit logs, marketplace de detalhe.
3. Eliminar warnings de "dynamic + static import" do Vite — qualquer módulo importado dinamicamente não pode ser também importado estaticamente em outro arquivo.
4. Configurar `manualChunks` no `vite.config.ts` para isolar `recharts`, `xlsx-js-style`, `framer-motion`, `@radix-ui/*` em chunks próprios.
5. Confirmar que `vendor` inicial cai significativamente.

Validação: comparar tamanhos antes/depois e listar no relatório.

---

## Fase C — Performance React (~30 min)

1. Buscar re-renders desnecessários em listas longas (`Vehicles`, `Drivers`, `Payments`, `AuditLogs`): `React.memo` em cards/linhas, `useCallback` em handlers passados como prop, `useMemo` em derivações pesadas.
2. Verificar `useEffect` com dependências erradas (já tratado parcialmente, mas revisar componentes não tocados).
3. Confirmar que TanStack Query tem `staleTime` razoável onde aplicável (sem mudar invalidations).
4. Conferir listeners (`addEventListener`, Supabase realtime channels) com cleanup correto.
5. Avaliar virtualização (`@tanstack/react-virtual`) **somente** se alguma lista exceder 200 itens visíveis — caso contrário, registrar como não necessário.

Sem refatorações estruturais — só ajustes locais.

---

## Fase D — E2E Playwright + cobertura de testes (~45 min)

1. Rodar a suíte Playwright atual (`e2e/*.spec.ts`) e corrigir flakes/falhas reais.
2. Garantir cobertura mínima dos fluxos críticos pedidos: login/logout, CRUD veículo, CRUD motorista, marketplace, pagamentos, upload imagem, permissões anon/motorista/locador/admin. A maioria já existe — verificar gaps e completar.
3. Rodar `vitest run` confirmando 439/439 ainda verde.
4. Anexar resultados ao relatório final.

---

## Fase E — Responsividade e UX (~30 min)

1. Capturar screenshots Playwright em viewports 375/768/1280 das rotas principais.
2. Corrigir overflow horizontal, tabelas sem `overflow-x-auto`, modais cortados, botões inacessíveis em mobile.
3. Garantir loading skeletons, toasts de sucesso/erro e confirmação de exclusão em fluxos onde faltem.
4. Sem redesenhos — apenas ajustes pontuais de classes Tailwind.

---

## Fase F — Validação final e relatório (~20 min)

1. `vite build` limpo, `tsc --noEmit` limpo, `eslint` 0/0, `vitest` 100%, Playwright 100%.
2. `supabase--linter` sem novos warnings.
3. Gerar `docs/FINAL_AUDIT_REPORT.md` consolidando: problemas encontrados, correções, otimizações de bundle/performance, melhorias de segurança aplicadas em rodadas anteriores, resultados de testes, itens não corrigidos (com motivo), confirmação explícita de que nenhuma regra de negócio foi alterada.

---

## Fora de escopo (já feito ou rejeitado)

- Hardening de RLS / CORS / SECURITY DEFINER — concluído na Fase 2.
- Sanitização PII / bugs de testes — concluído na Fase 5.
- ESLint cleanup — concluído na rodada anterior.
- Billing/Stripe, chatbot motorista, push notifications — itens de roadmap do produto, não de auditoria.

---

## Como prosseguir

Aprovar a **Fase A** para começar. Cada fase termina com checkpoint antes da próxima. Posso também executar A+B juntas se preferir acelerar — me diga.