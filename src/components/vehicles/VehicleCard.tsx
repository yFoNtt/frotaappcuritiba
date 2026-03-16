import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Fuel, Calendar, Eye, Gauge } from 'lucide-react';

interface VehicleCardVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuel_type: string;
  status: string;
  weekly_price: number;
  km_limit: number | null;
  allowed_apps: string[];
  images: string[];
  city: string;
  state: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
}

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
  inactive: 'Inativo'
};

const fuelLabels: Record<string, string> = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido'
};

const appLabels: Record<string, string> = {
  uber: 'Uber',
  '99': '99',
  indrive: 'InDrive',
  other: 'Outro'
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-border/40 bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/20">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={vehicle.images[0] || '/placeholder.svg'}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <Badge
            variant={vehicle.status === 'available' ? 'available' : vehicle.status === 'rented' ? 'rented' : 'maintenance'}
            className="rounded-full px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-sm">

            {statusLabels[vehicle.status] || vehicle.status}
          </Badge>
        </div>

        {/* Price overlay on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
          <Button size="sm" asChild className="rounded-full shadow-lg">
            <Link to={`/veiculos/${vehicle.id}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Ver Detalhes
            </Link>
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-base truncate">
              {vehicle.brand} {vehicle.model}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/50" />
              <span className="truncate">{vehicle.city}, {vehicle.state}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-extrabold leading-tight text-muted-foreground">
              R$ {vehicle.weekly_price.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">/semana</div>
          </div>
        </div>

        {/* Details chips */}
        <div className="flex flex-wrap gap-1.5">
          <div className="flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3 w-3 text-primary/50" />
            {vehicle.year}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Fuel className="h-3 w-3 text-primary/50" />
            {fuelLabels[vehicle.fuel_type] || vehicle.fuel_type}
          </div>
          {vehicle.km_limit &&
          <div className="flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Gauge className="h-3 w-3 text-primary/50" />
              {vehicle.km_limit.toLocaleString('pt-BR')} km
            </div>
          }
        </div>

        {/* Apps */}
        {vehicle.allowed_apps.length > 0 &&
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
            {vehicle.allowed_apps.map((app) =>
          <span
            key={app}
            className="rounded-full bg-primary/8 px-2.5 py-0.5 text-[11px] font-semibold text-primary">

                {appLabels[app] || app}
              </span>
          )}
          </div>
        }
      </CardContent>
    </Card>);

}