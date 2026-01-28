import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyData {
  month: string;
  monthFull: string;
  receita: number;
  custos: number;
  lucro: number;
}

interface VehicleComparison {
  name: string;
  plate: string;
  receita: number;
  custos: number;
  lucro: number;
}

interface OccupancyData {
  rate: number;
  rented: number;
  available: number;
  maintenance: number;
  total: number;
}

interface MaintenanceCost {
  name: string;
  value: number;
}

interface Totals {
  totalReceita: number;
  totalCustos: number;
  totalLucro: number;
  receitaGrowth: number;
}

interface ExportData {
  monthlyData: MonthlyData[];
  vehicleComparison: VehicleComparison[];
  occupancyData: OccupancyData;
  maintenanceCostsByType: MaintenanceCost[];
  totals: Totals;
}

export function useReportExport() {
  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const exportToPDF = useCallback((data: ExportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Frota', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${today}`, pageWidth / 2, 28, { align: 'center' });

    // KPIs Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro (Últimos 6 meses)', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Receita Total', formatCurrency(data.totals.totalReceita)],
        ['Custos Total', formatCurrency(data.totals.totalCustos)],
        ['Lucro Líquido', formatCurrency(data.totals.totalLucro)],
        ['Crescimento vs Mês Anterior', `${data.totals.receitaGrowth.toFixed(1)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Fleet Status
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Status da Frota', 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Status', 'Quantidade', 'Percentual']],
      body: [
        ['Alugados', data.occupancyData.rented.toString(), `${data.occupancyData.total > 0 ? ((data.occupancyData.rented / data.occupancyData.total) * 100).toFixed(1) : 0}%`],
        ['Disponíveis', data.occupancyData.available.toString(), `${data.occupancyData.total > 0 ? ((data.occupancyData.available / data.occupancyData.total) * 100).toFixed(1) : 0}%`],
        ['Manutenção', data.occupancyData.maintenance.toString(), `${data.occupancyData.total > 0 ? ((data.occupancyData.maintenance / data.occupancyData.total) * 100).toFixed(1) : 0}%`],
        ['Total', data.occupancyData.total.toString(), '100%'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Monthly Data
    const monthlyY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Evolução Mensal', 14, monthlyY);

    autoTable(doc, {
      startY: monthlyY + 5,
      head: [['Mês', 'Receita', 'Custos', 'Lucro']],
      body: data.monthlyData.map(m => [
        m.monthFull,
        formatCurrency(m.receita),
        formatCurrency(m.custos),
        formatCurrency(m.lucro),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // New page for vehicle comparison
    doc.addPage();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Comparativo por Veículo', 14, 20);

    autoTable(doc, {
      startY: 25,
      head: [['Veículo', 'Placa', 'Receita', 'Custos', 'Lucro']],
      body: data.vehicleComparison.map(v => [
        v.name,
        v.plate,
        formatCurrency(v.receita),
        formatCurrency(v.custos),
        formatCurrency(v.lucro),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Maintenance costs
    const maintY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Custos por Tipo de Manutenção', 14, maintY);

    autoTable(doc, {
      startY: maintY + 5,
      head: [['Tipo', 'Custo Total']],
      body: data.maintenanceCostsByType.map(m => [
        m.name,
        formatCurrency(m.value),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Save PDF
    doc.save(`relatorio-frota-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }, []);

  const exportToExcel = useCallback(async (data: ExportData) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FrotaApp';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumo');
    summarySheet.addRow(['Relatório de Frota']);
    summarySheet.addRow([`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`]);
    summarySheet.addRow([]);
    summarySheet.addRow(['RESUMO FINANCEIRO (ÚLTIMOS 6 MESES)']);
    summarySheet.addRow(['Métrica', 'Valor']);
    summarySheet.addRow(['Receita Total', data.totals.totalReceita]);
    summarySheet.addRow(['Custos Total', data.totals.totalCustos]);
    summarySheet.addRow(['Lucro Líquido', data.totals.totalLucro]);
    summarySheet.addRow(['Crescimento vs Mês Anterior (%)', data.totals.receitaGrowth]);
    summarySheet.addRow([]);
    summarySheet.addRow(['STATUS DA FROTA']);
    summarySheet.addRow(['Status', 'Quantidade', 'Percentual (%)']);
    summarySheet.addRow(['Alugados', data.occupancyData.rented, data.occupancyData.total > 0 ? ((data.occupancyData.rented / data.occupancyData.total) * 100) : 0]);
    summarySheet.addRow(['Disponíveis', data.occupancyData.available, data.occupancyData.total > 0 ? ((data.occupancyData.available / data.occupancyData.total) * 100) : 0]);
    summarySheet.addRow(['Manutenção', data.occupancyData.maintenance, data.occupancyData.total > 0 ? ((data.occupancyData.maintenance / data.occupancyData.total) * 100) : 0]);
    summarySheet.addRow(['Total', data.occupancyData.total, 100]);

    // Style header
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.getRow(4).font = { bold: true };
    summarySheet.getRow(5).font = { bold: true };
    summarySheet.getRow(11).font = { bold: true };
    summarySheet.getRow(12).font = { bold: true };

    // Monthly data sheet
    const monthlySheet = workbook.addWorksheet('Evolução Mensal');
    monthlySheet.addRow(['Mês', 'Receita (R$)', 'Custos (R$)', 'Lucro (R$)']);
    monthlySheet.getRow(1).font = { bold: true };
    data.monthlyData.forEach(m => {
      monthlySheet.addRow([m.monthFull, m.receita, m.custos, m.lucro]);
    });

    // Vehicle comparison sheet
    const vehicleSheet = workbook.addWorksheet('Por Veículo');
    vehicleSheet.addRow(['Veículo', 'Placa', 'Receita (R$)', 'Custos (R$)', 'Lucro (R$)']);
    vehicleSheet.getRow(1).font = { bold: true };
    data.vehicleComparison.forEach(v => {
      vehicleSheet.addRow([v.name, v.plate, v.receita, v.custos, v.lucro]);
    });

    // Maintenance costs sheet
    const maintSheet = workbook.addWorksheet('Custos Manutenção');
    maintSheet.addRow(['Tipo de Manutenção', 'Custo Total (R$)']);
    maintSheet.getRow(1).font = { bold: true };
    data.maintenanceCostsByType.forEach(m => {
      maintSheet.addRow([m.name, m.value]);
    });

    // Auto-fit columns for all sheets
    [summarySheet, monthlySheet, vehicleSheet, maintSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        column.width = 20;
      });
    });

    // Save Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-frota-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportToPDF, exportToExcel };
}
