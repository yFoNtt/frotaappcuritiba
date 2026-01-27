import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUS,
  MaintenanceType,
  MaintenanceStatus
} from '@/hooks/useMaintenances';
import { Vehicle } from '@/hooks/useVehicles';

export interface MaintenanceFiltersState {
  search: string;
  type: string;
  status: string;
  vehicleId: string;
}

interface MaintenanceFiltersProps {
  filters: MaintenanceFiltersState;
  onFiltersChange: (filters: MaintenanceFiltersState) => void;
  vehicles: Vehicle[];
  resultCount: number;
}

export function MaintenanceFilters({ 
  filters, 
  onFiltersChange, 
  vehicles,
  resultCount 
}: MaintenanceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.status !== 'all' || 
    filters.vehicleId !== 'all';

  const activeFiltersCount = [
    filters.type !== 'all',
    filters.status !== 'all',
    filters.vehicleId !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search,
      type: 'all',
      status: 'all',
      vehicleId: 'all',
    });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Search and Toggle */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, veículo ou prestador..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showAdvanced ? "secondary" : "outline"}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="h-5 w-5 p-0 justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Serviço</label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(MAINTENANCE_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(MAINTENANCE_STATUS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Veículo</label>
                <Select 
                  value={filters.vehicleId} 
                  onValueChange={(value) => onFiltersChange({ ...filters, vehicleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os veículos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.brand} {v.model} - {v.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {resultCount} resultado{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
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
