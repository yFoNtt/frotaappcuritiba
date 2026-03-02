import { Route } from "react-router-dom";
import Index from "@/pages/Index";
import Vehicles from "@/pages/Vehicles";
import VehicleDetails from "@/pages/VehicleDetails";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import HowItWorks from "@/pages/HowItWorks";
import ForRenters from "@/pages/ForRenters";

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/veiculos" element={<Vehicles />} />
    <Route path="/veiculos/:id" element={<VehicleDetails />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/cadastro" element={<Auth />} />
    <Route path="/esqueci-senha" element={<ForgotPassword />} />
    <Route path="/redefinir-senha" element={<ResetPassword />} />
    <Route path="/como-funciona" element={<HowItWorks />} />
    <Route path="/para-locadores" element={<ForRenters />} />
  </>
);
