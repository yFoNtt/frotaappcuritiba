## Plano de implementação

Aplicar as 3 entregas exatamente na ordem especificada, sem tocar em arquivos fora do escopo.

### Entrega 1 — Migration SQL (RLS do chat-lead)

Nova migration em `supabase/migrations/<timestamp>_fix_lead_conversation_rls.sql`:

- Cria `public.vehicle_belongs_to_locador(uuid, uuid)` como `SECURITY DEFINER STABLE` com `search_path = public`, retornando se `vehicles.id = _vehicle_id AND locador_id = _locador_id`.
- `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO authenticated`.
- `DROP POLICY IF EXISTS "Motoristas podem iniciar conversa como interessados" ON public.conversations;`
- Recria a policy de INSERT em `conversations` usando `vehicle_belongs_to_locador(vehicle_id, locador_id)` no lugar do `EXISTS` direto em `vehicles` (que era bloqueado por RLS do motorista sem contrato).

Conteúdo SQL idempotente (`CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS`).

### Entrega 2 — `src/pages/VehicleDetails.tsx`

- `handleOpenChat`: adicionar checagem `role !== 'motorista'` (após o gate de login e o atalho do owner) com toast de erro explicando que só motoristas usam o chat interno.
- Novo `handleWhatsAppClick`: gate de login (abre `LoginDialog`) antes de abrir o `whatsappLink`.
- `showChatButton`: passa a ser `!isOwner` (sem checar role) — botões sempre visíveis, gate vai pro clique.
- Trocar o `<a href={whatsappLink}>` do WhatsApp por `<Button onClick={handleWhatsAppClick}>` (mantendo o mesmo visual/ícone) para que o gate de login funcione mesmo sem `user`.

### Entrega 3 — Onboarding do motorista

**Novo:** `src/components/motorista/OnboardingChecklist.tsx` — card com 5 itens (perfil, veículo, documentos, chat, pagamentos), barra de progresso, dismiss persistido em `localStorage` por `user.id`, esconde quando completo ou dispensado. Usa `useProfile`, `useMotoristaFullData`, `useMotoristaDocuments`, `useMotoristaPayments`, `useConversations('motorista')`.

**Editar:** `src/pages/motorista/Dashboard.tsx`
- Adicionar imports: `Sparkles, MessageCircle, FileText` (lucide), `useAuth`, `OnboardingChecklist`, `OnboardingTour`.
- Definir `MOTORISTA_TOUR_STEPS` (5 passos).
- Renderizar `<OnboardingChecklist />` logo abaixo do header.
- Renderizar `<OnboardingTour steps={MOTORISTA_TOUR_STEPS} storageKey={`motorista_tour_seen_${user.id}`} />` no fim do layout, condicionado a `user?.id`.

Reaproveita o `OnboardingTour` genérico existente sem alterá-lo.

### Ordem de execução

1. Migration SQL (Entrega 1) — bloqueador do chat-lead.
2. Editar `VehicleDetails.tsx` (Entrega 2).
3. Criar `OnboardingChecklist.tsx` do motorista + editar `Dashboard.tsx` do motorista (Entrega 3).

### Fora de escopo (não tocar)

`useChat.ts`, onboarding do locador, `OnboardingTour.tsx` genérico, `useAuth`/`useInactivityTimeout`, qualquer outra policy RLS, cores cruas/tokens não-semânticos.
