import { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { useLocadorPayments } from '@/hooks/usePayments';
import { useLocadorMaintenances } from '@/hooks/useMaintenances';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Car, DollarSign, Wrench, PieChartIcon } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const chartConfig = {
  receita: {
    label: 'Receita',
    color: 'hsl(var(--primary))',
  },
  custos: {
    label: 'Custos',
    color: 'hsl(var(--destructive))',
  },
  lucro: {
    label: 'Lucro',
    color: 'hsl(var(--chart-2))',
  },
  ocupacao: {
    label: 'Ocupação',
    color: 'hsl(var(--chart-3))',
  },
};

export default function LocadorReports() {
  const { data: vehicles, isLoading: loadingVehicles } = useLocadorVehicles();
  const { data: payments, isLoading: loadingPayments } = useLocadorPayments();
  const { data: maintenances, isLoading: loadingMaintenances } = useLocadorMaintenances();

  const isLoading = loadingVehicles || loadingPayments || loadingMaintenances;

  // Gerar dados dos últimos 6 meses
  const monthlyData = useMemo(() => {
    if (!payments || !maintenances) return [];

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      // Receita do mês (pagamentos pagos)
      const monthPayments = payments.filter(p => {
        if (!p.paid_at) return false;
        const paidDate = parseISO(p.paid_at);
        return isWithinInterval(paidDate, { start, end });
      });
      const receita = monthPayments.reduce((acc, p) => acc + Number(p.amount), 0);

      // Custos do mês (manutenções)
      const monthMaintenances = maintenances.filter(m => {
        const performedDate = parseISO(m.performed_at);
        return isWithinInterval(performedDate, { start, end });
      });
      const custos = monthMaintenances.reduce((acc, m) => acc + Number(m.cost || 0), 0);

      months.push({
        month: format(date, 'MMM', { locale: ptBR }),
        monthFull: format(date, 'MMMM yyyy', { locale: ptBR }),
        receita,
        custos,
        lucro: receita - custos,
      });
    }

    return months;
  }, [payments, maintenances]);

  // Taxa de ocupação da frota
  const occupancyData = useMemo(() => {
    if (!vehicles) return { rate: 0, rented: 0, available: 0, maintenance: 0 };

    const rented = vehicles.filter(v => v.status === 'rented').length;
    const available = vehicles.filter(v => v.status === 'available').length;
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const total = vehicles.length;

    return {
      rate: total > 0 ? Math.round((rented / total) * 100) : 0,
      rented,
      available,
      maintenance,
      total,
    };
  }, [vehicles]);

  // Dados para gráfico de pizza de status
  const statusPieData = useMemo(() => {
    if (!vehicles) return [];

    return [
      { name: 'Alugados', value: occupancyData.rented, fill: 'hsl(var(--primary))' },
      { name: 'Disponíveis', value: occupancyData.available, fill: 'hsl(var(--chart-2))' },
      { name: 'Manutenção', value: occupancyData.maintenance, fill: 'hsl(var(--chart-4))' },
    ].filter(d => d.value > 0);
  }, [vehicles, occupancyData]);

  // Comparativo por veículo
  const vehicleComparison = useMemo(() => {
    if (!vehicles || !payments || !maintenances) return [];

    return vehicles.slice(0, 5).map(vehicle => {
      const vehiclePayments = payments.filter(p => p.vehicle_id === vehicle.id && p.status === 'paid');
      const vehicleMaintenances = maintenances.filter(m => m.vehicle_id === vehicle.id);

      const receita = vehiclePayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const custos = vehicleMaintenances.reduce((acc, m) => acc + Number(m.cost || 0), 0);

      return {
        name: `${vehicle.brand} ${vehicle.model}`.substring(0, 15),
        plate: vehicle.plate,
        receita,
        custos,
        lucro: receita - custos,
      };
    });
  }, [vehicles, payments, maintenances]);

  // Custos por tipo de manutenção
  const maintenanceCostsByType = useMemo(() => {
    if (!maintenances) return [];

    const byType: Record<string, number> = {};
    maintenances.forEach(m => {
      const type = m.type || 'Outros';
      byType[type] = (byType[type] || 0) + Number(m.cost || 0);
    });

    return Object.entries(byType)
      .map(([name, value], index) => ({
        name,
        value,
        fill: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [maintenances]);

  // Totais
  const totals = useMemo(() => {
    const totalReceita = monthlyData.reduce((acc, m) => acc + m.receita, 0);
    const totalCustos = monthlyData.reduce((acc, m) => acc + m.custos, 0);
    const totalLucro = totalReceita - totalCustos;
    const lastMonth = monthlyData[monthlyData.length - 1] || { receita: 0, custos: 0, lucro: 0 };
    const prevMonth = monthlyData[monthlyData.length - 2] || { receita: 0, custos: 0, lucro: 0 };

    const receitaGrowth = prevMonth.receita > 0 
      ? ((lastMonth.receita - prevMonth.receita) / prevMonth.receita) * 100 
      : 0;

    return {
      totalReceita,
      totalCustos,
      totalLucro,
      receitaGrowth,
      lastMonthReceita: lastMonth.receita,
      lastMonthCustos: lastMonth.custos,
    };
  }, [monthlyData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada da sua frota</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Análise detalhada da sua frota</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total (6 meses)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totals.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {totals.receitaGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={totals.receitaGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {totals.receitaGrowth.toFixed(1)}%
              </span>
              vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Custos Total (6 meses)</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totals.totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground">
              Manutenções e reparos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {totals.totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground">
              Receita - Custos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyData.rate}%</div>
            <div className="text-xs text-muted-foreground">
              {occupancyData.rented} de {occupancyData.total} veículos alugados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Receita vs Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Receita vs Custos</CardTitle>
            <CardDescription>Evolução nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Receita"
                />
                <Area
                  type="monotone"
                  dataKey="custos"
                  stackId="2"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.6}
                  name="Custos"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Lucro Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Lucro Mensal</CardTitle>
            <CardDescription>Receita menos custos por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                  name="Lucro"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Status da Frota */}
        <Card>
          <CardHeader>
            <CardTitle>Status da Frota</CardTitle>
            <CardDescription>Distribuição atual dos veículos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Custos por Tipo de Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle>Custos por Tipo de Manutenção</CardTitle>
            <CardDescription>Distribuição dos gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={maintenanceCostsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: R$ ${value.toLocaleString('pt-BR')}`}
                >
                  {maintenanceCostsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo por Veículo */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comparativo por Veículo</CardTitle>
          <CardDescription>Receita, custos e lucro dos principais veículos</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px]">
            <BarChart data={vehicleComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <YAxis type="category" dataKey="name" className="text-xs" width={120} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="custos" name="Custos" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="lucro" name="Lucro" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
