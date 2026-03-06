import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordFieldProps {
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword?: string;
  onConfirmPasswordChange?: (value: string) => void;
  showConfirm?: boolean;
  showForgotLink?: boolean;
  passwordWarning?: string;
  loading?: boolean;
}

export function PasswordField({
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  showConfirm = false,
  showForgotLink = false,
  passwordWarning,
  loading = false,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          {showForgotLink && (
            <Link to="/esqueci-senha" className="text-xs text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="pl-10 pr-10"
            required
            disabled={loading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {passwordWarning && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{passwordWarning}</p>
          </div>
        )}
        {showForgotLink && (
          <div className="flex justify-end">
            <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
              className="pl-10"
              required
              disabled={loading}
            />
          </div>
        </div>
      )}
    </>
  );
}
