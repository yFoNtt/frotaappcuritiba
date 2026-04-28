import { useState, useCallback } from 'react';
import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  FileText,
  Download,
  Eye,
  FileImage,
  File,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { useMotoristaDocuments, useMotoristaFullData, useMotoristaDriver } from '@/hooks/useMotoristaData';
import { useMotoristaDocumentRequests, DocumentType } from '@/hooks/useDocumentRequests';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const documentTypeLabels: Record<string, string> = {
  cnh: 'CNH',
  comprovante: 'Comprovante',
  contrato: 'Contrato',
  multa: 'Multa',
  outro: 'Outro',
};

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'cnh', label: 'CNH' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'multa', label: 'Multa' },
  { value: 'outro', label: 'Outro' },
];

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return Clock;
    case 'approved':
      return CheckCircle;
    case 'rejected':
      return XCircle;
    default:
      return Clock;
  }
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  return FileText;
};

export default function MotoristaDocuments() {
  const { driver, isLoading: dataLoading } = useMotoristaFullData();
  const { data: driverRecord } = useMotoristaDriver();
  const { data: documents = [], isLoading: docsLoading } = useMotoristaDocuments();
  const { requests, isLoading: requestsLoading, submitRequest } = useMotoristaDocumentRequests();
  
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('cnh');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentExpiresAt, setDocumentExpiresAt] = useState('');

  const isLoading = dataLoading || docsLoading;

  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('Error getting signed URL:', error);
      toast.error('Erro ao acessar documento');
      return null;
    }

    return data.signedUrl;
  };

  const handleViewDocument = async (filePath: string) => {
    setLoadingUrl(filePath);
    const url = await getDocumentUrl(filePath);
    setLoadingUrl(null);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownloadDocument = async (filePath: string, name: string) => {
    setLoadingUrl(filePath);
    const url = await getDocumentUrl(filePath);
    setLoadingUrl(null);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [documentName]);

  const handleSubmitRequest = async () => {
    if (!selectedFile || !documentName || !documentType || !driverRecord) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await submitRequest.mutateAsync({
      locador_id: driverRecord.locador_id,
      driver_id: driverRecord.id,
      file: selectedFile,
      name: documentName,
      type: documentType,
      description: documentDescription || undefined,
      expires_at: documentExpiresAt || undefined,
    });

    // Reset form
    setSelectedFile(null);
    setDocumentName('');
    setDocumentType('cnh');
    setDocumentDescription('');
    setDocumentExpiresAt('');
    setUploadDialogOpen(false);
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = differenceInDays(parseISO(expiresAt), new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return isAfter(new Date(), parseISO(expiresAt));
  };

  // Count documents by status
  const expiringDocs = documents.filter(d => isExpiringSoon(d.expires_at) && !isExpired(d.expires_at));
  const expiredDocs = documents.filter(d => isExpired(d.expires_at));
  const cnhDocs = documents.filter(d => d.type === 'cnh');
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <MotoristaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meus Documentos</h1>
            <p className="text-muted-foreground">
              Visualize e solicite atualização de documentos
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Solicitar Atualização
          </Button>
        </div>

        {/* Alerts */}
        {(expiredDocs.length > 0 || expiringDocs.length > 0) && (
          <div className="space-y-3">
            {expiredDocs.length > 0 && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">
                        {expiredDocs.length} documento{expiredDocs.length > 1 ? 's' : ''} vencido{expiredDocs.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Envie uma nova versão para atualização
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                    Atualizar
                  </Button>
                </CardContent>
              </Card>
            )}

            {expiringDocs.length > 0 && (
              <Card className="border-warning bg-warning/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <Calendar className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium text-warning">
                      {expiringDocs.length} documento{expiringDocs.length > 1 ? 's' : ''} vencendo em 30 dias
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Atualize seus documentos para evitar problemas
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{isLoading ? '-' : documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNH</p>
                  <p className="text-2xl font-bold">{isLoading ? '-' : cnhDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${expiredDocs.length > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                  <AlertTriangle className={`h-6 w-6 ${expiredDocs.length > 0 ? 'text-destructive' : 'text-success'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                  <p className="text-2xl font-bold">{isLoading ? '-' : expiredDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${pendingRequests.length > 0 ? 'bg-warning-soft' : 'bg-muted'}`}>
                  <Clock className={`h-6 w-6 ${pendingRequests.length > 0 ? 'text-warning-soft-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{requestsLoading ? '-' : pendingRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Documents and Requests */}
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">Documentos Aprovados</TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              Solicitações
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  Lista de documentos aprovados vinculados ao seu perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum documento encontrado</h3>
                    <p className="text-muted-foreground">
                      Seus documentos aparecerão aqui quando aprovados
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Documento</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => {
                          const FileIcon = getFileIcon(doc.mime_type);
                          const expiring = isExpiringSoon(doc.expires_at);
                          const expired = isExpired(doc.expires_at);
                          const isDocLoading = loadingUrl === doc.file_path;

                          return (
                            <TableRow key={doc.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{doc.name}</p>
                                    {doc.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {doc.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getTypeColor(doc.type)}>
                                  {documentTypeLabels[doc.type] || doc.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {doc.expires_at ? (
                                  <div className="flex items-center gap-2">
                                    <span className={expired ? 'text-destructive' : expiring ? 'text-warning' : ''}>
                                      {format(parseISO(doc.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                                    </span>
                                    {expired && (
                                      <Badge variant="destructive" className="text-xs">Vencido</Badge>
                                    )}
                                    {expiring && !expired && (
                                      <Badge variant="outline" className="text-xs border-warning text-warning">Vencendo</Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewDocument(doc.file_path)}
                                    disabled={isDocLoading}
                                    title="Visualizar"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadDocument(doc.file_path, doc.name)}
                                    disabled={isDocLoading}
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CNH Info Card */}
            {driver && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações da CNH
                  </CardTitle>
                  <CardDescription>
                    Dados cadastrados no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Número da CNH</p>
                      <p className="font-medium">{driver.cnh_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Validade</p>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${
                          isExpired(driver.cnh_expiry) ? 'text-destructive' : 
                          isExpiringSoon(driver.cnh_expiry) ? 'text-warning' : ''
                        }`}>
                          {format(parseISO(driver.cnh_expiry), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {isExpired(driver.cnh_expiry) && (
                          <Badge variant="destructive">Vencida</Badge>
                        )}
                        {isExpiringSoon(driver.cnh_expiry) && !isExpired(driver.cnh_expiry) && (
                          <Badge variant="outline" className="border-warning text-warning">Vencendo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Solicitações</CardTitle>
                <CardDescription>
                  Acompanhe o status das suas solicitações de atualização de documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Send className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhuma solicitação</h3>
                    <p className="text-muted-foreground mb-4">
                      Você ainda não enviou nenhuma solicitação de atualização
                    </p>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Solicitação
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Documento</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data Envio</TableHead>
                          <TableHead>Observação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => {
                          const StatusIcon = getStatusIcon(request.status);

                          return (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{request.name}</p>
                                    {request.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {request.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getTypeColor(request.type)}>
                                  {documentTypeLabels[request.type] || request.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`h-4 w-4 ${
                                    request.status === 'pending' ? 'text-warning' :
                                    request.status === 'approved' ? 'text-success' :
                                    'text-destructive'
                                  }`} />
                                  <Badge className={getStatusColor(request.status)}>
                                    {getStatusLabel(request.status)}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(parseISO(request.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                {request.status === 'rejected' && request.rejection_reason ? (
                                  <span className="text-sm text-destructive">{request.rejection_reason}</span>
                                ) : request.status === 'approved' ? (
                                  <span className="text-sm text-success">Documento atualizado</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Aguardando análise</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upload Request Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Solicitar Atualização de Documento</DialogTitle>
              <DialogDescription>
                Envie uma nova versão do documento para aprovação do locador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selecionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, JPG, PNG, DOC, DOCX. Máximo 10MB.
                </p>
              </div>

              {/* Document Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Documento *</Label>
                <Input
                  id="name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ex: CNH Atualizada"
                />
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expires_at">Data de Vencimento</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={documentExpiresAt}
                  onChange={(e) => setDocumentExpiresAt(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Observação (opcional)</Label>
                <Textarea
                  id="description"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Adicione detalhes sobre a atualização..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={!selectedFile || !documentName || submitRequest.isPending}
              >
                {submitRequest.isPending ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MotoristaLayout>
  );
}
