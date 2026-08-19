import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InactivityWarningDialogProps {
  open: boolean;
  seconds?: number;
  onContinue: () => void;
  onLogout: () => void;
}

export function InactivityWarningDialog({
  open,
  seconds = 60,
  onContinue,
  onLogout,
}: InactivityWarningDialogProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!open) {
      setRemaining(seconds);
      return;
    }
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, seconds]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você ainda está aí?</AlertDialogTitle>
          <AlertDialogDescription>
            Por segurança, sua sessão será encerrada em{' '}
            <span className="font-semibold text-foreground">{remaining}s</span> por inatividade.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Sair agora</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>Continuar conectado</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
