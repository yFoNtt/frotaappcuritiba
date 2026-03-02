import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Trash2,
  Bell,
} from 'lucide-react';
import { useLocadorDocumentRequests, DocumentRequest } from '@/hooks/useDocumentRequests';
import { useLocadorDrivers } from '@/hooks/useDrivers';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatsCard } from '@/components/dashboard/StatsCard';

const documentTypeLabels: Record<string, string> = {
  cnh: 'CNH',
  comprovante: 'Comprovante',
  contrato: 'Contrato',
  multa: 'Multa',
  outro: 'Outro',
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    cnh: 'bg-primary/10 text-primary',
    comprovante: 'bg-success/10 text-success',
    contrato: 'bg-accent text-accent-foreground',
    multa: 'bg-destructive/10 text-destructive',
    outro: 'bg-muted text-muted-foreground',
  };
  return colors[type] || colors.outro;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-warning/10 text-warning';
    case 'approved':
      return 'bg-success/10 text-success';
    case 'rejected':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Rejeitado';
    default:
      return status;
  }
};

export default function DocumentRequestsPage() {
  const { 
    requests, 
    isLoading, 
    approveRequest, 
    rejectRequest, 
    deleteRequest,
    getFileUrl 
  } = useLocadorDocumentRequests();
  const { data: drivers = [] } = useLocadorDrivers();

  const [search, setSearch] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const driver = drivers.find(d => d.id === req.driver_id);
      const driverName = driver?.name || '';
      return (
        req.name.toLowerCase().includes(search.toLowerCase()) ||
        driverName.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [requests, drivers, search]);

  // Stats
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    return { pending, approved, rejected, total: requests.length };
  }, [requests]);

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || 'Motorista';
  };

  const handleViewFile = async (filePath: string) => {
    setLoadingAction(filePath);
    const url = await getFileUrl(filePath);
    setLoadingAction(null);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleApprove = async (request: DocumentRequest) => {
    setLoadingAction(request.id);
    await approveRequest.mutateAsync(request);
    setLoadingAction(null);
  };

  const handleRejectClick = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    
    await rejectRequest.mutateAsync({
      request: selectedRequest,
      reason: rejectReason,
    });
    
    setRejectDialogOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
  };

  const handleDeleteClick = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRequest) return;
    
    await deleteRequest.mutateAsync(selectedRequest);
    
    setDeleteDialogOpen(false);
    setSelectedRequest(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Documentos</h1>
          <p className="text-muted-foreground">
            Revise e aprove solicitações de atualização de documentos dos motoristas
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Pendentes"
            value={isLoading ? '-' : stats.pending}
            icon={Clock}
            variant={stats.pending > 0 ? 'warning' : 'default'}
          />
          <StatsCard
            title="Aprovados"
            value={isLoading ? '-' : stats.approved}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Rejeitados"
            value={isLoading ? '-' : stats.rejected}
            icon={XCircle}
          />
          <StatsCard
            title="Total"
            value={isLoading ? '-' : stats.total}
            icon={FileText}
          />
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por documento ou motorista..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Solicitações ({filteredRequests.length})
            </CardTitle>
            <CardDescription>
              Documentos enviados pelos motoristas aguardando sua análise
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhuma solicitação</h3>
                <p className="text-muted-foreground">
                  {search ? 'Nenhuma solicitação encontrada com esse filtro' : 'Você não tem solicitações pendentes'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Envio</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium">{getDriverName(request.driver_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.name}</p>
                            {request.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {request.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(request.type)}>
                            {documentTypeLabels[request.type] || request.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewFile(request.file_path)}
                              disabled={loadingAction === request.file_path}
                              title="Visualizar arquivo"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(request)}
                                  disabled={loadingAction === request.id}
                                  title="Aprovar"
                                  className="text-success hover:text-success hover:bg-success/10"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRejectClick(request)}
                                  title="Rejeitar"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(request)}
                              title="Excluir"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Solicitação</DialogTitle>
              <DialogDescription>
                Informe o motivo da rejeição para que o motorista possa corrigir e enviar novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Ex: Documento ilegível, data incorreta, etc."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || rejectRequest.isPending}
              >
                {rejectRequest.isPending ? 'Rejeitando...' : 'Rejeitar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
