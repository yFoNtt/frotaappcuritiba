# Navegação Marketplace + UX para áreas autenticadas

Permitir que Locador, Motorista e Admin acessem o marketplace público sem logout, e melhorar feedback após publicar veículo.

## 1. Sidebars — links para o marketplace

Como as três áreas usam **sidebars** (não headers), os atalhos vão na sidebar (todos como `<Link>` do React Router, estilo idêntico aos itens existentes, com tokens semânticos):

- **`src/components/dashboard/DashboardSidebar.tsx`** (Locador): adicionar uma seção no rodapé da nav, antes do bloco de usuário/logout, com:
  - `Store` → "Ver Marketplace" → `/veiculos`
  - `Eye` → "Minha Vitrine" → `/veiculos?locador={user.id}`
- **`src/components/motorista/MotoristaSidebar.tsx`**: adicionar item `Store` → "Buscar Veículos" → `/veiculos` na lista do menu.
- **`src/components/admin/AdminSidebar.tsx`**: adicionar item `Store` → "Ver Marketplace" → `/veiculos` na lista do menu.

Mobile já usa a mesma `SidebarContent` via Sheet, então o link aparece em ambos.

## 2. Filtro "Minha Vitrine" (`?locador=`)

Filtrar **client-side** em `src/pages/Vehicles.tsx` — não mexer na RPC `get_public_vehicles` (que hoje não expõe `locador_id` por design público). Em vez disso:

- `useLocadorVehicles`-style não funciona para outros usuários; então adicionar uma RPC enxuta `get_public_vehicles_by_locador(_locador_id uuid)` (SECURITY DEFINER, STABLE) que retorna as mesmas colunas públicas filtradas por `locador_id` e `status='available'`.
- Em `Vehicles.tsx`, ler `searchParams.get('locador')`; se presente, usar a nova RPC; senão, comportamento atual.
- Mostrar um chip "Vitrine de: {você}" com botão "Limpar" quando o filtro estiver ativo.

## 3. Banners contextuais em `/veiculos`

Em `src/pages/Vehicles.tsx`, acima da grid, renderizar conforme `useAuth().role`:

- **locador**: container `bg-muted/50 border border-border rounded-lg px-4 py-2 mb-4 flex items-center justify-between` com botão ghost `← Voltar para Gestão` (→ `/locador/veiculos`) e botão outline `+ Cadastrar Novo Veículo` (→ `/locador/veiculos`).
- **motorista**: mesmo container com botão ghost `← Voltar para Minha Área` (→ `/motorista`).
- **admin / anônimo**: nada.

## 4. Botão ← Voltar em `/veiculos/:id`

Em `src/pages/VehicleDetails.tsx`, adicionar acima do título: `<Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft/> Voltar</Button>`. Visível para todos.

## 5. Toast com ação após publicar veículo

Em `src/components/vehicles/VehicleForm.tsx` (linhas ~262 e ~286), substituir os `toast.success(...)` por versões com `action`:

```ts
toast.success("Veículo publicado com sucesso!", {
  action: { label: "Ver no Marketplace", onClick: () => navigate("/veiculos") },
  duration: 6000,
});
```

`useNavigate` já deve ser importado (ou adicionar).

## Detalhes técnicos

- Tokens semânticos apenas (`text-muted-foreground`, `bg-muted`, `border-border`, etc.).
- Ícones: `Store`, `Eye`, `ArrowLeft`, `ChevronLeft`, `Plus` do `lucide-react`.
- Reaproveitar `useAuth()` (`user`, `role`) — sem novos hooks.
- React Router: `useNavigate`, `useSearchParams`, `<Link>`.
- Migration nova somente para a RPC `get_public_vehicles_by_locador` (público — `GRANT EXECUTE TO anon, authenticated`), seguindo o padrão da `get_public_vehicles` existente.
- Sem mudanças em headers (não existem componentes de header dedicados nas áreas autenticadas — a navegação principal está nas sidebars).

## Arquivos afetados

- `src/components/dashboard/DashboardSidebar.tsx`
- `src/components/motorista/MotoristaSidebar.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/pages/Vehicles.tsx`
- `src/pages/VehicleDetails.tsx`
- `src/components/vehicles/VehicleForm.tsx`
- `src/hooks/useVehicles.tsx` (novo hook `usePublicVehiclesByLocador`)
- nova migration: RPC `get_public_vehicles_by_locador`
