import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, SlidersHorizontal, X, MapPin, Fuel, Car, DollarSign } from 'lucide-react';
import type { Vehicle } from '@/hooks/useVehicles';

export interface VehicleFiltersState {
  search: string;
  state: string;
  city: string;
  brand: string;
  minYear: string;
  minPrice: string;
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

const appLabels: Record<string, string> = {
  uber: 'Uber',
  '99': '99',
  indrive: 'inDrive',
  other: 'Outros',
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

    // Price range
    const prices = vehicles.map(v => v.weekly_price);
    const minPriceValue = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPriceValue = prices.length > 0 ? Math.max(...prices) : 2000;

    return { 
      states, 
      cities: filteredCities, 
      brands, 
      years, 
      fuelTypes, 
      apps,
      minPriceValue: Math.floor(minPriceValue / 100) * 100,
      maxPriceValue: Math.ceil(maxPriceValue / 100) * 100,
    };
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

  const toggleAppFilter = (app: string) => {
    if (filters.app === app) {
      onFiltersChange({ ...filters, app: '' });
    } else {
      onFiltersChange({ ...filters, app });
    }
  };

  const toggleFuelFilter = (fuel: string) => {
    if (filters.fuelType === fuel) {
      onFiltersChange({ ...filters, fuelType: '' });
    } else {
      onFiltersChange({ ...filters, fuelType: fuel });
    }
  };

  const getSelectValue = (value: string) => value === '' ? 'all' : value;

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');
  const activeFiltersCount = Object.values(filters).filter((v) => v !== '').length;

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

      {/* Quick Filters Row 1 - Location & Brand */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            Estado
          </Label>
          <Select value={getSelectValue(filters.state)} onValueChange={(v) => updateFilter('state', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {filterOptions.states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            Cidade
          </Label>
          <Select 
            value={getSelectValue(filters.city)} 
            onValueChange={(v) => updateFilter('city', v)}
            disabled={filterOptions.cities.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {filterOptions.cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Car className="h-3 w-3" />
            Marca
          </Label>
          <Select value={getSelectValue(filters.brand)} onValueChange={(v) => updateFilter('brand', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {filterOptions.brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            Preço/semana
          </Label>
          <Select value={getSelectValue(filters.maxPrice)} onValueChange={(v) => updateFilter('maxPrice', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer valor</SelectItem>
              <SelectItem value="500">Até R$ 500</SelectItem>
              <SelectItem value="600">Até R$ 600</SelectItem>
              <SelectItem value="700">Até R$ 700</SelectItem>
              <SelectItem value="800">Até R$ 800</SelectItem>
              <SelectItem value="900">Até R$ 900</SelectItem>
              <SelectItem value="1000">Até R$ 1.000</SelectItem>
              <SelectItem value="1200">Até R$ 1.200</SelectItem>
              <SelectItem value="1500">Até R$ 1.500</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Filter Pills - Apps */}
      {filterOptions.apps.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Aplicativos aceitos</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.apps.map((app) => (
              <Badge
                key={app}
                variant={filters.app === app ? 'default' : 'outline'}
                className="cursor-pointer transition-colors hover:bg-primary/10"
                onClick={() => toggleAppFilter(app)}
              >
                {appLabels[app] || app}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Filter Pills - Fuel Type */}
      {filterOptions.fuelTypes.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Fuel className="h-3 w-3" />
            Combustível
          </Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.fuelTypes.map((fuel) => (
              <Badge
                key={fuel}
                variant={filters.fuelType === fuel ? 'default' : 'outline'}
                className="cursor-pointer transition-colors hover:bg-primary/10"
                onClick={() => toggleFuelFilter(fuel)}
              >
                {fuelLabels[fuel] || fuel}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-muted-foreground"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
        </Button>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-destructive hover:text-destructive">
              <X className="mr-1 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ano mínimo</Label>
            <Select value={getSelectValue(filters.minYear)} onValueChange={(v) => updateFilter('minYear', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer ano</SelectItem>
                {filterOptions.years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    A partir de {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preço mínimo/semana</Label>
            <Select value={getSelectValue(filters.minPrice)} onValueChange={(v) => updateFilter('minPrice', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer valor</SelectItem>
                <SelectItem value="300">A partir de R$ 300</SelectItem>
                <SelectItem value="400">A partir de R$ 400</SelectItem>
                <SelectItem value="500">A partir de R$ 500</SelectItem>
                <SelectItem value="600">A partir de R$ 600</SelectItem>
                <SelectItem value="700">A partir de R$ 700</SelectItem>
                <SelectItem value="800">A partir de R$ 800</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Faixa de preço</Label>
              {(filters.minPrice || filters.maxPrice) && (
                <span className="text-xs font-medium text-primary">
                  {filters.minPrice ? `R$ ${filters.minPrice}` : 'R$ 0'} - {filters.maxPrice ? `R$ ${filters.maxPrice}` : 'Qualquer'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>R$ {filterOptions.minPriceValue}</span>
              <div className="flex-1 text-center">—</div>
              <span>R$ {filterOptions.maxPriceValue}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
