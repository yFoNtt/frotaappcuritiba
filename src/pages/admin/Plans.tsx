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
  Users
} from 'lucide-react';
import { mockSubscriptionPlans } from '@/data/mockAdminData';
import { toast } from 'sonner';

export default function AdminPlans() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Plano salvo com sucesso!');
    setIsAddDialogOpen(false);
  };

  const handleTogglePlan = (planId: string) => {
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

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {mockSubscriptionPlans.map((plan) => (
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

        {/* Revenue Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Informações de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Assinantes Básico</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-success">R$ 1.188/mês</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Assinantes Pro</p>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-success">R$ 1.592/mês</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Assinantes Enterprise</p>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-success">R$ 1.596/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
