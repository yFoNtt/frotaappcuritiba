import { useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Users, 
  Car, 
  FileText,
  Activity
} from 'lucide-react';
import { useAdminStats, useAdminVehicles, useAdminMonthlyData } from '@/hooks/useAdminData';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AdminMetrics() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useAdminVehicles();
  const { data: monthlyData = [], isLoading: monthlyLoading } = useAdminMonthlyData();

  const isLoading = statsLoading || vehiclesLoading || monthlyLoading;

  const vehicleStatusData = useMemo(() => {
    const available = vehicles.filter(v => v.status === 'available').length;
    const rented = vehicles.filter(v => v.status === 'rented').length;
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length;

    return [
      { name: 'Disponíveis', value: available, color: 'hsl(142, 76%, 36%)' },
      { name: 'Alugados', value: rented, color: 'hsl(217, 91%, 50%)' },
      { name: 'Manutenção', value: maintenance, color: 'hsl(38, 92%, 50%)' },
    ];
  }, [vehicles]);

  const occupancyRate = stats && stats.totalVehicles > 0 
    ? Math.round((stats.rentedVehicles / stats.totalVehicles) * 100) 
    : 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho da plataforma
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                  <p className="text-2xl font-bold text-primary">{occupancyRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Veículos</p>
                  <p className="text-2xl font-bold">{stats?.totalVehicles || 0}</p>
                </div>
                <Car className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                  <p className="text-2xl font-bold text-success">{stats?.activeContracts || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Evolução da Plataforma
              </CardTitle>
              <CardDescription>Crescimento de usuários e veículos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
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
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
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
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Nenhum dado disponível ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Status dos Veículos
              </CardTitle>
              <CardDescription>Distribuição por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {vehicles.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">Nenhum veículo cadastrado</div>
                )}
              </div>
              {vehicles.length > 0 && (
                <div className="flex justify-center gap-6 mt-4">
                  {vehicleStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Cadastros Mensais
              </CardTitle>
              <CardDescription>Novos usuários e veículos por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="users" fill="hsl(217, 91%, 50%)" name="Novos usuários" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="vehicles" fill="hsl(142, 76%, 36%)" name="Novos veículos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Nenhum dado disponível ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resumo da Plataforma
              </CardTitle>
              <CardDescription>Métricas gerais do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total de Locadores</span>
                  <span className="text-2xl font-bold text-primary">{stats?.totalLocadores || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">empresas cadastradas</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Motoristas Cadastrados</span>
                  <span className="text-2xl font-bold">{stats?.totalDrivers || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">motoristas na plataforma</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contratos</span>
                  <span className="text-2xl font-bold">{stats?.totalContracts || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.activeContracts || 0} ativos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}