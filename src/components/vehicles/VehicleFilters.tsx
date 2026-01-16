import { useState } from 'react';
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
import { brazilianStates, popularCities, carBrands } from '@/data/mockData';
import { Search, SlidersHorizontal, X } from 'lucide-react';

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
}

export function VehicleFilters({ filters, onFiltersChange, onClearFilters }: VehicleFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof VehicleFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por marca ou modelo..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={filters.state} onValueChange={(v) => updateFilter('state', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {brazilianStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cidade</Label>
          <Select value={filters.city} onValueChange={(v) => updateFilter('city', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {popularCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Marca</Label>
          <Select value={filters.brand} onValueChange={(v) => updateFilter('brand', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {carBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Preço máximo/semana</Label>
          <Select value={filters.maxPrice} onValueChange={(v) => updateFilter('maxPrice', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer</SelectItem>
              <SelectItem value="500">Até R$ 500</SelectItem>
              <SelectItem value="600">Até R$ 600</SelectItem>
              <SelectItem value="700">Até R$ 700</SelectItem>
              <SelectItem value="800">Até R$ 800</SelectItem>
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
            <Select value={filters.minYear} onValueChange={(v) => updateFilter('minYear', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Combustível</Label>
            <Select value={filters.fuelType} onValueChange={(v) => updateFilter('fuelType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
                <SelectItem value="gasoline">Gasolina</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="electric">Elétrico</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Aplicativo</Label>
            <Select value={filters.app} onValueChange={(v) => updateFilter('app', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="uber">Uber</SelectItem>
                <SelectItem value="99">99</SelectItem>
                <SelectItem value="indrive">InDrive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
