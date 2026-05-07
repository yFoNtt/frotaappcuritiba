
## Objetivo

Permitir filtrar todos os relatórios do sistema por período, veículo, motorista e status/tipo. PDF e Excel passam a exportar somente os dados filtrados.

## Escopo

1. **Locador → Relatórios** (`src/pages/locador/Reports.tsx`)
2. **Locador → Pagamentos** (`src/pages/locador/Payments.tsx` — relatório/histórico)
3. **Locador → Manutenções** (`src/pages/locador/Maintenance.tsx` — já tem busca/tipo/status, falta período + veículo unificado + export filtrado)
4. **Admin → Indicadores** (`src/pages/admin/Metrics.tsx`)

## Componente compartilhado

Criar `src/components/reports/ReportFilters.tsx` reutilizável:

- **Período**: presets (`7d`, `30d`, `3m`, `6m`, `12m`, `Personalizado`) + datepicker início/fim quando custom
- **Veículo**: Select com "Todos" + lista
- **Motorista**: Select com "Todos" + lista (admin: todos da plataforma; locador: somente seus)
- **Status/Tipo**: Select contextual por tela (status pagamento / tipo manutenção / status veículo)
- Badge com contador de filtros ativos + botão "Limpar"
- Layout colapsável em mobile (mesmo padrão de `MaintenanceFilters`)

Estado tipado:
```ts
interface ReportFiltersState {
  startDate: Date | null;
  endDate: Date | null;
  preset: '7d'|'30d'|'3m'|'6m'|'12m'|'custom';
  vehicleId: string;   // 'all' | uuid
  driverId: string;    // 'all' | uuid
  statusOrType: string;// 'all' | enum
}
```

## Mudanças por tela

### Locador → Relatórios
- Substituir período fixo "últimos 6 meses" por filtro dinâmico
- Filtrar `payments`, `maintenances`, `vehicles` antes dos `useMemo` de KPIs/charts
- Passar dataset filtrado para `useReportExport` (PDF + Excel já refletem filtros automaticamente)
- Atualizar título dos cards para refletir o intervalo selecionado

### Locador → Pagamentos
- Adicionar `ReportFilters` no topo do histórico
- Filtros: período (data due/paid), veículo, motorista, status (`pending|paid|overdue|cancelled`)
- Exportação CSV/PDF (se já existir) usa lista filtrada

### Locador → Manutenções
- Estender `MaintenanceFilters` com período (datepicker início/fim) e remover veículo do antigo se ficar duplicado, OU substituir pelo novo `ReportFilters`
- Decisão: manter `MaintenanceFilters` atual e adicionar somente o range de datas (menor disrupção)
- Botão de exportar passa a exportar somente o filtrado

### Admin → Indicadores
- Adicionar filtros: período, locador (extra para admin), status veículo
- `useMetricsExport` recebe dados já filtrados

## Hooks de exportação

Sem mudanças estruturais — eles já recebem `data` pronta. Apenas garantir que cada tela passe o conjunto filtrado em `monthlyData`, `vehicleComparison`, etc.

## UI/UX

- `ReportFilters` segue `MaintenanceFilters` (Card colapsável, badge contador, botão limpar)
- Datepickers com `pointer-events-auto` no `Calendar`
- Indicador visual no topo: "Mostrando dados de DD/MM/AAAA até DD/MM/AAAA"
- Tokens semânticos (sem cores hardcoded)

## Sem mudanças no banco

Tudo é filtragem client-side sobre dados já retornados pelos hooks (`useLocadorVehicles`, `useLocadorPayments`, `useLocadorMaintenances`, `useAdminData`). RLS continua intocado.

## Arquivos a criar/editar

**Criar:**
- `src/components/reports/ReportFilters.tsx`
- `src/hooks/useReportFilters.ts` (lógica de presets + computação de start/end)

**Editar:**
- `src/pages/locador/Reports.tsx`
- `src/pages/locador/Payments.tsx`
- `src/pages/locador/Maintenance.tsx` (+ `MaintenanceFilters.tsx` para incluir período)
- `src/pages/admin/Metrics.tsx`

## Validação

- Conferir KPIs com filtro = "12m" batendo com valores atuais ("6m" hardcoded)
- Exportar PDF e Excel após aplicar filtro e validar que linhas/totais refletem somente o subconjunto
- Testar em mobile (390px) — colapso e datepickers funcionando
