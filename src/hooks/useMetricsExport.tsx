import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface PlatformStats {
  totalUsers: number;
  totalLocadores: number;
  totalMotoristas: number;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  totalDrivers: number;
  totalContracts: number;
  activeContracts: number;
}

interface VehicleStatusData {
  name: string;
  value: number;
}

interface MonthlyData {
  month: string;
  users: number;
  vehicles: number;
  totalUsers: number;
  totalVehicles: number;
}

interface ContractStatusData {
  name: string;
  value: number;
}

interface MetricsExportData {
  stats: PlatformStats;
  vehicleStatusData: VehicleStatusData[];
  monthlyData: MonthlyData[];
  contractStatusData: ContractStatusData[];
  occupancyRate: number;
  contractConversionRate: number;
  vehicleUtilization: number;
}

export function useMetricsExport() {
  const exportToPDF = (data: MetricsExportData) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Indicadores', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0);

      // KPIs Section
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicadores Principais', 14, yPos);

      yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [['Indicador', 'Valor', 'Detalhes']],
        body: [
          ['Taxa de Ocupação', `${data.occupancyRate}%`, `${data.stats.rentedVehicles} de ${data.stats.totalVehicles} veículos`],
          ['Conversão de Motoristas', `${data.contractConversionRate}%`, `${data.stats.activeContracts} contratos para ${data.stats.totalDrivers} motoristas`],
          ['Utilização Total', `${data.vehicleUtilization}%`, 'Veículos em uso ou manutenção'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Platform Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo da Plataforma', 14, yPos);

      yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Total', 'Ativos/Disponíveis']],
        body: [
          ['Usuários', data.stats.totalUsers.toString(), `${data.stats.totalLocadores} locadores, ${data.stats.totalMotoristas} motoristas`],
          ['Veículos', data.stats.totalVehicles.toString(), `${data.stats.availableVehicles} disponíveis`],
          ['Motoristas', data.stats.totalDrivers.toString(), '-'],
          ['Contratos', data.stats.totalContracts.toString(), `${data.stats.activeContracts} ativos`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Vehicle Status Distribution
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição da Frota', 14, yPos);

      yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [['Status', 'Quantidade', 'Percentual']],
        body: data.vehicleStatusData.map(item => {
          const percentage = data.stats.totalVehicles > 0 
            ? ((item.value / data.stats.totalVehicles) * 100).toFixed(1) 
            : '0';
          return [item.name, item.value.toString(), `${percentage}%`];
        }),
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Contract Status Distribution
      if (data.contractStatusData.some(c => c.value > 0)) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Distribuição de Contratos', 14, yPos);

        yPos += 8;
        autoTable(doc, {
          startY: yPos,
          head: [['Status', 'Quantidade', 'Percentual']],
          body: data.contractStatusData.map(item => {
            const percentage = data.stats.totalContracts > 0 
              ? ((item.value / data.stats.totalContracts) * 100).toFixed(1) 
              : '0';
            return [item.name, item.value.toString(), `${percentage}%`];
          }),
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246], fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 4 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Monthly Data
      if (data.monthlyData.length > 0) {
        // Check if we need a new page
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Evolução Mensal', 14, yPos);

        yPos += 8;
        autoTable(doc, {
          startY: yPos,
          head: [['Mês', 'Novos Usuários', 'Novos Veículos', 'Total Usuários', 'Total Veículos']],
          body: data.monthlyData.map(item => [
            item.month,
            item.users.toString(),
            item.vehicles.toString(),
            item.totalUsers.toString(),
            item.totalVehicles.toString(),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [20, 184, 166], fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 4 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      const fileName = `indicadores_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      doc.save(fileName);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  return { exportToPDF };
}
