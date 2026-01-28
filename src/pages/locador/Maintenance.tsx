import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Plus, Wrench, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useMaintenanceExport } from '@/hooks/useMaintenanceExport';
import { isBefore, addDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { 
  useLocadorMaintenances, 
  useCreateMaintenance, 
  useUpdateMaintenance,
  useDeleteMaintenance,
  useCompleteMaintenance,
  Maintenance,
  MaintenanceInsert
} from '@/hooks/useMaintenances';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { MaintenanceStatsCards } from '@/components/maintenance/MaintenanceStatsCards';
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable';
import { MaintenanceFormDialog } from '@/components/maintenance/MaintenanceFormDialog';
import { MaintenanceDetailsDialog } from '@/components/maintenance/MaintenanceDetailsDialog';
import { MaintenanceFilters, MaintenanceFiltersState } from '@/components/maintenance/MaintenanceFilters';
import { UpcomingMaintenanceCard } from '@/components/maintenance/UpcomingMaintenanceCard';

export default function LocadorMaintenance() {
  const [filters, setFilters] = useState<MaintenanceFiltersState>({
    search: '',
    type: 'all',
    status: 'all',
    vehicleId: 'all',
  });
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [viewingMaintenance, setViewingMaintenance] = useState<Maintenance | null>(null);
  const [deletingMaintenance, setDeletingMaintenance] = useState<Maintenance | null>(null);

  const { data: maintenances = [], isLoading: maintenancesLoading } = useLocadorMaintenances();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useLocadorVehicles();
  
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();
  const completeMaintenance = useCompleteMaintenance();
  const { exportToPDF, exportToExcel } = useMaintenanceExport();

  const isLoading = maintenancesLoading || vehiclesLoading;

  const handleExportPDF = () => {
    exportToPDF({ maintenances: filteredMaintenances, vehicles, filters });
  };

  const handleExportExcel = () => {
    exportToExcel({ maintenances: filteredMaintenances, vehicles, filters });
  };

  // Filter maintenances
  const filteredMaintenances = useMemo(() => {
    return maintenances.filter(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id);
      const matchesSearch = 
        m.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        vehicle?.model.toLowerCase().includes(filters.search.toLowerCase()) ||
        vehicle?.brand.toLowerCase().includes(filters.search.toLowerCase()) ||
        m.service_provider?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = filters.type === 'all' || m.type === filters.type;
      const matchesStatus = filters.status === 'all' || m.status === filters.status;
      const matchesVehicle = filters.vehicleId === 'all' || m.vehicle_id === filters.vehicleId;
      return matchesSearch && matchesType && matchesStatus && matchesVehicle;
    });
  }, [maintenances, vehicles, filters]);

  // Calculate upcoming maintenances (within 30 days or scheduled)
  const upcomingMaintenances = useMemo(() => {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return maintenances.filter(m => {
      if (m.status === 'scheduled') return true;
      if (m.next_maintenance_date && m.status === 'completed') {
        const nextDate = parseISO(m.next_maintenance_date);
        return isBefore(nextDate, thirtyDaysFromNow);
      }
      return false;
    });
  }, [maintenances]);

  // Calculate stats
  const stats = useMemo(() => {
    const completedMaintenances = maintenances.filter(m => m.status === 'completed');
    const totalCost = completedMaintenances.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const averageCost = completedMaintenances.length > 0 ? totalCost / completedMaintenances.length : 0;
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const completedThisMonth = completedMaintenances.filter(m => {
      const date = parseISO(m.performed_at);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    }).length;

    const scheduledCount = maintenances.filter(m => m.status === 'scheduled').length;
    
    return { 
      totalCost, 
      totalRecords: maintenances.length, 
      scheduledCount, 
      upcomingCount: upcomingMaintenances.length,
      completedThisMonth,
      averageCost
    };
  }, [maintenances, upcomingMaintenances]);

  const handleOpenAddDialog = () => {
    setEditingMaintenance(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setViewingMaintenance(null);
    setIsFormDialogOpen(true);
  };

  const handleViewDetails = (maintenance: Maintenance) => {
    setViewingMaintenance(maintenance);
  };

  const handleSubmit = async (data: MaintenanceInsert, isEditing: boolean, maintenanceId?: string) => {
    if (isEditing && maintenanceId) {
      await updateMaintenance.mutateAsync({ id: maintenanceId, updates: data });
    } else {
      await createMaintenance.mutateAsync(data);
    }
    setIsFormDialogOpen(false);
    setEditingMaintenance(null);
  };

  const handleDelete = async () => {
    if (deletingMaintenance) {
      await deleteMaintenance.mutateAsync(deletingMaintenance.id);
      setDeletingMaintenance(null);
      setViewingMaintenance(null);
    }
  };

  const handleComplete = async (id: string) => {
    await completeMaintenance.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-16" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Wrench className="h-8 w-8" />
                Manutenções
              </h1>
              <p className="text-muted-foreground">
                Registre e acompanhe as manutenções dos veículos
              </p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" disabled={filteredMaintenances.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleOpenAddDialog} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Manutenção
              </Button>
            </div>
          </div>

          {/* Stats */}
          <MaintenanceStatsCards stats={stats} />

          {/* Upcoming Maintenances + Filters */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MaintenanceFilters 
                filters={filters}
                onFiltersChange={setFilters}
                vehicles={vehicles}
                resultCount={filteredMaintenances.length}
              />
            </div>
            <div>
              <UpcomingMaintenanceCard 
                maintenances={upcomingMaintenances}
                vehicles={vehicles}
                onViewDetails={handleViewDetails}
                onComplete={handleComplete}
              />
            </div>
          </div>

          {/* Table */}
          <MaintenanceTable
            maintenances={filteredMaintenances}
            vehicles={vehicles}
            onEdit={handleOpenEditDialog}
            onDelete={setDeletingMaintenance}
            onComplete={handleComplete}
            onViewDetails={handleViewDetails}
            onAddNew={handleOpenAddDialog}
            totalCount={maintenances.length}
          />

          {/* Form Dialog */}
          <MaintenanceFormDialog
            open={isFormDialogOpen}
            onOpenChange={setIsFormDialogOpen}
            maintenance={editingMaintenance}
            vehicles={vehicles}
            onSubmit={handleSubmit}
            isSubmitting={createMaintenance.isPending || updateMaintenance.isPending}
          />

          {/* Details Dialog */}
          <MaintenanceDetailsDialog
            open={!!viewingMaintenance}
            onOpenChange={(open) => !open && setViewingMaintenance(null)}
            maintenance={viewingMaintenance}
            vehicle={viewingMaintenance ? vehicles.find(v => v.id === viewingMaintenance.vehicle_id) : undefined}
            onEdit={() => viewingMaintenance && handleOpenEditDialog(viewingMaintenance)}
            onDelete={() => viewingMaintenance && setDeletingMaintenance(viewingMaintenance)}
            onComplete={() => viewingMaintenance && handleComplete(viewingMaintenance.id)}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deletingMaintenance} onOpenChange={() => setDeletingMaintenance(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Manutenção</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
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
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
