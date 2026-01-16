import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Car, 
  DollarSign,
  TrendingUp,
  UserCheck,
  ArrowRight,
  Activity
} from 'lucide-react';
import { mockPlatformStats, mockAdminUsers, mockMonthlyData } from '@/data/mockAdminData';
import { mockVehicles, mockLocadores } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
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
  const recentUsers = mockAdminUsers.slice(0, 5);
  const recentVehicles = mockVehicles.slice(0, 4);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma FrotaApp
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Usuários"
            value={mockPlatformStats.totalUsers}
            icon={Users}
            variant="primary"
            trend={{ value: mockPlatformStats.growthRate, positive: true }}
          />
          <StatsCard
            title="Locadores Ativos"
            value={mockPlatformStats.totalLocadores}
            icon={Building2}
            variant="success"
          />
          <StatsCard
            title="Veículos Cadastrados"
            value={mockPlatformStats.totalVehicles}
            icon={Car}
            variant="default"
          />
          <StatsCard
            title="Receita Mensal"
            value={`R$ ${mockPlatformStats.monthlyRevenue.toLocaleString('pt-BR')}`}
            icon={DollarSign}
            variant="success"
            trend={{ value: 12, positive: true }}
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Growth Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Crescimento da Plataforma
              </CardTitle>
              <CardDescription>Evolução de usuários e veículos nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockMonthlyData}>
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
                      dataKey="users" 
                      stroke="hsl(217, 91%, 50%)" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                      name="Usuários"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vehicles" 
                      stroke="hsl(142, 76%, 36%)" 
                      fillOpacity={1} 
                      fill="url(#colorVehicles)" 
                      name="Veículos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Anúncios Ativos</span>
                  <span className="text-2xl font-bold text-primary">{mockPlatformStats.activeAds}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">de {mockPlatformStats.totalVehicles} veículos</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Motoristas</span>
                  <span className="text-2xl font-bold text-success">{mockPlatformStats.totalMotoristas}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">cadastrados na plataforma</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Crescimento</span>
                  <span className="text-2xl font-bold text-success">+{mockPlatformStats.growthRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">comparado ao mês anterior</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users and Vehicles */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários Recentes</CardTitle>
                <CardDescription>Últimos cadastros na plataforma</CardDescription>
              </div>
              <Link to="/admin/usuarios">
                <Button variant="outline" size="sm">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      user.role === 'locador' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'locador' ? 'default' : 'secondary'}>
                      {user.role === 'locador' ? 'Locador' : 'Motorista'}
                    </Badge>
                    <Badge variant={
                      user.status === 'active' ? 'success' :
                      user.status === 'blocked' ? 'destructive' : 'warning'
                    }>
                      {user.status === 'active' ? 'Ativo' :
                       user.status === 'blocked' ? 'Bloqueado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Vehicles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Veículos Recentes</CardTitle>
                <CardDescription>Últimos veículos cadastrados</CardDescription>
              </div>
              <Link to="/admin/veiculos">
                <Button variant="outline" size="sm">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentVehicles.map((vehicle) => {
                const locador = mockLocadores.find(l => l.id === vehicle.locadorId);
                return (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-muted-foreground">
                          {locador?.companyName || locador?.name} • {vehicle.city}/{vehicle.state}
                        </p>
                      </div>
                    </div>
                    <Badge variant={vehicle.status}>
                      {vehicle.status === 'available' && 'Disponível'}
                      {vehicle.status === 'rented' && 'Alugado'}
                      {vehicle.status === 'maintenance' && 'Manutenção'}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
