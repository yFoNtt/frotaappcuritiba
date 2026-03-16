import { useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [rateLimitMessage, setRateLimitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordWarning('');
    setRateLimitMessage('');

    const { error } = await signIn(email, password);

    if (error) {
      const msg = error.message;

      // Check if it's a rate limit error
      if (msg.includes('Muitas tentativas') || msg.includes('tentativa(s) restante(s)')) {
        setRateLimitMessage(msg);
      }

      const weakMsg = getWeakPasswordMessage(error);
      if (weakMsg) {
        setPasswordWarning(weakMsg);
        toast.error(weakMsg);
      } else {
        toast.error(msg);
      }
    } else {
      toast.success('Login realizado com sucesso!');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rateLimitMessage && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{rateLimitMessage}</AlertDescription>
        </Alert>
      )}
      <EmailField email={email} onEmailChange={setEmail} loading={loading} />
      <PasswordField
        password={password}
        onPasswordChange={setPassword}
        showForgotLink
        passwordWarning={passwordWarning}
        loading={loading}
      />
      <Button type="submit" className="w-full" disabled={loading || !!rateLimitMessage.includes('Muitas tentativas')}>
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
