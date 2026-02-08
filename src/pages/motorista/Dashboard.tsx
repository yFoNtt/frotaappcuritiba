import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Car, 
  CreditCard, 
  AlertTriangle, 
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMotoristaFullData, useMotoristaStats } from '@/hooks/useMotoristaData';
import { useMotoristaPayments } from '@/hooks/usePayments';
import { useMemo } from 'react';

export default function MotoristaDashboard() {
  const { driver, vehicle, contract, isLoading: dataLoading } = useMotoristaFullData();
  const { data: stats, isLoading: statsLoading } = useMotoristaStats();
  const { data: payments = [], isLoading: paymentsLoading } = useMotoristaPayments();

  const isLoading = dataLoading || statsLoading || paymentsLoading;

  // Find next pending payment
  const proximoPagamento = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return payments
      .filter(p => p.status === 'pending')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .find(p => p.due_date >= today || p.due_date < today);
  }, [payments]);

  const pagamentosAtrasados = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return payments.filter(p => p.status === 'pending' && p.due_date < today).length;
  }, [payments]);

  if (isLoading) {
    return (
      <MotoristaLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </MotoristaLayout>
    );
  }

  // Check if motorista has no data yet
  if (!driver) {
    return (
      <MotoristaLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Olá, Motorista!</h1>
            <p className="text-muted-foreground">Bem-vindo ao seu painel</p>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Car className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Nenhum veículo vinculado</h3>
              <p className="mt-2 text-muted-foreground">
                Você ainda não está vinculado a nenhum veículo ou locador.
                Entre em contato com seu locador para iniciar.
              </p>
            </CardContent>
          </Card>
        </div>
      </MotoristaLayout>
    );
  }

  return (
    <MotoristaLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Olá, {driver.name.split(' ')[0]}!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie seu veículo e pagamentos</p>
        </div>

        {/* Alert for overdue payments */}
        {pagamentosAtrasados > 0 && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-3 sm:py-4 px-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-destructive shrink-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-destructive">
                    Você tem {pagamentosAtrasados} pagamento(s) atrasado(s)
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Regularize sua situação para evitar problemas com o contrato.
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm" asChild className="w-full sm:w-auto">
                <Link to="/motorista/pagamentos">Pagar agora</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                R$ {(stats?.totalPago || 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Pagamentos em dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                R$ {(stats?.pendente || 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Atrasado</CardTitle>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-destructive">
                R$ {(stats?.atrasado || 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Pagamentos em atraso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Dias Restantes</CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats?.diasRestantesContrato || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Até fim do contrato</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Vehicle Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                    Meu Veículo
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Detalhes do veículo alugado</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link to="/motorista/veiculo">
                    Ver detalhes
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {vehicle ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="h-20 sm:h-24 w-full sm:w-32 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {vehicle.images?.[0] ? (
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="h-20 sm:h-24 w-full sm:w-32 rounded-lg object-cover"
                      />
                    ) : (
                      <Car className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {vehicle.year} • {vehicle.color} • {vehicle.plate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{vehicle.fuel_type}</Badge>
                      <Badge className="bg-green-500/10 text-green-600 text-xs">
                        Em uso
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                  <Car className="mb-2 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  <p className="font-medium text-sm">Nenhum veículo vinculado</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Entre em contato com seu locador
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Payment Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Próximo Pagamento
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Seu pagamento semanal</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link to="/motorista/pagamentos">
                    Ver todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {proximoPagamento ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4 gap-2">
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        Semana de {new Date(proximoPagamento.reference_week).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Vencimento: {new Date(proximoPagamento.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2 sm:flex-col sm:gap-1">
                      <p className="text-lg sm:text-xl font-bold">
                        R$ {Number(proximoPagamento.amount).toLocaleString('pt-BR')}
                      </p>
                      <Badge 
                        variant={
                          proximoPagamento.due_date < new Date().toISOString().split('T')[0] 
                            ? 'destructive' 
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {proximoPagamento.due_date < new Date().toISOString().split('T')[0] 
                          ? 'Atrasado' 
                          : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full">Realizar Pagamento</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                  <CheckCircle2 className="mb-2 h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
                  <p className="font-medium text-sm">Tudo em dia!</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Você não tem pagamentos pendentes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contract Info */}
        {contract && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Informações do Contrato</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Detalhes do seu contrato de locação</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3 sm:p-4">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Início do Contrato</p>
                  <p className="text-sm sm:text-lg font-semibold">
                    {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="rounded-lg border p-3 sm:p-4">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Fim do Contrato</p>
                  <p className="text-sm sm:text-lg font-semibold">
                    {contract.end_date 
                      ? new Date(contract.end_date).toLocaleDateString('pt-BR')
                      : 'Indeterminado'}
                  </p>
                </div>
                <div className="rounded-lg border p-3 sm:p-4">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Valor Semanal</p>
                  <p className="text-sm sm:text-lg font-semibold">
                    R$ {Number(contract.weekly_price).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="rounded-lg border p-3 sm:p-4">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Dia de Vencimento</p>
                  <p className="text-sm sm:text-lg font-semibold capitalize">{contract.payment_day}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MotoristaLayout>
  );
}
