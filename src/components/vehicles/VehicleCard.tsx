import { Link } from 'react-router-dom';
import { Vehicle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { MapPin, Fuel, Calendar, Eye } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
}

const statusLabels = {
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
};

const fuelLabels = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
};

const appLabels = {
  uber: 'Uber',
  '99': '99',
  indrive: 'InDrive',
  other: 'Outro',
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={vehicle.images[0] || '/placeholder.svg'}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge variant={vehicle.status === 'available' ? 'available' : vehicle.status === 'rented' ? 'rented' : 'maintenance'}>
            {statusLabels[vehicle.status]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title & Price */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">
              {vehicle.brand} {vehicle.model}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {vehicle.city}, {vehicle.state}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              R$ {vehicle.weeklyPrice.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-muted-foreground">/semana</div>
          </div>
        </div>

        {/* Details */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {vehicle.year}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
            <Fuel className="h-3 w-3" />
            {fuelLabels[vehicle.fuelType]}
          </div>
          <div className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
            {vehicle.kmLimit.toLocaleString('pt-BR')} km/mês
          </div>
        </div>

        {/* Apps */}
        <div className="flex flex-wrap gap-1">
          {vehicle.allowedApps.map((app) => (
            <span
              key={app}
              className="rounded bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {appLabels[app]}
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/50 p-4">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/veiculos/${vehicle.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
