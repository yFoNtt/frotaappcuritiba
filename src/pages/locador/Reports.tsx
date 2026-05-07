import { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { useLocadorPayments } from '@/hooks/usePayments';
import { useLocadorMaintenances } from '@/hooks/useMaintenances';
import { useLocadorDrivers } from '@/hooks/useDrivers';
import { useReportExport } from '@/hooks/useReportExport';
import { useReportFilters } from '@/hooks/useReportFilters';
import { ReportFilters } from '@/components/reports/ReportFilters';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, LineChart, Line,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInCalendarMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Car, DollarSign, Wrench, FileDown, FileSpreadsheet } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const chartConfig = {
  receita: { label: 'Receita', color: 'hsl(var(--primary))' },
  custos: { label: 'Custos', color: 'hsl(var(--destructive))' },
  lucro: { label: 'Lucro', color: 'hsl(var(--chart-2))' },
  ocupacao: { label: 'Ocupação', color: 'hsl(var(--chart-3))' },
};

export default function LocadorReports() {
  const { data: vehicles, isLoading: loadingVehicles } = useLocadorVehicles();
  const { data: payments, isLoading: loadingPayments } = useLocadorPayments();
  const { data: maintenances, isLoading: loadingMaintenances } = useLocadorMaintenances();
  const { data: drivers = [] } = useLocadorDrivers();
  const { exportToPDF, exportToExcel } = useReportExport();
  const { filters, setFilters, range } = useReportFilters();

  const isLoading = loadingVehicles || loadingPayments || loadingMaintenances;

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      if (filters.vehicleId !== 'all' && p.vehicle_id !== filters.vehicleId) return false;
      if (filters.driverId !== 'all' && p.driver_id !== filters.driverId) return false;
      if (range.start && range.end) {
        const ref = p.paid_at ? parseISO(p.paid_at) : parseISO(p.due_date);
        if (!isWithinInterval(ref, { start: range.start, end: range.end })) return false;
      }
      return true;
    });
  }, [payments, filters, range]);

  const filteredMaintenances = useMemo(() => {
    if (!maintenances) return [];
    return maintenances.filter((m) => {
      if (filters.vehicleId !== 'all' && m.vehicle_id !== filters.vehicleId) return false;
      if (range.start && range.end) {
        const d = parseISO(m.performed_at);
        if (!isWithinInterval(d, { start: range.start, end: range.end })) return false;
      }
      return true;
    });
  }, [maintenances, filters, range]);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    if (filters.vehicleId === 'all') return vehicles;
    return vehicles.filter((v) => v.id === filters.vehicleId);
  }, [vehicles, filters]);

  // Determinar quantidade de meses no gráfico
  const monthlyData = useMemo(() => {
    if (!filteredPayments && !filteredMaintenances) return [];
    const today = new Date();
    let monthsCount = 6;
    let endRef = today;
    if (range.start && range.end) {
      monthsCount = Math.min(24, Math.max(1, differenceInCalendarMonths(range.end, range.start) + 1));
      endRef = range.end;
    }
    const months: Array<{ month: string; monthFull: string; receita: number; custos: number; lucro: number }> = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = subMonths(endRef, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthPayments = filteredPayments.filter((p) => {
        if (!p.paid_at) return false;
        return isWithinInterval(parseISO(p.paid_at), { start, end });
      });
      const receita = monthPayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const monthMaintenances = filteredMaintenances.filter((m) =>
        isWithinInterval(parseISO(m.performed_at), { start, end })
      );
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
  }, [filteredPayments, filteredMaintenances, range]);

  const occupancyData = useMemo(() => {
    const rented = filteredVehicles.filter((v) => v.status === 'rented').length;
    const available = filteredVehicles.filter((v) => v.status === 'available').length;
    const maintenance = filteredVehicles.filter((v) => v.status === 'maintenance').length;
    const total = filteredVehicles.length;
    return {
      rate: total > 0 ? Math.round((rented / total) * 100) : 0,
      rented, available, maintenance, total,
    };
  }, [filteredVehicles]);

  const statusPieData = useMemo(
    () =>
      [
        { name: 'Alugados', value: occupancyData.rented, fill: 'hsl(var(--primary))' },
        { name: 'Disponíveis', value: occupancyData.available, fill: 'hsl(var(--chart-2))' },
        { name: 'Manutenção', value: occupancyData.maintenance, fill: 'hsl(var(--chart-4))' },
      ].filter((d) => d.value > 0),
    [occupancyData]
  );

  const vehicleComparison = useMemo(() => {
    return filteredVehicles.slice(0, 5).map((vehicle) => {
      const vp = filteredPayments.filter((p) => p.vehicle_id === vehicle.id && p.status === 'paid');
      const vm = filteredMaintenances.filter((m) => m.vehicle_id === vehicle.id);
      const receita = vp.reduce((a, p) => a + Number(p.amount), 0);
      const custos = vm.reduce((a, m) => a + Number(m.cost || 0), 0);
      return {
        name: `${vehicle.brand} ${vehicle.model}`.substring(0, 15),
        plate: vehicle.plate,
        receita, custos, lucro: receita - custos,
      };
    });
  }, [filteredVehicles, filteredPayments, filteredMaintenances]);

  const maintenanceCostsByType = useMemo(() => {
    const byType: Record<string, number> = {};
    filteredMaintenances.forEach((m) => {
      const type = m.type || 'Outros';
      byType[type] = (byType[type] || 0) + Number(m.cost || 0);
    });
    return Object.entries(byType)
      .map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredMaintenances]);

  const totals = useMemo(() => {
    const totalReceita = monthlyData.reduce((acc, m) => acc + m.receita, 0);
    const totalCustos = monthlyData.reduce((acc, m) => acc + m.custos, 0);
    const totalLucro = totalReceita - totalCustos;
    const lastMonth = monthlyData[monthlyData.length - 1] || { receita: 0, custos: 0, lucro: 0 };
    const prevMonth = monthlyData[monthlyData.length - 2] || { receita: 0, custos: 0, lucro: 0 };
    const receitaGrowth = prevMonth.receita > 0
      ? ((lastMonth.receita - prevMonth.receita) / prevMonth.receita) * 100
      : 0;
    return { totalReceita, totalCustos, totalLucro, receitaGrowth };
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
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-32" /></CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const handleExportPDF = () => exportToPDF({ monthlyData, vehicleComparison, occupancyData, maintenanceCostsByType, totals });
  const handleExportExcel = () => exportToExcel({ monthlyData, vehicleComparison, occupancyData, maintenanceCostsByType, totals });

  const periodLabel = range.start && range.end
    ? `${format(range.start, 'dd/MM/yyyy')} – ${format(range.end, 'dd/MM/yyyy')}`
    : 'Todo o período';

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada da sua frota — {periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button onClick={handleExportPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <ReportFilters
          filters={filters}
          onChange={setFilters}
          vehicles={(vehicles ?? []).map((v) => ({
            value: v.id,
            label: `${v.brand} ${v.model} - ${v.plate}`,
          }))}
          drivers={drivers.map((d) => ({ value: d.id, label: d.name }))}
          resultCount={filteredPayments.length + filteredMaintenances.length}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totals.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {totals.receitaGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={totals.receitaGrowth >= 0 ? 'text-success' : 'text-destructive'}>
                {totals.receitaGrowth.toFixed(1)}%
              </span>
              vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Custos Total</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totals.totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground">Manutenções e reparos</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.totalLucro >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {totals.totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground">Receita - Custos</div>
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
      <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita vs Custos</CardTitle>
            <CardDescription>Evolução no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] sm:h-[300px]">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Area type="monotone" dataKey="receita" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Receita" />
                <Area type="monotone" dataKey="custos" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Custos" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lucro Mensal</CardTitle>
            <CardDescription>Receita menos custos por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] sm:h-[300px]">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Line type="monotone" dataKey="lucro" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }} name="Lucro" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status da Frota</CardTitle>
            <CardDescription>Distribuição atual dos veículos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] sm:h-[300px]">
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusPieData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custos por Tipo de Manutenção</CardTitle>
            <CardDescription>Distribuição dos gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] sm:h-[300px]">
              <PieChart>
                <Pie data={maintenanceCostsByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: R$ ${value.toLocaleString('pt-BR')}`}>
                  {maintenanceCostsByType.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comparativo por Veículo</CardTitle>
          <CardDescription>Receita, custos e lucro dos principais veículos</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[350px]">
            <BarChart data={vehicleComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} />
              <YAxis type="category" dataKey="name" className="text-xs" width={120} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
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
