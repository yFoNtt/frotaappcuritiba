import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Car,
  User,
  Calendar,
  Gauge,
  Fuel,
  Check,
  X,
  AlertTriangle,
  FileText,
  Camera,
} from 'lucide-react';
import {
  VehicleInspection,
  FUEL_LEVELS,
  CONDITION_LABELS,
  INSPECTION_TYPES,
} from '@/hooks/useInspections';
import { Vehicle } from '@/hooks/useVehicles';
import { useState } from 'react';

interface Driver {
  id: string;
  name: string;
}

interface InspectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: VehicleInspection | null;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  vehicleName?: string;
}

const conditionColors = {
  excellent: 'bg-success/10 text-success border-success/20',
  good: 'bg-primary/10 text-primary border-primary/20',
  fair: 'bg-warning/10 text-warning border-warning/20',
  poor: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function InspectionDetailsDialog({
  open,
  onOpenChange,
  inspection,
  vehicle,
  driver,
  vehicleName,
}: InspectionDetailsDialogProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!inspection) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Detalhes da Vistoria
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant={inspection.type === 'check_in' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {INSPECTION_TYPES[inspection.type]}
                </Badge>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(inspection.performed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
              </div>

              {/* Vehicle and Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    Veículo
                  </div>
                  {vehicle ? (
                    <div>
                      <p className="font-semibold">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                    </div>
                  ) : vehicleName ? (
                    <p className="font-semibold">{vehicleName}</p>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Motorista
                  </div>
                  {driver ? (
                    <p className="font-semibold">{driver.name}</p>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
              </div>

              {/* KM and Fuel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    Quilometragem
                  </div>
                  <p className="text-2xl font-bold">
                    {inspection.km_reading.toLocaleString('pt-BR')} km
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Fuel className="h-4 w-4" />
                    Combustível
                  </div>
                  <p className="text-2xl font-bold">
                    {FUEL_LEVELS[inspection.fuel_level]}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Conditions */}
              <div className="space-y-3">
                <h4 className="font-semibold">Estado do Veículo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Externo</p>
                    <Badge
                      variant="outline"
                      className={conditionColors[inspection.exterior_condition]}
                    >
                      {CONDITION_LABELS[inspection.exterior_condition]}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Interno</p>
                    <Badge
                      variant="outline"
                      className={conditionColors[inspection.interior_condition]}
                    >
                      {CONDITION_LABELS[inspection.interior_condition]}
                    </Badge>
                  </div>
                  {inspection.tires_condition && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Pneus</p>
                      <Badge
                        variant="outline"
                        className={conditionColors[inspection.tires_condition]}
                      >
                        {CONDITION_LABELS[inspection.tires_condition]}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Systems */}
              <div className="space-y-3">
                <h4 className="font-semibold">Sistemas</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    {inspection.lights_working ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm">Faróis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inspection.ac_working ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm">Ar-condicionado</span>
                  </div>
                </div>
              </div>

              {/* Damages */}
              {inspection.damages && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Avarias / Danos
                    </div>
                    <p className="text-sm bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                      {inspection.damages}
                    </p>
                  </div>
                </>
              )}

              {/* Notes */}
              {inspection.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Observações
                  </div>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">
                    {inspection.notes}
                  </p>
                </div>
              )}

              {/* Photos */}
              {inspection.photos && inspection.photos.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <Camera className="h-4 w-4" />
                      Fotos ({inspection.photos.length})
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {inspection.photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPhoto(photo)}
                          className="aspect-square rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all"
                        >
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lightbox for photos */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl p-2">
            <img
              src={selectedPhoto}
              alt="Foto da vistoria"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
