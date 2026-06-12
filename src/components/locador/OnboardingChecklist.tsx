import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, X, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLocadorVehicles } from '@/hooks/useVehicles';
import { useLocadorDrivers } from '@/hooks/useDrivers';
import { useLocadorContracts } from '@/hooks/useContracts';
import { useChecklistTemplates } from '@/hooks/useChecklistTemplates';

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  to: string;
  disabled?: boolean;
  disabledHint?: string;
}

export function OnboardingChecklist() {
  const { user } = useAuth();
  const storageKey = user ? `onboarding_dismissed_${user.id}` : null;

  const { data: profile } = useProfile();
  const { data: vehicles = [] } = useLocadorVehicles();
  const { data: drivers = [] } = useLocadorDrivers();
  const { data: contracts = [] } = useLocadorContracts();
  const { data: templates = [] } = useChecklistTemplates();

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    setDismissed(localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  const items: ChecklistItem[] = useMemo(() => {
    const hasVehicle = vehicles.length > 0;
    const hasDriver = drivers.length > 0;
    const canContract = hasVehicle && hasDriver;
    return [
      {
        key: 'profile',
        label: 'Complete seu perfil',
        done: Boolean(profile?.company_name || profile?.full_name),
        to: '/locador/configuracoes',
      },
      {
        key: 'vehicle',
        label: 'Cadastre seu primeiro veículo',
        done: hasVehicle,
        to: '/locador/veiculos',
      },
      {
        key: 'driver',
        label: 'Adicione seu primeiro motorista',
        done: hasDriver,
        to: '/locador/motoristas',
      },
      {
        key: 'contract',
        label: 'Crie seu primeiro contrato',
        done: contracts.length > 0,
        to: '/locador/contratos',
        disabled: !canContract,
        disabledHint: 'Cadastre 1 veículo e 1 motorista antes',
      },
      {
        key: 'inspection',
        label: 'Configure o checklist de vistoria',
        done: templates.length > 0,
        to: '/locador/vistorias',
      },
    ];
  }, [profile, vehicles, drivers, contracts, templates]);

  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const isComplete = done === total;

  if (dismissed || isComplete) return null;

  const handleDismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, '1');
    setDismissed(true);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Bem-vindo ao FrotaApp! 👋
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Complete estes passos para começar a gerenciar sua frota.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Dispensar onboarding"
            className="h-7 w-7 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Progress value={(done / total) * 100} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {done} de {total}
          </span>
        </div>

        <ul className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.done ? CheckCircle2 : Circle;
            const content = (
              <div
                className={`flex items-center justify-between gap-3 rounded-md border border-transparent px-2 py-2 text-sm transition-colors ${
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      item.done ? 'text-success' : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={`truncate ${
                      item.done ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {!item.done && !item.disabled && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {item.disabled && item.disabledHint && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground hidden sm:inline">
                    {item.disabledHint}
                  </span>
                )}
              </div>
            );
            return (
              <li key={item.key}>
                {item.disabled || item.done ? content : <Link to={item.to}>{content}</Link>}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
