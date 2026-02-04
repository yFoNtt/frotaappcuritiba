import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Loader2, X, Upload, ClipboardList, FileText } from 'lucide-react';
import {
  useCreateInspection,
  uploadInspectionPhotos,
  FUEL_LEVELS,
  CONDITION_LABELS,
  INSPECTION_TYPES,
  VehicleInspection,
} from '@/hooks/useInspections';
import { useAuth } from '@/hooks/useAuth';
import { Vehicle } from '@/hooks/useVehicles';
import { useEffectiveChecklist } from '@/hooks/useChecklistTemplates';
import {
  InspectionChecklist,
  INSPECTION_CHECKLIST_TEMPLATE,
  ChecklistCategory,
  checklistToJson,
} from './InspectionChecklist';

const formSchema = z.object({
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  driver_id: z.string().min(1, 'Selecione um motorista'),
  contract_id: z.string().nullable(),
  type: z.enum(['check_in', 'check_out']),
  km_reading: z.coerce.number().min(0, 'KM inválido'),
  fuel_level: z.enum(['empty', 'quarter', 'half', 'three_quarters', 'full']),
  exterior_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  interior_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  tires_condition: z.enum(['excellent', 'good', 'fair', 'poor']).nullable(),
  lights_working: z.boolean(),
  ac_working: z.boolean(),
  damages: z.string().nullable(),
  notes: z.string().nullable(),
  performed_at: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface Driver {
  id: string;
  name: string;
  vehicle_id: string | null;
}

interface Contract {
  id: string;
  driver_id: string;
  vehicle_id: string;
  status: string;
}

interface InspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  contracts: Contract[];
  inspection?: VehicleInspection | null;
}

export function InspectionFormDialog({
  open,
  onOpenChange,
  vehicles,
  drivers,
  contracts,
  inspection,
}: InspectionFormDialogProps) {
  const { user } = useAuth();
  const createInspection = useCreateInspection();
  const { getChecklist, isLoading: isLoadingChecklist } = useEffectiveChecklist();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistCategory[]>([]);
  const [activeTab, setActiveTab] = useState('info');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_id: '',
      driver_id: '',
      contract_id: null,
      type: 'check_in',
      km_reading: 0,
      fuel_level: 'full',
      exterior_condition: 'good',
      interior_condition: 'good',
      tires_condition: 'good',
      lights_working: true,
      ac_working: true,
      damages: '',
      notes: '',
      performed_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const selectedVehicleId = form.watch('vehicle_id');
  const selectedDriverId = form.watch('driver_id');

  // Reset checklist when dialog opens - use custom template if available
  useEffect(() => {
    if (open && !isLoadingChecklist) {
      const effectiveChecklist = getChecklist();
      setChecklist(effectiveChecklist);
      setActiveTab('info');
    }
  }, [open, isLoadingChecklist, getChecklist]);

  // Find active contract for selected vehicle/driver
  useEffect(() => {
    if (selectedVehicleId && selectedDriverId) {
      const activeContract = contracts.find(
        (c) =>
          c.vehicle_id === selectedVehicleId &&
          c.driver_id === selectedDriverId &&
          c.status === 'active'
      );
      form.setValue('contract_id', activeContract?.id || null);
    }
  }, [selectedVehicleId, selectedDriverId, contracts, form]);

  // Set initial KM from vehicle
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
      if (vehicle && typeof vehicle.current_km === 'number') {
        form.setValue('km_reading', vehicle.current_km);
      }
    }
  }, [selectedVehicleId, vehicles, form]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 10) {
      alert('Máximo de 10 fotos permitidas');
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} excede o limite de 5MB`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`${file.name} não é um formato válido`);
        return false;
      }
      return true;
    });

    setPhotos((prev) => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    try {
      setIsUploading(true);

      // Generate a temporary ID for the folder structure
      const tempId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Upload photos first if any
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadInspectionPhotos(user.id, tempId, photos);
      }

      // Convert checklist to JSON
      const checklistJson = checklistToJson(checklist);

      await createInspection.mutateAsync({
        vehicle_id: data.vehicle_id,
        driver_id: data.driver_id,
        contract_id: data.contract_id || null,
        type: data.type,
        km_reading: data.km_reading,
        fuel_level: data.fuel_level,
        exterior_condition: data.exterior_condition,
        interior_condition: data.interior_condition,
        tires_condition: data.tires_condition || null,
        lights_working: data.lights_working,
        ac_working: data.ac_working,
        damages: data.damages || null,
        notes: data.notes || null,
        performed_at: data.performed_at,
        photos: photoUrls,
        checklist: checklistJson,
      });

      form.reset();
      setPhotos([]);
      setPreviews([]);
      setChecklist(getChecklist());
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting inspection:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = createInspection.isPending || isUploading;

  // Count checklist issues
  const checklistIssues = checklist.reduce((count, category) => {
    return count + category.items.filter((item) => item.status === 'not_ok').length;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {inspection ? 'Editar Vistoria' : 'Nova Vistoria'}
          </DialogTitle>
          <DialogDescription>
            Registre o estado do veículo na entrega ou devolução
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
              <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="checklist" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Checklist
                  {checklistIssues > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                      {checklistIssues}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos
                  {photos.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {photos.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                <TabsContent value="info" forceMount className="mt-0 space-y-6 data-[state=inactive]:hidden">
                  {/* Vehicle and Driver Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vehicle_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veículo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o veículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.brand} {vehicle.model} - {vehicle.plate}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="driver_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motorista *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedVehicleId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o motorista" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {drivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Type and Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Vistoria *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(INSPECTION_TYPES).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="performed_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data/Hora *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* KM and Fuel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="km_reading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quilometragem *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 45000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuel_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Combustível *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(FUEL_LEVELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="exterior_condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado Externo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interior_condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado Interno *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tires_condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado dos Pneus</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || 'good'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Damages and Notes */}
                  <FormField
                    control={form.control}
                    name="damages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avarias / Danos</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva quaisquer danos ou avarias encontrados..."
                            rows={3}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Outras observações sobre a vistoria..."
                            rows={2}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="checklist" forceMount className="mt-0 data-[state=inactive]:hidden">
                  <InspectionChecklist
                    checklist={checklist}
                    onChange={setChecklist}
                  />
                </TabsContent>

                <TabsContent value="photos" forceMount className="mt-0 space-y-4 data-[state=inactive]:hidden">
                  <div className="space-y-3">
                    <Label>Fotos da Vistoria (máx. 10)</Label>
                    <div className="flex flex-wrap gap-3">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-24 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {photos.length < 10 && (
                        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Camera className="h-6 w-6" />
                            <span className="text-xs">Adicionar</span>
                          </div>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG ou WebP. Máximo 5MB por foto. Tire fotos de todos os ângulos
                      importantes do veículo.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? 'Enviando fotos...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Registrar Vistoria
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
