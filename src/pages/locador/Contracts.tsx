import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  FileText, 
  Car, 
  Users,
  Calendar,
  Ban,
  CheckCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useLocadorContracts, 
  useCreateContract, 
  useEndContract,
  useCancelContract,
  Contract,
  ContractInsert 
} from '@/hooks/useContracts';
import { useLocadorDrivers, Driver } from '@/hooks/useDrivers';
import { useLocadorVehicles, Vehicle } from '@/hooks/useVehicles';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ContractInspectionsSection } from '@/components/contracts/ContractInspectionsSection';
import { InspectionDetailsDialog } from '@/components/inspections/InspectionDetailsDialog';
import { VehicleInspection } from '@/hooks/useInspections';

const contractSchema = z.object({
  driver_id: z.string().min(1, 'Selecione um motorista'),
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().optional(),
  weekly_price: z.coerce.number().min(1, 'Valor semanal é obrigatório'),
  deposit: z.coerce.number().optional(),
  km_limit: z.coerce.number().optional(),
  excess_km_fee: z.coerce.number().optional(),
  payment_day: z.string().default('segunda-feira'),
  terms: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' | 'secondary' }> = {
  active: { label: 'Ativo', variant: 'success' },
  ended: { label: 'Encerrado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  pending: { label: 'Pendente', variant: 'default' },
};

const paymentDays = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
  'domingo',
];

export default function LocadorContracts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [endingContract, setEndingContract] = useState<Contract | null>(null);
  const [cancellingContract, setCancellingContract] = useState<Contract | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [viewingInspection, setViewingInspection] = useState<VehicleInspection | null>(null);

  const { data: contracts = [], isLoading: contractsLoading } = useLocadorContracts();
  const { data: drivers = [], isLoading: driversLoading } = useLocadorDrivers();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles();

  const createContract = useCreateContract();
  const endContract = useEndContract();
  const cancelContract = useCancelContract();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      driver_id: '',
      vehicle_id: '',
      start_date: '',
      end_date: '',
      weekly_price: 0,
      deposit: 0,
      km_limit: undefined,
      excess_km_fee: undefined,
      payment_day: 'segunda-feira',
      terms: '',
    },
  });

  // Drivers without active contracts
  const availableDrivers = useMemo(() => {
    const driversWithActiveContracts = contracts
      .filter(c => c.status === 'active')
      .map(c => c.driver_id);
    return drivers.filter(d => !driversWithActiveContracts.includes(d.id));
  }, [drivers, contracts]);

  // Vehicles without active contracts
  const availableVehicles = useMemo(() => {
    const vehiclesWithActiveContracts = contracts
      .filter(c => c.status === 'active')
      .map(c => c.vehicle_id);
    return vehicles.filter(v => 
      v.status === 'available' && !vehiclesWithActiveContracts.includes(v.id)
    );
  }, [vehicles, contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const driver = drivers.find(d => d.id === contract.driver_id);
      const vehicle = vehicles.find(v => v.id === contract.vehicle_id);
      
      const matchesSearch = 
        driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${vehicle?.brand} ${vehicle?.model}`.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contracts, drivers, vehicles, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    ended: contracts.filter(c => c.status === 'ended').length,
    cancelled: contracts.filter(c => c.status === 'cancelled').length,
  }), [contracts]);

  const getDriverInfo = (driverId: string): Driver | undefined => {
    return drivers.find(d => d.id === driverId);
  };

  const getVehicleInfo = (vehicleId: string): Vehicle | undefined => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const handleOpenAddDialog = () => {
    form.reset();
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: ContractFormData) => {
    const contractData: ContractInsert = {
      driver_id: data.driver_id,
      vehicle_id: data.vehicle_id,
      start_date: data.start_date,
      end_date: data.end_date || null,
      weekly_price: data.weekly_price,
      deposit: data.deposit,
      km_limit: data.km_limit,
      excess_km_fee: data.excess_km_fee,
      payment_day: data.payment_day,
      terms: data.terms,
      status: 'active',
    };

    await createContract.mutateAsync(contractData);
    setIsFormOpen(false);
    form.reset();
  };

  const handleEndContract = async () => {
    if (endingContract) {
      await endContract.mutateAsync({
        id: endingContract.id,
        endDate: new Date().toISOString().split('T')[0],
      });
      setEndingContract(null);
    }
  };

  const handleCancelContract = async () => {
    if (cancellingContract && cancellationReason.trim()) {
      await cancelContract.mutateAsync({
        id: cancellingContract.id,
        reason: cancellationReason,
      });
      setCancellingContract(null);
      setCancellationReason('');
    }
  };

  // Auto-fill weekly price when vehicle is selected
  const selectedVehicleId = form.watch('vehicle_id');
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  if (contractsLoading || driversLoading || vehiclesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
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
            <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
            <p className="text-muted-foreground">
              Gerencie os contratos de locação da sua frota
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button 
              onClick={handleOpenAddDialog}
              disabled={drivers.length === 0 || availableVehicles.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
            {(drivers.length === 0 || availableVehicles.length === 0) && (
              <p className="text-xs text-muted-foreground">
                {drivers.length === 0 
                  ? 'Cadastre um motorista primeiro'
                  : availableVehicles.length === 0 
                    ? 'Nenhum veículo disponível'
                    : 'Todos os motoristas já têm contrato ativo'
                }
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ended}</p>
                  <p className="text-sm text-muted-foreground">Encerrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <Ban className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                  <p className="text-sm text-muted-foreground">Cancelados</p>
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
                  placeholder="Buscar por motorista ou veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="ended">Encerrados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredContracts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor/Semana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const driver = getDriverInfo(contract.driver_id);
                    const vehicle = getVehicleInfo(contract.vehicle_id);
                    const daysActive = differenceInDays(
                      contract.end_date ? parseISO(contract.end_date) : new Date(),
                      parseISO(contract.start_date)
                    );
                    
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {driver?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <span className="font-medium">{driver?.name || 'Motorista removido'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{vehicle?.brand} {vehicle?.model}</p>
                              <p className="text-xs text-muted-foreground">{vehicle?.plate}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(parseISO(contract.start_date), 'dd/MM/yyyy')}</p>
                            <p className="text-xs text-muted-foreground">
                              {contract.end_date 
                                ? `até ${format(parseISO(contract.end_date), 'dd/MM/yyyy')}`
                                : `${daysActive} dias`
                              }
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {Number(contract.weekly_price).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusLabels[contract.status]?.variant || 'default'}>
                            {statusLabels[contract.status]?.label || contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setViewingContract(contract)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {contract.status === 'active' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setEndingContract(contract)}
                                  title="Encerrar contrato"
                                >
                                  <CheckCircle className="h-4 w-4 text-success" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setCancellingContract(contract)}
                                  title="Cancelar contrato"
                                >
                                  <Ban className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhum contrato encontrado</h3>
                <p className="mb-4 text-muted-foreground">
                  {contracts.length === 0
                    ? 'Você ainda não criou nenhum contrato.'
                    : 'Nenhum contrato corresponde aos filtros.'}
                </p>
                {contracts.length === 0 && availableDrivers.length > 0 && availableVehicles.length > 0 && (
                  <Button onClick={handleOpenAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeiro contrato
                  </Button>
                )}
                {(availableDrivers.length === 0 || availableVehicles.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    {availableDrivers.length === 0 && 'Cadastre motoristas '}
                    {availableDrivers.length === 0 && availableVehicles.length === 0 && 'e '}
                    {availableVehicles.length === 0 && 'adicione veículos disponíveis '}
                    para criar contratos.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Contract Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Contrato</DialogTitle>
              <DialogDescription>
                Crie um novo contrato de locação entre motorista e veículo.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="driver_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motorista</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableDrivers.map(driver => (
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
                  <FormField
                    control={form.control}
                    name="vehicle_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veículo</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const vehicle = vehicles.find(v => v.id === value);
                            if (vehicle) {
                              form.setValue('weekly_price', Number(vehicle.weekly_price));
                              form.setValue('deposit', Number(vehicle.deposit) || 0);
                              form.setValue('km_limit', vehicle.km_limit || undefined);
                              form.setValue('excess_km_fee', Number(vehicle.excess_km_fee) || undefined);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableVehicles.map(vehicle => (
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="weekly_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Semanal (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caução (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="km_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite KM/mês</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ilimitado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="excess_km_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa KM excedente</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="R$/km" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payment_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentDays.map(day => (
                              <SelectItem key={day} value={day}>
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </SelectItem>
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
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condições Adicionais (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Proibido fumar no veículo, manutenção preventiva por conta do locador..."
                          className="resize-none"
                          rows={3}
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
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createContract.isPending}>
                    {createContract.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar Contrato
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Contract Dialog */}
        <Dialog open={!!viewingContract} onOpenChange={(open) => !open && setViewingContract(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
            </DialogHeader>
            {viewingContract && (
              <div className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Motorista</span>
                    <span className="font-medium">{getDriverInfo(viewingContract.driver_id)?.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Veículo</span>
                    <span className="font-medium">
                      {getVehicleInfo(viewingContract.vehicle_id)?.brand} {getVehicleInfo(viewingContract.vehicle_id)?.model}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Início</span>
                    <span>{format(parseISO(viewingContract.start_date), 'dd/MM/yyyy')}</span>
                  </div>
                  {viewingContract.end_date && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Término</span>
                      <span>{format(parseISO(viewingContract.end_date), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Valor Semanal</span>
                    <span className="font-semibold">R$ {Number(viewingContract.weekly_price).toLocaleString('pt-BR')}</span>
                  </div>
                  {viewingContract.deposit && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Caução</span>
                      <span>R$ {Number(viewingContract.deposit).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {viewingContract.km_limit && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Limite KM/mês</span>
                      <span>{viewingContract.km_limit.toLocaleString('pt-BR')} km</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Dia de Pagamento</span>
                    <span className="capitalize">{viewingContract.payment_day}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusLabels[viewingContract.status]?.variant || 'default'}>
                      {statusLabels[viewingContract.status]?.label || viewingContract.status}
                    </Badge>
                  </div>
                  {viewingContract.terms && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block mb-1">Condições</span>
                      <p className="text-sm bg-muted p-2 rounded">{viewingContract.terms}</p>
                    </div>
                  )}
                  {viewingContract.cancellation_reason && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block mb-1">Motivo do Cancelamento</span>
                      <p className="text-sm bg-destructive/10 p-2 rounded text-destructive">{viewingContract.cancellation_reason}</p>
                    </div>
                  )}
                </div>

                {/* Inspections Section */}
                <ContractInspectionsSection
                  contractId={viewingContract.id}
                  vehicleId={viewingContract.vehicle_id}
                  vehicleName={`${getVehicleInfo(viewingContract.vehicle_id)?.brand} ${getVehicleInfo(viewingContract.vehicle_id)?.model}`}
                  onViewInspection={setViewingInspection}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Inspection Details Dialog */}
        <InspectionDetailsDialog
          open={!!viewingInspection}
          onOpenChange={(open) => !open && setViewingInspection(null)}
          inspection={viewingInspection}
          vehicle={viewingInspection ? getVehicleInfo(viewingContract?.vehicle_id || '') : undefined}
          driver={viewingInspection ? getDriverInfo(viewingContract?.driver_id || '') : undefined}
        />

        {/* End Contract Dialog */}
        <AlertDialog open={!!endingContract} onOpenChange={(open) => !open && setEndingContract(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar contrato?</AlertDialogTitle>
              <AlertDialogDescription>
                O contrato será marcado como encerrado na data de hoje. O veículo será liberado para novos contratos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEndContract}>
                {endContract.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Encerrar Contrato
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Contract Dialog */}
        <AlertDialog open={!!cancellingContract} onOpenChange={(open) => {
          if (!open) {
            setCancellingContract(null);
            setCancellationReason('');
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar contrato?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Por favor, informe o motivo do cancelamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Motivo do cancelamento</Label>
              <Textarea
                id="reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelContract}
                disabled={!cancellationReason.trim()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelContract.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancelar Contrato
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
