/**
 * Lazy loaders for heavy export libraries (jspdf ~444KB, jspdf-autotable,
 * xlsx-js-style ~627KB). These are only fetched when the user actually
 * triggers an export, keeping them out of the initial bundle graph.
 */

export async function loadPdfLibs() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
}

export async function loadXLSX() {
  const { default: XLSX } = await import('xlsx-js-style');
  return XLSX;
}
