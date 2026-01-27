import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Calendar,
  Car,
  ChevronRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Maintenance, MAINTENANCE_TYPES } from '@/hooks/useMaintenances';
import { Vehicle } from '@/hooks/useVehicles';

interface UpcomingMaintenanceCardProps {
  maintenances: Maintenance[];
  vehicles: Vehicle[];
  onViewDetails: (maintenance: Maintenance) => void;
  onComplete: (id: string) => void;
}

export function UpcomingMaintenanceCard({ 
  maintenances, 
  vehicles, 
  onViewDetails,
  onComplete 
}: UpcomingMaintenanceCardProps) {
  if (maintenances.length === 0) return null;

  const getVehicleInfo = (vehicleId: string): Vehicle | undefined => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getUrgencyInfo = (maintenance: Maintenance) => {
    if (maintenance.status === 'scheduled') {
      const performDate = parseISO(maintenance.performed_at);
      const daysUntil = differenceInDays(performDate, new Date());
      
      if (daysUntil < 0) {
        return { label: 'Atrasada', variant: 'destructive' as const, urgent: true };
      } else if (daysUntil === 0) {
        return { label: 'Hoje', variant: 'warning' as const, urgent: true };
      } else if (daysUntil <= 3) {
        return { label: `${daysUntil}d`, variant: 'warning' as const, urgent: true };
      }
      return { label: `${daysUntil}d`, variant: 'secondary' as const, urgent: false };
    }

    if (maintenance.next_maintenance_date) {
      const nextDate = parseISO(maintenance.next_maintenance_date);
      const daysUntil = differenceInDays(nextDate, new Date());
      
      if (daysUntil < 0) {
        return { label: 'Atrasada', variant: 'destructive' as const, urgent: true };
      } else if (daysUntil <= 7) {
        return { label: `${daysUntil}d`, variant: 'warning' as const, urgent: true };
      }
      return { label: `${daysUntil}d`, variant: 'secondary' as const, urgent: false };
    }

    return null;
  };

  const sortedMaintenances = [...maintenances].sort((a, b) => {
    const urgencyA = getUrgencyInfo(a);
    const urgencyB = getUrgencyInfo(b);
    if (urgencyA?.urgent && !urgencyB?.urgent) return -1;
    if (!urgencyA?.urgent && urgencyB?.urgent) return 1;
    return 0;
  });

  return (
    <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Manutenções Próximas
          <Badge variant="warning" className="ml-auto">
            {maintenances.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-3">
            {sortedMaintenances.slice(0, 5).map((maintenance) => {
              const vehicle = getVehicleInfo(maintenance.vehicle_id);
              const urgency = getUrgencyInfo(maintenance);
              
              return (
                <div 
                  key={maintenance.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/80 hover:bg-background transition-colors cursor-pointer group"
                  onClick={() => onViewDetails(maintenance)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {MAINTENANCE_TYPES[maintenance.type]}
                      </span>
                      {urgency && (
                        <Badge variant={urgency.variant} className="text-[10px] px-1.5 py-0 h-4">
                          {urgency.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Car className="h-3 w-3" />
                      <span className="truncate">{vehicle?.brand} {vehicle?.model}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(
                          parseISO(maintenance.status === 'scheduled' 
                            ? maintenance.performed_at 
                            : maintenance.next_maintenance_date || maintenance.performed_at),
                          "dd/MM"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {maintenance.status === 'scheduled' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-success hover:text-success hover:bg-success/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onComplete(maintenance.id);
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {maintenances.length > 5 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            + {maintenances.length - 5} manutenções próximas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
