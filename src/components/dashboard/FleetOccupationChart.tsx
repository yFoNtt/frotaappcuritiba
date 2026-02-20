import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Vehicle {
  id: string;
  status: string;
}

interface FleetOccupationChartProps {
  vehicles: Vehicle[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponíveis', color: 'hsl(var(--success))' },
  rented: { label: 'Alugados', color: 'hsl(var(--primary))' },
  maintenance: { label: 'Manutenção', color: 'hsl(var(--warning))' },
  inactive: { label: 'Inativos', color: 'hsl(var(--muted-foreground))' },
};

export function FleetOccupationChart({ vehicles }: FleetOccupationChartProps) {
  const { chartData, occupationRate } = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      counts[v.status] = (counts[v.status] || 0) + 1;
    });

    const data = Object.entries(counts).map(([status, value]) => ({
      name: STATUS_MAP[status]?.label || status,
      value,
      color: STATUS_MAP[status]?.color || 'hsl(var(--muted-foreground))',
    }));

    const rented = counts['rented'] || 0;
    const rate = vehicles.length > 0 ? Math.round((rented / vehicles.length) * 100) : 0;

    return { chartData: data, occupationRate: rate };
  }, [vehicles]);

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Ocupação da Frota</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Distribuição dos veículos por status</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <p className="text-center text-sm text-muted-foreground py-12">Nenhum veículo cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Ocupação da Frota</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Taxa de ocupação: <span className="font-semibold text-primary">{occupationRate}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value} veículo${value > 1 ? 's' : ''}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
