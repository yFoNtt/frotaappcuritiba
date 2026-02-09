import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Car, 
  Phone, 
  Mail, 
  Link as LinkIcon,
  Unlink,
  Loader2
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { 
  useLocadorDrivers, 
  useCreateDriver, 
  useUpdateDriver, 
  useDeleteDriver,
  useAssignVehicle,
  useUnassignVehicle,
  Driver,
  DriverInsert 
} from '@/hooks/useDrivers';
import { useLocadorVehicles, Vehicle } from '@/hooks/useVehicles';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Validation schema
const driverSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().optional(),
  cnh_number: z.string().min(11, 'CNH deve ter 11 dígitos').max(11, 'CNH deve ter 11 dígitos'),
  cnh_expiry: z.string().refine((date) => {
    const expiryDate = new Date(date);
    return expiryDate > new Date();
  }, 'CNH deve estar válida'),
  vehicle_id: z.string().optional(),
});

type DriverFormData = z.infer<typeof driverSchema>;

export default function LocadorDrivers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<Driver | null>(null);

  const { data: drivers = [], isLoading: driversLoading } = useLocadorDrivers();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles();
  
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const assignVehicle = useAssignVehicle();
  const unassignVehicle = useUnassignVehicle();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cnh_number: '',
      cnh_expiry: '',
      vehicle_id: '',
    },
  });

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.cnh_number.includes(searchTerm)
    );
  }, [drivers, searchTerm]);

  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.status === 'available' && !v.current_driver_id);
  }, [vehicles]);

  const stats = useMemo(() => ({
    total: drivers.length,
    withVehicle: drivers.filter(d => d.vehicle_id).length,
    withoutVehicle: drivers.filter(d => !d.vehicle_id).length,
  }), [drivers]);

  const getVehicleInfo = (vehicleId: string | null): Vehicle | undefined => {
    if (!vehicleId) return undefined;
    return vehicles.find(v => v.id === vehicleId);
  };

  const isCnhExpiringSoon = (dateString: string) => {
    const expiryDate = parseISO(dateString);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  const isCnhExpired = (dateString: string) => {
    const expiryDate = parseISO(dateString);
    return expiryDate < new Date();
  };

  const handleOpenAddDialog = () => {
    form.reset({
      name: '',
      email: '',
      phone: '',
      cnh_number: '',
      cnh_expiry: '',
      vehicle_id: '',
    });
    setEditingDriver(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (driver: Driver) => {
    form.reset({
      name: driver.name,
      email: driver.email,
      phone: driver.phone || '',
      cnh_number: driver.cnh_number,
      cnh_expiry: driver.cnh_expiry,
      vehicle_id: driver.vehicle_id || '',
    });
    setEditingDriver(driver);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (data: DriverFormData) => {
    const driverData: DriverInsert = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      cnh_number: data.cnh_number,
      cnh_expiry: data.cnh_expiry,
      vehicle_id: data.vehicle_id || null,
    };

    if (editingDriver) {
      await updateDriver.mutateAsync({ 
        id: editingDriver.id, 
        updates: driverData 
      });
    } else {
      await createDriver.mutateAsync(driverData);
    }

    setIsAddDialogOpen(false);
    setEditingDriver(null);
    form.reset();
  };

  const handleDelete = async () => {
    if (deletingDriver) {
      await deleteDriver.mutateAsync(deletingDriver.id);
      setDeletingDriver(null);
    }
  };

  const handleAssignVehicle = async (vehicleId: string) => {
    if (assigningDriver) {
      await assignVehicle.mutateAsync({ 
        driverId: assigningDriver.id, 
        vehicleId 
      });
      setAssigningDriver(null);
    }
  };

  const handleUnassignVehicle = async (driver: Driver) => {
    if (driver.vehicle_id) {
      await unassignVehicle.mutateAsync({ 
        driverId: driver.id, 
        vehicleId: driver.vehicle_id 
      });
    }
  };

  if (driversLoading || vehiclesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
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
            <h1 className="text-3xl font-bold tracking-tight">Motoristas</h1>
            <p className="text-muted-foreground">
              Gerencie os motoristas vinculados à sua frota
            </p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Motorista
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total de Motoristas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Car className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withVehicle}</p>
                  <p className="text-sm text-muted-foreground">Com Veículo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withoutVehicle}</p>
                  <p className="text-sm text-muted-foreground">Sem Veículo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou CNH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredDrivers.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorista</TableHead>
                    <TableHead className="hidden md:table-cell">Contato</TableHead>
                    <TableHead className="hidden sm:table-cell">CNH</TableHead>
                    <TableHead className="hidden lg:table-cell">Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => {
                    const vehicle = getVehicleInfo(driver.vehicle_id);
                    const cnhExpiring = isCnhExpiringSoon(driver.cnh_expiry);
                    const cnhExpired = isCnhExpired(driver.cnh_expiry);
                    
                    return (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{driver.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Desde {format(parseISO(driver.created_at), 'MM/yyyy')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {driver.email}
                            </div>
                            {driver.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {driver.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <p className="font-mono text-sm">{driver.cnh_number}</p>
                            <p className={`text-xs ${
                              cnhExpired 
                                ? 'text-destructive font-medium' 
                                : cnhExpiring 
                                  ? 'text-warning font-medium' 
                                  : 'text-muted-foreground'
                            }`}>
                              Venc: {format(parseISO(driver.cnh_expiry), 'dd/MM/yyyy')}
                              {cnhExpired && ' ❌'}
                              {cnhExpiring && !cnhExpired && ' ⚠️'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {vehicle ? (
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{vehicle.brand} {vehicle.model}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.vehicle_id ? 'success' : 'secondary'}>
                            {driver.vehicle_id ? 'Ativo' : 'Sem veículo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {driver.vehicle_id ? (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleUnassignVehicle(driver)}
                                disabled={unassignVehicle.isPending}
                                title="Desvincular veículo"
                              >
                                {unassignVehicle.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Unlink className="h-4 w-4 text-warning" />
                                )}
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setAssigningDriver(driver)}
                                disabled={availableVehicles.length === 0}
                                title={availableVehicles.length === 0 ? 'Nenhum veículo disponível' : 'Vincular veículo'}
                              >
                                <LinkIcon className="h-4 w-4 text-success" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenEditDialog(driver)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingDriver(driver)}
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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhum motorista encontrado</h3>
                <p className="mb-4 text-muted-foreground">
                  {drivers.length === 0
                    ? 'Você ainda não cadastrou nenhum motorista.'
                    : 'Nenhum motorista corresponde à busca.'}
                </p>
                {drivers.length === 0 && (
                  <Button onClick={handleOpenAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar primeiro motorista
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Driver Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingDriver ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}
              </DialogTitle>
              <DialogDescription>
                {editingDriver 
                  ? 'Atualize os dados do motorista.' 
                  : 'Preencha os dados do motorista para vinculá-lo à sua frota.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do motorista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cnh_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da CNH</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00000000000" 
                            maxLength={11}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cnh_expiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validade CNH</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!editingDriver && availableVehicles.length > 0 && (
                  <FormField
                    control={form.control}
                    name="vehicle_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veículo (opcional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um veículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {availableVehicles.map(v => (
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
                )}

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
                    disabled={createDriver.isPending || updateDriver.isPending}
                  >
                    {(createDriver.isPending || updateDriver.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingDriver ? 'Salvar Alterações' : 'Cadastrar Motorista'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Assign Vehicle Dialog */}
        <Dialog open={!!assigningDriver} onOpenChange={(open) => !open && setAssigningDriver(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Veículo</DialogTitle>
              <DialogDescription>
                Selecione um veículo para vincular a {assigningDriver?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {availableVehicles.map(vehicle => (
                <button
                  key={vehicle.id}
                  onClick={() => handleAssignVehicle(vehicle.id)}
                  disabled={assignVehicle.isPending}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {vehicle.images?.[0] ? (
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Car className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.plate} • R$ {Number(vehicle.weekly_price).toLocaleString('pt-BR')}/semana
                    </p>
                  </div>
                  {assignVehicle.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </button>
              ))}
              {availableVehicles.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum veículo disponível para vincular.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingDriver} onOpenChange={(open) => !open && setDeletingDriver(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover motorista?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{deletingDriver?.name}</strong>? 
                {deletingDriver?.vehicle_id && (
                  <> O veículo vinculado será liberado automaticamente.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteDriver.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
