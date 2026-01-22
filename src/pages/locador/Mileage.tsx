import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Gauge,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  Car,
  User,
  Calendar,
  DollarSign,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocadorDrivers } from '@/hooks/useDrivers';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { useLocadorContracts } from '@/hooks/useContracts';
import { 
  useLocadorMileageRecords, 
  useDriversMileageStats, 
  useCreateMileageRecord,
  type MileageInsert 
} from '@/hooks/useMileage';

export default function LocadorMileage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MileageInsert>>({});

  const { data: drivers = [], isLoading: driversLoading } = useLocadorDrivers();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles();
  const { data: contracts = [] } = useLocadorContracts();
  const { data: mileageRecords = [], isLoading: recordsLoading } = useLocadorMileageRecords();
  const { data: mileageStats = [], isLoading: statsLoading } = useDriversMileageStats();
  const createMileage = useCreateMileageRecord();

  const isLoading = driversLoading || vehiclesLoading || recordsLoading || statsLoading;

  // Filter records
  const filteredRecords = useMemo(() => {
    return mileageRecords.filter(record => {
      const driver = drivers.find(d => d.id === record.driver_id);
      const vehicle = vehicles.find(v => v.id === record.vehicle_id);
      
      const matchesSearch = !searchTerm || 
        driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.plate.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDriver = selectedDriver === 'all' || record.driver_id === selectedDriver;
      
      return matchesSearch && matchesDriver;
    });
  }, [mileageRecords, drivers, vehicles, searchTerm, selectedDriver]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalExcess = mileageStats.reduce((acc, s) => acc + s.excessKm, 0);
    const totalExcessCost = mileageStats.reduce((acc, s) => acc + s.excessCost, 0);
    const driversWithExcess = mileageStats.filter(s => s.excessKm > 0).length;
    const totalKmDriven = mileageStats.reduce((acc, s) => acc + s.totalKmDriven, 0);
    
    return { totalExcess, totalExcessCost, driversWithExcess, totalKmDriven };
  }, [mileageStats]);

  // Active drivers with vehicles
  const activeDriversWithVehicles = useMemo(() => {
    return drivers.filter(d => d.status === 'active' && d.vehicle_id);
  }, [drivers]);

  const handleSubmit = async () => {
    if (!formData.driver_id || !formData.vehicle_id || !formData.km_reading) {
      return;
    }

    // Find active contract for this driver
    const contract = contracts.find(c => 
      c.driver_id === formData.driver_id && c.status === 'active'
    );

    await createMileage.mutateAsync({
      driver_id: formData.driver_id,
      vehicle_id: formData.vehicle_id,
      contract_id: contract?.id || null,
      km_reading: formData.km_reading,
      recorded_at: formData.recorded_at || new Date().toISOString().split('T')[0],
      notes: formData.notes,
    });

    setFormData({});
    setIsAddDialogOpen(false);
  };

  const handleDriverSelect = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver?.vehicle_id) {
      setFormData(prev => ({
        ...prev,
        driver_id: driverId,
        vehicle_id: driver.vehicle_id!,
      }));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-5 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
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
            <h1 className="text-3xl font-bold tracking-tight">Controle de Quilometragem</h1>
            <p className="text-muted-foreground">
              Registre e acompanhe a quilometragem dos veículos por motorista
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar KM
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Quilometragem</DialogTitle>
                <DialogDescription>
                  Registre a quilometragem atual do veículo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Motorista</Label>
                  <Select 
                    value={formData.driver_id} 
                    onValueChange={handleDriverSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDriversWithVehicles.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.vehicle_id && (
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Veículo vinculado:</p>
                    <p className="font-medium">
                      {vehicles.find(v => v.id === formData.vehicle_id)?.brand}{' '}
                      {vehicles.find(v => v.id === formData.vehicle_id)?.model} -{' '}
                      {vehicles.find(v => v.id === formData.vehicle_id)?.plate}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Quilometragem Atual (km)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 45000"
                    value={formData.km_reading || ''}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      km_reading: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data do Registro</Label>
                  <Input
                    type="date"
                    value={formData.recorded_at || new Date().toISOString().split('T')[0]}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      recorded_at: e.target.value 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    placeholder="Adicione observações se necessário..."
                    value={formData.notes || ''}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.driver_id || !formData.km_reading || createMileage.isPending}
                >
                  {createMileage.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KM Total Rodado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.totalKmDriven.toLocaleString('pt-BR')} km
              </div>
              <p className="text-xs text-muted-foreground">
                Soma de todos os motoristas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KM Excedente</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {summaryStats.totalExcess.toLocaleString('pt-BR')} km
              </div>
              <p className="text-xs text-muted-foreground">
                Acima do limite contratual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Excedente</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {summaryStats.totalExcessCost.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Total a cobrar por excedente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Excedente</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.driversWithExcess}
              </div>
              <p className="text-xs text-muted-foreground">
                Motoristas acima do limite
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Driver Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Quilometragem por Motorista
            </CardTitle>
            <CardDescription>
              Controle de KM rodado e excedente de cada motorista
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mileageStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead className="text-right">KM Inicial</TableHead>
                    <TableHead className="text-right">KM Atual</TableHead>
                    <TableHead className="text-right">KM Rodado</TableHead>
                    <TableHead className="text-right">Limite</TableHead>
                    <TableHead className="text-right">Excedente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mileageStats.map(stat => (
                    <TableRow key={stat.driverId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {stat.driverName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {stat.vehicleName ? (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            {stat.vehicleName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.initialKm.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.currentKm.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {stat.totalKmDriven.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.kmLimit ? stat.kmLimit.toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.excessKm > 0 ? (
                          <Badge variant="destructive">
                            +{stat.excessKm.toLocaleString('pt-BR')} km
                          </Badge>
                        ) : (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.excessCost > 0 ? (
                          <span className="font-semibold text-destructive">
                            R$ {stat.excessCost.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Gauge className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhum motorista ativo</h3>
                <p className="text-muted-foreground">
                  Vincule motoristas a veículos para iniciar o controle de KM
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mileage Records History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Registros
                </CardTitle>
                <CardDescription>
                  Todos os registros de quilometragem
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead className="text-right">KM Registrado</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(record => {
                    const driver = drivers.find(d => d.id === record.driver_id);
                    const vehicle = vehicles.find(v => v.id === record.vehicle_id);
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(record.recorded_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>{driver?.name || '-'}</TableCell>
                        <TableCell>
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {record.km_reading.toLocaleString('pt-BR')} km
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.notes || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground">
                  Comece registrando a quilometragem dos veículos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
