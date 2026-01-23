import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit,
  Check,
  CreditCard,
  Car,
  Users,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStats } from '@/hooks/useAdminData';

// Static plans data - in a real app, this would come from a database table
const subscriptionPlans = [
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

export default function AdminPlans() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [plans, setPlans] = useState(subscriptionPlans);

  const { data: stats } = useAdminStats();

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Plano salvo com sucesso!');
    setIsAddDialogOpen(false);
  };

  const handleTogglePlan = (planId: string) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
    toast.success('Status do plano atualizado!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
            <p className="text-muted-foreground">
              Gerencie os planos de assinatura da plataforma
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Plano</DialogTitle>
                <DialogDescription>
                  Configure os detalhes do novo plano de assinatura.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input id="name" placeholder="Ex: Premium" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$/mês)</Label>
                    <Input id="price" type="number" placeholder="99" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxVehicles">Máx. Veículos</Label>
                    <Input id="maxVehicles" type="number" placeholder="10" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDrivers">Máx. Motoristas</Label>
                    <Input id="maxDrivers" type="number" placeholder="20" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Plano</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sistema de Planos</p>
                <p className="text-sm text-muted-foreground">
                  Os planos são configurações estáticas. Para um sistema completo de assinaturas, 
                  seria necessário integrar com um gateway de pagamento como Stripe ou PagSeguro.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
              {plan.id === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Mais Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">R$ {plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center gap-4 py-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Car className="h-4 w-4 text-primary" />
                      {plan.maxVehicles === 999 ? '∞' : plan.maxVehicles}
                    </div>
                    <p className="text-xs text-muted-foreground">Veículos</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                      <Users className="h-4 w-4 text-primary" />
                      {plan.maxDrivers === 999 ? '∞' : plan.maxDrivers}
                    </div>
                    <p className="text-xs text-muted-foreground">Motoristas</p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={plan.isActive} 
                      onCheckedChange={() => handleTogglePlan(plan.id)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Estatísticas da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total de Locadores</p>
                <p className="text-2xl font-bold">{stats?.totalLocadores || 0}</p>
                <p className="text-sm text-muted-foreground">cadastrados</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total de Veículos</p>
                <p className="text-2xl font-bold">{stats?.totalVehicles || 0}</p>
                <p className="text-sm text-muted-foreground">na plataforma</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                <p className="text-2xl font-bold">{stats?.activeContracts || 0}</p>
                <p className="text-sm text-muted-foreground">em andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}