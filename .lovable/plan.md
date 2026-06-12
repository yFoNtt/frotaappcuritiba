
# Plano — Melhorias FrotaApp (Sprints 1 + 2)

Escopo aprovado: itens **1, 2, 3, 6, 10**. Itens 4 (mapa), 5 (FKs), 7 (billing), 8 (push), 9 (E2E) **fora** deste plano.

---

## 1. PII no Assistente IA (estender o existente)

O `locador-assistant` já mascara via `supabase/functions/_shared/maskPII.ts` antes de chamar o Gemini. Vou **estender**, não substituir.

- **Frontend** — criar `src/lib/piiSanitizer.ts` com `maskCPF`, `maskCNH`, `maskPhone`, `maskEmail`, `maskPlate` (formato do prompt do usuário). Uso opcional pelo frontend; nenhuma página é alterada agora.
- **Edge function** — em `_shared/maskPII.ts`, adicionar suporte a **placa** (regex `^[A-Z]{3}-?\d[A-Z0-9]\d{2}$`, com e sem Mercosul) no `maskPIIDeep`, mascarando como `XXX-****`. Atualizar `newStats()` para incluir `plates`.
- Adicionar comentário no topo do `locador-assistant/index.ts`: *"LGPD: PII (CPF/CNPJ/CNH/telefone/email/placa) pseudonimizada antes do envio ao LLM via maskPIIDeep."*
- Adicionar teste unitário `src/test/piiSanitizer.test.ts` cobrindo as 5 funções.

## 2. Onboarding Checklist do Locador

Novo componente `src/components/locador/OnboardingChecklist.tsx` exibido no topo de `src/pages/locador/Dashboard.tsx`.

5 passos com link para a respectiva rota:
1. Perfil completo — derivado de `profile.company_name` (ou `full_name`).
2. Primeiro veículo — `useVehicles().length > 0` → `/locador/veiculos`.
3. Primeiro motorista — `useDrivers().length > 0` → `/locador/motoristas`.
4. Primeiro contrato — `useContracts().length > 0` → `/locador/contratos` (desabilitado até ter ≥1 veículo **e** ≥1 motorista).
5. Template de inspeção — `useChecklistTemplates().length > 0` → `/locador/vistorias`.

Comportamento:
- Barra de progresso "{n} de 5 completo".
- Botão **X** para fechar; estado em `localStorage` (`onboarding_dismissed_{userId}`).
- Auto-oculta quando todos os 5 passos estiverem `true`.
- Reabre se o usuário ainda tiver pendências e limpar o storage (não vamos forçar reabrir; "uma vez dispensado, fica dispensado" para evitar irritar).
- Reutiliza tokens semânticos (`bg-card`, `text-success` para feitos, `text-muted-foreground` para pendentes, ícones `CheckCircle2` / `Circle` do `lucide-react`).

## 3. Hero + Social Proof na Home

Atualizar componentes existentes em `src/components/home/` (não criar duplicações):

- **`HeroSection.tsx`** — reforçar headline ("Dirija para Uber/99 **sem comprar carro**" com palavra-chave em `text-primary`), adicionar **stats row** (1.000+ motoristas, 4.8★, "Comece em 10 min") logo abaixo da subheadline; manter CTAs atuais.
- **`TestimonialsSection.tsx`** — já existe; substituir avatares por **iniciais** (já são iniciais) e adicionar um quarto card opcional? Manter 3 atuais — só ajustar copy para perfis brasileiros (Uber/99) e adicionar um chip "Verificado" sutil.
- **`FeaturesSection.tsx`** (exportado por `HeroSection.tsx`) — confirmar que existem 4 features (⚡ Rápido, 🔒 Seguro, 💰 Preço Justo, 🚗 Qualidade); ajustar se faltar alguma.

Todos os números/depoimentos serão marcados como *ilustrativos* no `mem://` para evitar problemas de honestidade. Sem alterar tema/cores globais.

## 6. Badges de Urgência no Marketplace

Atualizar `src/components/vehicles/VehicleCard.tsx`:

- Como **não há "slots"** no modelo de dados (um veículo é um único bem físico), vou redefinir como:
  - Se `status = 'available'` e `created_at` < 7 dias atrás → badge **"🆕 Novo"** (verde-soft).
  - Se `status = 'available'` e o locador tem ≥ 3 veículos disponíveis → nada extra.
  - Se for a **única** unidade disponível daquele `brand+model` em `Vehicles.tsx` (calculado no nível da listagem) → badge **"⚡ Última unidade"** (`bg-destructive-soft text-destructive-soft-foreground`).
- A passagem do flag será via nova prop opcional `urgency?: 'last' | 'new' | null` calculada em `Vehicles.tsx` antes de renderizar os cards (sem queries extras).

## 10. Insights na Dashboard do Locador

Adicionar uma nova seção `LocadorInsights` em `src/pages/locador/Dashboard.tsx`:

- **Trend de ocupação** — comparar `(veículos alugados / total)` da semana atual vs anterior usando `contracts` já carregados; mostrar % e seta (`TrendingUp`/`TrendingDown` com `text-success`/`text-destructive`).
- **Insight de preço** — comparar `weekly_price` médio da frota do locador vs média de **todos os veículos disponíveis** (via `get_public_vehicles()`). Mostrar "Seus preços estão R$ X abaixo/acima da média do marketplace" com CTA "Ajustar preços" → `/locador/veiculos`.
- **Sugestão de ação** — se houver veículos `available` há > 14 dias sem contrato, sugerir "Você tem N veículo(s) parado(s). Considere revisar preço ou divulgar mais." com CTA para o veículo.

Sem chamada de IA — tudo cálculo local com hooks existentes. Componente novo: `src/components/locador/LocadorInsights.tsx`.

---

## Arquivos

**Criar:**
- `src/lib/piiSanitizer.ts`
- `src/test/piiSanitizer.test.ts`
- `src/components/locador/OnboardingChecklist.tsx`
- `src/components/locador/LocadorInsights.tsx`

**Editar:**
- `supabase/functions/_shared/maskPII.ts` (suporte a placa)
- `supabase/functions/locador-assistant/index.ts` (comentário LGPD)
- `src/components/home/HeroSection.tsx` (stats row + reforço de copy)
- `src/components/home/TestimonialsSection.tsx` (copy/chip "verificado")
- `src/components/vehicles/VehicleCard.tsx` (badge de urgência opcional)
- `src/pages/Vehicles.tsx` (computar `urgency` por card)
- `src/pages/locador/Dashboard.tsx` (montar `OnboardingChecklist` + `LocadorInsights`)

**Não tocar:** rotas, RLS, schema, billing, push, mapa, FKs, E2E.

## Pontos de atenção
- Stats e depoimentos do hero serão **conteúdo ilustrativo**; vou registrar isso em `mem://` para revisitar.
- Onboarding usa apenas dados já carregados pelos hooks do Dashboard — sem queries adicionais.
- Insight de preço chama `get_public_vehicles` que já é RPC pública existente, sem nova migration.

Aprovação para implementar?
