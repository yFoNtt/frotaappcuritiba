# Correções pós-auditoria Bolt

Aplicar exatamente as 5 entregas descritas, na ordem obrigatória, sem tocar em arquivos fora do escopo.

## Entrega 1 — `src/lib/piiSanitizer.ts`
Substituir `maskCPF` para redação total (`XXX.XXX.XXX-XX`), sem expor nenhum dígito real.

## Entrega 2 — `src/test/piiSanitizer.test.ts`
Atualizar o bloco `describe('maskCPF', ...)` para validar redação total (3 casos: redação completa, input inválido, CPF formatado).

## Entrega 3 — `src/components/dashboard/DashboardSidebar.tsx`
- Adicionar `import { useProfile } from '@/hooks/useProfile'`.
- Estender props de `SidebarContent` com `displayName?` e `companyName?`.
- Substituir bloco hardcoded "JS / João Silva / JS Locações" pelas iniciais e valores reais (`displayName` / `companyName`), com fallbacks `'?'`, `'Usuário'` e `'Sem empresa cadastrada'`.
- Em `DashboardSidebar`, chamar `const { data: profile } = useProfile();` e repassar `displayName={profile?.full_name ?? undefined}` + `companyName={profile?.company_name ?? undefined}` nas duas instâncias (mobile Sheet e desktop aside).

## Entrega 4 — Nova migration
`supabase/migrations/20260701010000_revoke_get_user_emails_for_admin.sql` via ferramenta de migration:
```sql
REVOKE ALL ON FUNCTION public.get_user_emails_for_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_emails_for_admin() TO authenticated;
```
Hardening por consistência (defesa em profundidade); função já é segura via `has_role()` interno.

## Entrega 5 — `e2e/helpers/supabase-rest.ts`
Trocar constantes hardcoded por leitura de `process.env.E2E_SUPABASE_URL` / `E2E_SUPABASE_ANON_KEY` com fallback aos valores atuais, preservando runs locais.

## Restrições
- Não tocar em `tsconfig*.json`, seed/cleanup edge functions, `_shared/cors.ts`, `useAuth.tsx`, `LocadorInsights.tsx`, `ForRenters.tsx`, nem migrations existentes.
- Manter `as never` nos hooks Supabase.
- Baseline esperada após: `tsc --noEmit` ok, `vitest run` = 439/439, `eslint .` limpo.
