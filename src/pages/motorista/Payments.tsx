import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Download,
  Eye
} from 'lucide-react';
import { motoristaPagamentos, motoristaStats } from '@/data/mockMotoristaData';

export default function MotoristaPagamentos() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-500/10 text-green-600">Pago</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'atrasado':
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'pendente':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'atrasado':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <MotoristaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <p className="text-muted-foreground">Gerencie seus pagamentos semanais</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {motoristaStats.totalPago.toLocaleString('pt-BR')}
              </div>
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
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription>Todos os seus pagamentos semanais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {motoristaPagamentos.map((pagamento) => (
                <div
                  key={pagamento.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(pagamento.status)}
                    <div>
                      <p className="font-medium">{pagamento.semana}</p>
                      <p className="text-sm text-muted-foreground">{pagamento.periodo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        R$ {pagamento.valor.toLocaleString('pt-BR')}
                      </p>
                      {pagamento.dataPagamento && (
                        <p className="text-xs text-muted-foreground">
                          Pago em {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    
                    {getStatusBadge(pagamento.status)}

                    <div className="flex gap-2">
                      {pagamento.status === 'pago' && pagamento.comprovante && (
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {(pagamento.status === 'pendente' || pagamento.status === 'atrasado') && (
                        <Button size="sm">Pagar</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Info */}
        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento</CardTitle>
            <CardDescription>Opções disponíveis para realizar seu pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium">PIX</p>
                <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium">Cartão de Crédito</p>
                <p className="text-sm text-muted-foreground">Até 3x sem juros</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium">Boleto</p>
                <p className="text-sm text-muted-foreground">Vencimento em 3 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MotoristaLayout>
  );
}
