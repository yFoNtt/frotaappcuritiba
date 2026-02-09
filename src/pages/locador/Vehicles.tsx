import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash2, Eye, Car, ChevronDown, Loader2 } from 'lucide-react';
import { useLocadorVehicles, Vehicle } from '@/hooks/useVehicles';
import { VehicleForm } from '@/components/vehicles/VehicleForm';
import { DeleteVehicleDialog } from '@/components/vehicles/DeleteVehicleDialog';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
  inactive: 'Inativo',
};

const statusOptions = [
  { value: 'available', label: 'Disponível', variant: 'available' as const },
  { value: 'rented', label: 'Alugado', variant: 'rented' as const },
  { value: 'maintenance', label: 'Manutenção', variant: 'maintenance' as const },
];

export default function LocadorVehicles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useLocadorVehicles();

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'available').length,
    rented: vehicles.filter((v) => v.status === 'rented').length,
    maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
  }), [vehicles]);

  const handleStatusChange = async (vehicleId: string, newStatus: string) => {
    setUpdatingStatusId(vehicleId);
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: newStatus })
        .eq('id', vehicleId);

      if (error) throw error;

      toast.success(`Status alterado para "${statusLabels[newStatus]}"`);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status. Tente novamente.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingVehicle(null);
    }
  };

  const handleAddNew = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
            <p className="text-muted-foreground">Gerencie sua frota de veículos</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Veículo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Car className="h-5 w-5 text-primary" />
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
                  <Car className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.available}</p>
                  <p className="text-sm text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rented}</p>
                  <p className="text-sm text-muted-foreground">Alugados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Car className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.maintenance}</p>
                  <p className="text-sm text-muted-foreground">Manutenção</p>
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
                  placeholder="Buscar por marca, modelo ou placa..."
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
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="rented">Alugado</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredVehicles.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead className="hidden sm:table-cell">Placa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Localização</TableHead>
                    <TableHead className="hidden sm:table-cell">Valor/Semana</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
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
                          <div>
                            <p className="font-medium">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.year} • {vehicle.color}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono hidden sm:table-cell">{vehicle.plate}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-auto p-0 hover:bg-transparent"
                              disabled={updatingStatusId === vehicle.id}
                            >
                              {updatingStatusId === vehicle.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Badge
                                  variant={
                                    vehicle.status === 'available'
                                      ? 'available'
                                      : vehicle.status === 'rented'
                                      ? 'rented'
                                      : 'maintenance'
                                  }
                                  className="cursor-pointer"
                                >
                                  {statusLabels[vehicle.status] || vehicle.status}
                                  <ChevronDown className="ml-1 h-3 w-3" />
                                </Badge>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {statusOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleStatusChange(vehicle.id, option.value)}
                                disabled={vehicle.status === option.value}
                                className="cursor-pointer"
                              >
                                <Badge variant={option.variant} className="mr-2">
                                  {option.label}
                                </Badge>
                                {vehicle.status === option.value && (
                                  <span className="ml-auto text-xs text-muted-foreground">Atual</span>
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {vehicle.city}, {vehicle.state}
                      </TableCell>
                      <TableCell className="font-semibold hidden sm:table-cell">
                        R$ {Number(vehicle.weekly_price).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/veiculos/${vehicle.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(vehicle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(vehicle)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Car className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhum veículo encontrado</h3>
                <p className="mb-4 text-muted-foreground">
                  {vehicles.length === 0
                    ? 'Você ainda não cadastrou nenhum veículo.'
                    : 'Nenhum veículo corresponde aos filtros selecionados.'}
                </p>
                {vehicles.length === 0 && (
                  <Button onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar primeiro veículo
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Form Dialog */}
        <VehicleForm 
          open={isFormOpen} 
          onOpenChange={handleFormClose} 
          vehicle={editingVehicle}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteVehicleDialog
          vehicle={deletingVehicle}
          open={!!deletingVehicle}
          onOpenChange={(open) => !open && setDeletingVehicle(null)}
        />
      </div>
    </DashboardLayout>
  );
}
