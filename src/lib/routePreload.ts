/**
 * Route preload map — maps route paths to their lazy import functions.
 * Calling preload(path) will trigger the dynamic import so the chunk
 * is already cached by the time the user navigates.
 */

const routeImportMap: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/veiculos': () => import('@/pages/Vehicles'),
  '/como-funciona': () => import('@/pages/HowItWorks'),
  '/para-locadores': () => import('@/pages/ForRenters'),
  '/login': () => import('@/pages/Auth'),
  '/cadastro': () => import('@/pages/Auth'),
  '/esqueci-senha': () => import('@/pages/ForgotPassword'),
  '/redefinir-senha': () => import('@/pages/ResetPassword'),
  // Dashboard entries (preloaded on auth)
  '/admin': () => import('@/pages/admin/Dashboard'),
  '/locador': () => import('@/pages/locador/Dashboard'),
  '/motorista': () => import('@/pages/motorista/Dashboard'),
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
