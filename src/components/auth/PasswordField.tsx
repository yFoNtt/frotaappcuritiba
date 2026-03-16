import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldAlert, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
}

function evaluatePassword(password: string): PasswordStrength {
  const checks = [
    { label: 'Mínimo 8 caracteres', passed: password.length >= 8 },
    { label: 'Letra maiúscula', passed: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', passed: /[a-z]/.test(password) },
    { label: 'Número', passed: /[0-9]/.test(password) },
    { label: 'Caractere especial', passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.passed).length;

  const levels: Record<number, { label: string; color: string }> = {
    0: { label: 'Muito fraca', color: 'bg-destructive' },
    1: { label: 'Fraca', color: 'bg-destructive' },
    2: { label: 'Razoável', color: 'bg-orange-500' },
    3: { label: 'Boa', color: 'bg-yellow-500' },
    4: { label: 'Forte', color: 'bg-emerald-500' },
    5: { label: 'Excelente', color: 'bg-emerald-600' },
  };

  const { label, color } = levels[score];
  return { score, label, color, checks };
}

interface PasswordFieldProps {
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword?: string;
  onConfirmPasswordChange?: (value: string) => void;
  showConfirm?: boolean;
  showForgotLink?: boolean;
  showStrength?: boolean;
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
  showStrength = false,
  passwordWarning,
  loading = false,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(
    () => (showStrength && password ? evaluatePassword(password) : null),
    [password, showStrength]
  );

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

        {/* Password strength indicator */}
        {strength && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {strength.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {strength.checks.map((check) => (
                <div key={check.label} className="flex items-center gap-1.5">
                  {check.passed ? (
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={`text-[11px] ${check.passed ? 'text-emerald-500' : 'text-muted-foreground/50'}`}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
