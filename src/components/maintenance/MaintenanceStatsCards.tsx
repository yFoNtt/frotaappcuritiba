import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Wrench, Clock, Calendar, TrendingUp } from 'lucide-react';

interface MaintenanceStats {
  totalCost: number;
  totalRecords: number;
  scheduledCount: number;
  upcomingCount: number;
  completedThisMonth: number;
  averageCost: number;
}

interface MaintenanceStatsCardsProps {
  stats: MaintenanceStats;
}

export function MaintenanceStatsCards({ stats }: MaintenanceStatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
      <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(stats.totalCost)}</p>
              <p className="text-xs text-muted-foreground">Gasto Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(stats.averageCost)}</p>
              <p className="text-xs text-muted-foreground">Custo Médio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-muted p-2.5">
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalRecords}</p>
              <p className="text-xs text-muted-foreground">Total Registros</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success/10 p-2.5">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.completedThisMonth}</p>
              <p className="text-xs text-muted-foreground">Este Mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-warning/10 p-2.5">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.scheduledCount}</p>
              <p className="text-xs text-muted-foreground">Agendadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent p-2.5">
              <Calendar className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Próx. 30 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
