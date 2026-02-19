import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, CreditCard, IdCard, Wrench, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  payment_overdue: { icon: CreditCard, color: 'text-destructive', label: 'Pagamento' },
  cnh_expiry: { icon: IdCard, color: 'text-warning', label: 'CNH' },
  maintenance_due: { icon: Wrench, color: 'text-primary', label: 'Manutenção' },
  contract_expiry: { icon: FileText, color: 'text-orange-500', label: 'Contrato' },
};

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = typeConfig[notification.type] || { icon: Bell, color: 'text-muted-foreground', label: 'Notificação' };
  const Icon = config.icon;
  const isUnread = !notification.read_at;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-colors',
        isUnread ? 'bg-accent/50' : 'hover:bg-accent/30'
      )}
    >
      <div className={cn('mt-0.5 flex-shrink-0', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {config.label}
          </Badge>
          {isUnread && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="mt-1 text-sm font-medium leading-tight">{notification.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{notification.message}</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        {isUnread && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
            title="Marcar como lida"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
          title="Remover"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface NotificationBellProps {
  collapsed?: boolean;
}

export function NotificationBell({ collapsed = false }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center'
          )}
        >
          <div className="relative flex-shrink-0">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {!collapsed && <span>Notificações</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notificações</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Ler todas
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
