## Contador de Visitas (`site_visits`) — Painel Admin

Implementação em 9 entregas na ordem exata do prompt. Nada fora dos arquivos listados será tocado.

### Entrega 1 — Migração SQL
Criar `supabase/migrations/20260701000001_create_site_visits.sql` com:
- Tabela `public.site_visits` (ip, path, referrer, user_agent, is_mobile, city/region/country, utm_*, created_at)
- Índices em `created_at DESC` e `(ip_address, created_at DESC)`
- RLS ON, apenas policy de `SELECT` para admin via `has_role(auth.uid(), 'admin')` — sem INSERT/UPDATE/DELETE (só service_role grava)
- Função `cleanup_old_site_visits()` (SECURITY DEFINER, retenção 180 dias) com `REVOKE` de PUBLIC/anon/authenticated
- Job `pg_cron` diário às 03h

### Entrega 2 — Edge Function `log-visit`
Novo `supabase/functions/log-visit/index.ts`:
- Usa `buildCorsHeaders` do módulo compartilhado
- Aceita POST com `{ path, referrer, user_agent, utm_* }`
- Extrai IP de `x-forwarded-for`/`x-real-ip`, detecta mobile por UA
- Geolocalização best-effort via `ipapi.co` com timeout 2s e bypass para IPs privados; falha nunca bloqueia insert
- Insere com `SUPABASE_SERVICE_ROLE_KEY`

### Entrega 3 — `supabase/config.toml`
Adicionar entrada `[functions.log-visit]` com `verify_jwt = false` (preservando as demais).

### Entrega 4 — Hook `useVisitLogger`
Novo `src/hooks/useVisitLogger.tsx`:
- `useLocation` para disparar em mudança de rota
- Ignora rotas `/admin/*`
- Deduplica por path via `useRef`
- Envia via `supabase.functions.invoke('log-visit', …)` com falha silenciosa
- Exporta componente `VisitLogger` (retorna null)

### Entrega 5 — Ligar em `App.tsx`
Importar `VisitLogger` e montar dentro do `<BrowserRouter>`, logo abaixo do `<NavigationProgress />`.

### Entrega 6 — Hook `useSiteVisits`
Novo `src/hooks/useSiteVisits.tsx`:
- TanStack Query, `enabled: role === 'admin'`
- SELECT `*` ordenado por `created_at desc`, limit 2000
- Cast `'site_visits' as never` (mesmo padrão de `useConsents.tsx`)

### Entrega 7 — Página `src/pages/admin/Visits.tsx`
Nova página dentro de `AdminLayout`:
- 4 StatCards (Total, IPs únicos, Hoje, Últimos 7 dias)
- AreaChart Recharts (30 dias) com tokens `hsl(var(--primary))`
- Cards de Dispositivo (mobile/desktop), Top cidades, Origem (`sourceLabel` derivado de referrer/utm)
- Tabela das 50 visitas mais recentes
- Skeleton de loading no padrão do projeto

> Observação: o bloco JSX do prompt veio parcialmente destruído pela renderização de markdown (linhas em branco entre tags, cards sem props visíveis). Vou reconstruir o JSX completo respeitando 100% da lógica, dos ícones, dos textos e da estrutura descrita — tokens semânticos apenas, sem cores cruas.

### Entrega 8 — Rota e menu
- `src/routes/adminRoutes.tsx`: lazy import de `AdminVisits` + rota `/admin/visitas`
- `src/components/admin/AdminSidebar.tsx`: importar ícone `Globe` e inserir item "Visitas" entre "Métricas" e "Auditoria"

### Entrega 9 — `src/pages/Privacy.tsx`
Ajustar o bullet de "Uso da plataforma" para incluir "retidos por até 180 dias".

### Validação pós-implementação
- `tsc --noEmit`, `vitest run`, `eslint .` limpos
- Confirmar RLS: SELECT em `site_visits` por não-admin deve falhar
- Verificar `/admin/visitas` renderiza (mesmo vazio inicialmente)

### Fora do escopo (não tocar)
`Metrics.tsx`, `LocadorDetails.tsx`, `Users.tsx`, `Locadores.tsx`, `Plans.tsx`, `Settings.tsx`, `AuditLogs.tsx`, `Vehicles.tsx`, `useAuth.tsx`, `_shared/cors.ts`, demais Edge Functions e migrações existentes.
