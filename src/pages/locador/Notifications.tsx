import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CreditCard,
  IdCard,
  Wrench,
  FileText,
  Trash2,
  Filter,
  UserPen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeFilters = [
  { value: 'all', label: 'Todas', icon: Bell },
  { value: 'payment_overdue', label: 'Pagamentos', icon: CreditCard },
  { value: 'cnh_expiry', label: 'CNH', icon: IdCard },
  { value: 'maintenance_due', label: 'Manutenção', icon: Wrench },
  { value: 'contract_expiry', label: 'Contratos', icon: FileText },
  { value: 'driver_change', label: 'Motoristas', icon: UserPen },
] as const;

const typeConfig: Record<string, { icon: typeof Bell; color: string; bgColor: string; label: string }> = {
  payment_overdue: { icon: CreditCard, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Pagamento' },
  cnh_expiry: { icon: IdCard, color: 'text-warning', bgColor: 'bg-warning/10', label: 'CNH' },
  maintenance_due: { icon: Wrench, color: 'text-primary', bgColor: 'bg-primary/10', label: 'Manutenção' },
  contract_expiry: { icon: FileText, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Contrato' },
  driver_change: { icon: UserPen, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Motorista' },
};

const statusFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'Não lidas' },
  { value: 'read', label: 'Lidas' },
] as const;

function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = typeConfig[notification.type] || {
    icon: Bell,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Notificação',
  };
  const Icon = config.icon;
  const isUnread = !notification.read_at;

  return (
    <Card className={cn('transition-all', isUnread && 'border-primary/30 shadow-sm')}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className={cn('mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
            {isUnread && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                Nova
              </Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
              {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          <p className="text-sm font-semibold">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground/60">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {isUnread && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRead(notification.id)}
              title="Marcar como lida"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(notification.id)}
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LocadorNotifications() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const filtered = useMemo(() => notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter === 'unread' && n.read_at) return false;
    if (statusFilter === 'read' && !n.read_at) return false;
    return true;
  }), [notifications, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(safePage * ITEMS_PER_PAGE, filtered.length);

  // Reset page when filters change
  const handleTypeFilter = (v: string) => { setTypeFilter(v); setCurrentPage(1); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setCurrentPage(1); };

  // Stats
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    payments: notifications.filter(n => n.type === 'payment_overdue').length,
    cnh: notifications.filter(n => n.type === 'cnh_expiry').length,
    maintenance: notifications.filter(n => n.type === 'maintenance_due').length,
    driverChanges: notifications.filter(n => n.type === 'driver_change').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            <p className="text-muted-foreground">
              Histórico completo de alertas e notificações
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como lidas ({unreadCount})
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">Não lidas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <CreditCard className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.payments}</p>
                <p className="text-xs text-muted-foreground">Pagamentos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <IdCard className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.cnh}</p>
                <p className="text-xs text-muted-foreground">CNH</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-xs text-muted-foreground">Manutenção</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <UserPen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.driverChanges}</p>
                <p className="text-xs text-muted-foreground">Motoristas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
                <Tabs value={typeFilter} onValueChange={handleTypeFilter} className="w-full sm:w-auto">
                  <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
                    {typeFilters.map(f => (
                      <TabsTrigger key={f.value} value={f.value} className="text-xs px-3 py-1.5">
                        <f.icon className="mr-1.5 h-3 w-3" />
                        {f.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Tabs value={statusFilter} onValueChange={handleStatusFilter} className="w-full sm:w-auto">
                  <TabsList className="w-full sm:w-auto">
                    {statusFilters.map(f => (
                      <TabsTrigger key={f.value} value={f.value} className="text-xs px-3">
                        {f.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="flex items-start gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BellOff className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma notificação</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Nenhuma notificação encontrada com os filtros selecionados.'
                  : 'Você não possui notificações no momento.'}
              </p>
              {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => { handleTypeFilter('all'); handleStatusFilter('all'); }}
                >
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedItems.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {startItem}–{endItem} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(safePage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-1 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === safePage ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
