import { useState, useMemo } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, startOfWeek, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useLocadorPayments, 
  useCreatePayment, 
  useMarkPaymentPaid,
  useCancelPayment,
  useGenerateWeeklyPayments,
  Payment 
} from '@/hooks/usePayments';
import { useLocadorDrivers, Driver } from '@/hooks/useDrivers';
import { useLocadorVehicles, Vehicle } from '@/hooks/useVehicles';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const paymentSchema = z.object({
  driver_id: z.string().min(1, 'Selecione um motorista'),
  amount: z.string().min(1, 'Valor é obrigatório').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Valor deve ser maior que zero'
  ),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  reference_week: z.string().min(1, 'Semana de referência é obrigatória'),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG = {
  pending: { label: 'Pendente', variant: 'warning' as const, icon: Clock },
  paid: { label: 'Pago', variant: 'success' as const, icon: CheckCircle },
  overdue: { label: 'Atrasado', variant: 'destructive' as const, icon: AlertTriangle },
  cancelled: { label: 'Cancelado', variant: 'secondary' as const, icon: XCircle },
};

export default function LocadorPayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);
  const [cancellingPayment, setCancellingPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  const { data: payments = [], isLoading: paymentsLoading } = useLocadorPayments();
  const { data: drivers = [], isLoading: driversLoading } = useLocadorDrivers();
  const { data: vehicles = [] } = useLocadorVehicles();
  
  const createPayment = useCreatePayment();
  const markPaid = useMarkPaymentPaid();
  const cancelPayment = useCancelPayment();
  const generateWeekly = useGenerateWeeklyPayments();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      driver_id: '',
      amount: '',
      due_date: '',
      reference_week: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  // Update overdue status for pending payments
  const processedPayments = useMemo(() => {
    const today = new Date();
    return payments.map(p => {
      if (p.status === 'pending' && isBefore(parseISO(p.due_date), today)) {
        return { ...p, status: 'overdue' as const };
      }
      return p;
    });
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return processedPayments.filter(payment => {
      const driver = drivers.find(d => d.id === payment.driver_id);
      const matchesSearch = 
        driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [processedPayments, drivers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const stats = useMemo(() => {
    const total = processedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const received = processedPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = processedPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const overdue = processedPayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    return { total, received, pending, overdue };
  }, [processedPayments]);

  const getDriverInfo = (driverId: string): Driver | undefined => {
    return drivers.find(d => d.id === driverId);
  };

  const getVehicleInfo = (vehicleId: string | null): Vehicle | undefined => {
    if (!vehicleId) return undefined;
    return vehicles.find(v => v.id === vehicleId);
  };

  const handleOpenAddDialog = () => {
    form.reset({
      driver_id: '',
      amount: '',
      due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      reference_week: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      notes: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (data: PaymentFormData) => {
    await createPayment.mutateAsync({
      driver_id: data.driver_id,
      amount: parseFloat(data.amount),
      due_date: data.due_date,
      reference_week: data.reference_week,
      notes: data.notes || undefined,
    });
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleMarkPaid = async () => {
    if (payingPayment) {
      await markPaid.mutateAsync({ 
        id: payingPayment.id, 
        paymentMethod: paymentMethod || undefined 
      });
      setPayingPayment(null);
      setPaymentMethod('');
    }
  };

  const handleCancel = async () => {
    if (cancellingPayment) {
      await cancelPayment.mutateAsync(cancellingPayment.id);
      setCancellingPayment(null);
    }
  };

  const handleGenerateWeekly = async () => {
    const nextMonday = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });
    await generateWeekly.mutateAsync(format(nextMonday, 'yyyy-MM-dd'));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (paymentsLoading || driversLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
            <p className="text-muted-foreground">
              Gerencie as cobranças semanais dos motoristas
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleGenerateWeekly}
              disabled={generateWeekly.isPending}
            >
              {generateWeekly.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Gerar Cobranças
            </Button>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cobrança
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
                  <p className="text-sm text-muted-foreground">Total Geral</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(stats.received)}</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(stats.pending)}</p>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.overdue)}</p>
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
                  placeholder="Buscar por motorista ou valor..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredPayments.length > 0 ? (
              <>
                {/* Mobile card layout */}
                <div className="md:hidden divide-y">
                  {paginatedPayments.map((payment) => {
                    const driver = getDriverInfo(payment.driver_id);
                    const vehicle = getVehicleInfo(payment.vehicle_id);
                    const statusConfig = STATUS_CONFIG[payment.status];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div key={payment.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {driver?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                              <p className="font-medium">{driver?.name || 'Motorista não encontrado'}</p>
                              {vehicle && <p className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</p>}
                            </div>
                          </div>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            <span>Venc: {format(parseISO(payment.due_date), 'dd/MM/yyyy')}</span>
                            <span className="ml-3">Ref: {format(parseISO(payment.reference_week), "dd/MM", { locale: ptBR })}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(Number(payment.amount))}</span>
                        </div>
                        {(payment.status === 'pending' || payment.status === 'overdue') && (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setPayingPayment(payment)} className="text-success hover:text-success">
                              <CheckCircle className="mr-1 h-4 w-4" />Pagar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setCancellingPayment(payment)} className="text-destructive hover:text-destructive">
                              <XCircle className="mr-1 h-4 w-4" />Cancelar
                            </Button>
                          </div>
                        )}
                        {payment.status === 'paid' && payment.paid_at && (
                          <p className="text-xs text-muted-foreground text-right">Pago em {format(parseISO(payment.paid_at), 'dd/MM/yyyy')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table layout */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Motorista</TableHead>
                        <TableHead className="hidden lg:table-cell">Veículo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="hidden lg:table-cell">Semana Ref.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map((payment) => {
                        const driver = getDriverInfo(payment.driver_id);
                        const vehicle = getVehicleInfo(payment.vehicle_id);
                        const statusConfig = STATUS_CONFIG[payment.status];
                        const StatusIcon = statusConfig.icon;
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                  {driver?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                                </div>
                                <span className="font-medium">{driver?.name || 'Motorista não encontrado'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {vehicle ? <span className="text-sm">{vehicle.brand} {vehicle.model}</span> : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(Number(payment.amount))}</TableCell>
                            <TableCell>{format(parseISO(payment.due_date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="hidden lg:table-cell">{format(parseISO(payment.reference_week), "dd/MM", { locale: ptBR })}</TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />{statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {(payment.status === 'pending' || payment.status === 'overdue') && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => setPayingPayment(payment)} className="text-success hover:text-success">
                                      <CheckCircle className="mr-1 h-4 w-4" />Pagar
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setCancellingPayment(payment)} className="text-destructive hover:text-destructive">
                                      <XCircle className="mr-1 h-4 w-4" />Cancelar
                                    </Button>
                                  </>
                                )}
                                {payment.status === 'paid' && payment.paid_at && (
                                  <span className="text-xs text-muted-foreground">Pago em {format(parseISO(payment.paid_at), 'dd/MM/yyyy')}</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)} de {filteredPayments.length} pagamentos
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {getPageNumbers().map((page, i) =>
                          page === 'ellipsis' ? (
                            <PaginationItem key={`ellipsis-${i}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => setCurrentPage(page)}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhuma cobrança encontrada</h3>
                <p className="mb-4 text-muted-foreground">
                  {payments.length === 0
                    ? 'Você ainda não registrou nenhuma cobrança.'
                    : 'Nenhuma cobrança corresponde aos filtros.'}
                </p>
                {payments.length === 0 && (
                  <Button onClick={handleOpenAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar primeira cobrança
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Payment Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Cobrança</DialogTitle>
              <DialogDescription>
                Registre uma nova cobrança semanal para um motorista.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="driver_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motorista</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o motorista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {drivers.map(driver => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reference_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semana de Referência</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre esta cobrança..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPayment.isPending}>
                    {createPayment.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Registrar Cobrança
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Confirm Payment Dialog */}
        <Dialog open={!!payingPayment} onOpenChange={() => setPayingPayment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pagamento</DialogTitle>
              <DialogDescription>
                Confirme o recebimento do pagamento de {payingPayment && formatCurrency(Number(payingPayment.amount))}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="payment-method">Método de Pagamento (opcional)</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayingPayment(null)}>
                Cancelar
              </Button>
              <Button onClick={handleMarkPaid} disabled={markPaid.isPending}>
                {markPaid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Payment Dialog */}
        <AlertDialog open={!!cancellingPayment} onOpenChange={() => setCancellingPayment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Cobrança</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar esta cobrança de {cancellingPayment && formatCurrency(Number(cancellingPayment.amount))}? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Cancelar Cobrança
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
