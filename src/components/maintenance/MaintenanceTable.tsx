import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { 
  Wrench, 
  Calendar, 
  Gauge, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2,
  Plus,
  Eye,
  MapPin
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Maintenance, MaintenanceType, MAINTENANCE_TYPES } from '@/hooks/useMaintenances';
import { Vehicle } from '@/hooks/useVehicles';

const ITEMS_PER_PAGE = 10;

const TYPE_VARIANTS: Record<MaintenanceType, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  oil_change: 'warning',
  tire_change: 'default',
  revision: 'success',
  repair: 'destructive',
  inspection: 'secondary',
  other: 'secondary',
};

const STATUS_CONFIG = {
  scheduled: { label: 'Agendada', variant: 'warning' as const, icon: Clock, color: 'text-warning' },
  in_progress: { label: 'Em Andamento', variant: 'default' as const, icon: Loader2, color: 'text-primary' },
  completed: { label: 'Concluída', variant: 'success' as const, icon: CheckCircle, color: 'text-success' },
  cancelled: { label: 'Cancelada', variant: 'secondary' as const, icon: AlertTriangle, color: 'text-muted-foreground' },
};

interface MaintenanceTableProps {
  maintenances: Maintenance[];
  vehicles: Vehicle[];
  onEdit: (maintenance: Maintenance) => void;
  onDelete: (maintenance: Maintenance) => void;
  onComplete: (id: string) => void;
  onViewDetails: (maintenance: Maintenance) => void;
  onAddNew: () => void;
  totalCount: number;
}

export function MaintenanceTable({ 
  maintenances, 
  vehicles, 
  onEdit, 
  onDelete, 
  onComplete,
  onViewDetails,
  onAddNew,
  totalCount
}: MaintenanceTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(maintenances.length / ITEMS_PER_PAGE);
  const paginatedMaintenances = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return maintenances.slice(start, start + ITEMS_PER_PAGE);
  }, [maintenances, currentPage]);

  // Reset page when data changes
  useEffect(() => { setCurrentPage(1); }, [maintenances.length]);

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

  const getVehicleInfo = (vehicleId: string): Vehicle | undefined => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getNextMaintenanceInfo = (maintenance: Maintenance) => {
    if (!maintenance.next_maintenance_date) return null;
    
    const nextDate = parseISO(maintenance.next_maintenance_date);
    const daysUntil = differenceInDays(nextDate, new Date());
    
    if (daysUntil < 0) {
      return { label: `Atrasada ${Math.abs(daysUntil)}d`, variant: 'destructive' as const };
    } else if (daysUntil <= 7) {
      return { label: `Em ${daysUntil}d`, variant: 'warning' as const };
    } else if (daysUntil <= 30) {
      return { label: `Em ${daysUntil}d`, variant: 'default' as const };
    }
    return null;
  };

  if (maintenances.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Wrench className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Nenhuma manutenção encontrada</h3>
          <p className="mb-6 text-muted-foreground max-w-sm">
            {totalCount === 0
              ? 'Você ainda não registrou nenhuma manutenção. Mantenha o histórico dos seus veículos em dia!'
              : 'Nenhuma manutenção corresponde aos filtros aplicados.'}
          </p>
          {totalCount === 0 && (
            <Button onClick={onAddNew} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Registrar primeira manutenção
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Mobile card layout */}
        <div className="md:hidden divide-y">
          {paginatedMaintenances.map((maintenance) => {
            const vehicle = getVehicleInfo(maintenance.vehicle_id);
            const statusConfig = STATUS_CONFIG[maintenance.status];
            const StatusIcon = statusConfig.icon;
            const nextInfo = getNextMaintenanceInfo(maintenance);
            return (
              <div key={maintenance.id} className="p-4 space-y-3" onClick={() => onViewDetails(maintenance)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{vehicle?.brand} {vehicle?.model}</p>
                      <p className="text-xs text-muted-foreground">{vehicle?.plate}</p>
                    </div>
                  </div>
                  <Badge variant={statusConfig.variant} className="gap-1">
                    <StatusIcon className={`h-3 w-3 ${maintenance.status === 'in_progress' ? 'animate-spin' : ''}`} />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate">{maintenance.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(maintenance.performed_at), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                    {maintenance.km_at_maintenance && (
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {maintenance.km_at_maintenance.toLocaleString('pt-BR')} km
                      </span>
                    )}
                    {maintenance.service_provider && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {maintenance.service_provider}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={TYPE_VARIANTS[maintenance.type]} className="font-medium text-xs">
                      {MAINTENANCE_TYPES[maintenance.type]}
                    </Badge>
                    {nextInfo && maintenance.status === 'completed' && (
                      <Badge variant={nextInfo.variant} className="text-[10px] px-1.5 py-0">Próx: {nextInfo.label}</Badge>
                    )}
                  </div>
                  <span className="font-semibold text-sm">
                    {maintenance.cost ? formatCurrency(Number(maintenance.cost)) : '-'}
                  </span>
                </div>
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetails(maintenance)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {maintenance.status === 'scheduled' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success hover:bg-success/10" onClick={() => onComplete(maintenance.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(maintenance)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(maintenance)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table layout */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Veículo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMaintenances.map((maintenance) => {
                const vehicle = getVehicleInfo(maintenance.vehicle_id);
                const statusConfig = STATUS_CONFIG[maintenance.status];
                const StatusIcon = statusConfig.icon;
                const nextInfo = getNextMaintenanceInfo(maintenance);
                return (
                  <TableRow key={maintenance.id} className="group cursor-pointer" onClick={() => onViewDetails(maintenance)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/50 group-hover:from-primary/10 group-hover:to-primary/5 transition-colors">
                          <Wrench className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-medium">{vehicle?.brand} {vehicle?.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle?.plate}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium truncate">{maintenance.description}</p>
                        {maintenance.service_provider && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" />{maintenance.service_provider}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={TYPE_VARIANTS[maintenance.type]} className="font-medium">
                        {MAINTENANCE_TYPES[maintenance.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(parseISO(maintenance.performed_at), "dd MMM yyyy", { locale: ptBR })}
                        </div>
                        {maintenance.km_at_maintenance && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Gauge className="h-3 w-3" />{maintenance.km_at_maintenance.toLocaleString('pt-BR')} km
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={statusConfig.variant} className="gap-1">
                          <StatusIcon className={`h-3 w-3 ${maintenance.status === 'in_progress' ? 'animate-spin' : ''}`} />
                          {statusConfig.label}
                        </Badge>
                        {nextInfo && maintenance.status === 'completed' && (
                          <Badge variant={nextInfo.variant} className="text-[10px] px-1.5 py-0">Próx: {nextInfo.label}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">{maintenance.cost ? formatCurrency(Number(maintenance.cost)) : '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetails(maintenance)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalhes</TooltipContent>
                        </Tooltip>
                        {maintenance.status === 'scheduled' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success hover:bg-success/10" onClick={() => onComplete(maintenance.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Marcar como concluída</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(maintenance)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(maintenance)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
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
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, maintenances.length)} de {maintenances.length} manutenções
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
      </CardContent>
    </Card>
  );
}
