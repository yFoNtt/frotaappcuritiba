import { Building2, Truck } from 'lucide-react';
import { Label } from '@/components/ui/label';

type AppRole = 'locador' | 'motorista';

interface RoleSelectorProps {
  selectedRole: AppRole;
  onRoleChange: (role: AppRole) => void;
}

interface RoleOptionProps {
  role: AppRole;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}

function RoleOption({ selected, onClick, icon, label, description }: RoleOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      {selected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        {icon}
      </div>
      <div className="text-center">
        <p className={`font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="mb-6">
      <Label className="mb-3 block text-sm font-medium">Selecione o tipo de conta</Label>
      <div className="grid grid-cols-2 gap-4">
        <RoleOption
          role="locador"
          selected={selectedRole === 'locador'}
          onClick={() => onRoleChange('locador')}
          icon={<Building2 className="h-6 w-6" />}
          label="Locador"
          description="Tenho veículos para alugar"
        />
        <RoleOption
          role="motorista"
          selected={selectedRole === 'motorista'}
          onClick={() => onRoleChange('motorista')}
          icon={<Truck className="h-6 w-6" />}
          label="Motorista"
          description="Quero alugar um veículo"
        />
      </div>
    </div>
  );
}
