import { lazy } from "react";
import { Route } from "react-router-dom";
import { LazyFallback as Lazy } from "@/components/LazyFallback";

const Index = lazy(() => import("@/pages/Index"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const VehicleDetails = lazy(() => import("@/pages/VehicleDetails"));
const Auth = lazy(() => import("@/pages/Auth"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const ForRenters = lazy(() => import("@/pages/ForRenters"));

export const publicRoutes = (
  <>
    <Route path="/" element={<Lazy><Index /></Lazy>} />
    <Route path="/veiculos" element={<Lazy><Vehicles /></Lazy>} />
    <Route path="/veiculos/:id" element={<Lazy><VehicleDetails /></Lazy>} />
    <Route path="/login" element={<Lazy><Auth /></Lazy>} />
    <Route path="/cadastro" element={<Lazy><Auth /></Lazy>} />
    <Route path="/esqueci-senha" element={<Lazy><ForgotPassword /></Lazy>} />
    <Route path="/redefinir-senha" element={<Lazy><ResetPassword /></Lazy>} />
    <Route path="/como-funciona" element={<Lazy><HowItWorks /></Lazy>} />
    <Route path="/para-locadores" element={<Lazy><ForRenters /></Lazy>} />
  </>
);
