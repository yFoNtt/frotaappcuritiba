import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DatePreset,
  ReportFiltersState,
  DEFAULT_REPORT_FILTERS,
} from '@/hooks/useReportFilters';

export interface ReportFiltersOption {
  value: string;
  label: string;
}

export interface ReportFiltersProps {
  filters: ReportFiltersState;
  onChange: (filters: ReportFiltersState) => void;
  vehicles?: ReportFiltersOption[];
  drivers?: ReportFiltersOption[];
  statusOptions?: ReportFiltersOption[];
  statusLabel?: string;
  resultCount?: number;
  defaultOpen?: boolean;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
  { value: 'all', label: 'Todo o período' },
  { value: 'custom', label: 'Personalizado' },
];

export function ReportFilters({
  filters,
  onChange,
  vehicles,
  drivers,
  statusOptions,
  statusLabel = 'Status',
  resultCount,
  defaultOpen = false,
}: ReportFiltersProps) {
  const [open, setOpen] = useState(defaultOpen);

  const activeCount =
    (filters.preset !== '6m' ? 1 : 0) +
    (filters.vehicleId !== 'all' ? 1 : 0) +
    (filters.driverId !== 'all' ? 1 : 0) +
    (filters.statusOrType !== 'all' ? 1 : 0);

  const update = (patch: Partial<ReportFiltersState>) =>
    onChange({ ...filters, ...patch });

  const clear = () => onChange(DEFAULT_REPORT_FILTERS);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros do relatório</span>
            {activeCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1.5">
                {activeCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {typeof resultCount === 'number' && (
              <span className="text-xs text-muted-foreground">
                {resultCount} resultado{resultCount !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              variant={open ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setOpen(!open)}
              className="gap-1"
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {open ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>

        {open && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select
                  value={filters.preset}
                  onValueChange={(v) => update({ preset: v as DatePreset })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Veículo */}
              {vehicles && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Veículo</label>
                  <Select
                    value={filters.vehicleId}
                    onValueChange={(v) => update({ vehicleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {vehicles.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Motorista */}
              {drivers && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motorista</label>
                  <Select
                    value={filters.driverId}
                    onValueChange={(v) => update({ driverId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {drivers.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status / Tipo */}
              {statusOptions && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{statusLabel}</label>
                  <Select
                    value={filters.statusOrType}
                    onValueChange={(v) => update({ statusOrType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Datas customizadas */}
            {filters.preset === 'custom' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate
                          ? format(filters.startDate, 'PPP', { locale: ptBR })
                          : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate ?? undefined}
                        onSelect={(d) => update({ startDate: d ?? null })}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate
                          ? format(filters.endDate, 'PPP', { locale: ptBR })
                          : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate ?? undefined}
                        onSelect={(d) => update({ endDate: d ?? null })}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {activeCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clear} className="gap-1">
                  <X className="h-3 w-3" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
