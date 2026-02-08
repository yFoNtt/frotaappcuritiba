import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building2, 
  Car, 
  FileText,
  TrendingUp,
  ArrowRight,
  Activity
} from 'lucide-react';
import { useAdminStats, useAdminVehicles, useAdminUsers, useAdminMonthlyData } from '@/hooks/useAdminData';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useAdminVehicles();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: monthlyData = [], isLoading: monthlyLoading } = useAdminMonthlyData();

  const isLoading = statsLoading || vehiclesLoading || usersLoading || monthlyLoading;

  const recentUsers = users.slice(0, 5);
  const recentVehicles = vehicles.slice(0, 4);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48 mt-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[400px] lg:col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const occupancyRate = stats && stats.totalVehicles > 0 
    ? Math.round((stats.rentedVehicles / stats.totalVehicles) * 100) 
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visão geral da plataforma FrotaApp
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Locadores Ativos"
            value={stats?.totalLocadores || 0}
            icon={Building2}
            variant="success"
          />
          <StatsCard
            title="Veículos Cadastrados"
            value={stats?.totalVehicles || 0}
            icon={Car}
            variant="default"
          />
          <StatsCard
            title="Contratos Ativos"
            value={stats?.activeContracts || 0}
            icon={FileText}
            variant="success"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Growth Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Crescimento da Plataforma
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Evolução de usuários e veículos nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="h-[200px] sm:h-[300px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} width={30} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalUsers" 
                        stroke="hsl(217, 91%, 50%)" 
                        fillOpacity={1} 
                        fill="url(#colorUsers)" 
                        name="Usuários"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalVehicles" 
                        stroke="hsl(142, 76%, 36%)" 
                        fillOpacity={1} 
                        fill="url(#colorVehicles)" 
                        name="Veículos"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    Nenhum dado disponível ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Resumo Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="rounded-lg border p-2.5 sm:p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Veículos Disponíveis</span>
                  <span className="text-xl sm:text-2xl font-bold text-success">{stats?.availableVehicles || 0}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">de {stats?.totalVehicles || 0} veículos</p>
              </div>
              <div className="rounded-lg border p-2.5 sm:p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Motoristas</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">{stats?.totalDrivers || 0}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">cadastrados na plataforma</p>
              </div>
              <div className="rounded-lg border p-2.5 sm:p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Taxa de Ocupação</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">{occupancyRate}%</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">veículos alugados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users and Vehicles */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-lg">Usuários Recentes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Últimos cadastros na plataforma</CardDescription>
              </div>
              <Link to="/admin/usuarios">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0 sm:pt-0">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-semibold shrink-0 ${
                        user.role === 'locador' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.role === 'locador' ? 'L' : user.role === 'admin' ? 'A' : 'M'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{user.id.slice(0, 8)}...</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {format(parseISO(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={user.role === 'locador' ? 'default' : user.role === 'admin' ? 'destructive' : 'secondary'}
                      className="text-[10px] sm:text-xs shrink-0"
                    >
                      {user.role === 'locador' ? 'Locador' : user.role === 'admin' ? 'Admin' : 'Motorista'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">Nenhum usuário cadastrado ainda</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Vehicles */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-lg">Veículos Recentes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Últimos veículos cadastrados</CardDescription>
              </div>
              <Link to="/admin/veiculos">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0 sm:pt-0">
              {recentVehicles.length > 0 ? (
                recentVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Car className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {vehicle.city}/{vehicle.state}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        vehicle.status === 'available' ? 'success' :
                        vehicle.status === 'rented' ? 'default' : 'warning'
                      }
                      className="text-[10px] sm:text-xs shrink-0"
                    >
                      {vehicle.status === 'available' && 'Disponível'}
                      {vehicle.status === 'rented' && 'Alugado'}
                      {vehicle.status === 'maintenance' && 'Manutenção'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">Nenhum veículo cadastrado ainda</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}