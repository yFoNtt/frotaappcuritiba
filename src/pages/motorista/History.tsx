import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  CreditCard, 
  FileText, 
  Wrench,
  Calendar
} from 'lucide-react';
import { motoristaHistorico } from '@/data/mockMotoristaData';

export default function MotoristaHistorico() {
  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'pagamento':
        return <CreditCard className="h-4 w-4" />;
      case 'contrato':
        return <FileText className="h-4 w-4" />;
      case 'manutencao':
        return <Wrench className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'pagamento':
        return <Badge className="bg-green-500/10 text-green-600">Pagamento</Badge>;
      case 'contrato':
        return <Badge className="bg-blue-500/10 text-blue-600">Contrato</Badge>;
      case 'manutencao':
        return <Badge className="bg-orange-500/10 text-orange-600">Manutenção</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'pagamento':
        return 'bg-green-500';
      case 'contrato':
        return 'bg-blue-500';
      case 'manutencao':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <MotoristaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Histórico</h1>
          <p className="text-muted-foreground">Todas as suas atividades e eventos</p>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Linha do Tempo
            </CardTitle>
            <CardDescription>Histórico completo de atividades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0">
              {motoristaHistorico.map((evento, index) => (
                <div key={evento.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {/* Timeline line */}
                  {index < motoristaHistorico.length - 1 && (
                    <div className="absolute left-[19px] top-10 h-full w-0.5 bg-border" />
                  )}
                  
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getTypeColor(evento.tipo)} text-white`}>
                    {getTypeIcon(evento.tipo)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{evento.descricao}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(evento.data).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {evento.valor !== null && evento.valor > 0 && (
                          <span className="font-semibold text-green-600">
                            R$ {evento.valor.toLocaleString('pt-BR')}
                          </span>
                        )}
                        {getTypeBadge(evento.tipo)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {motoristaHistorico.filter(e => e.tipo === 'pagamento').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pagamentos realizados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {motoristaHistorico.filter(e => e.tipo === 'manutencao').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Manutenções</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {motoristaHistorico.filter(e => e.tipo === 'contrato').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Eventos de contrato</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MotoristaLayout>
  );
}
