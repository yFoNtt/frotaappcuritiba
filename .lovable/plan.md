## Objetivo
Permitir que qualquer usuário logado com papel `motorista` abra um chat interno com o locador de qualquer veículo do marketplace, sem precisar de cadastro prévio em `drivers`. Em paralelo, corrige um bug de RLS em `storage.objects` (delete de anexos) e nivela a política de senha do motorista com a do locador.

WhatsApp continua público (sem login). Fluxo `ensureMotoristaConversation` (contrato ativo) permanece intacto.

## Entregas

### 1. Migration SQL
Aplicar exatamente o bloco fornecido pelo usuário:
- `conversations.driver_id` vira nullable; adiciona `interested_user_id`, `vehicle_id`; CHECK garante que pelo menos um dos dois identificadores esteja presente; índice único por `(locador_id, interested_user_id)` parcial.
- Policies RLS reescritas para `conversations` (SELECT/INSERT/UPDATE) admitindo `interested_user_id = auth.uid()` com `has_role('motorista')` e validação de `vehicle_id` pertencente ao locador.
- Policies RLS reescritas para `messages` (SELECT/INSERT/UPDATE) reconhecendo participantes lead.
- Policies de `storage.objects` (bucket `chat-attachments`) reescritas — inclui correção do bug de DELETE que comparava `c.driver_id` com `auth.uid()`.
- `get_public_vehicle(uuid)` recriada para devolver `locador_id` apenas quando `auth.uid()` está presente (visitante anônimo continua sem ver). GRANT EXECUTE para anon/authenticated/service_role.

### 2. `src/hooks/useChat.ts`
- Estender interface `Conversation`: `driver_id: string | null`, novos campos `interested_user_id`, `vehicle_id`.
- Em `useConversations.load()`: hidratar drivers só quando `driver_id` existe; hidratar conversas-lead via `profiles.full_name` por `interested_user_id`, preenchendo o shape `driver` com `id: ''`, nome do perfil (fallback `"Interessado(a) no veículo"`).
- Adicionar export `ensureLeadConversation(userId, locadorId, vehicleId?)` logo após `ensureMotoristaConversation` (sem alterá-la): reutiliza conversa "driver oficial" se o usuário já é driver desse locador; senão usa/cria conversa-lead por `interested_user_id`.

### 3. `src/hooks/useVehicles.tsx`
Apenas tipagem: adicionar `locador_id?: string | null` em `PublicVehicle`.

### 4. `src/pages/VehicleDetails.tsx`
- Trocar import direto do supabase pelo `ensureLeadConversation`.
- Reescrever `handleOpenChat`: exige login (abre `loginDialogOpen`), atalho para `/locador/mensagens` quando `isOwner`, lê `publicVehicle.locador_id`, chama `ensureLeadConversation` e navega para `/motorista/mensagens` com `state.conversationId`.
- `showChatButton = !isOwner && role === 'motorista'` (visitante anônimo vê o botão e é convidado a logar quando clica; admin/locador não veem).
- Botão do WhatsApp permanece inalterado.

### 5. `src/pages/motorista/Settings.tsx`
- Importar `Loader2`.
- `handleChangePassword`: aplicar mesma política do locador (8+ chars, maiúscula, minúscula, número, especial) + flag `isPasswordStrong`.
- JSX dos campos de senha: placeholder, mensagens inline de fraqueza/divergência, `Loader2` no botão durante `isPending`.

## Fora de escopo (não tocar)
`ensureMotoristaConversation`, `get_public_vehicles` (lista), `sender_role`, `ChatRole`, vínculo `drivers.user_id`, `supabase/types.ts`, botão WhatsApp.

## Ordem
Migration → useChat.ts → useVehicles.tsx → VehicleDetails.tsx → motorista/Settings.tsx. Após a migration aprovada, os types.ts são regenerados automaticamente e os arquivos do frontend são atualizados.
