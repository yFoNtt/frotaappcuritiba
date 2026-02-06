import { useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Car, 
  FileText,
  Activity,
  Building2,
  UserCheck,
  Gauge,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap
} from 'lucide-react';
import { useAdminStats, useAdminVehicles, useAdminMonthlyData, useAdminContracts } from '@/hooks/useAdminData';
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
  Legend,
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

function MetricCard({ title, value, subtitle, icon, trend, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card border',
    primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
    success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
    warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
    destructive: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20',
  };

  const iconVariantStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    destructive: 'bg-destructive/15 text-destructive',
  };

  return (
    <Card className={`${variantStyles[variant]} transition-all hover:shadow-md`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-medium ${trend.positive ? 'text-success' : 'text-destructive'}`}>
                {trend.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {trend.positive ? '+' : ''}{trend.value}% vs. mês anterior
              </div>
            )}
          </div>
          <div className={`rounded-xl p-3 ${iconVariantStyles[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminMetrics() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useAdminVehicles();
  const { data: monthlyData = [], isLoading: monthlyLoading } = useAdminMonthlyData();
  const { data: contracts = [], isLoading: contractsLoading } = useAdminContracts();

  const isLoading = statsLoading || vehiclesLoading || monthlyLoading || contractsLoading;

  const vehicleStatusData = useMemo(() => {
    const available = vehicles.filter(v => v.status === 'available').length;
    const rented = vehicles.filter(v => v.status === 'rented').length;
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length;

    return [
      { name: 'Disponíveis', value: available, color: 'hsl(var(--success))' },
      { name: 'Alugados', value: rented, color: 'hsl(var(--primary))' },
      { name: 'Manutenção', value: maintenance, color: 'hsl(var(--warning))' },
    ];
  }, [vehicles]);

  const occupancyRate = stats && stats.totalVehicles > 0 
    ? Math.round((stats.rentedVehicles / stats.totalVehicles) * 100) 
    : 0;

  const contractConversionRate = stats && stats.totalDrivers > 0
    ? Math.round((stats.activeContracts / stats.totalDrivers) * 100)
    : 0;

  const vehicleUtilization = stats && stats.totalVehicles > 0
    ? Math.round(((stats.rentedVehicles + vehicles.filter(v => v.status === 'maintenance').length) / stats.totalVehicles) * 100)
    : 0;

  const contractStatusData = useMemo(() => {
    const active = contracts.filter(c => c.status === 'active').length;
    const completed = contracts.filter(c => c.status === 'completed').length;
    const cancelled = contracts.filter(c => c.status === 'cancelled').length;

    return [
      { name: 'Ativos', value: active, color: 'hsl(var(--success))' },
      { name: 'Finalizados', value: completed, color: 'hsl(var(--muted-foreground))' },
      { name: 'Cancelados', value: cancelled, color: 'hsl(var(--destructive))' },
    ];
  }, [contracts]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
            <p className="text-muted-foreground">
              Análise detalhada do desempenho da plataforma
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-2 px-3 py-1.5">
            <Activity className="h-4 w-4 text-success animate-pulse" />
            Atualizado em tempo real
          </Badge>
        </div>

        {/* Primary KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Taxa de Ocupação"
            value={`${occupancyRate}%`}
            subtitle="veículos alugados"
            icon={<Gauge className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.totalLocadores || 0} locadores • ${stats?.totalMotoristas || 0} motoristas`}
            icon={<Users className="h-6 w-6" />}
            variant="default"
          />
          <MetricCard
            title="Frota Total"
            value={stats?.totalVehicles || 0}
            subtitle={`${stats?.availableVehicles || 0} disponíveis`}
            icon={<Car className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Contratos Ativos"
            value={stats?.activeContracts || 0}
            subtitle={`de ${stats?.totalContracts || 0} totais`}
            icon={<FileText className="h-6 w-6" />}
            variant="warning"
          />
        </div>

        {/* Secondary KPIs - Progress Bars */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Ocupação da Frota</span>
                </div>
                <span className="text-sm font-bold">{occupancyRate}%</span>
              </div>
              <Progress value={occupancyRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.rentedVehicles || 0} de {stats?.totalVehicles || 0} veículos em uso
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Conversão de Motoristas</span>
                </div>
                <span className="text-sm font-bold">{contractConversionRate}%</span>
              </div>
              <Progress value={contractConversionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.activeContracts || 0} contratos para {stats?.totalDrivers || 0} motoristas
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Utilização Total</span>
                </div>
                <span className="text-sm font-bold">{vehicleUtilization}%</span>
              </div>
              <Progress value={vehicleUtilization} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Veículos em uso ou manutenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Growth Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Evolução da Plataforma
                  </CardTitle>
                  <CardDescription>Crescimento acumulado nos últimos 6 meses</CardDescription>
                </div>
                <Badge variant="secondary" className="hidden sm:flex">Acumulado</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                      <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} />
                      <YAxis className="text-xs" axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area 
                        type="monotone" 
                        dataKey="totalUsers" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorUsers)" 
                        name="Usuários"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalVehicles" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2}
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
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Car className="h-5 w-5 text-primary" />
                    Distribuição da Frota
                  </CardTitle>
                  <CardDescription>Status atual dos veículos</CardDescription>
                </div>
                <Badge variant="secondary" className="hidden sm:flex">{vehicles.length} veículos</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center justify-center">
                {vehicles.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
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
                        formatter={(value: number) => [`${value} veículos`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">Nenhum veículo cadastrado</div>
                )}
              </div>
              {vehicles.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {vehicleStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                      <div 
                        className="h-2.5 w-2.5 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">({item.value})</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Monthly Registration */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Cadastros Mensais
                  </CardTitle>
                  <CardDescription>Novos registros por mês</CardDescription>
                </div>
                <Badge variant="secondary" className="hidden sm:flex">Últimos 6 meses</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                      <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} />
                      <YAxis className="text-xs" axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="users" fill="hsl(var(--primary))" name="Usuários" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="vehicles" fill="hsl(var(--success))" name="Veículos" radius={[6, 6, 0, 0]} maxBarSize={40} />
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

          {/* Platform Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Resumo
              </CardTitle>
              <CardDescription>Visão geral da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Locadores</span>
                  </div>
                  <span className="text-xl font-bold">{stats?.totalLocadores || 0}</span>
                </div>
              </div>

              <div className="rounded-xl border bg-gradient-to-br from-success/5 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-success/10 p-2">
                      <UserCheck className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-sm font-medium">Motoristas</span>
                  </div>
                  <span className="text-xl font-bold">{stats?.totalDrivers || 0}</span>
                </div>
              </div>

              <div className="rounded-xl border bg-gradient-to-br from-warning/5 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-warning/10 p-2">
                      <FileText className="h-4 w-4 text-warning" />
                    </div>
                    <span className="text-sm font-medium">Contratos</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">{stats?.totalContracts || 0}</span>
                    <p className="text-xs text-muted-foreground">{stats?.activeContracts || 0} ativos</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-gradient-to-br from-muted/50 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">Frota</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">{stats?.totalVehicles || 0}</span>
                    <p className="text-xs text-muted-foreground">{stats?.availableVehicles || 0} disponíveis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Status Distribution */}
        {contracts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Distribuição de Contratos
              </CardTitle>
              <CardDescription>Status de todos os contratos na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 items-center justify-center py-4">
                {contractStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/30">
                    <div 
                      className="h-4 w-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
