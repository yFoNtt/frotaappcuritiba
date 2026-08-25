import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from './GoogleIcon';
import { Label } from '@/components/ui/label';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';
import { DocumentFields } from './DocumentFields';
import { RoleSelector } from './RoleSelector';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getWeakPasswordMessage } from './utils';
import { useGoogleSignIn } from './useGoogleSignIn';
import { translateAuthError } from './authErrors';
import { registerSchema, type RegisterFormValues } from './registerSchema';

type AppRole = 'locador' | 'motorista';

interface RegisterFormProps {
  onRegistered: () => void;
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const { signUp } = useAuth();
  const { googleLoading, handleGoogleSignIn } = useGoogleSignIn();
  const [passwordWarning, setPasswordWarning] = useState('');

  // Live (per-keystroke) feedback state kept by DocumentFields
  const [documentValid, setDocumentValid] = useState(false);
  const [documentLiveError, setDocumentLiveError] = useState('');
  const [cnhValid, setCnhValid] = useState(false);
  const [cnhLiveError, setCnhLiveError] = useState('');
  const [cnhExpiryValid, setCnhExpiryValid] = useState(false);
  const [cnhExpiryLiveError, setCnhExpiryLiveError] = useState('');

  const {
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    defaultValues: {
      role: 'locador',
      email: '',
      password: '',
      confirmPassword: '',
      document: '',
      cnh: '',
      cnhExpiry: '',
      acceptedTerms: false,
    },
  });

  const selectedRole = watch('role');
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const document = watch('document');
  const cnh = watch('cnh') ?? '';
  const cnhExpiry = watch('cnhExpiry') ?? '';
  const acceptedTerms = watch('acceptedTerms');
  const loading = isSubmitting;

  // Clear CNH fields when switching to locador
  useEffect(() => {
    if (selectedRole === 'locador') {
      setValue('cnh', '');
      setValue('cnhExpiry', '');
      clearErrors(['cnh', 'cnhExpiry']);
      setCnhValid(false);
      setCnhLiveError('');
      setCnhExpiryValid(false);
      setCnhExpiryLiveError('');
    }
  }, [selectedRole, setValue, clearErrors]);

  const setField = (field: keyof RegisterFormValues) => (value: string) => {
    setValue(field, value as never);
    clearErrors(field);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setPasswordWarning('');

    const cleanDocument = values.document.replace(/\D/g, '');
    const profileData = {
      documentType: cleanDocument.length === 11 ? ('cpf' as const) : ('cnpj' as const),
      documentNumber: cleanDocument,
      cnhNumber: values.role === 'motorista' ? (values.cnh ?? '').replace(/\D/g, '') : undefined,
      cnhExpiry: values.role === 'motorista' ? values.cnhExpiry : undefined,
    };

    const { error } = await signUp(values.email, values.password, values.role as AppRole, profileData);

    if (error) {
      const weakMsg = getWeakPasswordMessage(error);
      if (weakMsg) {
        setPasswordWarning(weakMsg);
        toast.error(weakMsg);
      } else {
        toast.error(translateAuthError(error, 'signup'));
      }
      return;
    }

    toast.success('Conta criada com sucesso! Faça login para continuar.');
    onRegistered();
  };

  return (
    <>
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Cadastrar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>
      </div>

      <RoleSelector
        selectedRole={selectedRole as AppRole}
        onRoleChange={(role) => setValue('role', role)}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <DocumentFields
          selectedRole={selectedRole as AppRole}
          loading={loading}
          document={document}
          onDocumentChange={setField('document')}
          documentError={errors.document?.message ?? documentLiveError}
          onDocumentErrorChange={setDocumentLiveError}
          documentValid={documentValid}
          onDocumentValidChange={setDocumentValid}
          cnh={cnh}
          onCnhChange={setField('cnh')}
          cnhError={errors.cnh?.message ?? cnhLiveError}
          onCnhErrorChange={setCnhLiveError}
          cnhValid={cnhValid}
          onCnhValidChange={setCnhValid}
          cnhExpiry={cnhExpiry}
          onCnhExpiryChange={setField('cnhExpiry')}
          cnhExpiryError={errors.cnhExpiry?.message ?? cnhExpiryLiveError}
          onCnhExpiryErrorChange={setCnhExpiryLiveError}
          cnhExpiryValid={cnhExpiryValid}
          onCnhExpiryValidChange={setCnhExpiryValid}
        />
        <EmailField
          email={email}
          onEmailChange={setField('email')}
          loading={loading}
          error={errors.email?.message}
        />
        <PasswordField
          password={password}
          onPasswordChange={setField('password')}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={setField('confirmPassword')}
          showConfirm
          showStrength
          passwordWarning={passwordWarning}
          loading={loading}
          error={errors.password?.message}
          confirmError={errors.confirmPassword?.message}
        />
        <div className="space-y-1 pt-1">
          <div className="flex items-start gap-2">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setValue('acceptedTerms', e.target.checked);
                clearErrors('acceptedTerms');
              }}
              disabled={loading}
              className="mt-1 h-4 w-4 cursor-pointer accent-primary"
            />
            <Label
              htmlFor="accept-terms"
              className="text-sm font-normal leading-snug text-muted-foreground"
            >
              Li e aceito os{' '}
              <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Termos de Uso
              </a>{' '}
              e a{' '}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Política de Privacidade
              </a>
              .
            </Label>
          </div>
          {errors.acceptedTerms?.message && (
            <p className="text-xs text-destructive">{errors.acceptedTerms.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>
    </>
  );
}
