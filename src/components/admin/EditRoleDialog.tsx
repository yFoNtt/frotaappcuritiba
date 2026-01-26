import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'locador' | 'motorista';
  } | null;
  onSave: (userId: string, newRole: 'admin' | 'locador' | 'motorista') => Promise<void>;
  isLoading: boolean;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  user,
  onSave,
  isLoading,
}: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'locador' | 'motorista'>(
    user?.role || 'motorista'
  );

  // Update selected role when user changes
  useState(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  });

  const handleSave = async () => {
    if (!user) return;
    await onSave(user.id, selectedRole);
  };

  const roleLabels = {
    admin: 'Administrador',
    locador: 'Locador',
    motorista: 'Motorista',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Editar Permissão</DialogTitle>
          <DialogDescription>
            Altere a permissão do usuário{' '}
            <span className="font-medium text-foreground">
              {user?.email || 'Usuário'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as 'admin' | 'locador' | 'motorista')
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    Administrador
                  </div>
                </SelectItem>
                <SelectItem value="locador">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Locador
                  </div>
                </SelectItem>
                <SelectItem value="motorista">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    Motorista
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user?.role !== selectedRole && (
            <p className="mt-4 text-sm text-muted-foreground">
              A permissão será alterada de{' '}
              <span className="font-medium">{roleLabels[user?.role || 'motorista']}</span>{' '}
              para{' '}
              <span className="font-medium">{roleLabels[selectedRole]}</span>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || user?.role === selectedRole}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
