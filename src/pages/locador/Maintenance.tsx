import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  Wrench, 
  DollarSign,
  Gauge,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { 
  useLocadorMaintenances, 
  useCreateMaintenance, 
  useUpdateMaintenance,
  useDeleteMaintenance,
  useCompleteMaintenance,
  Maintenance,
  MaintenanceInsert,
  MaintenanceType,
  MaintenanceStatus,
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUS
} from '@/hooks/useMaintenances';
import { useLocadorVehicles, Vehicle } from '@/hooks/useVehicles';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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

export default function LocadorMaintenance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [deletingMaintenance, setDeletingMaintenance] = useState<Maintenance | null>(null);

  const { data: maintenances = [], isLoading: maintenancesLoading } = useLocadorMaintenances();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles();
  
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();
  const completeMaintenance = useCompleteMaintenance();

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

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id);
      const matchesSearch = 
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || m.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [maintenances, vehicles, searchTerm, typeFilter]);

  // Calculate upcoming maintenances (within 30 days or scheduled)
  const upcomingMaintenances = useMemo(() => {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return maintenances.filter(m => {
      if (m.status === 'scheduled') return true;
      if (m.next_maintenance_date) {
        const nextDate = parseISO(m.next_maintenance_date);
        return isBefore(nextDate, thirtyDaysFromNow);
      }
      return false;
    });
  }, [maintenances]);

  const stats = useMemo(() => {
    const totalCost = maintenances
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const totalRecords = maintenances.length;
    const scheduledCount = maintenances.filter(m => m.status === 'scheduled').length;
    
    return { totalCost, totalRecords, scheduledCount, upcomingCount: upcomingMaintenances.length };
  }, [maintenances, upcomingMaintenances]);

  const getVehicleInfo = (vehicleId: string): Vehicle | undefined => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const handleOpenAddDialog = () => {
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
    setEditingMaintenance(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (maintenance: Maintenance) => {
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
    setEditingMaintenance(maintenance);
    setIsAddDialogOpen(true);
  };

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

    if (editingMaintenance) {
      await updateMaintenance.mutateAsync({ 
        id: editingMaintenance.id, 
        updates: maintenanceData 
      });
    } else {
      await createMaintenance.mutateAsync(maintenanceData);
    }

    setIsAddDialogOpen(false);
    setEditingMaintenance(null);
    form.reset();
  };

  const handleDelete = async () => {
    if (deletingMaintenance) {
      await deleteMaintenance.mutateAsync(deletingMaintenance.id);
      setDeletingMaintenance(null);
    }
  };

  const handleComplete = async (id: string) => {
    await completeMaintenance.mutateAsync(id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (maintenancesLoading || vehiclesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manutenções</h1>
            <p className="text-muted-foreground">
              Registre e acompanhe as manutenções dos veículos
            </p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Manutenção
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <DollarSign className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</p>
                  <p className="text-sm text-muted-foreground">Gasto Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRecords}</p>
                  <p className="text-sm text-muted-foreground">Total de Registros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.scheduledCount}</p>
                  <p className="text-sm text-muted-foreground">Agendadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.upcomingCount}</p>
                  <p className="text-sm text-muted-foreground">Próximas (30 dias)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(MAINTENANCE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredMaintenances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenances.map((maintenance) => {
                    const vehicle = getVehicleInfo(maintenance.vehicle_id);
                    const statusConfig = STATUS_CONFIG[maintenance.status];
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={maintenance.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                              <Wrench className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{vehicle?.brand} {vehicle?.model}</p>
                              <p className="text-xs text-muted-foreground">{vehicle?.plate}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate">{maintenance.description}</p>
                          {maintenance.service_provider && (
                            <p className="text-xs text-muted-foreground truncate">
                              {maintenance.service_provider}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={TYPE_VARIANTS[maintenance.type]}>
                            {MAINTENANCE_TYPES[maintenance.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(parseISO(maintenance.performed_at), 'dd/MM/yyyy')}
                          </div>
                          {maintenance.km_at_maintenance && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Gauge className="h-3 w-3" />
                              {maintenance.km_at_maintenance.toLocaleString('pt-BR')} km
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {maintenance.cost ? formatCurrency(Number(maintenance.cost)) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {maintenance.status === 'scheduled' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleComplete(maintenance.id)}
                                title="Marcar como concluída"
                              >
                                <CheckCircle className="h-4 w-4 text-success" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenEditDialog(maintenance)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingMaintenance(maintenance)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhuma manutenção encontrada</h3>
                <p className="mb-4 text-muted-foreground">
                  {maintenances.length === 0
                    ? 'Você ainda não registrou nenhuma manutenção.'
                    : 'Nenhuma manutenção corresponde aos filtros.'}
                </p>
                {maintenances.length === 0 && (
                  <Button onClick={handleOpenAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar primeira manutenção
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Maintenance Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMaintenance ? 'Editar Manutenção' : 'Registrar Manutenção'}
              </DialogTitle>
              <DialogDescription>
                {editingMaintenance 
                  ? 'Atualize os dados da manutenção.' 
                  : 'Preencha os dados para registrar uma nova manutenção.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo</FormLabel>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva os serviços realizados..."
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="performed_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="km_at_maintenance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Km na Manutenção</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="45000" {...field} />
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
                        <FormLabel>Prestador</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da oficina" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="next_maintenance_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próxima Manutenção (Data)</FormLabel>
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
                        <FormLabel>Próxima Manutenção (Km)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações adicionais..."
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMaintenance.isPending || updateMaintenance.isPending}
                  >
                    {(createMaintenance.isPending || updateMaintenance.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingMaintenance ? 'Salvar Alterações' : 'Registrar'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingMaintenance} onOpenChange={() => setDeletingMaintenance(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Manutenção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
