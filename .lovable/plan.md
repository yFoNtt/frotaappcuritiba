# Plano — Correções Visuais, Conteúdo e Segurança

5 frentes em uma só entrega. Sem mudanças de schema, RLS ou rotas.

## 1) `src/pages/ForRenters.tsx` — Reescrita completa
Substituir o conteúdo atual (planos com preços fictícios) pelas seções pedidas, mantendo `PublicLayout` + `SEO`:
- **Hero**: headline "Transforme sua frota em renda garantida", subheadline focada em Curitiba, dois CTAs (`/cadastro` e scroll para `#beneficios`). Background com `bg-gradient-to-b from-background to-muted/30`.
- **Benefícios** (3 cards `bg-card border rounded-xl p-6 shadow-sm`): Contratos digitais, Pagamentos automáticos, Gestão completa. Ícones Lucide (`FileSignature`, `Wallet`, `LayoutDashboard`).
- **Como funciona** (4 steps numerados em grid, ícones `Car`, `Users`, `BarChart3`, `Bell`).
- **Planos** (3 cards): Básico (até 3 veículos — grátis, CTA ativo `/cadastro?tipo=locador`), Profissional (até 15 — badge "Em breve", botão `disabled`), Enterprise (ilimitado — badge "Em breve", botão `disabled`). Coerente com o knowledge atual (billing não implementado).
- **CTA final**: "Pronto para começar?" + botão `/cadastro`.
- Animações com `framer-motion` (`initial={{ opacity:0, y:20 }}` + `whileInView`).
- 100% tokens semânticos (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`).

## 2) `src/pages/HowItWorks.tsx` — Enriquecimento
- Manter Hero + FAQ existentes.
- Substituir a seção única "Steps" por **Tabs shadcn** ("Para Motoristas" | "Para Locadores"), cada uma com 4 steps numerados com ícones Lucide próprios.
  - Motorista: `Search` → `MessageCircle` → `Car` → `CheckCircle` (mantém o atual).
  - Locador: `UserPlus` → `Car` → `FileSignature` → `BarChart3`.
- CTA final dividido em dois botões lado a lado: "É locador? Cadastre-se" (`/cadastro?tipo=locador`) e "É motorista? Encontre um veículo" (`/veiculos`).
- Validar responsividade (grid colapsa para 1 coluna em `<md`).

## 3) `src/components/onboarding/OnboardingTour.tsx` — Novo
- Modal centralizado via shadcn `Dialog` (não tooltip).
- Props: `steps: { title, description, icon }[]`, `storageKey: string`, `autoOpen?: boolean`.
- `useEffect` lê `localStorage[storageKey]` no mount; abre se ausente e `autoOpen`.
- Estado: `currentStep`. Botões "Anterior", "Próximo", "Concluir" e "Pular tour" (canto sup. direito).
- Progress dots inferiores (bolinhas com `bg-primary` no atual, `bg-muted` nos demais).
- `framer-motion` `AnimatePresence` + `motion.div` (fade + slide).
- Ao concluir/pular: grava `localStorage[storageKey] = '1'`.
- Estilo: `max-w-md bg-card rounded-2xl shadow-2xl`, backdrop blur via overlay padrão do Dialog.
- Conteúdo dos 5 steps do Locador definido em `src/pages/locador/Dashboard.tsx` e passado via prop (storageKey = `frotaapp_tour_seen_v1`). Ícones: `Sparkles`, `Car`, `Users`, `FileText`, `LayoutDashboard`.
- Renderização condicional client-only garantida pelo `useEffect`.

## 4) Imagens de veículos
- **`VehicleCard.tsx`**: trocar `object-cover` da imagem principal por `object-contain` em fundo `bg-muted` com `p-2`. Manter `aspect-[16/10]`. Adicionar `onError` para fallback `/placeholder.svg` (já existente no projeto). Remover `group-hover:scale-110` que distorce; trocar por `scale-105` suave.
- **`ImageGallery.tsx`** (usado por `/veiculos/:id`):
  - Imagem principal: `object-contain` (atualmente `object-cover`) com `bg-muted`.
  - Thumbnails: `object-contain bg-muted` com `border-2`.
  - Lightbox (Dialog): já está com `object-contain` e teclado (`Esc`, setas) — manter; ajustar fechar ao clicar no overlay (`onClick` no wrapper, `e.stopPropagation()` na imagem).
  - Sem alterações em upload/Storage.

## 5) PII no Assistente
- `supabase/functions/locador-assistant/index.ts` **já** usa `maskPIIDeep` (ver linha 1-5). Ação:
  - Garantir que o payload enviado ao Gemini passe por `maskPIIDeep` em **todos** os campos de contexto (drivers, profile, observações). Auditar o ponto de montagem do prompt e envolver com `maskPIIDeep(context)` se ainda não estiver.
  - Não duplicar a função `maskPII` local — reusar `_shared/maskPII.ts` (regra do projeto, já decidida).
- **Frontend `src/components/locador/LocadorAssistant.tsx`**: adicionar aviso discreto abaixo do input:
  `<p className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Dados sensíveis são mascarados automaticamente antes de serem processados.</p>`

## Arquivos
**Criar**: `src/components/onboarding/OnboardingTour.tsx`
**Editar**: `src/pages/ForRenters.tsx`, `src/pages/HowItWorks.tsx`, `src/pages/locador/Dashboard.tsx`, `src/components/vehicles/VehicleCard.tsx`, `src/components/vehicles/ImageGallery.tsx`, `src/components/locador/LocadorAssistant.tsx`, `supabase/functions/locador-assistant/index.ts` (apenas se faltar mascaramento em algum campo)

## Fora de escopo
- Billing real, integração de pagamento, push notifications, mapas, FKs, novas migrations, alterações de RLS/roles.
