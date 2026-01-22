import { useState } from 'react';
import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import { useMotoristaDocuments, useMotoristaFullData } from '@/hooks/useMotoristaData';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type DocumentType = 'cnh' | 'comprovante' | 'contrato' | 'multa' | 'outro';

const documentTypeLabels: Record<string, string> = {
  cnh: 'CNH',
  comprovante: 'Comprovante',
  contrato: 'Contrato',
  multa: 'Multa',
  outro: 'Outro',
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    cnh: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    comprovante: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    contrato: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    multa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    outro: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[type] || colors.outro;
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
  const { data: documents = [], isLoading: docsLoading } = useMotoristaDocuments();
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

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

  return (
    <MotoristaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Meus Documentos</h1>
          <p className="text-muted-foreground">
            Visualize sua CNH e outros documentos vinculados ao seu perfil
          </p>
        </div>

        {/* Alerts */}
        {(expiredDocs.length > 0 || expiringDocs.length > 0) && (
          <div className="space-y-3">
            {expiredDocs.length > 0 && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">
                      {expiredDocs.length} documento{expiredDocs.length > 1 ? 's' : ''} vencido{expiredDocs.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Entre em contato com o locador para atualizar
                    </p>
                  </div>
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Documentos</p>
                  <p className="text-2xl font-bold">{isLoading ? '-' : documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
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
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>
              Lista de todos os documentos vinculados ao seu perfil
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
                  Seus documentos aparecerão aqui quando o locador cadastrá-los
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
                      <TableHead>Data Upload</TableHead>
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
                          <TableCell>
                            {format(parseISO(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
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
          <Card>
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
      </div>
    </MotoristaLayout>
  );
}
