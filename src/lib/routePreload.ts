/**
 * Route preload map — maps route paths to their lazy import functions.
 * Calling preload(path) will trigger the dynamic import so the chunk
 * is already cached by the time the user navigates.
 */

const routeImportMap: Record<string, () => Promise<unknown>> = {
  // Public
  '/': () => import('@/pages/Index'),
  '/veiculos': () => import('@/pages/Vehicles'),
  '/como-funciona': () => import('@/pages/HowItWorks'),
  '/para-locadores': () => import('@/pages/ForRenters'),
  '/login': () => import('@/pages/Auth'),
  '/cadastro': () => import('@/pages/Auth'),
  '/esqueci-senha': () => import('@/pages/ForgotPassword'),
  '/redefinir-senha': () => import('@/pages/ResetPassword'),
  // Admin
  '/admin': () => import('@/pages/admin/Dashboard'),
  '/admin/usuarios': () => import('@/pages/admin/Users'),
  '/admin/locadores': () => import('@/pages/admin/Locadores'),
  '/admin/veiculos': () => import('@/pages/admin/Vehicles'),
  '/admin/planos': () => import('@/pages/admin/Plans'),
  '/admin/metricas': () => import('@/pages/admin/Metrics'),
  '/admin/auditoria': () => import('@/pages/admin/AuditLogs'),
  '/admin/configuracoes': () => import('@/pages/admin/Settings'),
  // Locador
  '/locador': () => import('@/pages/locador/Dashboard'),
  '/locador/veiculos': () => import('@/pages/locador/Vehicles'),
  '/locador/motoristas': () => import('@/pages/locador/Drivers'),
  '/locador/contratos': () => import('@/pages/locador/Contracts'),
  '/locador/vistorias': () => import('@/pages/locador/Inspections'),
  '/locador/pagamentos': () => import('@/pages/locador/Payments'),
  '/locador/manutencao': () => import('@/pages/locador/Maintenance'),
  '/locador/quilometragem': () => import('@/pages/locador/Mileage'),
  '/locador/relatorios': () => import('@/pages/locador/Reports'),
  '/locador/documentos': () => import('@/pages/locador/Documents'),
  '/locador/solicitacoes': () => import('@/pages/locador/DocumentRequests'),
  '/locador/alertas': () => import('@/pages/locador/Alerts'),
  '/locador/auditoria': () => import('@/pages/locador/AuditLogs'),
  '/locador/notificacoes': () => import('@/pages/locador/Notifications'),
  '/locador/configuracoes': () => import('@/pages/locador/Settings'),
  // Motorista
  '/motorista': () => import('@/pages/motorista/Dashboard'),
  '/motorista/veiculo': () => import('@/pages/motorista/Vehicle'),
  '/motorista/pagamentos': () => import('@/pages/motorista/Payments'),
  '/motorista/documentos': () => import('@/pages/motorista/Documents'),
  '/motorista/historico': () => import('@/pages/motorista/History'),
  '/motorista/configuracoes': () => import('@/pages/motorista/Settings'),
};

const preloaded = new Set<string>();

/**
 * Preload the JS chunk for a given route path.
 * Safe to call multiple times — each path is only fetched once.
 */
export function preloadRoute(path: string) {
  if (preloaded.has(path)) return;
  const loader = routeImportMap[path];
  if (loader) {
    preloaded.add(path);
    loader();
  }
}

/**
 * Preload multiple routes at once (e.g. on idle after initial render).
 */
export function preloadRoutes(paths: string[]) {
  paths.forEach(preloadRoute);
}

/**
 * Preload critical public routes after the app is idle.
 * Uses requestIdleCallback when available, falls back to setTimeout.
 */
export function preloadCriticalRoutes() {
  const criticalPaths = ['/veiculos', '/como-funciona', '/login'];
  const schedule = typeof requestIdleCallback === 'function'
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 2000);

  schedule(() => preloadRoutes(criticalPaths));
}
