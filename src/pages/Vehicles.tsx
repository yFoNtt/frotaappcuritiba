import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { VehicleFilters, VehicleFiltersState } from '@/components/vehicles/VehicleFilters';
import { useAvailableVehiclesInfinite, useAvailableVehicles } from '@/hooks/useVehicles';
import { Car, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const initialFilters: VehicleFiltersState = {
  search: '',
  state: '',
  city: '',
  brand: '',
  minYear: '',
  minPrice: '',
  maxPrice: '',
  fuelType: '',
  app: '',
};

export default function Vehicles() {
  const [filters, setFilters] = useState<VehicleFiltersState>(initialFilters);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Infinite query for paginated vehicles
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useAvailableVehiclesInfinite();

  // Regular query for filter options (gets all vehicles for extracting unique values)
  const { data: allVehicles = [] } = useAvailableVehicles();

  // Flatten all pages into a single array
  const allLoadedVehicles = useMemo(() => {
    return data?.pages.flatMap((page) => page.vehicles) ?? [];
  }, [data]);

  // Apply client-side filters
  const filteredVehicles = useMemo(() => {
    return allLoadedVehicles.filter((vehicle) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          vehicle.brand.toLowerCase().includes(searchLower) ||
          vehicle.model.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.state && vehicle.state !== filters.state) return false;
      if (filters.city && vehicle.city !== filters.city) return false;
      if (filters.brand && vehicle.brand !== filters.brand) return false;
      if (filters.minYear && vehicle.year < parseInt(filters.minYear)) return false;
      if (filters.minPrice && vehicle.weekly_price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && vehicle.weekly_price > parseInt(filters.maxPrice)) return false;
      if (filters.fuelType && vehicle.fuel_type !== filters.fuelType) return false;
      if (filters.app && !vehicle.allowed_apps?.includes(filters.app)) return false;
      return true;
    });
  }, [allLoadedVehicles, filters]);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

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
            vehicles={allVehicles}
          />
        </div>
      </div>

      <div className="container py-8">
        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <>
                {filteredVehicles.length} de {totalCount} veículo{totalCount !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                {allLoadedVehicles.length} de {totalCount} veículo{totalCount !== 1 ? 's' : ''} carregado{allLoadedVehicles.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {filteredVehicles.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>

            {/* Load more trigger */}
            {!hasActiveFilters && hasNextPage && (
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Carregando mais veículos...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    Carregar mais
                  </Button>
                )}
              </div>
            )}

            {/* End of list message */}
            {!hasNextPage && allLoadedVehicles.length > 0 && !hasActiveFilters && (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Você viu todos os {totalCount} veículos disponíveis
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Nenhum veículo encontrado
            </h3>
            <p className="max-w-md text-muted-foreground">
              {hasActiveFilters
                ? 'Tente ajustar os filtros para encontrar mais opções de veículos.'
                : 'Ainda não há veículos cadastrados. Em breve teremos opções para você!'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilters(initialFilters)}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
