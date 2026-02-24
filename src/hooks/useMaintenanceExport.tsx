import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Maintenance, MAINTENANCE_TYPES, MAINTENANCE_STATUS } from './useMaintenances';
import { Vehicle } from './useVehicles';

interface ExportOptions {
  maintenances: Maintenance[];
  vehicles: Vehicle[];
  filters: {
    search: string;
    type: string;
    status: string;
    vehicleId: string;
  };
}

const boldStyle = { font: { bold: true } };
const headerStyle = { font: { bold: true, sz: 14 } };
const colHeaderStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '3B82F6' } } };

function styledCell(v: string | number, style?: object) {
  return { v, t: typeof v === 'number' ? 'n' as const : 's' as const, s: style };
}

export function useMaintenanceExport() {
  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });

  const getVehicleName = (vehicleId: string, vehicles: Vehicle[]) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : '-';
  };

  const getVehiclePlate = (vehicleId: string, vehicles: Vehicle[]) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.plate || '-';
  };

  const getActiveFiltersDescription = (filters: ExportOptions['filters'], vehicles: Vehicle[]) => {
    const parts: string[] = [];
    if (filters.search) parts.push(`Busca: "${filters.search}"`);
    if (filters.type !== 'all') parts.push(`Tipo: ${MAINTENANCE_TYPES[filters.type as keyof typeof MAINTENANCE_TYPES]}`);
    if (filters.status !== 'all') parts.push(`Status: ${MAINTENANCE_STATUS[filters.status as keyof typeof MAINTENANCE_STATUS]}`);
    if (filters.vehicleId !== 'all') {
      const vehicle = vehicles.find(v => v.id === filters.vehicleId);
      if (vehicle) parts.push(`Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`);
    }
    return parts.length > 0 ? parts.join(' | ') : 'Nenhum filtro aplicado';
  };

  const exportToPDF = useCallback(({ maintenances, vehicles, filters }: ExportOptions) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Manutenções', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${today}`, pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Filtros: ${getActiveFiltersDescription(filters, vehicles)}`, 14, 38);
    doc.setTextColor(0);

    const completedMaintenances = maintenances.filter(m => m.status === 'completed');
    const totalCost = completedMaintenances.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const avgCost = completedMaintenances.length > 0 ? totalCost / completedMaintenances.length : 0;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Registros', maintenances.length.toString()],
        ['Manutenções Concluídas', completedMaintenances.length.toString()],
        ['Custo Total', formatCurrency(totalCost)],
        ['Custo Médio', formatCurrency(avgCost)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    const tableY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento das Manutenções', 14, tableY);

    autoTable(doc, {
      startY: tableY + 5,
      head: [['Data', 'Veículo', 'Placa', 'Tipo', 'Descrição', 'Status', 'Custo']],
      body: maintenances.map(m => [
        formatDate(m.performed_at),
        getVehicleName(m.vehicle_id, vehicles),
        getVehiclePlate(m.vehicle_id, vehicles),
        MAINTENANCE_TYPES[m.type as keyof typeof MAINTENANCE_TYPES] || m.type,
        m.description.length > 30 ? m.description.substring(0, 30) + '...' : m.description,
        MAINTENANCE_STATUS[m.status as keyof typeof MAINTENANCE_STATUS] || m.status,
        formatCurrency(Number(m.cost || 0)),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 40 },
        5: { cellWidth: 22 },
        6: { cellWidth: 25 },
      },
    });

    const costByType: Record<string, number> = {};
    maintenances.forEach(m => {
      const typeName = MAINTENANCE_TYPES[m.type as keyof typeof MAINTENANCE_TYPES] || m.type;
      costByType[typeName] = (costByType[typeName] || 0) + Number(m.cost || 0);
    });

    if (Object.keys(costByType).length > 0) {
      const breakdownY = (doc as any).lastAutoTable.finalY + 15;
      if (breakdownY > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Custos por Tipo de Manutenção', 14, 20);
        autoTable(doc, {
          startY: 25,
          head: [['Tipo de Manutenção', 'Custo Total']],
          body: Object.entries(costByType).sort((a, b) => b[1] - a[1]).map(([type, cost]) => [type, formatCurrency(cost)]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Custos por Tipo de Manutenção', 14, breakdownY);
        autoTable(doc, {
          startY: breakdownY + 5,
          head: [['Tipo de Manutenção', 'Custo Total']],
          body: Object.entries(costByType).sort((a, b) => b[1] - a[1]).map(([type, cost]) => [type, formatCurrency(cost)]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }
    }

    doc.save(`manutencoes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }, []);

  const exportToExcel = useCallback(async ({ maintenances, vehicles, filters }: ExportOptions) => {
    const wb = XLSX.utils.book_new();

    const completedMaintenances = maintenances.filter(m => m.status === 'completed');
    const totalCost = completedMaintenances.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const avgCost = completedMaintenances.length > 0 ? totalCost / completedMaintenances.length : 0;

    // Summary sheet
    const summaryData = [
      [styledCell('Histórico de Manutenções', headerStyle)],
      [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
      [`Filtros: ${getActiveFiltersDescription(filters, vehicles)}`],
      [],
      [styledCell('RESUMO', boldStyle)],
      [styledCell('Métrica', boldStyle), styledCell('Valor', boldStyle)],
      ['Total de Registros', maintenances.length],
      ['Manutenções Concluídas', completedMaintenances.length],
      ['Custo Total (R$)', totalCost],
      ['Custo Médio (R$)', avgCost],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo');

    // Maintenances sheet
    const maintenanceRows = [
      ['Data', 'Veículo', 'Placa', 'Tipo', 'Descrição', 'Status', 'Custo (R$)', 'KM na Manutenção', 'Prestador de Serviço', 'Próxima Manutenção', 'Próximo KM', 'Observações'].map(h => styledCell(h, colHeaderStyle)),
      ...maintenances.map(m => [
        formatDate(m.performed_at),
        getVehicleName(m.vehicle_id, vehicles),
        getVehiclePlate(m.vehicle_id, vehicles),
        MAINTENANCE_TYPES[m.type as keyof typeof MAINTENANCE_TYPES] || m.type,
        m.description,
        MAINTENANCE_STATUS[m.status as keyof typeof MAINTENANCE_STATUS] || m.status,
        Number(m.cost || 0),
        m.km_at_maintenance || '',
        m.service_provider || '',
        m.next_maintenance_date ? formatDate(m.next_maintenance_date) : '',
        m.next_maintenance_km || '',
        m.notes || '',
      ]),
    ];
    const maintenanceSheet = XLSX.utils.aoa_to_sheet(maintenanceRows);
    maintenanceSheet['!cols'] = Array(12).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(wb, maintenanceSheet, 'Manutenções');

    // Cost by type sheet
    const costByType: Record<string, { count: number; cost: number }> = {};
    maintenances.forEach(m => {
      const typeName = MAINTENANCE_TYPES[m.type as keyof typeof MAINTENANCE_TYPES] || m.type;
      if (!costByType[typeName]) costByType[typeName] = { count: 0, cost: 0 };
      costByType[typeName].count += 1;
      costByType[typeName].cost += Number(m.cost || 0);
    });

    const costRows = [
      ['Tipo de Manutenção', 'Quantidade', 'Custo Total (R$)', 'Custo Médio (R$)'].map(h => styledCell(h, colHeaderStyle)),
      ...Object.entries(costByType).sort((a, b) => b[1].cost - a[1].cost).map(([type, data]) => [
        type, data.count, data.cost, data.count > 0 ? data.cost / data.count : 0,
      ]),
    ];
    const costSheet = XLSX.utils.aoa_to_sheet(costRows);
    costSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, costSheet, 'Custos por Tipo');

    // Cost by vehicle sheet
    const costByVehicle: Record<string, { count: number; cost: number; plate: string }> = {};
    maintenances.forEach(m => {
      const vehicleName = getVehicleName(m.vehicle_id, vehicles);
      const plate = getVehiclePlate(m.vehicle_id, vehicles);
      if (!costByVehicle[m.vehicle_id]) costByVehicle[m.vehicle_id] = { count: 0, cost: 0, plate };
      costByVehicle[m.vehicle_id].count += 1;
      costByVehicle[m.vehicle_id].cost += Number(m.cost || 0);
    });

    const vehicleRows = [
      ['Veículo', 'Placa', 'Quantidade', 'Custo Total (R$)', 'Custo Médio (R$)'].map(h => styledCell(h, colHeaderStyle)),
      ...Object.entries(costByVehicle).sort((a, b) => b[1].cost - a[1].cost).map(([vehicleId, data]) => [
        getVehicleName(vehicleId, vehicles), data.plate, data.count, data.cost, data.count > 0 ? data.cost / data.count : 0,
      ]),
    ];
    const vehicleSheet = XLSX.utils.aoa_to_sheet(vehicleRows);
    vehicleSheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, vehicleSheet, 'Custos por Veículo');

    XLSX.writeFile(wb, `manutencoes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }, []);

  return { exportToPDF, exportToExcel };
}
