import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import VehicleDetails from "./pages/VehicleDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HowItWorks from "./pages/HowItWorks";
import ForRenters from "./pages/ForRenters";
import NotFound from "./pages/NotFound";

// Locador Dashboard Pages
import LocadorDashboard from "./pages/locador/Dashboard";
import LocadorVehicles from "./pages/locador/Vehicles";
import LocadorDrivers from "./pages/locador/Drivers";
import LocadorPayments from "./pages/locador/Payments";
import LocadorMaintenance from "./pages/locador/Maintenance";
import LocadorAlerts from "./pages/locador/Alerts";
import LocadorSettings from "./pages/locador/Settings";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminLocadores from "./pages/admin/Locadores";
import AdminVehicles from "./pages/admin/Vehicles";
import AdminPlans from "./pages/admin/Plans";
import AdminMetrics from "./pages/admin/Metrics";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/veiculos" element={<Vehicles />} />
          <Route path="/veiculos/:id" element={<VehicleDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="/para-locadores" element={<ForRenters />} />
          
          {/* Locador Dashboard Routes */}
          <Route path="/locador" element={<LocadorDashboard />} />
          <Route path="/locador/veiculos" element={<LocadorVehicles />} />
          <Route path="/locador/motoristas" element={<LocadorDrivers />} />
          <Route path="/locador/pagamentos" element={<LocadorPayments />} />
          <Route path="/locador/manutencao" element={<LocadorMaintenance />} />
          <Route path="/locador/alertas" element={<LocadorAlerts />} />
          <Route path="/locador/configuracoes" element={<LocadorSettings />} />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/locadores" element={<AdminLocadores />} />
          <Route path="/admin/veiculos" element={<AdminVehicles />} />
          <Route path="/admin/planos" element={<AdminPlans />} />
          <Route path="/admin/metricas" element={<AdminMetrics />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
