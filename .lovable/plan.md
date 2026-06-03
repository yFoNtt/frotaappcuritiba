
# Relatório Técnico FrotaApp — Plano de Geração

Vou produzir um único arquivo Markdown consolidando o estado atual do repositório, salvo em `/mnt/documents/FrotaApp_Relatorio_Tecnico.md` e entregue como artifact para download.

## Fontes de análise

- **Rotas**: `src/routes/publicRoutes.tsx`, `locadorRoutes.tsx`, `adminRoutes.tsx`, `motoristaRoutes.tsx` (já em contexto).
- **Schema/RLS**: tabelas e policies já listadas no contexto Supabase (audit_logs, cnh_alerts, contracts, conversations, document_requests, documents, drivers, inspection_checklist_templates, login_attempts, maintenances, messages, mileage_records, notifications, payments, profiles, user_roles, vehicle_inspections, vehicles).
- **Edge Functions**: `check-cnh-expiry`, `generate-notifications`, `rate-limited-login`, `locador-assistant`, `suggest-vehicle-price`, `log-inconsistency-review`, `seed-test-*`, `cleanup-test-motoristas`.
- **Páginas/Components**: árvore em `src/pages/**` e `src/components/**`.
- **Memórias do projeto**: stack, design system, padrões de segurança e features já implementadas (CNH, manutenção, pagamentos, vistorias, mensageria, auditoria, etc.).

## Estrutura do documento

1. **Visão Geral do Produto e Personas** — SaaS Marketplace + Gestão; status de isolamento RLS por papel (Visitante, Locador, Motorista, Admin).
2. **Stack Técnica Atual** — React 18, TS 5, Vite 5, Tailwind v3, shadcn/ui, TanStack Query, Framer Motion, Recharts, xlsx-js-style; backend Lovable Cloud (Postgres + RLS), Storage (4 buckets), Edge Functions, Realtime, Lovable AI Gateway.
3. **Arquitetura de Rotas** — tabelas por nível de acesso (públicas, /locador/*, /motorista/*, /admin/*) com path → página.
4. **Modelo de Dados** — lista das 18 tabelas com propósito, principais colunas e relações lógicas (sem FKs físicas, ligadas via `locador_id`/`driver_id`/`user_id`); funções (`has_role`, `get_public_vehicles`, validadores CPF/CNPJ/CNH, `audit_trigger_func`, `notify_locador_on_driver_change`, `update_vehicle_current_km`, `update_conversation_on_message`).
5. **Funcionalidades 100% Operacionais** — auth com Google + roles, marketplace público, gestão completa de veículos/motoristas/contratos/pagamentos/manutenções/vistorias/quilometragem/documentos, chat realtime, notificações, alertas CNH, auditoria, exportações Excel, painel admin com métricas reais, LGPD (Política/Termos).
6. **Lacunas Técnicas e Próximos Passos** — integração de pagamento real (Stripe/Pix) para mensalidade do SaaS, fluxos LGPD pendentes (exportar dados, excluir conta, mascarar PII no payload do assistente IA), GSC ainda não conectado, ausência de FKs físicas no banco, faltam testes E2E para mensageria, melhorias UX em telas de relatórios, push notifications, app mobile/PWA install flow, onboarding guiado para novo locador.

## Entrega

- Arquivo: `/mnt/documents/FrotaApp_Relatorio_Tecnico.md`
- Tag `<presentation-artifact>` com `mime_type="text/markdown"` para download direto.
- Sem alterações no código do app.
