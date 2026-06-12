import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, ArrowRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { useLocadorContracts } from '@/hooks/useContracts';
import { useAvailableVehicles } from '@/hooks/useVehicles';
import { differenceInDays } from 'date-fns';

export function LocadorInsights() {
  const { data: vehicles = [] } = useLocadorVehicles();
  const { data: contracts = [] } = useLocadorContracts();
  const { data: marketVehicles = [] } = useAvailableVehicles();

  const insights = useMemo(() => {
    const total = vehicles.length;
    const rented = vehicles.filter((v) => v.status === 'rented').length;
    const currentOccupation = total > 0 ? (rented / total) * 100 : 0;

    // Previous week occupation: contracts that were active 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const rentedLastWeek = contracts.filter(
      (c) =>
        c.start_date <= sevenDaysAgoStr &&
        (!c.end_date || c.end_date >= sevenDaysAgoStr) &&
        c.status !== 'canceled',
    ).length;
    const prevOccupation = total > 0 ? (rentedLastWeek / total) * 100 : 0;
    const occupationDelta = currentOccupation - prevOccupation;

    // Price comparison vs marketplace average
    const myAvg =
      vehicles.length > 0
        ? vehicles.reduce((acc, v) => acc + Number(v.weekly_price || 0), 0) / vehicles.length
        : 0;
    const marketAvg =
      marketVehicles.length > 0
        ? marketVehicles.reduce((acc, v) => acc + Number(v.weekly_price || 0), 0) /
          marketVehicles.length
        : 0;
    const priceDelta = myAvg - marketAvg;

    // Idle vehicles (available > 14 days)
    const idleVehicles = vehicles.filter((v) => {
      if (v.status !== 'available') return false;
      const days = differenceInDays(new Date(), new Date(v.created_at));
      return days > 14;
    });

    return {
      currentOccupation,
      occupationDelta,
      myAvg,
      marketAvg,
      priceDelta,
      idleCount: idleVehicles.length,
      hasMarketData: marketVehicles.length > 0 && vehicles.length > 0,
    };
  }, [vehicles, contracts, marketVehicles]);

  const TrendIcon =
    insights.occupationDelta > 0 ? TrendingUp : insights.occupationDelta < 0 ? TrendingDown : Minus;
  const trendClass =
    insights.occupationDelta > 0
      ? 'text-success'
      : insights.occupationDelta < 0
        ? 'text-destructive'
        : 'text-muted-foreground';

  if (vehicles.length === 0) return null;

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
      {/* Ocupação */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardDescription className="text-xs">Ocupação da frota</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {insights.currentOccupation.toFixed(0)}%
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className={`flex items-center gap-1.5 text-xs ${trendClass}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="font-medium">
              {insights.occupationDelta > 0 ? '+' : ''}
              {insights.occupationDelta.toFixed(0)}% vs semana anterior
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Preço vs mercado */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardDescription className="text-xs flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Preço médio
          </CardDescription>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            R$ {insights.myAvg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {insights.hasMarketData ? (
            <>
              <p className="text-xs text-muted-foreground">
                Mercado: R${' '}
                {insights.marketAvg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                /semana
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  insights.priceDelta < 0 ? 'text-warning' : 'text-success'
                }`}
              >
                {insights.priceDelta < 0
                  ? `R$ ${Math.abs(insights.priceDelta).toFixed(0)} abaixo da média`
                  : `R$ ${insights.priceDelta.toFixed(0)} acima da média`}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sem dados de mercado disponíveis</p>
          )}
        </CardContent>
      </Card>

      {/* Veículos parados */}
      <Card className={insights.idleCount > 0 ? 'border-warning/40' : ''}>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardDescription className="text-xs flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Veículos parados
          </CardDescription>
          <CardTitle className="text-2xl sm:text-3xl font-bold">{insights.idleCount}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {insights.idleCount > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Sem contrato há mais de 14 dias. Revise preço ou divulgue mais.
              </p>
              <Link to="/locador/veiculos">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Revisar <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Todos os veículos estão em rotação 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
