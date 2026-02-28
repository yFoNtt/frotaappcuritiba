import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Plus, Search, ClipboardCheck, Filter, FileSpreadsheet } from 'lucide-react';
import { useLocadorInspections, useDeleteInspection, VehicleInspection } from '@/hooks/useInspections';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { useLocadorDrivers } from '@/hooks/useDrivers';
import { useLocadorContracts } from '@/hooks/useContracts';
import { useInspectionExport } from '@/hooks/useInspectionExport';
import { InspectionFormDialog } from '@/components/inspections/InspectionFormDialog';
import { InspectionDetailsDialog } from '@/components/inspections/InspectionDetailsDialog';
import { InspectionCard } from '@/components/inspections/InspectionCard';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function LocadorInspections() {
  const { data: inspections = [], isLoading: inspectionsLoading } = useLocadorInspections();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles();
  const { data: drivers = [], isLoading: driversLoading } = useLocadorDrivers();
  const { data: contracts = [] } = useLocadorContracts();
  const deleteInspection = useDeleteInspection();
  const { exportToExcel } = useInspectionExport();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<VehicleInspection | null>(null);
  const [editingInspection, setEditingInspection] = useState<VehicleInspection | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handleTypeChange = (value: string) => { setTypeFilter(value); setCurrentPage(1); };
  const handleVehicleChange = (value: string) => { setVehicleFilter(value); setCurrentPage(1); };

  const isLoading = inspectionsLoading || vehiclesLoading || driversLoading;

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      const vehicle = vehicles.find((v) => v.id === inspection.vehicle_id);
      const driver = drivers.find((d) => d.id === inspection.driver_id);

      const matchesSearch =
        !searchTerm ||
        vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || inspection.type === typeFilter;
      const matchesVehicle = vehicleFilter === 'all' || inspection.vehicle_id === vehicleFilter;

      return matchesSearch && matchesType && matchesVehicle;
    });
  }, [inspections, vehicles, drivers, searchTerm, typeFilter, vehicleFilter]);

  const totalPages = Math.ceil(filteredInspections.length / ITEMS_PER_PAGE);
  const paginatedInspections = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInspections.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInspections, currentPage]);

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

  const handleViewDetails = (inspection: VehicleInspection) => {
    setSelectedInspection(inspection);
    setIsDetailsOpen(true);
  };

  const handleEdit = (inspection: VehicleInspection) => {
    setEditingInspection(inspection);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteInspection.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleExportExcel = async () => {
    if (filteredInspections.length === 0) {
      toast.error('Nenhuma vistoria para exportar');
      return;
    }

    try {
      await exportToExcel({
        inspections: filteredInspections,
        drivers,
        vehicles,
      });
      toast.success('Exportação concluída com sucesso!');
    } catch (error) {
      console.error('Error exporting inspections:', error);
      toast.error('Erro ao exportar vistorias');
    }
  };

  const selectedVehicle = selectedInspection
    ? vehicles.find((v) => v.id === selectedInspection.vehicle_id)
    : null;
  const selectedDriver = selectedInspection
    ? drivers.find((d) => d.id === selectedInspection.driver_id)
    : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vistorias</h1>
            <p className="text-muted-foreground">
              Check-in e check-out de veículos com registro fotográfico
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={inspections.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={() => { setEditingInspection(null); setIsFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Vistoria
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por veículo ou motorista..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
                <SelectItem value="check_out">Check-out</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={handleVehicleChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Veículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os veículos</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Inspections List */}
        {filteredInspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhuma vistoria encontrada</h3>
            <p className="text-muted-foreground mt-1">
              {inspections.length === 0
                ? 'Registre a primeira vistoria de um veículo'
                : 'Tente ajustar os filtros de busca'}
            </p>
            {inspections.length === 0 && (
              <Button className="mt-4" onClick={() => { setEditingInspection(null); setIsFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Vistoria
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedInspections.map((inspection) => {
                const vehicle = vehicles.find((v) => v.id === inspection.vehicle_id);
                const driver = drivers.find((d) => d.id === inspection.driver_id);

                return (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      vehicle={vehicle}
                      driver={driver}
                      onView={() => handleViewDetails(inspection)}
                      onEdit={() => handleEdit(inspection)}
                      onDelete={() => setDeleteConfirmId(inspection.id)}
                    />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredInspections.length)} de {filteredInspections.length} vistorias
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
        )}
      </div>

      {/* Form Dialog */}
      <InspectionFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingInspection(null);
        }}
        vehicles={vehicles}
        drivers={drivers}
        contracts={contracts}
        inspection={editingInspection}
      />

      {/* Details Dialog */}
      <InspectionDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        inspection={selectedInspection}
        vehicle={selectedVehicle}
        driver={selectedDriver}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vistoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro de vistoria e todas as fotos
              associadas serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
