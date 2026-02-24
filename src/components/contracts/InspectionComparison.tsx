import { useState } from 'react';
import { useSignedPhotoUrls } from '@/hooks/useSignedPhotoUrls';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  ArrowDown,
  ArrowUp,
  Fuel, 
  Car, 
  Thermometer,
  Lightbulb,
  CircleDot,
  AlertTriangle,
  Check,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VehicleInspection, FUEL_LEVELS, CONDITION_LABELS } from '@/hooks/useInspections';
import { cn } from '@/lib/utils';

interface InspectionComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkIn: VehicleInspection;
  checkOut: VehicleInspection;
  vehicleName?: string;
}

export function InspectionComparison({
  open,
  onOpenChange,
  checkIn,
  checkOut,
  vehicleName
}: InspectionComparisonProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState<'check_in' | 'check_out'>('check_in');

  const { signedUrls: checkInPhotoUrls } = useSignedPhotoUrls(checkIn.photos);
  const { signedUrls: checkOutPhotoUrls } = useSignedPhotoUrls(checkOut.photos);

  const kmDifference = checkOut.km_reading - checkIn.km_reading;

  const openLightbox = (images: string[], index: number, type: 'check_in' | 'check_out') => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxType(type);
    setLightboxOpen(true);
  };

  const fuelLevelToNumber = (level: string): number => {
    const levels: Record<string, number> = {
      empty: 0,
      quarter: 25,
      half: 50,
      three_quarters: 75,
      full: 100
    };
    return levels[level] || 0;
  };

  const conditionToNumber = (condition: string): number => {
    const conditions: Record<string, number> = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1
    };
    return conditions[condition] || 0;
  };

  const getDifferenceIndicator = (before: number, after: number) => {
    if (after > before) return { icon: ArrowUp, color: 'text-green-500', label: 'Melhorou' };
    if (after < before) return { icon: ArrowDown, color: 'text-red-500', label: 'Piorou' };
    return { icon: null, color: 'text-muted-foreground', label: 'Igual' };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              Comparação de Vistorias
              {vehicleName && (
                <Badge variant="outline" className="font-normal">
                  {vehicleName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="p-6 pt-4 space-y-6">
              {/* Header com datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <Badge className="mb-2">Check-in</Badge>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(checkIn.performed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 border">
                  <Badge variant="secondary" className="mb-2">Check-out</Badge>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(checkOut.performed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* KM Summary */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">KM Inicial</p>
                    <p className="text-2xl font-bold">{checkIn.km_reading.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">KM Final</p>
                    <p className="text-2xl font-bold">{checkOut.km_reading.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="border-l pl-4 ml-4 text-center flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Rodado</p>
                    <p className="text-2xl font-bold text-primary">
                      {kmDifference.toLocaleString('pt-BR')} km
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Comparação Detalhada
                </h3>
                
                <div className="border rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-0 bg-muted/50 text-sm font-medium">
                    <div className="p-3 border-r">Item</div>
                    <div className="p-3 border-r text-center">Check-in</div>
                    <div className="p-3 border-r text-center">Check-out</div>
                    <div className="p-3 text-center">Variação</div>
                  </div>

                  {/* Fuel Level */}
                  <ComparisonRow
                    icon={<Fuel className="h-4 w-4" />}
                    label="Nível de Combustível"
                    checkInValue={FUEL_LEVELS[checkIn.fuel_level as keyof typeof FUEL_LEVELS]}
                    checkOutValue={FUEL_LEVELS[checkOut.fuel_level as keyof typeof FUEL_LEVELS]}
                    difference={getDifferenceIndicator(
                      fuelLevelToNumber(checkIn.fuel_level),
                      fuelLevelToNumber(checkOut.fuel_level)
                    )}
                  />

                  {/* Exterior Condition */}
                  <ComparisonRow
                    icon={<Car className="h-4 w-4" />}
                    label="Condição Externa"
                    checkInValue={CONDITION_LABELS[checkIn.exterior_condition as keyof typeof CONDITION_LABELS]}
                    checkOutValue={CONDITION_LABELS[checkOut.exterior_condition as keyof typeof CONDITION_LABELS]}
                    difference={getDifferenceIndicator(
                      conditionToNumber(checkIn.exterior_condition),
                      conditionToNumber(checkOut.exterior_condition)
                    )}
                    checkInCondition={checkIn.exterior_condition}
                    checkOutCondition={checkOut.exterior_condition}
                  />

                  {/* Interior Condition */}
                  <ComparisonRow
                    icon={<CircleDot className="h-4 w-4" />}
                    label="Condição Interna"
                    checkInValue={CONDITION_LABELS[checkIn.interior_condition as keyof typeof CONDITION_LABELS]}
                    checkOutValue={CONDITION_LABELS[checkOut.interior_condition as keyof typeof CONDITION_LABELS]}
                    difference={getDifferenceIndicator(
                      conditionToNumber(checkIn.interior_condition),
                      conditionToNumber(checkOut.interior_condition)
                    )}
                    checkInCondition={checkIn.interior_condition}
                    checkOutCondition={checkOut.interior_condition}
                  />

                  {/* Tires Condition */}
                  {(checkIn.tires_condition || checkOut.tires_condition) && (
                    <ComparisonRow
                      icon={<CircleDot className="h-4 w-4" />}
                      label="Condição dos Pneus"
                      checkInValue={checkIn.tires_condition ? CONDITION_LABELS[checkIn.tires_condition as keyof typeof CONDITION_LABELS] : '-'}
                      checkOutValue={checkOut.tires_condition ? CONDITION_LABELS[checkOut.tires_condition as keyof typeof CONDITION_LABELS] : '-'}
                      difference={getDifferenceIndicator(
                        conditionToNumber(checkIn.tires_condition || ''),
                        conditionToNumber(checkOut.tires_condition || '')
                      )}
                      checkInCondition={checkIn.tires_condition || undefined}
                      checkOutCondition={checkOut.tires_condition || undefined}
                    />
                  )}

                  {/* Lights Working */}
                  <ComparisonRow
                    icon={<Lightbulb className="h-4 w-4" />}
                    label="Faróis/Luzes"
                    checkInValue={checkIn.lights_working ? 'Funcionando' : 'Com defeito'}
                    checkOutValue={checkOut.lights_working ? 'Funcionando' : 'Com defeito'}
                    checkInBool={checkIn.lights_working}
                    checkOutBool={checkOut.lights_working}
                  />

                  {/* AC Working */}
                  <ComparisonRow
                    icon={<Thermometer className="h-4 w-4" />}
                    label="Ar Condicionado"
                    checkInValue={checkIn.ac_working ? 'Funcionando' : 'Com defeito'}
                    checkOutValue={checkOut.ac_working ? 'Funcionando' : 'Com defeito'}
                    checkInBool={checkIn.ac_working}
                    checkOutBool={checkOut.ac_working}
                  />
                </div>
              </div>

              {/* Damages Comparison */}
              {(checkIn.damages || checkOut.damages) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Danos Reportados
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">Check-in</Badge>
                      {checkIn.damages ? (
                        <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20">
                          {checkIn.damages}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          Nenhum dano reportado
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">Check-out</Badge>
                      {checkOut.damages ? (
                        <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20">
                          {checkOut.damages}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          Nenhum dano reportado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Photos Comparison */}
              {((checkInPhotoUrls.length > 0) || (checkOutPhotoUrls.length > 0)) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Registro Fotográfico
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Check-in Photos */}
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        Check-in ({checkInPhotoUrls.length} fotos)
                      </Badge>
                      {checkInPhotoUrls.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {checkInPhotoUrls.slice(0, 6).map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => openLightbox(checkInPhotoUrls, index, 'check_in')}
                              className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity relative group"
                            >
                              <img
                                src={photo}
                                alt={`Check-in foto ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="h-5 w-5 text-white" />
                              </div>
                            </button>
                          ))}
                          {checkInPhotoUrls.length > 6 && (
                            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                              +{checkInPhotoUrls.length - 6}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          Sem fotos
                        </p>
                      )}
                    </div>

                    {/* Check-out Photos */}
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">
                        Check-out ({checkOutPhotoUrls.length} fotos)
                      </Badge>
                      {checkOutPhotoUrls.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {checkOutPhotoUrls.slice(0, 6).map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => openLightbox(checkOutPhotoUrls, index, 'check_out')}
                              className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity relative group"
                            >
                              <img
                                src={photo}
                                alt={`Check-out foto ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="h-5 w-5 text-white" />
                              </div>
                            </button>
                          ))}
                          {checkOutPhotoUrls.length > 6 && (
                            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                              +{checkOutPhotoUrls.length - 6}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          Sem fotos
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Comparison */}
              {(checkIn.notes || checkOut.notes) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Observações
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">Check-in</Badge>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">
                        {checkIn.notes || 'Sem observações'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">Check-out</Badge>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">
                        {checkOut.notes || 'Sem observações'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            <Badge 
              variant={lightboxType === 'check_in' ? 'default' : 'secondary'}
              className="absolute top-4 left-4 z-10"
            >
              {lightboxType === 'check_in' ? 'Check-in' : 'Check-out'} - Foto {lightboxIndex + 1}/{lightboxImages.length}
            </Badge>
            
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="w-full max-h-[80vh] object-contain"
            />
            
            {lightboxImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setLightboxIndex(i => i === 0 ? lightboxImages.length - 1 : i - 1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setLightboxIndex(i => i === lightboxImages.length - 1 ? 0 : i + 1)}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ComparisonRowProps {
  icon: React.ReactNode;
  label: string;
  checkInValue: string;
  checkOutValue: string;
  difference?: {
    icon: typeof ArrowUp | typeof ArrowDown | null;
    color: string;
    label: string;
  };
  checkInCondition?: string;
  checkOutCondition?: string;
  checkInBool?: boolean;
  checkOutBool?: boolean;
}

function ComparisonRow({ 
  icon, 
  label, 
  checkInValue, 
  checkOutValue, 
  difference,
  checkInCondition,
  checkOutCondition,
  checkInBool,
  checkOutBool
}: ComparisonRowProps) {
  const getConditionColor = (condition?: string) => {
    const colors: Record<string, string> = {
      excellent: 'text-green-600 bg-green-50',
      good: 'text-blue-600 bg-blue-50',
      fair: 'text-yellow-600 bg-yellow-50',
      poor: 'text-red-600 bg-red-50',
    };
    return condition ? colors[condition] || '' : '';
  };

  const getBoolIcon = (value?: boolean) => {
    if (value === undefined) return null;
    return value 
      ? <Check className="h-4 w-4 text-green-600" />
      : <X className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="grid grid-cols-4 gap-0 border-t text-sm">
      <div className="p-3 border-r flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="p-3 border-r text-center">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded",
          getConditionColor(checkInCondition)
        )}>
          {checkInBool !== undefined && getBoolIcon(checkInBool)}
          {checkInValue}
        </span>
      </div>
      <div className="p-3 border-r text-center">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded",
          getConditionColor(checkOutCondition)
        )}>
          {checkOutBool !== undefined && getBoolIcon(checkOutBool)}
          {checkOutValue}
        </span>
      </div>
      <div className="p-3 text-center">
        {difference && difference.icon && (
          <span className={cn("inline-flex items-center gap-1", difference.color)}>
            <difference.icon className="h-4 w-4" />
            <span className="text-xs">{difference.label}</span>
          </span>
        )}
        {difference && !difference.icon && (
          <span className="text-xs text-muted-foreground">{difference.label}</span>
        )}
        {checkInBool !== undefined && checkOutBool !== undefined && (
          <span className={cn(
            "text-xs",
            checkInBool === checkOutBool ? 'text-muted-foreground' : checkOutBool ? 'text-green-600' : 'text-red-600'
          )}>
            {checkInBool === checkOutBool ? 'Igual' : checkOutBool ? 'Reparado' : 'Defeito'}
          </span>
        )}
      </div>
    </div>
  );
}
