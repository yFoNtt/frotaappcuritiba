import { useState, useMemo } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { VehicleFilters, VehicleFiltersState } from '@/components/vehicles/VehicleFilters';
import { mockVehicles } from '@/data/mockData';
import { Car } from 'lucide-react';

const initialFilters: VehicleFiltersState = {
  search: '',
  state: '',
  city: '',
  brand: '',
  minYear: '',
  maxPrice: '',
  fuelType: '',
  app: '',
};

export default function Vehicles() {
  const [filters, setFilters] = useState<VehicleFiltersState>(initialFilters);

  const filteredVehicles = useMemo(() => {
    return mockVehicles.filter((vehicle) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          vehicle.brand.toLowerCase().includes(searchLower) ||
          vehicle.model.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // State filter
      if (filters.state && vehicle.state !== filters.state) return false;

      // City filter
      if (filters.city && vehicle.city !== filters.city) return false;

      // Brand filter
      if (filters.brand && vehicle.brand !== filters.brand) return false;

      // Min year filter
      if (filters.minYear && vehicle.year < parseInt(filters.minYear)) return false;

      // Max price filter
      if (filters.maxPrice && vehicle.weeklyPrice > parseInt(filters.maxPrice)) return false;

      // Fuel type filter
      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;

      // App filter
      if (filters.app && !vehicle.allowedApps.includes(filters.app as any)) return false;

      return true;
    });
  }, [filters]);

  const availableCount = filteredVehicles.filter((v) => v.status === 'available').length;

  return (
    <PublicLayout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Veículos Disponíveis
            </h1>
            <p className="mt-2 text-muted-foreground">
              Encontre o veículo ideal para trabalhar com aplicativos
            </p>
          </div>

          <VehicleFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters(initialFilters)}
          />
        </div>
      </div>

      <div className="container py-8">
        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredVehicles.length} veículo{filteredVehicles.length !== 1 ? 's' : ''} encontrado{filteredVehicles.length !== 1 ? 's' : ''}
            {availableCount > 0 && (
              <span className="ml-1 text-success">
                ({availableCount} disponíve{availableCount !== 1 ? 'is' : 'l'})
              </span>
            )}
          </p>
        </div>

        {filteredVehicles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Nenhum veículo encontrado
            </h3>
            <p className="max-w-md text-muted-foreground">
              Tente ajustar os filtros para encontrar mais opções de veículos.
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
