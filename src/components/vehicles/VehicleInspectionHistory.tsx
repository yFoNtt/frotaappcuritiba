import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gauge,
  Fuel,
  Camera,
  Eye,
  ChevronDown,
  ChevronUp,
  FileDown,
} from 'lucide-react';
import {
  useVehicleInspections,
  VehicleInspection,
  FUEL_LEVELS,
  CONDITION_LABELS,
} from '@/hooks/useInspections';
import { useInspectionExport } from '@/hooks/useInspectionExport';
import { InspectionDetailsDialog } from '@/components/inspections/InspectionDetailsDialog';

interface VehicleInspectionHistoryProps {
  vehicleId: string;
  vehicleName?: string;
  vehiclePlate?: string;
}

const conditionColors = {
  excellent: 'text-success',
  good: 'text-primary',
  fair: 'text-warning',
  poor: 'text-destructive',
};

export function VehicleInspectionHistory({ vehicleId, vehicleName, vehiclePlate }: VehicleInspectionHistoryProps) {
  const { data: inspections, isLoading } = useVehicleInspections(vehicleId);
  const { exportToPDF } = useInspectionExport();
  const [viewingInspection, setViewingInspection] = useState<VehicleInspection | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleExportPDF = () => {
    if (!inspections || inspections.length === 0) return;
    exportToPDF({
      vehicleName,
      vehiclePlate,
      inspections,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Histórico de Vistorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!inspections || inspections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Histórico de Vistorias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Nenhuma vistoria registrada para este veículo.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedInspections = showAll ? inspections : inspections.slice(0, 3);
  const hasMore = inspections.length > 3;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Histórico de Vistorias
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </Button>
              <Badge variant="secondary">{inspections.length} registro(s)</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayedInspections.map((inspection) => {
            const isCheckIn = inspection.type === 'check_in';
            return (
              <div
                key={inspection.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow"
              >
                {/* Icon */}
                <div
                  className={`rounded-full p-2.5 shrink-0 ${
                    isCheckIn
                      ? 'bg-success/10 text-success'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {isCheckIn ? (
                    <ArrowDownToLine className="h-4 w-4" />
                  ) : (
                    <ArrowUpFromLine className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
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
                        <span>{inspection.photos.length} foto(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Conditions */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className={conditionColors[inspection.exterior_condition as keyof typeof conditionColors]}>
                      Externo: {CONDITION_LABELS[inspection.exterior_condition as keyof typeof CONDITION_LABELS]}
                    </span>
                    <span className={conditionColors[inspection.interior_condition as keyof typeof conditionColors]}>
                      Interno: {CONDITION_LABELS[inspection.interior_condition as keyof typeof CONDITION_LABELS]}
                    </span>
                  </div>
                </div>

                {/* View Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingInspection(inspection)}
                  className="shrink-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          {/* Show More/Less Button */}
          {hasMore && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Ver todas ({inspections.length - 3} mais)
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Inspection Details Dialog */}
      <InspectionDetailsDialog
        inspection={viewingInspection}
        open={!!viewingInspection}
        onOpenChange={(open) => !open && setViewingInspection(null)}
        vehicleName={vehicleName}
      />
    </>
  );
}
