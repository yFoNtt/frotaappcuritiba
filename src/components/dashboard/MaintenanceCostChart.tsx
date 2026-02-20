import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Maintenance {
  id: string;
  cost: number | null;
  performed_at: string;
  status: string;
}

interface MaintenanceCostChartProps {
  maintenances: Maintenance[];
}

export function MaintenanceCostChart({ maintenances }: MaintenanceCostChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const completed = maintenances.filter(
        m => m.status === 'completed' && isWithinInterval(parseISO(m.performed_at), { start, end })
      );

      const totalCost = completed.reduce((sum, m) => sum + Number(m.cost || 0), 0);
      const count = completed.length;

      months.push({
        name: format(monthDate, 'MMM', { locale: ptBR }),
        custo: totalCost,
        quantidade: count,
      });
    }

    return months;
  }, [maintenances]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Custos de Manutenção</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Evolução dos gastos nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'custo' ? formatCurrency(value) : `${value} serviços`
                }
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Line
                type="monotone"
                dataKey="custo"
                name="Custo Total"
                stroke="hsl(var(--destructive))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'hsl(var(--destructive))' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
