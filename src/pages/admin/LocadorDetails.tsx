import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Building2, 
  Car, 
  Users, 
  FileText, 
  DollarSign,
  Calendar,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  useLocadorDetails, 
  useLocadorVehicles, 
  useLocadorDrivers, 
  useLocadorContracts,
  useLocadorPayments,
  useLocadorStats
} from '@/hooks/useAdminLocadorDetails';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/20',
  rented: 'bg-primary/10 text-primary border-primary/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  inactive: 'bg-muted text-muted-foreground',
  active: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
  inactive: 'Inativo',
  active: 'Ativo',
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
};

export default function LocadorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: locador, isLoading: locadorLoading } = useLocadorDetails(id || '');
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles(id || '');
  const { data: drivers = [], isLoading: driversLoading } = useLocadorDrivers(id || '');
  const { data: contracts = [], isLoading: contractsLoading } = useLocadorContracts(id || '');
  const { data: payments = [], isLoading: paymentsLoading } = useLocadorPayments(id || '');
  const stats = useLocadorStats(id || '');

  const isLoading = locadorLoading || vehiclesLoading || driversLoading || contractsLoading || paymentsLoading;

  // Create lookup maps for display
  const vehicleMap = useMemo(() => {
    const map = new Map<string, string>();
    vehicles.forEach(v => map.set(v.id, `${v.brand} ${v.model} - ${v.plate}`));
    return map;
  }, [vehicles]);

  const driverMap = useMemo(() => {
    const map = new Map<string, string>();
    drivers.forEach(d => map.set(d.id, d.name));
    return map;
  }, [drivers]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  if (!locador) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Locador não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O locador solicitado não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/admin/locadores')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Locadores
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin/locadores')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
              {locador.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{locador.email}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Cadastro: {format(parseISO(locador.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                {locador.last_sign_in_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Último acesso: {format(parseISO(locador.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                  <p className="text-sm text-muted-foreground">
                    Veículos ({stats.availableVehicles} disponíveis)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                  <p className="text-sm text-muted-foreground">
                    Motoristas ({stats.activeDrivers} ativos)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalContracts}</p>
                  <p className="text-sm text-muted-foreground">
                    Contratos ({stats.activeContracts} ativos)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs with Data Tables */}
        <Tabs defaultValue="vehicles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vehicles" className="gap-2">
              <Car className="h-4 w-4" />
              Veículos ({vehicles.length})
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2">
              <Users className="h-4 w-4" />
              Motoristas ({drivers.length})
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2">
              <FileText className="h-4 w-4" />
              Contratos ({contracts.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Pagamentos ({payments.length})
            </TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Veículos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vehicles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Cidade/UF</TableHead>
                        <TableHead>KM Atual</TableHead>
                        <TableHead>Preço Semanal</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                              <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.color}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{vehicle.plate}</TableCell>
                          <TableCell>{vehicle.city}/{vehicle.state}</TableCell>
                          <TableCell>{vehicle.current_km?.toLocaleString('pt-BR') || '—'} km</TableCell>
                          <TableCell>R$ {Number(vehicle.weekly_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[vehicle.status] || ''}>
                              {statusLabels[vehicle.status] || vehicle.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Car className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum veículo cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Motoristas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {drivers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>CNH</TableHead>
                        <TableHead>Validade CNH</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                {driver.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{driver.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {driver.email}
                              </p>
                              {driver.phone && (
                                <p className="text-muted-foreground">{driver.phone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{driver.cnh_number}</TableCell>
                          <TableCell>{format(parseISO(driver.cnh_expiry), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {driver.vehicle_id ? vehicleMap.get(driver.vehicle_id) || '—' : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[driver.status] || ''}>
                              {statusLabels[driver.status] || driver.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum motorista cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contratos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {contracts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Término</TableHead>
                        <TableHead>Valor Semanal</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>{vehicleMap.get(contract.vehicle_id) || '—'}</TableCell>
                          <TableCell>{driverMap.get(contract.driver_id) || '—'}</TableCell>
                          <TableCell>{format(parseISO(contract.start_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {contract.end_date 
                              ? format(parseISO(contract.end_date), 'dd/MM/yyyy') 
                              : 'Indeterminado'}
                          </TableCell>
                          <TableCell>
                            R$ {Number(contract.weekly_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[contract.status] || ''}>
                              {statusLabels[contract.status] || contract.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum contrato cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pagamentos
                  {stats.pendingPayments > 0 && (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 ml-2">
                      {stats.pendingPayments} pendente(s)
                    </Badge>
                  )}
                  {stats.overduePayments > 0 && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 ml-2">
                      {stats.overduePayments} atrasado(s)
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Semana Ref.</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Pago em</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, 20).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{driverMap.get(payment.driver_id) || '—'}</TableCell>
                          <TableCell>{format(parseISO(payment.reference_week), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{format(parseISO(payment.due_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-medium">
                            R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {payment.paid_at 
                              ? format(parseISO(payment.paid_at), 'dd/MM/yyyy') 
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[payment.status] || ''}>
                              {statusLabels[payment.status] || payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
