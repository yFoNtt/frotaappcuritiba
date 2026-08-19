import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';
import { translateAuthError } from '@/components/auth/authErrors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();

    if (!trimmed) {
      toast.error('Digite seu e-mail para receber o link de recuperação.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      toast.error('Digite um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        console.error('Reset password error:', error);
        toast.error(translateAuthError(error, 'reset'));
      } else {
        // Resposta neutra: não revelamos se o e-mail existe na base.
        setEmailSent(true);
        toast.success('Se existir uma conta com este e-mail, enviamos o link de recuperação.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error(translateAuthError(err, 'reset'));
    }

    setLoading(false);
  };

  return (
    <PublicLayout>
      <SEO
        title="Recuperar senha — Receba um link por email"
        description="Esqueceu sua senha do FrotaApp? Digite seu email e receba um link seguro para redefinir e voltar a acessar sua conta."
        canonical="/esqueci-senha"
        noindex
      />
      <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {emailSent ? 'Email enviado!' : 'Recuperar senha'}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? 'Verifique sua caixa de entrada para redefinir sua senha'
                : 'Digite seu email para receber o link de recuperação'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                   <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Se existir uma conta com o e-mail <strong>{email}</strong>, enviamos um link
                  de recuperação. O link expira em 1 hora. Verifique também a caixa de spam.
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                >
                  Enviar para outro email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center">
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
