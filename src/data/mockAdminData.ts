export interface PlatformStats {
  totalUsers: number;
  totalLocadores: number;
  totalMotoristas: number;
  totalVehicles: number;
  activeAds: number;
  monthlyRevenue: number;
  growthRate: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'locador' | 'motorista' | 'admin';
  status: 'active' | 'blocked' | 'pending';
  createdAt: Date;
  lastLogin?: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxVehicles: number;
  maxDrivers: number;
  features: string[];
  isActive: boolean;
}

export const mockPlatformStats: PlatformStats = {
  totalUsers: 156,
  totalLocadores: 24,
  totalMotoristas: 132,
  totalVehicles: 87,
  activeAds: 62,
  monthlyRevenue: 12450,
  growthRate: 18.5,
};

export const mockAdminUsers: AdminUser[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@frotaapp.com',
    role: 'locador',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2025-01-15'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@frotaapp.com',
    role: 'locador',
    status: 'active',
    createdAt: new Date('2024-02-20'),
    lastLogin: new Date('2025-01-14'),
  },
  {
    id: '101',
    name: 'Carlos Oliveira',
    email: 'carlos.motorista@email.com',
    role: 'motorista',
    status: 'active',
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date('2025-01-16'),
  },
  {
    id: '102',
    name: 'Ana Souza',
    email: 'ana.souza@email.com',
    role: 'motorista',
    status: 'pending',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '103',
    name: 'Pedro Lima',
    email: 'pedro.lima@email.com',
    role: 'motorista',
    status: 'active',
    createdAt: new Date('2024-01-20'),
    lastLogin: new Date('2025-01-13'),
  },
  {
    id: '104',
    name: 'Fernanda Costa',
    email: 'fernanda@email.com',
    role: 'motorista',
    status: 'blocked',
    createdAt: new Date('2024-04-05'),
  },
  {
    id: '3',
    name: 'Roberto Almeida',
    email: 'roberto@locadora.com',
    role: 'locador',
    status: 'pending',
    createdAt: new Date('2025-01-10'),
  },
];

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 99,
    maxVehicles: 5,
    maxDrivers: 10,
    features: ['Gestão de frota básica', 'Até 5 anúncios', 'Suporte por email'],
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 199,
    maxVehicles: 15,
    maxDrivers: 30,
    features: ['Gestão completa', 'Até 15 anúncios', 'Relatórios avançados', 'Suporte prioritário'],
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 399,
    maxVehicles: 999,
    maxDrivers: 999,
    features: ['Veículos ilimitados', 'Anúncios ilimitados', 'API de integração', 'Gerente de conta dedicado'],
    isActive: true,
  },
];

export const mockMonthlyData = [
  { month: 'Ago', users: 45, vehicles: 28, revenue: 4500 },
  { month: 'Set', users: 62, vehicles: 38, revenue: 6200 },
  { month: 'Out', users: 85, vehicles: 52, revenue: 7800 },
  { month: 'Nov', users: 110, vehicles: 68, revenue: 9500 },
  { month: 'Dez', users: 138, vehicles: 78, revenue: 11200 },
  { month: 'Jan', users: 156, vehicles: 87, revenue: 12450 },
];
