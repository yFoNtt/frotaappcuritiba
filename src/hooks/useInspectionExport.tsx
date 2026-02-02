import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  VehicleInspection,
  FUEL_LEVELS,
  CONDITION_LABELS,
  INSPECTION_TYPES,
} from '@/hooks/useInspections';

interface ExportOptions {
  vehicleName?: string;
  vehiclePlate?: string;
  inspections: VehicleInspection[];
}

export function useInspectionExport() {
  const exportToPDF = ({ vehicleName, vehiclePlate, inspections }: ExportOptions) => {
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

    // Add detailed info for each inspection with damages or notes
    const inspectionsWithDetails = inspections.filter((i) => i.damages || i.notes);

    if (inspectionsWithDetails.length > 0) {
      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      let currentY = finalY + 15;

      // Check if we need a new page
      if (currentY > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhes Adicionais', 14, currentY);
      currentY += 10;

      inspectionsWithDetails.forEach((inspection, index) => {
        // Check if we need a new page
        if (currentY > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `${INSPECTION_TYPES[inspection.type]} - ${format(new Date(inspection.performed_at), 'dd/MM/yyyy', { locale: ptBR })}`,
          14,
          currentY
        );
        currentY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        if (inspection.damages) {
          doc.setTextColor(180, 0, 0);
          doc.text('Avarias/Danos:', 14, currentY);
          currentY += 5;
          doc.setTextColor(0);
          const damagesLines = doc.splitTextToSize(inspection.damages, pageWidth - 28);
          doc.text(damagesLines, 14, currentY);
          currentY += damagesLines.length * 4 + 3;
        }

        if (inspection.notes) {
          doc.setTextColor(60);
          doc.text('Observações:', 14, currentY);
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

        // Add separator
        if (index < inspectionsWithDetails.length - 1) {
          doc.setDrawColor(200);
          doc.line(14, currentY, pageWidth - 14, currentY);
          currentY += 8;
        }
      });
    }

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
