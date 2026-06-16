
# Correções: WhatsApp público, chat e validações em Settings

## 1. Migration — expor `whatsapp_locador` na RPC pública
Criar nova migration que recria `public.get_public_vehicle(uuid)`:
- Adiciona coluna `whatsapp_locador text` (LEFT JOIN em `profiles.whatsapp` por `user_id = v.locador_id`).
- **Remove** o filtro `AND v.status = 'available'` para permitir visualização por URL pública independente do status.
- Mantém `SECURITY DEFINER`, `STABLE`, `search_path = public`.
- `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO anon, authenticated`.

Observação: a função atual já faz o JOIN e retorna `locador_whatsapp`. Vou renomear para `whatsapp_locador` conforme pedido e remover o filtro de status.

## 2. `src/hooks/useVehicles.tsx`
Adicionar `whatsapp_locador: string | null` à interface `PublicVehicle`. Após aprovação da migration os tipos do Supabase serão regenerados automaticamente.

## 3. `src/pages/VehicleDetails.tsx` — botão WhatsApp
- Montar `whatsappLink` a partir de `vehicle.whatsapp_locador`, mantendo só dígitos, prefixando `55`, exigindo ≥10 dígitos.
- Se houver número: botão `<a href=...>` com ícone WhatsApp.
- Se não houver: botão desabilitado "WhatsApp não disponível".
- Usar tokens semânticos (variantes do `Button`), sem cores cruas.

## 4. `src/pages/VehicleDetails.tsx` — chat sem paradoxo
Substituir `handleOpenChat`:
- Sem usuário → abre `Dialog` "Acesso necessário" (login / criar conta).
- `isOwner` → navega para `/locador/mensagens`.
- Busca `drivers` por `(user_id, locador_id)`; se existir vínculo, faz upsert da `conversations` e navega para `/motorista/mensagens`.
- Sem vínculo → `toast.info` orientando usar WhatsApp / aguardar cadastro.
- Adiciona estado `showLoginDialog` e o `Dialog` no JSX (imports de `@/components/ui/dialog`).

## 5. `src/pages/locador/Settings.tsx` — campo WhatsApp
- `onChange` aplica máscara `(XX) XXXXX-XXXX`, limita a 11 dígitos, `maxLength={15}`, placeholder `(41) 99999-9999`.
- Texto auxiliar muted explicando que é exibido publicamente.
- `handleSave` salva apenas dígitos (`whatsapp.replace(/\D/g, '')`).
- Ao carregar perfil, aplicar a máscara sobre o valor salvo para exibição.

## 6. `src/pages/locador/Settings.tsx` — política de senha
- Atualizar placeholder para "Mínimo 8 caracteres".
- Em `handleChangePassword` validar: ≥8 chars, maiúscula, minúscula, número e especial — com `toast.error` para cada caso.
- Inline no JSX: mensagem "Mínimo 8 caracteres" enquanto incompleto, e a já existente de senhas que não coincidem.

## Restrições aplicadas
- Apenas tokens semânticos (sem cores Tailwind cruas).
- `sonner` para toasts.
- Sem alterações em RLS, outras Edge Functions, ou no fluxo do lightbox.
- Sem alterar `src/integrations/supabase/client.ts` ou `types.ts`.

## Ordem de execução
1. Migration (Entrega 1) — aguarda aprovação do usuário.
2. Após migration aplicada: editar `useVehicles.tsx`, `Settings.tsx` (entregas 5 e 6), `VehicleDetails.tsx` (entregas 3 e 4).
