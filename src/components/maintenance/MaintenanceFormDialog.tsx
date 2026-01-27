import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Wrench, DollarSign, Gauge, Calendar, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Maintenance,
  MaintenanceInsert,
  MaintenanceType,
  MaintenanceStatus,
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUS
} from '@/hooks/useMaintenances';
import { Vehicle } from '@/hooks/useVehicles';

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  type: z.string().min(1, 'Selecione o tipo'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  cost: z.string().optional(),
  km_at_maintenance: z.string().optional(),
  performed_at: z.string().min(1, 'Data é obrigatória'),
  next_maintenance_date: z.string().optional(),
  next_maintenance_km: z.string().optional(),
  service_provider: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: Maintenance | null;
  vehicles: Vehicle[];
  onSubmit: (data: MaintenanceInsert, isEditing: boolean, maintenanceId?: string) => Promise<void>;
  isSubmitting: boolean;
}

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  maintenance,
  vehicles,
  onSubmit,
  isSubmitting,
}: MaintenanceFormDialogProps) {
  const isEditing = !!maintenance;

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: '',
      type: '',
      description: '',
      cost: '',
      km_at_maintenance: '',
      performed_at: format(new Date(), 'yyyy-MM-dd'),
      next_maintenance_date: '',
      next_maintenance_km: '',
      service_provider: '',
      notes: '',
      status: 'completed',
    },
  });

  useEffect(() => {
    if (open) {
      if (maintenance) {
        form.reset({
          vehicle_id: maintenance.vehicle_id,
          type: maintenance.type,
          description: maintenance.description,
          cost: maintenance.cost?.toString() || '',
          km_at_maintenance: maintenance.km_at_maintenance?.toString() || '',
          performed_at: maintenance.performed_at,
          next_maintenance_date: maintenance.next_maintenance_date || '',
          next_maintenance_km: maintenance.next_maintenance_km?.toString() || '',
          service_provider: maintenance.service_provider || '',
          notes: maintenance.notes || '',
          status: maintenance.status,
        });
      } else {
        form.reset({
          vehicle_id: '',
          type: '',
          description: '',
          cost: '',
          km_at_maintenance: '',
          performed_at: format(new Date(), 'yyyy-MM-dd'),
          next_maintenance_date: '',
          next_maintenance_km: '',
          service_provider: '',
          notes: '',
          status: 'completed',
        });
      }
    }
  }, [open, maintenance, form]);

  const handleSubmit = async (data: MaintenanceFormData) => {
    const maintenanceData: MaintenanceInsert = {
      vehicle_id: data.vehicle_id,
      type: data.type as MaintenanceType,
      description: data.description,
      cost: data.cost ? parseFloat(data.cost) : 0,
      km_at_maintenance: data.km_at_maintenance ? parseInt(data.km_at_maintenance) : undefined,
      performed_at: data.performed_at,
      next_maintenance_date: data.next_maintenance_date || undefined,
      next_maintenance_km: data.next_maintenance_km ? parseInt(data.next_maintenance_km) : undefined,
      service_provider: data.service_provider || undefined,
      notes: data.notes || undefined,
      status: (data.status as MaintenanceStatus) || 'completed',
    };

    await onSubmit(maintenanceData, isEditing, maintenance?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {isEditing ? 'Editar Manutenção' : 'Registrar Manutenção'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os dados da manutenção.' 
              : 'Preencha os dados para registrar uma nova manutenção.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Vehicle and Type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wrench className="h-4 w-4" />
                Informações Básicas
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                          {vehicles.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.brand} {v.model} - {v.plate}
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(MAINTENANCE_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Serviço *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Troca de óleo e filtro, verificação dos freios..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date, Status and Cost */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Data e Valores
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="performed_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(MAINTENANCE_STATUS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            className="pl-9"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* KM and Service Provider */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Gauge className="h-4 w-4" />
                Quilometragem e Prestador
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="km_at_maintenance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Km no Momento</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="45.000" 
                            className="pl-9"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="service_provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prestador / Oficina</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Nome da oficina" 
                            className="pl-9"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Next Maintenance */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Próxima Manutenção (Opcional)
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="next_maintenance_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Prevista</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="next_maintenance_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Km Prevista</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="50.000" 
                            className="pl-9"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Observações
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre o serviço..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Registrar Manutenção'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
