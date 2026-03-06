import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailFieldProps {
  email: string;
  onEmailChange: (value: string) => void;
  loading?: boolean;
}

export function EmailField({ email, onEmailChange, loading = false }: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">E-mail</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="pl-10"
          required
          disabled={loading}
        />
      </div>
    </div>
  );
}
