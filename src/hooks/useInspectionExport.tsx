import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  VehicleInspection,
  FUEL_LEVELS,
  CONDITION_LABELS,
  INSPECTION_TYPES,
  ChecklistStatus,
} from '@/hooks/useInspections';
import {
  jsonToChecklist,
  ChecklistCategory,
} from '@/components/inspections/InspectionChecklist';

interface ExportOptions {
  vehicleName?: string;
  vehiclePlate?: string;
  inspections: VehicleInspection[];
  includeChecklist?: boolean;
}

const getStatusLabel = (status: ChecklistStatus): string => {
  switch (status) {
    case 'ok': return '✓ OK';
    case 'not_ok': return '✗ Problema';
    case 'not_applicable': return '— N/A';
    default: return '-';
  }
};

const getStatusColor = (status: ChecklistStatus): [number, number, number] => {
  switch (status) {
    case 'ok': return [34, 197, 94];
    case 'not_ok': return [239, 68, 68];
    case 'not_applicable': return [156, 163, 175];
    default: return [0, 0, 0];
  }
};

const getStatusColorHex = (status: ChecklistStatus): string => {
  switch (status) {
    case 'ok': return '22C55E';
    case 'not_ok': return 'EF4444';
    case 'not_applicable': return '9CA3AF';
    default: return '000000';
  }
};

const boldStyle = { font: { bold: true } };
const headerStyle = { font: { bold: true, sz: 16 } };
const colHeaderStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '3B82F6' } } };
const subHeaderStyle = { font: { bold: true, color: { rgb: '3B82F6' } } };

function styledCell(v: string | number | boolean, style?: object) {
  return { v, t: typeof v === 'number' ? 'n' as const : 's' as const, s: style };
}

export function useInspectionExport() {
  const exportToPDF = ({ vehicleName, vehiclePlate, inspections, includeChecklist = true }: ExportOptions) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Vistorias', pageWidth / 2, 20, { align: 'center' });

    if (vehicleName || vehiclePlate) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const vehicleInfo = [vehicleName, vehiclePlate].filter(Boolean).join(' - ');
      doc.text(vehicleInfo, pageWidth / 2, 30, { align: 'center' });
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth / 2, 38, { align: 'center' }
    );

    doc.setTextColor(0);
    doc.setFontSize(11);
    const checkIns = inspections.filter((i) => i.type === 'check_in').length;
    const checkOuts = inspections.filter((i) => i.type === 'check_out').length;
    doc.text(`Total: ${inspections.length} vistorias (${checkIns} check-ins, ${checkOuts} check-outs)`, 14, 48);

    const tableData = inspections.map((inspection) => [
      INSPECTION_TYPES[inspection.type],
      format(new Date(inspection.performed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      `${inspection.km_reading.toLocaleString('pt-BR')} km`,
      FUEL_LEVELS[inspection.fuel_level],
      CONDITION_LABELS[inspection.exterior_condition as keyof typeof CONDITION_LABELS],
      CONDITION_LABELS[inspection.interior_condition as keyof typeof CONDITION_LABELS],
      inspection.tires_condition
        ? CONDITION_LABELS[inspection.tires_condition as keyof typeof CONDITION_LABELS]
        : '-',
      [
        inspection.lights_working ? '✓ Faróis' : '✗ Faróis',
        inspection.ac_working ? '✓ A/C' : '✗ A/C',
      ].join('\n'),
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Tipo', 'Data/Hora', 'KM', 'Combustível', 'Externo', 'Interno', 'Pneus', 'Sistemas']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 25 }, 1: { cellWidth: 30 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 },
        4: { cellWidth: 20 }, 5: { cellWidth: 20 }, 6: { cellWidth: 20 }, 7: { cellWidth: 25 },
      },
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 100;

    inspections.forEach((inspection, inspectionIndex) => {
      const hasDetails = inspection.damages || inspection.notes;
      const hasChecklist = includeChecklist && inspection.checklist && Object.keys(inspection.checklist).length > 0;
      if (!hasDetails && !hasChecklist) return;

      if (currentY > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        currentY = 20;
      }

      currentY += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(
        `${INSPECTION_TYPES[inspection.type]} - ${format(new Date(inspection.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        14, currentY
      );
      currentY += 8;
      doc.setTextColor(0);

      if (hasDetails) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        if (inspection.damages) {
          doc.setTextColor(180, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text('Avarias/Danos:', 14, currentY);
          doc.setFont('helvetica', 'normal');
          currentY += 5;
          doc.setTextColor(0);
          const damagesLines = doc.splitTextToSize(inspection.damages, pageWidth - 28);
          doc.text(damagesLines, 14, currentY);
          currentY += damagesLines.length * 4 + 3;
        }

        if (inspection.notes) {
          doc.setTextColor(60);
          doc.setFont('helvetica', 'bold');
          doc.text('Observações:', 14, currentY);
          doc.setFont('helvetica', 'normal');
          currentY += 5;
          doc.setTextColor(0);
          const notesLines = doc.splitTextToSize(inspection.notes, pageWidth - 28);
          doc.text(notesLines, 14, currentY);
          currentY += notesLines.length * 4 + 3;
        }

        if (inspection.photos && inspection.photos.length > 0) {
          doc.setTextColor(60);
          doc.text(`📷 ${inspection.photos.length} foto(s) registrada(s)`, 14, currentY);
          currentY += 6;
        }
      }

      if (hasChecklist) {
        const checklist = jsonToChecklist(inspection.checklist as Record<string, ChecklistStatus>);
        const summary = checklist.reduce(
          (acc, category) => {
            category.items.forEach((item) => { acc[item.status]++; });
            return acc;
          },
          { ok: 0, not_ok: 0, not_applicable: 0 } as Record<ChecklistStatus, number>
        );

        if (currentY > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Checklist de Vistoria:', 14, currentY);
        currentY += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(34, 197, 94);
        doc.text(`✓ ${summary.ok} OK`, 14, currentY);
        doc.setTextColor(239, 68, 68);
        doc.text(`✗ ${summary.not_ok} Problemas`, 40, currentY);
        doc.setTextColor(156, 163, 175);
        doc.text(`— ${summary.not_applicable} N/A`, 80, currentY);
        doc.setTextColor(0);
        currentY += 8;

        const showProblemsOnly = summary.not_ok > 0;

        checklist.forEach((category) => {
          const itemsToShow = showProblemsOnly
            ? category.items.filter(item => item.status === 'not_ok')
            : category.items;
          if (itemsToShow.length === 0) return;

          if (currentY > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(80);
          doc.text(category.title, 14, currentY);
          currentY += 5;

          const categoryTableData = itemsToShow.map((item) => [item.label, getStatusLabel(item.status)]);

          autoTable(doc, {
            startY: currentY,
            head: [],
            body: categoryTableData,
            styles: { fontSize: 8, cellPadding: 1.5 },
            columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 30, halign: 'center' } },
            didParseCell: (data) => {
              if (data.column.index === 1 && data.section === 'body') {
                const row = itemsToShow[data.row.index];
                if (row) {
                  data.cell.styles.textColor = getStatusColor(row.status);
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            },
            margin: { left: 14 },
            tableWidth: 140,
          });

          currentY = (doc as any).lastAutoTable?.finalY + 3 || currentY + 20;
        });

        if (showProblemsOnly && summary.not_ok > 0) {
          doc.setFontSize(7);
          doc.setTextColor(100);
          doc.setFont('helvetica', 'italic');
          doc.text('* Exibindo apenas itens com problemas identificados', 14, currentY);
          currentY += 5;
        }
      }

      if (inspectionIndex < inspections.length - 1) {
        doc.setDrawColor(200);
        doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);
        currentY += 6;
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    const fileName = vehiclePlate
      ? `vistorias_${vehiclePlate.replace(/[^a-zA-Z0-9]/g, '')}_${format(new Date(), 'yyyyMMdd')}.pdf`
      : `vistorias_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

    doc.save(fileName);
  };

  const exportToExcel = async ({
    vehicleName,
    vehiclePlate,
    inspections,
    drivers = [],
    vehicles = [],
  }: ExportOptions & {
    drivers?: Array<{ id: string; name: string }>;
    vehicles?: Array<{ id: string; brand: string; model: string; plate: string }>;
  }) => {
    const wb = XLSX.utils.book_new();

    const checkIns = inspections.filter((i) => i.type === 'check_in').length;
    const checkOuts = inspections.filter((i) => i.type === 'check_out').length;

    // Main inspections sheet
    const mainRows: any[][] = [
      [styledCell('Histórico de Vistorias', headerStyle)],
      [vehicleName || vehiclePlate ? [vehicleName, vehiclePlate].filter(Boolean).join(' - ') : ''],
      [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
      [],
      [styledCell(`Total: ${inspections.length} vistorias (${checkIns} check-ins, ${checkOuts} check-outs)`, boldStyle)],
      ['Tipo', 'Data/Hora', 'Veículo', 'Placa', 'Motorista', 'KM', 'Combustível', 'Externo', 'Interno', 'Pneus', 'Faróis', 'A/C', 'Avarias', 'Observações'].map(h => styledCell(h, colHeaderStyle)),
    ];

    inspections.forEach((inspection) => {
      const vehicle = vehicles.find((v) => v.id === inspection.vehicle_id);
      const driver = drivers.find((d) => d.id === inspection.driver_id);

      const getConditionColorHex = (condition: string) => {
        switch (condition) {
          case 'Excelente': return '22C55E';
          case 'Bom': return '3B82F6';
          case 'Regular': return 'F59E0B';
          case 'Ruim': return 'EF4444';
          default: return '000000';
        }
      };

      const extLabel = CONDITION_LABELS[inspection.exterior_condition as keyof typeof CONDITION_LABELS];
      const intLabel = CONDITION_LABELS[inspection.interior_condition as keyof typeof CONDITION_LABELS];
      const tiresLabel = inspection.tires_condition ? CONDITION_LABELS[inspection.tires_condition as keyof typeof CONDITION_LABELS] : '-';

      mainRows.push([
        INSPECTION_TYPES[inspection.type],
        format(new Date(inspection.performed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        vehicle ? `${vehicle.brand} ${vehicle.model}` : '-',
        vehicle?.plate || '-',
        driver?.name || '-',
        inspection.km_reading,
        FUEL_LEVELS[inspection.fuel_level],
        styledCell(extLabel, { font: { color: { rgb: getConditionColorHex(extLabel) } } }),
        styledCell(intLabel, { font: { color: { rgb: getConditionColorHex(intLabel) } } }),
        styledCell(tiresLabel, tiresLabel !== '-' ? { font: { color: { rgb: getConditionColorHex(tiresLabel) } } } : undefined),
        styledCell(inspection.lights_working ? 'OK' : 'Problema', { font: { color: { rgb: inspection.lights_working ? '22C55E' : 'EF4444' } } }),
        styledCell(inspection.ac_working ? 'OK' : 'Problema', { font: { color: { rgb: inspection.ac_working ? '22C55E' : 'EF4444' } } }),
        inspection.damages || '-',
        inspection.notes || '-',
      ]);
    });

    const mainSheet = XLSX.utils.aoa_to_sheet(mainRows);
    const widths = [18, 18, 20, 12, 25, 12, 14, 12, 12, 12, 12, 12, 30, 30];
    mainSheet['!cols'] = widths.map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, mainSheet, 'Vistorias');

    // Checklist sheet
    const inspectionsWithChecklist = inspections.filter(
      (i) => i.checklist && Object.keys(i.checklist).length > 0
    );

    if (inspectionsWithChecklist.length > 0) {
      const checklistRows: any[][] = [
        [styledCell('Detalhes dos Checklists', { font: { bold: true, sz: 14 } })],
        [],
      ];

      inspectionsWithChecklist.forEach((inspection) => {
        const vehicle = vehicles.find((v) => v.id === inspection.vehicle_id);
        const checklist = jsonToChecklist(inspection.checklist as Record<string, ChecklistStatus>);

        checklistRows.push([
          styledCell(
            `${INSPECTION_TYPES[inspection.type]} - ${format(new Date(inspection.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
            subHeaderStyle
          ),
          '',
          vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : '',
        ]);

        checklist.forEach((category) => {
          checklistRows.push([styledCell(category.title, boldStyle)]);
          category.items.forEach((item) => {
            checklistRows.push([
              '',
              item.label,
              styledCell(getStatusLabel(item.status), {
                font: { color: { rgb: getStatusColorHex(item.status) }, bold: item.status === 'not_ok' },
              }),
            ]);
          });
        });

        checklistRows.push([], []);
      });

      const checklistSheet = XLSX.utils.aoa_to_sheet(checklistRows);
      checklistSheet['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, checklistSheet, 'Checklists');
    }

    // Statistics sheet
    const statsRows: any[][] = [
      [styledCell('Estatísticas do Histórico', { font: { bold: true, sz: 14 } })],
      [],
      [styledCell('Métrica', boldStyle), styledCell('Valor', boldStyle)],
      ['Total de Vistorias', inspections.length],
      ['Check-ins', checkIns],
      ['Check-outs', checkOuts],
    ];

    if (inspections.length > 0) {
      const kmReadings = inspections.map((i) => i.km_reading).sort((a, b) => a - b);
      const avgKm = kmReadings.reduce((a, b) => a + b, 0) / kmReadings.length;

      statsRows.push(
        [],
        [styledCell('Quilometragem', boldStyle)],
        ['Mínima', `${kmReadings[0].toLocaleString('pt-BR')} km`],
        ['Máxima', `${kmReadings[kmReadings.length - 1].toLocaleString('pt-BR')} km`],
        ['Média', `${Math.round(avgKm).toLocaleString('pt-BR')} km`],
      );

      const conditionCounts = {
        exterior: { excellent: 0, good: 0, fair: 0, poor: 0 },
        interior: { excellent: 0, good: 0, fair: 0, poor: 0 },
      };
      inspections.forEach((i) => {
        conditionCounts.exterior[i.exterior_condition as keyof typeof conditionCounts.exterior]++;
        conditionCounts.interior[i.interior_condition as keyof typeof conditionCounts.interior]++;
      });

      statsRows.push(
        [],
        [styledCell('Condição Externa', boldStyle)],
        ['Excelente', conditionCounts.exterior.excellent],
        ['Bom', conditionCounts.exterior.good],
        ['Regular', conditionCounts.exterior.fair],
        ['Ruim', conditionCounts.exterior.poor],
        [],
        [styledCell('Condição Interna', boldStyle)],
        ['Excelente', conditionCounts.interior.excellent],
        ['Bom', conditionCounts.interior.good],
        ['Regular', conditionCounts.interior.fair],
        ['Ruim', conditionCounts.interior.poor],
      );
    }

    const statsSheet = XLSX.utils.aoa_to_sheet(statsRows);
    statsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, statsSheet, 'Estatísticas');

    const fileName = vehiclePlate
      ? `vistorias_${vehiclePlate.replace(/[^a-zA-Z0-9]/g, '')}_${format(new Date(), 'yyyyMMdd')}.xlsx`
      : `vistorias_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return { exportToPDF, exportToExcel };
}
