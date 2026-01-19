import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Vehicle } from '@/hooks/useVehicles';

export interface VehicleFiltersState {
  search: string;
  state: string;
  city: string;
  brand: string;
  minYear: string;
  maxPrice: string;
  fuelType: string;
  app: string;
}

interface VehicleFiltersProps {
  filters: VehicleFiltersState;
  onFiltersChange: (filters: VehicleFiltersState) => void;
  onClearFilters: () => void;
  vehicles?: Vehicle[];
}

const fuelLabels: Record<string, string> = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
};

export function VehicleFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  vehicles = []
}: VehicleFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract unique values from vehicles for dynamic filters
  const filterOptions = useMemo(() => {
    const states = [...new Set(vehicles.map(v => v.state))].sort();
    const cities = [...new Set(vehicles.map(v => v.city))].sort();
    const brands = [...new Set(vehicles.map(v => v.brand))].sort();
    const years = [...new Set(vehicles.map(v => v.year))].sort((a, b) => b - a);
    const fuelTypes = [...new Set(vehicles.map(v => v.fuel_type))].sort();
    const apps = [...new Set(vehicles.flatMap(v => v.allowed_apps || []))].sort();
    
    // Filter cities based on selected state
    const filteredCities = filters.state 
      ? [...new Set(vehicles.filter(v => v.state === filters.state).map(v => v.city))].sort()
      : cities;

    return { states, cities: filteredCities, brands, years, fuelTypes, apps };
  }, [vehicles, filters.state]);

  const updateFilter = (key: keyof VehicleFiltersState, value: string) => {
    const filterValue = value === 'all' ? '' : value;
    
    // Reset city if state changes
    if (key === 'state') {
      onFiltersChange({ ...filters, [key]: filterValue, city: '' });
    } else {
      onFiltersChange({ ...filters, [key]: filterValue });
    }
  };

  const getSelectValue = (value: string) => value === '' ? 'all' : value;

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por marca ou modelo..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={getSelectValue(filters.state)} onValueChange={(v) => updateFilter('state', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {filterOptions.states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cidade</Label>
          <Select 
            value={getSelectValue(filters.city)} 
            onValueChange={(v) => updateFilter('city', v)}
            disabled={filterOptions.cities.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filterOptions.cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Marca</Label>
          <Select value={getSelectValue(filters.brand)} onValueChange={(v) => updateFilter('brand', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filterOptions.brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Preço máximo/semana</Label>
          <Select value={getSelectValue(filters.maxPrice)} onValueChange={(v) => updateFilter('maxPrice', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer</SelectItem>
              <SelectItem value="500">Até R$ 500</SelectItem>
              <SelectItem value="600">Até R$ 600</SelectItem>
              <SelectItem value="700">Até R$ 700</SelectItem>
              <SelectItem value="800">Até R$ 800</SelectItem>
              <SelectItem value="900">Até R$ 900</SelectItem>
              <SelectItem value="1000">Até R$ 1.000</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-muted-foreground"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-destructive">
            <X className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ano mínimo</Label>
            <Select value={getSelectValue(filters.minYear)} onValueChange={(v) => updateFilter('minYear', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                {filterOptions.years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Combustível</Label>
            <Select value={getSelectValue(filters.fuelType)} onValueChange={(v) => updateFilter('fuelType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions.fuelTypes.map((fuel) => (
                  <SelectItem key={fuel} value={fuel}>
                    {fuelLabels[fuel] || fuel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Aplicativo</Label>
            <Select value={getSelectValue(filters.app)} onValueChange={(v) => updateFilter('app', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions.apps.map((app) => (
                  <SelectItem key={app} value={app}>
                    {app}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
