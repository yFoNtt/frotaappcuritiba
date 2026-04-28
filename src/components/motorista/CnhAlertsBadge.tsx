import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCnhAlerts } from '@/hooks/useCnhAlerts';
import { AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CnhAlertsBadge() {
  const { alerts, unreadCount, loading, markAsRead, markAllAsRead, getAlertMessage } = useCnhAlerts();

  if (loading || alerts.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Alertas de CNH</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Marcar todos como lidos
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Nenhum alerta</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => {
                const { title, description, severity } = getAlertMessage(alert);
                const isUnread = !alert.read_at;
                
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                      isUnread && "bg-muted/30"
                    )}
                    onClick={() => isUnread && markAsRead(alert.id)}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      severity === 'error' ? "bg-destructive-soft text-destructive-soft-foreground" : "bg-warning-soft text-warning-soft-foreground"
                    )}>
                      {severity === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium", isUnread && "font-semibold")}>
                          {title}
                        </p>
                        {!isUnread && (
                          <Check className="h-4 w-4 shrink-0 text-success" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(alert.sent_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}