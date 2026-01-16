import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { motoristaVehicle, motoristaPagamentos, motoristaStats } from '@/data/mockMotoristaData';

export default function MotoristaDashboard() {
  const proximoPagamento = motoristaPagamentos.find(p => p.status === 'pendente' || p.status === 'atrasado');
  const pagamentosAtrasados = motoristaPagamentos.filter(p => p.status === 'atrasado').length;

  return (
    <MotoristaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Olá, Motorista!</h1>
          <p className="text-muted-foreground">Gerencie seu veículo e pagamentos</p>
        </div>

        {/* Alert for overdue payments */}
        {pagamentosAtrasados > 0 && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive">
                <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  Você tem {pagamentosAtrasados} pagamento(s) atrasado(s)
                </p>
                <p className="text-sm text-muted-foreground">
                  Regularize sua situação para evitar problemas com o contrato.
                </p>
              </div>
              <Button variant="destructive" size="sm" asChild>
                <Link to="/motorista/pagamentos">Pagar agora</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {motoristaStats.totalPago.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">Pagamentos em dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                R$ {motoristaStats.pendente.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasado</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {motoristaStats.atrasado.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">Pagamentos em atraso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dias Restantes</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{motoristaStats.diasRestantesContrato}</div>
              <p className="text-xs text-muted-foreground">Até fim do contrato</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vehicle Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Meu Veículo
                  </CardTitle>
                  <CardDescription>Detalhes do veículo alugado</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/motorista/veiculo">
                    Ver detalhes
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <img
                  src={motoristaVehicle.imagem}
                  alt={`${motoristaVehicle.marca} ${motoristaVehicle.modelo}`}
                  className="h-24 w-32 rounded-lg object-cover"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold">
                      {motoristaVehicle.marca} {motoristaVehicle.modelo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {motoristaVehicle.ano} • {motoristaVehicle.cor} • {motoristaVehicle.placa}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{motoristaVehicle.combustivel}</Badge>
                    <Badge className="bg-green-500/10 text-green-600">
                      {motoristaVehicle.status}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Locador:</span>{' '}
                    {motoristaVehicle.locador.nome}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Payment Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Próximo Pagamento
                  </CardTitle>
                  <CardDescription>Seu pagamento semanal</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/motorista/pagamentos">
                    Ver todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {proximoPagamento ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{proximoPagamento.semana}</p>
                      <p className="text-sm text-muted-foreground">{proximoPagamento.periodo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        R$ {proximoPagamento.valor.toLocaleString('pt-BR')}
                      </p>
                      <Badge 
                        variant={proximoPagamento.status === 'atrasado' ? 'destructive' : 'secondary'}
                      >
                        {proximoPagamento.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full">Realizar Pagamento</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="mb-2 h-12 w-12 text-green-500" />
                  <p className="font-medium">Tudo em dia!</p>
                  <p className="text-sm text-muted-foreground">
                    Você não tem pagamentos pendentes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contract Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Contrato</CardTitle>
            <CardDescription>Detalhes do seu contrato de locação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Início do Contrato</p>
                <p className="text-lg font-semibold">
                  {new Date(motoristaVehicle.contrato.inicio).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Fim do Contrato</p>
                <p className="text-lg font-semibold">
                  {new Date(motoristaVehicle.contrato.fim).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Valor Semanal</p>
                <p className="text-lg font-semibold">
                  R$ {motoristaVehicle.contrato.valorSemanal.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Dia de Vencimento</p>
                <p className="text-lg font-semibold">{motoristaVehicle.contrato.diaVencimento}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MotoristaLayout>
  );
}
