import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  ArrowRight,
  Wrench
} from 'lucide-react';
import { mockVehicles } from '@/data/mockData';
import { mockMotoristas, mockPayments, mockAlerts, mockMaintenanceRecords } from '@/data/mockDriversPayments';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LocadorDashboard() {
  const locadorId = '1'; // Simulated current user
  
  const myVehicles = mockVehicles.filter(v => v.locadorId === locadorId);
  const myDrivers = mockMotoristas.filter(m => m.locadorId === locadorId);
  const myPayments = mockPayments.filter(p => p.locadorId === locadorId);
  const myAlerts = mockAlerts.filter(a => myVehicles.some(v => v.id === a.vehicleId));
  
  const availableVehicles = myVehicles.filter(v => v.status === 'available').length;
  const rentedVehicles = myVehicles.filter(v => v.status === 'rented').length;
  const maintenanceVehicles = myVehicles.filter(v => v.status === 'maintenance').length;
  
  const pendingPayments = myPayments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const monthlyRevenue = myPayments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const recentMaintenance = mockMaintenanceRecords
    .filter(m => myVehicles.some(v => v.id === m.vehicleId))
    .slice(0, 3);

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
            value={myVehicles.length}
            icon={Car}
            variant="primary"
          />
          <StatsCard
            title="Motoristas Ativos"
            value={myDrivers.length}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Faturamento Mensal"
            value={`R$ ${monthlyRevenue.toLocaleString('pt-BR')}`}
            icon={DollarSign}
            variant="success"
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="Alertas Pendentes"
            value={myAlerts.filter(a => !a.resolved).length}
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
                      <p className="text-2xl font-bold text-success">{availableVehicles}</p>
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
                      <p className="text-2xl font-bold text-primary">{rentedVehicles}</p>
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
                      <p className="text-2xl font-bold text-warning">{maintenanceVehicles}</p>
                      <p className="text-sm text-muted-foreground">Manutenção</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Vehicles */}
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Veículos Recentes</h4>
                {myVehicles.slice(0, 3).map((vehicle) => (
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
                    <Badge variant={vehicle.status}>
                      {vehicle.status === 'available' && 'Disponível'}
                      {vehicle.status === 'rented' && 'Alugado'}
                      {vehicle.status === 'maintenance' && 'Manutenção'}
                    </Badge>
                  </div>
                ))}
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
              {myAlerts.filter(a => !a.resolved).slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className={`mt-0.5 rounded-full p-1.5 ${
                    alert.type === 'revision' ? 'bg-primary/10 text-primary' :
                    alert.type === 'ipva' ? 'bg-warning/10 text-warning' :
                    alert.type === 'insurance' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(alert.dueDate, "dd 'de' MMM", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
              {myAlerts.filter(a => !a.resolved).length === 0 && (
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
              {pendingPayments.slice(0, 3).map((payment) => {
                const driver = mockMotoristas.find(d => d.id === payment.motoristaId);
                const vehicle = mockVehicles.find(v => v.id === payment.vehicleId);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{driver?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle?.brand} {vehicle?.model} • Semana {payment.weekNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {payment.amount}</p>
                      <Badge variant={payment.status === 'overdue' ? 'destructive' : 'warning'}>
                        {payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {pendingPayments.length === 0 && (
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
              {recentMaintenance.map((record) => {
                const vehicle = mockVehicles.find(v => v.id === record.vehicleId);
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
                        <p className="font-medium">{record.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle?.brand} {vehicle?.model}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">-R$ {record.cost}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(record.date, 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
