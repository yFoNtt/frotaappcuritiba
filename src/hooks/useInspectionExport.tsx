import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    case 'ok':
      return '✓ OK';
    case 'not_ok':
      return '✗ Problema';
    case 'not_applicable':
      return '— N/A';
    default:
      return '-';
  }
};

const getStatusColor = (status: ChecklistStatus): [number, number, number] => {
  switch (status) {
    case 'ok':
      return [34, 197, 94]; // green
    case 'not_ok':
      return [239, 68, 68]; // red
    case 'not_applicable':
      return [156, 163, 175]; // gray
    default:
      return [0, 0, 0];
  }
};

export function useInspectionExport() {
  const exportToPDF = ({ vehicleName, vehiclePlate, inspections, includeChecklist = true }: ExportOptions) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Vistorias', pageWidth / 2, 20, { align: 'center' });

    // Vehicle info
    if (vehicleName || vehiclePlate) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const vehicleInfo = [vehicleName, vehiclePlate].filter(Boolean).join(' - ');
      doc.text(vehicleInfo, pageWidth / 2, 30, { align: 'center' });
    }

    // Generation date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth / 2,
      38,
      { align: 'center' }
    );

    // Summary
    doc.setTextColor(0);
    doc.setFontSize(11);
    const checkIns = inspections.filter((i) => i.type === 'check_in').length;
    const checkOuts = inspections.filter((i) => i.type === 'check_out').length;
    doc.text(`Total: ${inspections.length} vistorias (${checkIns} check-ins, ${checkOuts} check-outs)`, 14, 48);

    // Table data
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

    // Main table
    autoTable(doc, {
      startY: 55,
      head: [
        ['Tipo', 'Data/Hora', 'KM', 'Combustível', 'Externo', 'Interno', 'Pneus', 'Sistemas'],
      ],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 25 },
      },
    });

    // Get the final Y position after the table
    let currentY = (doc as any).lastAutoTable?.finalY || 100;

    // Add detailed info for each inspection
    inspections.forEach((inspection, inspectionIndex) => {
      const hasDetails = inspection.damages || inspection.notes;
      const hasChecklist = includeChecklist && inspection.checklist && Object.keys(inspection.checklist).length > 0;

      if (!hasDetails && !hasChecklist) return;

      // Check if we need a new page
      if (currentY > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        currentY = 20;
      }

      // Add section header for this inspection
      currentY += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(
        `${INSPECTION_TYPES[inspection.type]} - ${format(new Date(inspection.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        14,
        currentY
      );
      currentY += 8;
      doc.setTextColor(0);

      // Add damages and notes
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

      // Add checklist details
      if (hasChecklist) {
        const checklist = jsonToChecklist(inspection.checklist as Record<string, ChecklistStatus>);
        
        // Count summary
        const summary = checklist.reduce(
          (acc, category) => {
            category.items.forEach((item) => {
              acc[item.status]++;
            });
            return acc;
          },
          { ok: 0, not_ok: 0, not_applicable: 0 } as Record<ChecklistStatus, number>
        );

        // Check if we need a new page
        if (currentY > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          currentY = 20;
        }

        // Checklist summary header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Checklist de Vistoria:', 14, currentY);
        currentY += 5;

        // Summary badges
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

        // Only show items with problems in detail, or all items if there are few problems
        const showProblemsOnly = summary.not_ok > 0;
        
        checklist.forEach((category) => {
          const itemsToShow = showProblemsOnly 
            ? category.items.filter(item => item.status === 'not_ok')
            : category.items;

          if (itemsToShow.length === 0) return;

          // Check if we need a new page
          if (currentY > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            currentY = 20;
          }

          // Category header
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(80);
          doc.text(category.title, 14, currentY);
          currentY += 5;

          // Items table for this category
          const categoryTableData = itemsToShow.map((item) => [
            item.label,
            getStatusLabel(item.status),
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [],
            body: categoryTableData,
            styles: {
              fontSize: 8,
              cellPadding: 1.5,
            },
            columnStyles: {
              0: { cellWidth: 100 },
              1: { cellWidth: 30, halign: 'center' },
            },
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

        // If showing problems only, add a note
        if (showProblemsOnly && summary.not_ok > 0) {
          doc.setFontSize(7);
          doc.setTextColor(100);
          doc.setFont('helvetica', 'italic');
          doc.text('* Exibindo apenas itens com problemas identificados', 14, currentY);
          currentY += 5;
        }
      }

      // Add separator between inspections
      if (inspectionIndex < inspections.length - 1) {
        doc.setDrawColor(200);
        doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);
        currentY += 6;
      }
    });

    // Footer on all pages
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

    // Generate filename
    const fileName = vehiclePlate
      ? `vistorias_${vehiclePlate.replace(/[^a-zA-Z0-9]/g, '')}_${format(new Date(), 'yyyyMMdd')}.pdf`
      : `vistorias_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

    doc.save(fileName);
  };

  return { exportToPDF };
}
