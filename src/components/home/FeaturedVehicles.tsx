import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { mockVehicles } from '@/data/mockData';
import { ArrowRight } from 'lucide-react';

export function FeaturedVehicles() {
  // Show only available vehicles for the homepage
  const featuredVehicles = mockVehicles
    .filter((v) => v.status === 'available')
    .slice(0, 3);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Veículos em Destaque
            </h2>
            <p className="mt-2 text-muted-foreground">
              Confira as melhores opções disponíveis agora
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link to="/veiculos">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        <div className="mt-8 flex justify-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/veiculos">
              Ver todos os veículos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
