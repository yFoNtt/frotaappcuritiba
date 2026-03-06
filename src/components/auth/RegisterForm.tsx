import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';
import { DocumentFields } from './DocumentFields';
import { RoleSelector } from './RoleSelector';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { validateDocument, validateCNHDocument } from '@/lib/documentValidation';
import { isAfter, startOfDay } from 'date-fns';
import { getWeakPasswordMessage } from './utils';

type AppRole = 'locador' | 'motorista';

interface RegisterFormProps {
  onRegistered: () => void;
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordWarning, setPasswordWarning] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('locador');

  // Document state
  const [document, setDocument] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [documentValid, setDocumentValid] = useState(false);

  // CNH state
  const [cnh, setCnh] = useState('');
  const [cnhError, setCnhError] = useState('');
  const [cnhValid, setCnhValid] = useState(false);
  const [cnhExpiry, setCnhExpiry] = useState('');
  const [cnhExpiryError, setCnhExpiryError] = useState('');
  const [cnhExpiryValid, setCnhExpiryValid] = useState(false);

  // Clear CNH fields when switching to locador
  useEffect(() => {
    if (selectedRole === 'locador') {
      setCnh('');
      setCnhError('');
      setCnhValid(false);
      setCnhExpiry('');
      setCnhExpiryError('');
      setCnhExpiryValid(false);
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate document
    const docValidation = validateDocument(document);
    if (!docValidation.isValid) {
      toast.error(docValidation.message);
      setDocumentError(docValidation.message);
      setLoading(false);
      return;
    }

    // Validate CNH for motorista
    if (selectedRole === 'motorista') {
      const cnhValidation = validateCNHDocument(cnh);
      if (!cnhValidation.isValid) {
        toast.error(cnhValidation.message);
        setCnhError(cnhValidation.message);
        setLoading(false);
        return;
      }

      if (!cnhExpiry) {
        toast.error('Data de validade da CNH é obrigatória');
        setCnhExpiryError('Data de validade é obrigatória');
        setLoading(false);
        return;
      }

      const expiryDate = new Date(cnhExpiry);
      const today = startOfDay(new Date());
      if (!isAfter(expiryDate, today)) {
        toast.error('CNH vencida. Renove sua habilitação antes de continuar.');
        setCnhExpiryError('CNH vencida. Renove sua habilitação antes de continuar.');
        setLoading(false);
        return;
      }
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const cleanDocument = document.replace(/\D/g, '');
    const profileData = {
      documentType: cleanDocument.length === 11 ? 'cpf' as const : 'cnpj' as const,
      documentNumber: cleanDocument,
      cnhNumber: selectedRole === 'motorista' ? cnh.replace(/\D/g, '') : undefined,
      cnhExpiry: selectedRole === 'motorista' ? cnhExpiry : undefined,
    };

    const { error } = await signUp(email, password, selectedRole, profileData);

    if (error) {
      const weakMsg = getWeakPasswordMessage(error);
      if (weakMsg) {
        setPasswordWarning(weakMsg);
        toast.error(weakMsg);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      onRegistered();
    }

    setLoading(false);
  };

  return (
    <>
      <RoleSelector selectedRole={selectedRole} onRoleChange={setSelectedRole} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <DocumentFields
          selectedRole={selectedRole}
          loading={loading}
          document={document}
          onDocumentChange={setDocument}
          documentError={documentError}
          onDocumentErrorChange={setDocumentError}
          documentValid={documentValid}
          onDocumentValidChange={setDocumentValid}
          cnh={cnh}
          onCnhChange={setCnh}
          cnhError={cnhError}
          onCnhErrorChange={setCnhError}
          cnhValid={cnhValid}
          onCnhValidChange={setCnhValid}
          cnhExpiry={cnhExpiry}
          onCnhExpiryChange={setCnhExpiry}
          cnhExpiryError={cnhExpiryError}
          onCnhExpiryErrorChange={setCnhExpiryError}
          cnhExpiryValid={cnhExpiryValid}
          onCnhExpiryValidChange={setCnhExpiryValid}
        />
        <EmailField email={email} onEmailChange={setEmail} loading={loading} />
        <PasswordField
          password={password}
          onPasswordChange={setPassword}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={setConfirmPassword}
          showConfirm
          showStrength
          passwordWarning={passwordWarning}
          loading={loading}
        />
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
