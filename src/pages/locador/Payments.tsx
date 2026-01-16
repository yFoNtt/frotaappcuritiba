import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DollarSign, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { mockVehicles } from '@/data/mockData';
import { mockMotoristas, mockPayments } from '@/data/mockDriversPayments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function LocadorPayments() {
  const locadorId = '1';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const myPayments = mockPayments.filter(p => p.locadorId === locadorId);

  const filteredPayments = myPayments.filter(payment => {
    const driver = mockMotoristas.find(d => d.id === payment.motoristaId);
    const vehicle = mockVehicles.find(v => v.id === payment.vehicleId);
    
    const matchesSearch = 
      driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle?.plate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalReceived = myPayments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalPending = myPayments
    .filter(p => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalOverdue = myPayments
    .filter(p => p.status === 'overdue')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleMarkAsPaid = (paymentId: string) => {
    toast.success('Pagamento marcado como pago!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">
            Controle os pagamentos semanais dos seus motoristas
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {(totalReceived + totalPending + totalOverdue).toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">Total Esperado</p>
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
                  <p className="text-2xl font-bold text-success">R$ {totalReceived.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">Recebido</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">R$ {totalPending.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">R$ {totalOverdue.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">Atrasado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por motorista ou veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Semana</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const driver = mockMotoristas.find(d => d.id === payment.motoristaId);
                  const vehicle = mockVehicles.find(v => v.id === payment.vehicleId);
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {driver?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-medium">{driver?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle?.brand} {vehicle?.model}
                        <p className="text-xs text-muted-foreground">{vehicle?.plate}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          Semana {payment.weekNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(payment.dueDate, "dd 'de' MMM", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {payment.amount.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            payment.status === 'paid' ? 'success' :
                            payment.status === 'overdue' ? 'destructive' : 'warning'
                          }
                        >
                          {payment.status === 'paid' && 'Pago'}
                          {payment.status === 'pending' && 'Pendente'}
                          {payment.status === 'overdue' && 'Atrasado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status !== 'paid' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar pago
                          </Button>
                        )}
                        {payment.status === 'paid' && payment.paidAt && (
                          <span className="text-sm text-muted-foreground">
                            Pago em {format(payment.paidAt, 'dd/MM')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
