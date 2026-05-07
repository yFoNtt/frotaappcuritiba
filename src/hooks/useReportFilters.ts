import { useMemo, useState } from 'react';
import { startOfDay, endOfDay, subDays, subMonths } from 'date-fns';

export type DatePreset = '7d' | '30d' | '3m' | '6m' | '12m' | 'all' | 'custom';

export interface ReportFiltersState {
  preset: DatePreset;
  startDate: Date | null;
  endDate: Date | null;
  vehicleId: string;
  driverId: string;
  statusOrType: string;
}

export const DEFAULT_REPORT_FILTERS: ReportFiltersState = {
  preset: '6m',
  startDate: null,
  endDate: null,
  vehicleId: 'all',
  driverId: 'all',
  statusOrType: 'all',
};

export function computePresetRange(preset: DatePreset, custom?: { start: Date | null; end: Date | null }) {
  const now = new Date();
  const end = endOfDay(now);
  switch (preset) {
    case '7d': return { start: startOfDay(subDays(now, 6)), end };
    case '30d': return { start: startOfDay(subDays(now, 29)), end };
    case '3m': return { start: startOfDay(subMonths(now, 3)), end };
    case '6m': return { start: startOfDay(subMonths(now, 6)), end };
    case '12m': return { start: startOfDay(subMonths(now, 12)), end };
    case 'all': return { start: null, end: null };
    case 'custom':
      return {
        start: custom?.start ? startOfDay(custom.start) : null,
        end: custom?.end ? endOfDay(custom.end) : null,
      };
  }
}

export function useReportFilters(initial: Partial<ReportFiltersState> = {}) {
  const [filters, setFilters] = useState<ReportFiltersState>({
    ...DEFAULT_REPORT_FILTERS,
    ...initial,
  });

  const range = useMemo(
    () => computePresetRange(filters.preset, { start: filters.startDate, end: filters.endDate }),
    [filters.preset, filters.startDate, filters.endDate]
  );

  const isInRange = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    if (!range.start || !range.end) return true;
    const d = new Date(dateStr);
    return d >= range.start && d <= range.end;
  };

  const activeCount =
    (filters.preset !== '6m' ? 1 : 0) +
    (filters.vehicleId !== 'all' ? 1 : 0) +
    (filters.driverId !== 'all' ? 1 : 0) +
    (filters.statusOrType !== 'all' ? 1 : 0);

  const reset = () => setFilters(DEFAULT_REPORT_FILTERS);

  return { filters, setFilters, range, isInRange, activeCount, reset };
}
