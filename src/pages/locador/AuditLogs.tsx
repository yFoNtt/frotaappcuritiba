import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, History, Filter, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuditLogs, TABLE_LABELS, ACTION_LABELS, AuditLog } from '@/hooks/useAuditLogs';

export default function AuditLogs() {
  const { data: logs = [], isLoading } = useAuditLogs();
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (tableFilter !== 'all' && log.table_name !== tableFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (dateFrom) {
        const logDate = log.created_at.split('T')[0];
        if (logDate < dateFrom) return false;
      }
      if (dateTo) {
        const logDate = log.created_at.split('T')[0];
        if (logDate > dateTo) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const tableName = (TABLE_LABELS[log.table_name] || log.table_name).toLowerCase();
        const actionName = (ACTION_LABELS[log.action] || log.action).toLowerCase();
        const fields = log.changed_fields?.join(', ').toLowerCase() || '';
        if (!tableName.includes(s) && !actionName.includes(s) && !fields.includes(s) && !log.record_id.includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [logs, search, tableFilter, actionFilter, dateFrom, dateTo]);

  const hasActiveFilters = tableFilter !== 'all' || actionFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setTableFilter('all');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const actionVariant = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-7 w-7" />
            Logs de Auditoria
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Histórico de todas as alterações realizadas nos seus dados.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por tabela, ação ou campos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tabela</label>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tabelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tabelas</SelectItem>
                    {Object.entries(TABLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ação</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {Object.entries(ACTION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data início</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data fim</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {filteredLogs.length} resultado{filteredLogs.length !== 1 ? 's' : ''} encontrado{filteredLogs.length !== 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                  <X className="mr-1 h-3 w-3" /> Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Registros</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} de auditoria
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead className="hidden md:table-cell">Campos Alterados</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionVariant(log.action) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                        {log.changed_fields?.join(', ') || '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">Nenhum log de auditoria encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tabela</p>
                  <p className="font-medium">{TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ação</p>
                  <Badge variant={actionVariant(selectedLog.action) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                  <p>{format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID do Registro</p>
                  <p className="text-sm font-mono break-all">{selectedLog.record_id}</p>
                </div>
              </div>

              {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Campos Alterados</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLog.changed_fields.map((field) => (
                      <Badge key={field} variant="secondary">{field}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.action === 'UPDATE' && selectedLog.old_data && selectedLog.new_data && selectedLog.changed_fields && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Comparação</p>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campo</TableHead>
                          <TableHead>Antes</TableHead>
                          <TableHead>Depois</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLog.changed_fields.map((field) => (
                          <TableRow key={field}>
                            <TableCell className="font-medium text-sm">{field}</TableCell>
                            <TableCell className="text-sm text-destructive/80 max-w-[200px] truncate">
                              {String((selectedLog.old_data as Record<string, unknown>)?.[field] ?? '—')}
                            </TableCell>
                            <TableCell className="text-sm text-primary max-w-[200px] truncate">
                              {String((selectedLog.new_data as Record<string, unknown>)?.[field] ?? '—')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {(selectedLog.action === 'INSERT' || selectedLog.action === 'DELETE') && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {selectedLog.action === 'INSERT' ? 'Dados Criados' : 'Dados Excluídos'}
                  </p>
                  <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.action === 'INSERT' ? selectedLog.new_data : selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
