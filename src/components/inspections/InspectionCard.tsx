import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Car,
  User,
  Gauge,
  Fuel,
  MoreVertical,
  Eye,
  Trash2,
  Camera,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pencil,
} from 'lucide-react';
import {
  VehicleInspection,
  FUEL_LEVELS,
  CONDITION_LABELS,
} from '@/hooks/useInspections';
import { Vehicle } from '@/hooks/useVehicles';

interface Driver {
  id: string;
  name: string;
}

interface InspectionCardProps {
  inspection: VehicleInspection;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const conditionColors = {
  excellent: 'text-success',
  good: 'text-primary',
  fair: 'text-warning',
  poor: 'text-destructive',
};

export function InspectionCard({
  inspection,
  vehicle,
  driver,
  onView,
  onEdit,
  onDelete,
}: InspectionCardProps) {
  const isCheckIn = inspection.type === 'check_in';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Main Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div
              className={`rounded-full p-3 ${
                isCheckIn
                  ? 'bg-success/10 text-success'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {isCheckIn ? (
                <ArrowDownToLine className="h-5 w-5" />
              ) : (
                <ArrowUpFromLine className="h-5 w-5" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isCheckIn ? 'default' : 'secondary'}>
                  {isCheckIn ? 'Check-in' : 'Check-out'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(inspection.performed_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>

              {/* Vehicle */}
              {vehicle && (
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium truncate">
                    {vehicle.brand} {vehicle.model}
                  </span>
                  <span className="text-muted-foreground">{vehicle.plate}</span>
                </div>
              )}

              {/* Driver */}
              {driver && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.name}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {inspection.km_reading.toLocaleString('pt-BR')} km
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <span>{FUEL_LEVELS[inspection.fuel_level]}</span>
                </div>
                {inspection.photos && inspection.photos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span>{inspection.photos.length} fotos</span>
                  </div>
                )}
              </div>

              {/* Conditions */}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className={conditionColors[inspection.exterior_condition]}>
                  Externo: {CONDITION_LABELS[inspection.exterior_condition]}
                </span>
                <span className={conditionColors[inspection.interior_condition]}>
                  Interno: {CONDITION_LABELS[inspection.interior_condition]}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
