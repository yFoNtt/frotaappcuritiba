import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ClipboardCheck, Fuel, Car, Calendar, Eye, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  VehicleInspection, 
  INSPECTION_TYPES, 
  FUEL_LEVELS, 
  CONDITION_LABELS 
} from '@/hooks/useInspections';
import { useVehicleInspections } from '@/hooks/useInspections';

interface ContractInspectionsSectionProps {
  contractId: string;
  vehicleId: string;
  onViewInspection?: (inspection: VehicleInspection) => void;
}

export function ContractInspectionsSection({ 
  contractId, 
  vehicleId, 
  onViewInspection 
}: ContractInspectionsSectionProps) {
  const { data: allInspections = [], isLoading } = useVehicleInspections(vehicleId);
  
  // Filter inspections for this contract
  const contractInspections = useMemo(() => {
    return allInspections.filter(i => i.contract_id === contractId);
  }, [allInspections, contractId]);

  const checkInInspection = contractInspections.find(i => i.type === 'check_in');
  const checkOutInspection = contractInspections.find(i => i.type === 'check_out');

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Separator />
        <div className="animate-pulse space-y-2 pt-2">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (contractInspections.length === 0) {
    return (
      <div className="space-y-2">
        <Separator />
        <div className="pt-2">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-4 w-4" />
            Vistorias
          </h4>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma vistoria registrada para este contrato
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Separator />
      <div className="pt-2">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <ClipboardCheck className="h-4 w-4" />
          Vistorias ({contractInspections.length})
        </h4>
        
        <div className="space-y-3">
          {contractInspections.map((inspection) => (
            <InspectionSummaryCard 
              key={inspection.id} 
              inspection={inspection}
              onView={onViewInspection ? () => onViewInspection(inspection) : undefined}
            />
          ))}
        </div>

        {/* KM Difference if both check-in and check-out exist */}
        {checkInInspection && checkOutInspection && (
          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">KM Rodados no Contrato</span>
              <span className="font-semibold text-primary">
                {(checkOutInspection.km_reading - checkInInspection.km_reading).toLocaleString('pt-BR')} km
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface InspectionSummaryCardProps {
  inspection: VehicleInspection;
  onView?: () => void;
}

function InspectionSummaryCard({ inspection, onView }: InspectionSummaryCardProps) {
  const isCheckIn = inspection.type === 'check_in';
  
  return (
    <div className="bg-muted/30 rounded-lg p-3 border">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isCheckIn ? 'default' : 'secondary'} className="text-xs">
              {isCheckIn ? 'Check-in' : 'Check-out'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(inspection.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <Car className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">KM:</span>
              <span className="font-medium">{inspection.km_reading.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fuel className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Comb:</span>
              <span className="font-medium">{FUEL_LEVELS[inspection.fuel_level as keyof typeof FUEL_LEVELS]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Ext:</span>
              <ConditionBadge condition={inspection.exterior_condition} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Int:</span>
              <ConditionBadge condition={inspection.interior_condition} />
            </div>
          </div>

          {inspection.damages && (
            <p className="mt-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
              ⚠️ {inspection.damages}
            </p>
          )}
          
          {inspection.photos && inspection.photos.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              📷 {inspection.photos.length} foto{inspection.photos.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {onView && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const conditionColors: Record<string, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };

  return (
    <span className={`font-medium ${conditionColors[condition] || ''}`}>
      {CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS] || condition}
    </span>
  );
}
