import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Car, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  ArrowRight,
  Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { useLocadorDrivers } from '@/hooks/useDrivers';
import { useLocadorPayments } from '@/hooks/usePayments';
import { useLocadorMaintenances, MAINTENANCE_TYPES } from '@/hooks/useMaintenances';
import { useMemo } from 'react';

export default function LocadorDashboard() {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles();
  const { data: drivers = [], isLoading: driversLoading } = useLocadorDrivers();
  const { data: payments = [], isLoading: paymentsLoading } = useLocadorPayments();
  const { data: maintenances = [], isLoading: maintenancesLoading } = useLocadorMaintenances();

  const isLoading = vehiclesLoading || driversLoading || paymentsLoading || maintenancesLoading;

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const availableVehicles = vehicles.filter(v => v.status === 'available').length;
    const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    
    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    const overduePayments = pendingPayments.filter(p => p.due_date < todayStr);
    
    const monthlyRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((acc, p) => acc + Number(p.amount), 0);

    // CNH alerts - drivers with expiring CNH
    const cnhAlerts = drivers.filter(d => {
      const expiryDate = new Date(d.cnh_expiry);
      const daysUntilExpiry = differenceInDays(expiryDate, today);
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length;

    // Upcoming maintenances
    const upcomingMaintenances = maintenances.filter(m => 
      m.status === 'scheduled' || 
      (m.next_maintenance_date && m.next_maintenance_date >= todayStr)
    ).length;

    const alertsCount = cnhAlerts + upcomingMaintenances + overduePayments.length;

    return {
      totalVehicles: vehicles.length,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      activeDrivers,
      pendingPayments,
      overduePayments,
      monthlyRevenue,
      alertsCount,
    };
  }, [vehicles, drivers, payments, maintenances]);

  // Recent vehicles
  const recentVehicles = useMemo(() => 
    vehicles.slice(0, 3), 
    [vehicles]
  );

  // Recent maintenances
  const recentMaintenances = useMemo(() => 
    maintenances
      .filter(m => m.status === 'completed')
      .slice(0, 3), 
    [maintenances]
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está um resumo da sua frota.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Veículos"
            value={stats.totalVehicles}
            icon={Car}
            variant="primary"
          />
          <StatsCard
            title="Motoristas Ativos"
            value={stats.activeDrivers}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Faturamento Total"
            value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`}
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title="Alertas Pendentes"
            value={stats.alertsCount}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Fleet Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Status da Frota</CardTitle>
                <CardDescription>Visão geral dos seus veículos</CardDescription>
              </div>
              <Link to="/locador/veiculos">
                <Button variant="outline" size="sm">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-success/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-success/10 p-2">
                      <Car className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{stats.availableVehicles}</p>
                      <p className="text-sm text-muted-foreground">Disponíveis</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{stats.rentedVehicles}</p>
                      <p className="text-sm text-muted-foreground">Alugados</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border bg-warning/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-warning/10 p-2">
                      <Wrench className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">{stats.maintenanceVehicles}</p>
                      <p className="text-sm text-muted-foreground">Manutenção</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Vehicles */}
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Veículos Recentes</h4>
                {recentVehicles.length > 0 ? (
                  recentVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Car className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                        </div>
                      </div>
                      <Badge variant={vehicle.status as 'available' | 'rented' | 'maintenance'}>
                        {vehicle.status === 'available' && 'Disponível'}
                        {vehicle.status === 'rented' && 'Alugado'}
                        {vehicle.status === 'maintenance' && 'Manutenção'}
                        {vehicle.status === 'inactive' && 'Inativo'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Nenhum veículo cadastrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alertas</CardTitle>
                <CardDescription>Pendências importantes</CardDescription>
              </div>
              <Link to="/locador/alertas">
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Overdue payments alerts */}
              {stats.overduePayments.slice(0, 2).map((payment) => {
                const driver = drivers.find(d => d.id === payment.driver_id);
                return (
                  <div
                    key={payment.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="mt-0.5 rounded-full p-1.5 bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Pagamento atrasado</p>
                      <p className="text-xs text-muted-foreground">
                        {driver?.name} - R$ {Number(payment.amount).toLocaleString('pt-BR')}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Venceu em {format(new Date(payment.due_date), "dd 'de' MMM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* CNH expiry alerts */}
              {drivers
                .filter(d => {
                  const expiryDate = new Date(d.cnh_expiry);
                  const daysUntilExpiry = differenceInDays(expiryDate, new Date());
                  return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
                })
                .slice(0, 2)
                .map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="mt-0.5 rounded-full p-1.5 bg-warning/10 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">CNH expirando</p>
                      <p className="text-xs text-muted-foreground">{driver.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(driver.cnh_expiry), "dd 'de' MMM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}

              {stats.alertsCount === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum alerta pendente 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payments and Maintenance */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pagamentos Pendentes</CardTitle>
                <CardDescription>Cobranças a receber</CardDescription>
              </div>
              <Link to="/locador/pagamentos">
                <Button variant="outline" size="sm">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.pendingPayments.slice(0, 3).map((payment) => {
                const driver = drivers.find(d => d.id === payment.driver_id);
                const vehicle = vehicles.find(v => v.id === payment.vehicle_id);
                const isOverdue = payment.due_date < new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{driver?.name || 'Motorista'}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo'} • {format(new Date(payment.reference_week), 'dd/MM')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {Number(payment.amount).toLocaleString('pt-BR')}</p>
                      <Badge variant={isOverdue ? 'destructive' : 'warning'}>
                        {isOverdue ? 'Atrasado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {stats.pendingPayments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Todos os pagamentos em dia! ✅
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Maintenance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manutenções Recentes</CardTitle>
                <CardDescription>Histórico de serviços</CardDescription>
              </div>
              <Link to="/locador/manutencao">
                <Button variant="outline" size="sm">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMaintenances.length > 0 ? (
                recentMaintenances.map((record) => {
                  const vehicle = vehicles.find(v => v.id === record.vehicle_id);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-muted p-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {MAINTENANCE_TYPES[record.type as keyof typeof MAINTENANCE_TYPES] || record.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          -R$ {Number(record.cost).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.performed_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhuma manutenção registrada
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
