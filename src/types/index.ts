// FrotaApp Types

export type UserRole = 'visitor' | 'locador' | 'motorista' | 'admin';

export type VehicleStatus = 'available' | 'rented' | 'maintenance';

export type FuelType = 'flex' | 'gasoline' | 'diesel' | 'electric' | 'hybrid';

export type RideApp = 'uber' | '99' | 'indrive' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
}

export interface Locador extends User {
  role: 'locador';
  companyName?: string;
  cnpj?: string;
  whatsapp: string;
  address?: string;
  city: string;
  state: string;
}

export interface Motorista extends User {
  role: 'motorista';
  locadorId: string;
  vehicleId?: string;
  cnh: string;
  cnhExpiry: Date;
}

export interface Vehicle {
  id: string;
  locadorId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuelType: FuelType;
  status: VehicleStatus;
  weeklyPrice: number;
  kmLimit: number;
  excessKmFee: number;
  deposit: number;
  allowedApps: RideApp[];
  description: string;
  images: string[];
  city: string;
  state: string;
  createdAt: Date;
  currentDriverId?: string;
}

export interface Payment {
  id: string;
  vehicleId: string;
  motoristaId: string;
  locadorId: string;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue';
  weekNumber: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'preventive' | 'corrective' | 'revision' | 'other';
  description: string;
  cost: number;
  date: Date;
  km: number;
}

export interface KmRecord {
  id: string;
  vehicleId: string;
  month: number;
  year: number;
  initialKm: number;
  finalKm: number;
  excessKm: number;
  feeCharged: number;
}

export interface Alert {
  id: string;
  vehicleId: string;
  type: 'revision' | 'ipva' | 'insurance' | 'maintenance';
  title: string;
  description: string;
  dueDate: Date;
  resolved: boolean;
}
