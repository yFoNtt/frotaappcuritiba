import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuditLog, TABLE_LABELS, ACTION_LABELS } from '@/hooks/useAuditLogs';
import { toast } from 'sonner';

const colHeaderStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '3B82F6' } } };

function styledCell(v: string | number, style?: object) {
  return { v, t: typeof v === 'number' ? 'n' as const : 's' as const, s: style };
}

export function useAuditLogsExport() {
  const exportToPDF = useCallback((logs: AuditLog[]) => {
    if (logs.length === 0) {
      toast.error('Nenhum log para exportar');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Logs de Auditoria', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${today} • ${logs.length} registro${logs.length !== 1 ? 's' : ''}`, pageWidth / 2, 28, { align: 'center' });

    autoTable(doc, {
      startY: 38,
      head: [['Data/Hora', 'Autor', 'Tabela', 'Ação', 'Campos Alterados']],
      body: logs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        log.changed_by_name || '—',
        TABLE_LABELS[log.table_name] || log.table_name,
        ACTION_LABELS[log.action] || log.action,
        log.changed_fields?.join(', ') || '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30 },
        4: { cellWidth: 50 },
      },
    });

    doc.save(`logs-auditoria-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exportado com sucesso');
  }, []);

  const exportToExcel = useCallback((logs: AuditLog[]) => {
    if (logs.length === 0) {
      toast.error('Nenhum log para exportar');
      return;
    }

    const wb = XLSX.utils.book_new();

    const rows = [
      [
        styledCell('Data/Hora', colHeaderStyle),
        styledCell('Autor', colHeaderStyle),
        styledCell('Tabela', colHeaderStyle),
        styledCell('Ação', colHeaderStyle),
        styledCell('ID do Registro', colHeaderStyle),
        styledCell('Campos Alterados', colHeaderStyle),
      ],
      ...logs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        log.changed_by_name || '—',
        TABLE_LABELS[log.table_name] || log.table_name,
        ACTION_LABELS[log.action] || log.action,
        log.record_id,
        log.changed_fields?.join(', ') || '—',
      ]),
    ];

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 14 },
      { wch: 38 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, sheet, 'Logs de Auditoria');

    XLSX.writeFile(wb, `logs-auditoria-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel exportado com sucesso');
  }, []);

  return { exportToPDF, exportToExcel };
}
