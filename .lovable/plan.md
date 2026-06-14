# Plano — 3 entregas

## Entrega 1 — Enquadramento da imagem (detalhes do veículo)

A página `/veiculos/:id` (`src/pages/VehicleDetails.tsx`) renderiza a imagem principal através de `ImageGallery` (`src/components/vehicles/ImageGallery.tsx`), que hoje usa `object-contain` no `<img>` principal (causando as barras laterais). O lightbox fica intocado.

- Em `ImageGallery.tsx`, trocar `object-contain` por `object-cover` apenas na imagem principal exibida fora do lightbox, mantendo `w-full h-full` e o container com `aspect-[4/3]`.
- Remover o `bg-muted` / `p-2` que reforçam o efeito de letterbox no card principal.
- Não tocar no lightbox/fullscreen (continua `object-contain` para mostrar a foto inteira ao clicar).
- Preservar o `Badge` "Disponível" sobreposto.

## Entrega 2 — WhatsApp do locador + Chat interno

### 2a. Banco
- A coluna `profiles.whatsapp` já existe (visível no hook `useProfile` e no Settings). Não precisa migration de coluna.
- Atualizar a RPC `get_public_vehicle(_vehicle_id uuid)` (SECURITY DEFINER) para incluir `locador_whatsapp text` via JOIN `profiles ON profiles.user_id = vehicles.locador_id` — expondo apenas esse campo. Sem placa, CPF, locador_id. Manter assinatura compatível adicionando a nova coluna no final.
- Idem para `get_public_vehicles()` e `get_public_vehicles_by_locador()`? Escopo deste prompt pede só `get_public_vehicle`, então só essa.

### 2b. `/locador/configuracoes` (`src/pages/locador/Settings.tsx`)
- Já tem o input WhatsApp. Adicionar:
  - Máscara `(XX) XXXXX-XXXX` (formatação onChange manual, padrão usado no projeto).
  - Validação: ao salvar, exigir mínimo 10 dígitos numéricos após remover máscara; exibir `toast.error` se inválido.
  - Placeholder `(41) 99999-9999`.
  - Label "WhatsApp (com DDD)".

### 2c. Formulário de veículo (`src/components/vehicles/VehicleForm.tsx`)
- Adicionar campo WhatsApp no final do form (após descrição), com a mesma máscara/validação do 2b.
- Carregar valor de `profiles.whatsapp` via `useProfile` ao abrir o modal.
- No `onSubmit`, fazer `update` em `profiles` com o novo whatsapp (paralelo ao insert/update de `vehicles`) usando o hook `useUpdateProfile` ou supabase direto.
- Não persistir whatsapp na tabela `vehicles`.

### 2d. Página pública `/veiculos/:id`
- Tipar `usePublicVehicle` para incluir `locador_whatsapp` (campo já virá da RPC após migration; ajustar tipo local na resposta).
- Para usuário logado, ler whatsapp diretamente de `profiles` do locador via select público (ou da própria RPC se preferir uniformidade). Para esta entrega: chamar a RPC `get_public_vehicle` também quando logado para obter `locador_whatsapp`, OU fazer um `select` adicional em `profiles` por `user_id = vehicle.locador_id` (limitado a `whatsapp`). Plano: usar a RPC para ambos os casos para evitar exposição de profiles via Data API.

#### Botão WhatsApp
- Substituir `https://wa.me/?text=...` por `https://wa.me/55${digits}?text=${msg}` onde `digits` = `locador_whatsapp` sem máscara.
- Se `locador_whatsapp` ausente: `<Button disabled>` + tooltip "Locador não informou WhatsApp" (shadcn `Tooltip`).

#### Botão Chat interno (substituir lógica atual)
Comportamento:
| Estado | Ação |
|---|---|
| Não logado | Abrir `Dialog` com mensagem + botões "Entrar" (`/auth?redirect=/veiculos/:id`) e "Cadastrar" (`/auth?mode=signup&redirect=...`) |
| Motorista | Buscar `drivers.id` por `user_id=auth.uid()` (qualquer locador). Se não existir, criar registro mínimo? **Não** — apenas exibir toast pedindo cadastro completo. Se existir, fazer upsert de `conversations(driver_id, locador_id)` e navegar para `/motorista/mensagens` passando `state: { conversationId }` |
| Locador | Botão oculto |
| Admin | Botão oculto |

- Em `src/pages/motorista/Messages.tsx`, ler `location.state?.conversationId` no mount e abrir essa conversa automaticamente.

### Observações
- Sem novas tabelas. Sem alterar policies de `conversations` (já permitem motorista criar conversa com locador via policies existentes).
- A relaxação "qualquer motorista logado pode abrir chat" funciona apenas se as policies de INSERT em `conversations` aceitarem motorista não vinculado ao locador. Verificar isso antes de implementar — se a policy exigir vínculo via `drivers`, manter checagem atual e exibir mensagem clara.

## Entrega 3 — Onboarding por usuário

`OnboardingTour` (`src/components/onboarding/OnboardingTour.tsx`) recebe `storageKey` por prop. No `Dashboard` do locador (`src/pages/locador/Dashboard.tsx`) hoje é fixo `frotaapp_tour_seen_v1`.

- No `Dashboard.tsx`, montar a chave dinamicamente: `frotaapp:locador:onboarding_seen:${user.id}` usando `useAuth`.
- Não renderizar o `OnboardingTour` enquanto `user?.id` for indefinido (evita gravar com chave incompleta).
- Nada muda no componente em si.

## Ordem
1. Entrega 3 (1 arquivo).
2. Entrega 1 (1 arquivo).
3. Entrega 2: migration RPC → Settings → VehicleForm → VehicleDetails → Motorista/Messages.

## Arquivos tocados
- `src/components/onboarding/OnboardingTour.tsx` — sem mudança (já parametrizado)
- `src/pages/locador/Dashboard.tsx` — chave dinâmica
- `src/components/vehicles/ImageGallery.tsx` — `object-cover` na principal
- `supabase/migrations/*` — atualizar RPC `get_public_vehicle`
- `src/pages/locador/Settings.tsx` — máscara/validação whatsapp
- `src/components/vehicles/VehicleForm.tsx` — campo whatsapp ligado a profiles
- `src/pages/VehicleDetails.tsx` — botão WhatsApp real, dialog de login, lógica chat
- `src/pages/motorista/Messages.tsx` — abrir conversa via `location.state`
