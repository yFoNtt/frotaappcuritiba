import { useMemo } from 'react';
import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMotoristaPayments, Payment } from '@/hooks/usePayments';

const STATUS_CONFIG = {
  pending: { label: 'Pendente', variant: 'warning' as const, icon: Clock, color: 'text-warning' },
  paid: { label: 'Pago', variant: 'success' as const, icon: CheckCircle2, color: 'text-success' },
  overdue: { label: 'Atrasado', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-destructive' },
  cancelled: { label: 'Cancelado', variant: 'secondary' as const, icon: XCircle, color: 'text-muted-foreground' },
};

export default function MotoristaPagamentos() {
  const { data: payments = [], isLoading } = useMotoristaPayments();

  // Process payments to mark overdue
  const processedPayments = useMemo(() => {
    const today = new Date();
    return payments.map(p => {
      if (p.status === 'pending' && isBefore(parseISO(p.due_date), today)) {
        return { ...p, status: 'overdue' as const };
      }
      return p;
    });
  }, [payments]);

  const stats = useMemo(() => {
    const paid = processedPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = processedPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const overdue = processedPayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    return { paid, pending, overdue };
  }, [processedPayments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <MotoristaLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </MotoristaLayout>
    );
  }

  return (
    <MotoristaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <p className="text-muted-foreground">Acompanhe seus pagamentos semanais</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(stats.paid)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(stats.pending)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(stats.overdue)}
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
            {processedPayments.length > 0 ? (
              <div className="space-y-4">
                {processedPayments.map((payment) => {
                  const statusConfig = STATUS_CONFIG[payment.status];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                        <div>
                          <p className="font-medium">
                            Semana de {format(parseISO(payment.reference_week), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {format(parseISO(payment.due_date), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(Number(payment.amount))}
                          </p>
                          {payment.paid_at && (
                            <p className="text-xs text-muted-foreground">
                              Pago em {format(parseISO(payment.paid_at), 'dd/MM/yyyy')}
                            </p>
                          )}
                          {payment.payment_method && (
                            <p className="text-xs text-muted-foreground capitalize">
                              via {payment.payment_method}
                            </p>
                          )}
                        </div>
                        
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhum pagamento encontrado</h3>
                <p className="text-muted-foreground">
                  Você ainda não possui cobranças registradas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Pagamento</CardTitle>
            <CardDescription>Como funcionam os pagamentos semanais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                • O pagamento semanal é referente ao aluguel do veículo e deve ser efetuado até a data de vencimento.
              </p>
              <p>
                • Pagamentos em atraso podem gerar multas e suspensão do contrato.
              </p>
              <p>
                • Entre em contato com seu locador para informações sobre formas de pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MotoristaLayout>
  );
}
