import { useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Upload,
  Search,
  Download,
  Trash2,
  Eye,
  FileImage,
  File,
  Calendar,
  User,
  Car,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { useDocuments, DocumentType, Document } from '@/hooks/useDocuments';
import { useLocadorDrivers } from '@/hooks/useDrivers';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { format, differenceInDays, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatsCard } from '@/components/dashboard/StatsCard';

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'cnh', label: 'CNH' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'multa', label: 'Multa' },
  { value: 'outro', label: 'Outro' },
];

const getTypeColor = (type: DocumentType) => {
  const colors: Record<DocumentType, string> = {
    cnh: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    comprovante: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    contrato: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    multa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    outro: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[type];
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

export default function DocumentsPage() {
  const { documents, isLoading, uploadDocument, deleteDocument, getDocumentUrl } = useDocuments();
  const { data: drivers = [] } = useLocadorDrivers();
  const { data: vehicles = [] } = useLocadorVehicles();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  
  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('outro');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentExpiresAt, setDocumentExpiresAt] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        (doc.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesType = typeFilter === 'all' || doc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [documents, search, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = documents.length;
    const expiringSoon = documents.filter(doc => {
      if (!doc.expires_at) return false;
      const daysUntilExpiry = differenceInDays(parseISO(doc.expires_at), new Date());
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;
    const expired = documents.filter(doc => {
      if (!doc.expires_at) return false;
      return isAfter(new Date(), parseISO(doc.expires_at));
    }).length;
    const byType = documentTypes.reduce((acc, type) => {
      acc[type.value] = documents.filter(d => d.type === type.value).length;
      return acc;
    }, {} as Record<DocumentType, number>);

    return { total, expiringSoon, expired, byType };
  }, [documents]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [documentName]);

  const handleUpload = async () => {
    if (!selectedFile || !documentName || !documentType) return;

    await uploadDocument.mutateAsync({
      file: selectedFile,
      name: documentName,
      type: documentType,
      description: documentDescription || undefined,
      expires_at: documentExpiresAt || undefined,
      driver_id: selectedDriverId || undefined,
      vehicle_id: selectedVehicleId || undefined,
    });

    // Reset form
    setSelectedFile(null);
    setDocumentName('');
    setDocumentType('outro');
    setDocumentDescription('');
    setDocumentExpiresAt('');
    setSelectedDriverId('');
    setSelectedVehicleId('');
    setUploadDialogOpen(false);
  };

  const handleViewDocument = async (doc: Document) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      await deleteDocument.mutateAsync(documentToDelete);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return null;
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || null;
  };

  const getVehicleName = (vehicleId: string | null) => {
    if (!vehicleId) return null;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}` : null;
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Gerencie CNHs, comprovantes, contratos e outros documentos
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Enviar Documento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Documentos"
            value={isLoading ? '-' : stats.total}
            icon={FileText}
          />
          <StatsCard
            title="Vencendo em 30 dias"
            value={isLoading ? '-' : stats.expiringSoon}
            icon={Calendar}
            variant={stats.expiringSoon > 0 ? 'warning' : 'default'}
          />
          <StatsCard
            title="Vencidos"
            value={isLoading ? '-' : stats.expired}
            icon={AlertTriangle}
            variant={stats.expired > 0 ? 'warning' : 'success'}
          />
          <StatsCard
            title="CNHs Cadastradas"
            value={isLoading ? '-' : stats.byType.cnh}
            icon={User}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou descrição..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos ({filteredDocuments.length})</CardTitle>
            <CardDescription>Lista de todos os documentos cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground">
                  {search || typeFilter !== 'all'
                    ? 'Tente ajustar os filtros'
                    : 'Comece enviando seu primeiro documento'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">Motorista/Veículo</TableHead>
                      <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                      <TableHead className="hidden lg:table-cell">Tamanho</TableHead>
                      <TableHead className="hidden lg:table-cell">Data Upload</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => {
                      const FileIcon = getFileIcon(doc.mime_type);
                      const driverName = getDriverName(doc.driver_id);
                      const vehicleName = getVehicleName(doc.vehicle_id);
                      const expiring = isExpiringSoon(doc.expires_at);
                      const expired = isExpired(doc.expires_at);

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
                            <Badge className={getTypeColor(doc.type as DocumentType)}>
                              {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              {driverName && (
                                <div className="flex items-center gap-1 text-sm">
                                  <User className="h-3 w-3" />
                                  {driverName}
                                </div>
                              )}
                              {vehicleName && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Car className="h-3 w-3" />
                                  {vehicleName}
                                </div>
                              )}
                              {!driverName && !vehicleName && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
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
                          <TableCell className="hidden lg:table-cell">{formatFileSize(doc.file_size)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {format(parseISO(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDocument(doc)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadDocument(doc)}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(doc)}
                                title="Excluir"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
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

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enviar Documento</DialogTitle>
              <DialogDescription>
                Faça upload de CNHs, comprovantes, contratos ou outros documentos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
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
                  placeholder="Ex: CNH João Silva"
                />
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label>Tipo *</Label>
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

              {/* Driver Select */}
              <div className="space-y-2">
                <Label>Motorista (opcional)</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Select */}
              <div className="space-y-2">
                <Label>Veículo (opcional)</Label>
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Adicione detalhes sobre o documento..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !documentName || uploadDocument.isPending}
              >
                {uploadDocument.isPending ? 'Enviando...' : 'Enviar'}
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
                Tem certeza que deseja excluir o documento "{documentToDelete?.name}"?
                Esta ação não pode ser desfeita.
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
