import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Wrench, 
  Calendar, 
  Gauge, 
  DollarSign,
  MapPin,
  FileText,
  Car,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Maintenance, MaintenanceType, MAINTENANCE_TYPES } from '@/hooks/useMaintenances';
import { Vehicle } from '@/hooks/useVehicles';

const TYPE_VARIANTS: Record<MaintenanceType, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  oil_change: 'warning',
  tire_change: 'default',
  revision: 'success',
  repair: 'destructive',
  inspection: 'secondary',
  other: 'secondary',
};

const STATUS_CONFIG = {
  scheduled: { label: 'Agendada', variant: 'warning' as const, icon: Clock },
  in_progress: { label: 'Em Andamento', variant: 'default' as const, icon: Loader2 },
  completed: { label: 'Concluída', variant: 'success' as const, icon: CheckCircle },
  cancelled: { label: 'Cancelada', variant: 'secondary' as const, icon: AlertTriangle },
};

interface MaintenanceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: Maintenance | null;
  vehicle: Vehicle | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

export function MaintenanceDetailsDialog({
  open,
  onOpenChange,
  maintenance,
  vehicle,
  onEdit,
  onDelete,
  onComplete,
}: MaintenanceDetailsDialogProps) {
  if (!maintenance) return null;

  const statusConfig = STATUS_CONFIG[maintenance.status];
  const StatusIcon = statusConfig.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getNextMaintenanceStatus = () => {
    if (!maintenance.next_maintenance_date) return null;
    
    const nextDate = parseISO(maintenance.next_maintenance_date);
    const daysUntil = differenceInDays(nextDate, new Date());
    
    if (daysUntil < 0) {
      return { text: `Atrasada há ${Math.abs(daysUntil)} dias`, variant: 'destructive' as const };
    } else if (daysUntil === 0) {
      return { text: 'Vence hoje!', variant: 'warning' as const };
    } else if (daysUntil <= 7) {
      return { text: `Em ${daysUntil} dias`, variant: 'warning' as const };
    } else if (daysUntil <= 30) {
      return { text: `Em ${daysUntil} dias`, variant: 'default' as const };
    }
    return { text: `Em ${daysUntil} dias`, variant: 'secondary' as const };
  };

  const nextStatus = getNextMaintenanceStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>Detalhes da Manutenção</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusConfig.variant} className="gap-1">
                  <StatusIcon className={`h-3 w-3 ${maintenance.status === 'in_progress' ? 'animate-spin' : ''}`} />
                  {statusConfig.label}
                </Badge>
                <Badge variant={TYPE_VARIANTS[maintenance.type]}>
                  {MAINTENANCE_TYPES[maintenance.type]}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Car className="h-4 w-4 text-muted-foreground" />
              Veículo
            </div>
            <p className="font-semibold">{vehicle?.brand} {vehicle?.model}</p>
            <p className="text-sm text-muted-foreground">{vehicle?.plate} • {vehicle?.color}</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Descrição
            </div>
            <p className="text-sm">{maintenance.description}</p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Data
              </div>
              <p className="font-medium">
                {format(parseISO(maintenance.performed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Custo
              </div>
              <p className="font-medium">
                {maintenance.cost ? formatCurrency(Number(maintenance.cost)) : 'Não informado'}
              </p>
            </div>
            {maintenance.km_at_maintenance && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  Km no Momento
                </div>
                <p className="font-medium">{maintenance.km_at_maintenance.toLocaleString('pt-BR')} km</p>
              </div>
            )}
            {maintenance.service_provider && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Prestador
                </div>
                <p className="font-medium">{maintenance.service_provider}</p>
              </div>
            )}
          </div>

          {/* Next Maintenance */}
          {(maintenance.next_maintenance_date || maintenance.next_maintenance_km) && (
            <>
              <Separator />
              <div className="rounded-lg border border-dashed p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Próxima Manutenção
                  </div>
                  {nextStatus && (
                    <Badge variant={nextStatus.variant}>{nextStatus.text}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {maintenance.next_maintenance_date && (
                    <div>
                      <span className="text-muted-foreground">Data: </span>
                      <span className="font-medium">
                        {format(parseISO(maintenance.next_maintenance_date), "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}
                  {maintenance.next_maintenance_km && (
                    <div>
                      <span className="text-muted-foreground">Km: </span>
                      <span className="font-medium">
                        {maintenance.next_maintenance_km.toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {maintenance.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações
                </div>
                <p className="text-sm text-muted-foreground">{maintenance.notes}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {maintenance.status === 'scheduled' && (
            <Button 
              variant="outline" 
              className="text-success border-success/50 hover:bg-success/10"
              onClick={onComplete}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar Concluída
            </Button>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
