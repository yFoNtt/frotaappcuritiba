import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Car,
  Shield,
  FileText,
  Wrench
} from 'lucide-react';
import { mockVehicles } from '@/data/mockData';
import { mockAlerts } from '@/data/mockDriversPayments';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function LocadorAlerts() {
  const locadorId = '1';
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const myVehicles = mockVehicles.filter(v => v.locadorId === locadorId);
  const myAlerts = mockAlerts.filter(a => 
    myVehicles.some(v => v.id === a.vehicleId)
  );

  const filteredAlerts = myAlerts.filter(alert => {
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && !alert.resolved) ||
      (statusFilter === 'resolved' && alert.resolved);
    
    return matchesType && matchesStatus;
  });

  const pendingCount = myAlerts.filter(a => !a.resolved).length;
  const resolvedCount = myAlerts.filter(a => a.resolved).length;

  const handleResolve = (alertId: string) => {
    toast.success('Alerta marcado como resolvido!');
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      revision: Wrench,
      ipva: FileText,
      insurance: Shield,
      maintenance: Wrench,
    };
    return icons[type] || AlertTriangle;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      revision: 'Revisão',
      ipva: 'IPVA',
      insurance: 'Seguro',
      maintenance: 'Manutenção',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      revision: 'bg-primary/10 text-primary',
      ipva: 'bg-warning/10 text-warning',
      insurance: 'bg-destructive/10 text-destructive',
      maintenance: 'bg-muted text-muted-foreground',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const getUrgencyLevel = (dueDate: Date) => {
    const daysRemaining = differenceInDays(dueDate, new Date());
    if (daysRemaining < 0) return { label: 'Vencido', variant: 'destructive' as const };
    if (daysRemaining <= 7) return { label: 'Urgente', variant: 'destructive' as const };
    if (daysRemaining <= 30) return { label: 'Atenção', variant: 'warning' as const };
    return { label: 'Normal', variant: 'default' as const };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="text-muted-foreground">
            Acompanhe revisões, IPVA, seguros e manutenções preventivas
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Alertas Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resolvedCount}</p>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="revision">Revisão</SelectItem>
                  <SelectItem value="ipva">IPVA</SelectItem>
                  <SelectItem value="insurance">Seguro</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredAlerts.map((alert) => {
            const vehicle = mockVehicles.find(v => v.id === alert.vehicleId);
            const Icon = getTypeIcon(alert.type);
            const urgency = getUrgencyLevel(alert.dueDate);
            const daysRemaining = differenceInDays(alert.dueDate, new Date());
            
            return (
              <Card 
                key={alert.id} 
                className={`transition-smooth ${alert.resolved ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${getTypeColor(alert.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                        {!alert.resolved && (
                          <Badge variant={urgency.variant}>
                            {urgency.label}
                          </Badge>
                        )}
                        {alert.resolved && (
                          <Badge variant="success">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Car className="h-4 w-4" />
                          {vehicle?.brand} {vehicle?.model}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(alert.dueDate, "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                      </div>

                      {!alert.resolved && (
                        <div className="flex items-center justify-between pt-2">
                          <p className={`text-sm font-medium ${
                            daysRemaining < 0 ? 'text-destructive' :
                            daysRemaining <= 7 ? 'text-destructive' :
                            daysRemaining <= 30 ? 'text-warning' :
                            'text-muted-foreground'
                          }`}>
                            {daysRemaining < 0 
                              ? `Vencido há ${Math.abs(daysRemaining)} dias`
                              : daysRemaining === 0 
                                ? 'Vence hoje!'
                                : `${daysRemaining} dias restantes`
                            }
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResolve(alert.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar resolvido
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAlerts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-success/10 p-4 mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold">Tudo em ordem!</h3>
              <p className="text-muted-foreground">
                Não há alertas pendentes no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
