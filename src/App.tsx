import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { toast } from "sonner";
import NotFound from "./pages/NotFound";
import { NavigationProgress } from "@/components/NavigationProgress";

import { publicRoutes } from "@/routes/publicRoutes";
import { locadorRoutes } from "@/routes/locadorRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { motoristaRoutes } from "@/routes/motoristaRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      onError: (error) => {
        console.error('[Mutation Error]', error);
        toast.error('Ocorreu um erro ao salvar os dados. Tente novamente.');
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="frotaapp-theme">
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NavigationProgress />
        <AuthProvider>
          <Routes>
            {publicRoutes}
            {locadorRoutes}
            {adminRoutes}
            {motoristaRoutes}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
