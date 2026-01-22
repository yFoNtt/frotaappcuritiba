import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

  const exportToExcel = useCallback((data: ExportData) => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Relatório de Frota'],
      [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
      [],
      ['RESUMO FINANCEIRO (ÚLTIMOS 6 MESES)'],
      ['Métrica', 'Valor'],
      ['Receita Total', data.totals.totalReceita],
      ['Custos Total', data.totals.totalCustos],
      ['Lucro Líquido', data.totals.totalLucro],
      ['Crescimento vs Mês Anterior (%)', data.totals.receitaGrowth],
      [],
      ['STATUS DA FROTA'],
      ['Status', 'Quantidade', 'Percentual (%)'],
      ['Alugados', data.occupancyData.rented, data.occupancyData.total > 0 ? ((data.occupancyData.rented / data.occupancyData.total) * 100) : 0],
      ['Disponíveis', data.occupancyData.available, data.occupancyData.total > 0 ? ((data.occupancyData.available / data.occupancyData.total) * 100) : 0],
      ['Manutenção', data.occupancyData.maintenance, data.occupancyData.total > 0 ? ((data.occupancyData.maintenance / data.occupancyData.total) * 100) : 0],
      ['Total', data.occupancyData.total, 100],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // Monthly data sheet
    const monthlyHeaders = ['Mês', 'Receita (R$)', 'Custos (R$)', 'Lucro (R$)'];
    const monthlyRows = data.monthlyData.map(m => [m.monthFull, m.receita, m.custos, m.lucro]);
    const monthlySheet = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyRows]);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Evolução Mensal');

    // Vehicle comparison sheet
    const vehicleHeaders = ['Veículo', 'Placa', 'Receita (R$)', 'Custos (R$)', 'Lucro (R$)'];
    const vehicleRows = data.vehicleComparison.map(v => [v.name, v.plate, v.receita, v.custos, v.lucro]);
    const vehicleSheet = XLSX.utils.aoa_to_sheet([vehicleHeaders, ...vehicleRows]);
    XLSX.utils.book_append_sheet(workbook, vehicleSheet, 'Por Veículo');

    // Maintenance costs sheet
    const maintHeaders = ['Tipo de Manutenção', 'Custo Total (R$)'];
    const maintRows = data.maintenanceCostsByType.map(m => [m.name, m.value]);
    const maintSheet = XLSX.utils.aoa_to_sheet([maintHeaders, ...maintRows]);
    XLSX.utils.book_append_sheet(workbook, maintSheet, 'Custos Manutenção');

    // Save Excel
    XLSX.writeFile(workbook, `relatorio-frota-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }, []);

  return { exportToPDF, exportToExcel };
}
