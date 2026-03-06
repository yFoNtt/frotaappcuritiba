import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getWeakPasswordMessage } from './utils';

export function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordWarning, setPasswordWarning] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordWarning('');

    const { error } = await signIn(email, password);

    if (error) {
      const weakMsg = getWeakPasswordMessage(error);
      if (weakMsg) {
        setPasswordWarning(weakMsg);
        toast.error(weakMsg);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Login realizado com sucesso!');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <EmailField email={email} onEmailChange={setEmail} loading={loading} />
      <PasswordField
        password={password}
        onPasswordChange={setPassword}
        showForgotLink
        passwordWarning={passwordWarning}
        loading={loading}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  );
}
