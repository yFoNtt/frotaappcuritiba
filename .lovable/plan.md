
# Auditoria FrotaApp — Execução em Fases

Você aprovou: **execução faseada, E2E liberado, major bumps só com CVE**. Abaixo o plano. Cada fase termina com aprovação sua antes de seguir.

---

## Fase 1 — Auditoria (SOMENTE LEITURA, sem mudar código)

Objetivo: mapear tudo antes de tocar em nada. Entrega = um relatório em `docs/AUDIT_REPORT.md` classificado por severidade (Crítico / Alto / Médio / Baixo).

Atividades:
1. **Análise estática**
   - `tsc --noEmit` — erros de tipo
   - `eslint .` — warnings e erros
   - `bunx vitest run` — testes unitários atuais
   - `bun run build` — confirmar build limpo
   - `scripts/check-hardcoded-colors.mjs` — guarda de tokens
2. **Dependências**: `bun audit` + `npm audit --json` para identificar CVEs. Cruzar com versões instaladas.
3. **Segurança backend**: rodar `supabase--linter`, `security--run_security_scan`, revisar todas as policies RLS por tabela, conferir RPCs `SECURITY DEFINER`, conferir Edge Functions (validação JWT, CORS, Zod, secrets expostos).
4. **Segurança frontend**: grep por `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `localStorage.setItem` de dados sensíveis, redirects sem validação, `any`, `// @ts-ignore`.
5. **React anti-patterns**: `useEffect` sem cleanup, deps incorretas, `setState` em `useMemo`, ausência de `useCallback`/`useMemo` em hot paths, componentes > 300 linhas.
6. **Permissões/rotas**: confirmar que toda rota protegida usa `ProtectedRoute` com role correto; tentar acessar rotas cruzadas via Playwright (admin→motorista, motorista→locador).
7. **E2E**: rodar toda a suíte `e2e/*.spec.ts` contra preview, registrar falhas.
8. **Performance**: bundle analyzer (`vite build --mode=analyze`), `supabase--slow_queries`, identificar requests duplicados.
9. **UX/Console**: navegar pelos principais fluxos via Playwright, capturar warnings/erros do console em cada página.

**Entregável Fase 1**: `docs/AUDIT_REPORT.md` com:
- Inventário de problemas por categoria e severidade
- Arquivo:linha de cada item
- Recomendação de correção e estimativa de risco
- Lista de deps a atualizar (com CVE id quando aplicável)
- Lista de funcionalidades que **não devo tocar** (regras de negócio)

Nenhum arquivo de código fonte muda nesta fase. Você revisa o relatório e me diz o que aprovar para Fase 2+.

---

## Fases seguintes (a confirmar após relatório)

Ordem proposta, do mais crítico/menos invasivo ao mais arriscado:

- **Fase 2 — Segurança crítica**: RLS faltando, policies abertas, XSS, secrets, permissões de rota, CORS de Edge Functions. Migrations + edits pontuais.
- **Fase 3 — Dependências vulneráveis**: aplica updates (patch/minor sempre; major só com CVE), corrige incompatibilidades.
- **Fase 4 — Bugs de build/console/tipos**: zera `tsc`, ESLint, warnings de console, remove `any` e `console.log` esquecidos.
- **Fase 5 — Testes**: corrige testes existentes quebrados, adiciona cobertura nos fluxos críticos identificados sem cobertura.
- **Fase 6 — Performance**: lazy loading faltante, `useMemo`/`useCallback` em hot paths, redução de bundle, otimização de queries lentas (`supabase--slow_queries` + índices).
- **Fase 7 — UX/Responsividade**: ajustes de feedback (loading, toasts, skeleton), overflow em mobile, sem alterar design system.
- **Fase 8 — Refactor pontual**: só onde a manutenção justifica (componentes > 300 linhas, duplicação clara). Sem mudar regra de negócio.
- **Fase 9 — Verificação final**: re-rodar tsc + ESLint + vitest + build + Playwright completo + linter Supabase. Changelog consolidado.

Cada fase será apresentada como novo plano antes de executar, com escopo fechado e arquivos afetados.

---

## Garantias em todas as fases

- Nada de remover funcionalidade ou alterar regra de negócio.
- Toda mudança de schema via `supabase--migration` (com GRANTs).
- Sem mexer em `src/integrations/supabase/{client,types}.ts`, `.env`, `supabase/config.toml`.
- Tokens semânticos sempre; nada de cor crua Tailwind.
- `sonner` para toasts; `xlsx-js-style` para Excel.
- Commits/mudanças pequenas e revisáveis.

Aprove esta Fase 1 (auditoria read-only com relatório) para eu começar.
