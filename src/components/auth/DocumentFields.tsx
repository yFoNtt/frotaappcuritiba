import { useState } from 'react';
import { FileText, CheckCircle2, XCircle, CreditCard, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateDocument, formatDocument, validateCNHDocument, formatCNH } from '@/lib/documentValidation';
import { format, isAfter, startOfDay, addDays } from 'date-fns';

type AppRole = 'locador' | 'motorista';

interface DocumentFieldsProps {
  selectedRole: AppRole;
  loading?: boolean;
  document: string;
  onDocumentChange: (value: string) => void;
  documentError: string;
  onDocumentErrorChange: (error: string) => void;
  documentValid: boolean;
  onDocumentValidChange: (valid: boolean) => void;
  cnh: string;
  onCnhChange: (value: string) => void;
  cnhError: string;
  onCnhErrorChange: (error: string) => void;
  cnhValid: boolean;
  onCnhValidChange: (valid: boolean) => void;
  cnhExpiry: string;
  onCnhExpiryChange: (value: string) => void;
  cnhExpiryError: string;
  onCnhExpiryErrorChange: (error: string) => void;
  cnhExpiryValid: boolean;
  onCnhExpiryValidChange: (valid: boolean) => void;
}

export function DocumentFields({
  selectedRole,
  loading = false,
  document,
  onDocumentChange,
  documentError,
  onDocumentErrorChange,
  documentValid,
  onDocumentValidChange,
  cnh,
  onCnhChange,
  cnhError,
  onCnhErrorChange,
  cnhValid,
  onCnhValidChange,
  cnhExpiry,
  onCnhExpiryChange,
  cnhExpiryError,
  onCnhExpiryErrorChange,
  cnhExpiryValid,
  onCnhExpiryValidChange,
}: DocumentFieldsProps) {
  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value);
    onDocumentChange(formatted);

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 11) {
      const validation = validateDocument(cleanValue);
      onDocumentValidChange(validation.isValid);
      onDocumentErrorChange(validation.isValid ? '' : validation.message);
    } else {
      onDocumentValidChange(false);
      onDocumentErrorChange('');
    }
  };

  const handleCnhChange = (value: string) => {
    const formatted = formatCNH(value);
    onCnhChange(formatted);

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      const validation = validateCNHDocument(cleanValue);
      onCnhValidChange(validation.isValid);
      onCnhErrorChange(validation.isValid ? '' : validation.message);
    } else {
      onCnhValidChange(false);
      onCnhErrorChange('');
    }
  };

  const handleCnhExpiryChange = (value: string) => {
    onCnhExpiryChange(value);

    if (!value) {
      onCnhExpiryValidChange(false);
      onCnhExpiryErrorChange('');
      return;
    }

    const expiryDate = new Date(value);
    const today = startOfDay(new Date());

    if (isAfter(expiryDate, today)) {
      onCnhExpiryValidChange(true);
      onCnhExpiryErrorChange('');
    } else {
      onCnhExpiryValidChange(false);
      onCnhExpiryErrorChange('CNH vencida. Renove sua habilitação antes de continuar.');
    }
  };

  const getMinDate = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <>
      {/* CPF/CNPJ */}
      <div className="space-y-2">
        <Label htmlFor="document">
          {selectedRole === 'locador' ? 'CPF ou CNPJ' : 'CPF'}
        </Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="document"
            type="text"
            placeholder={selectedRole === 'locador' ? '000.000.000-00 ou 00.000.000/0000-00' : '000.000.000-00'}
            value={document}
            onChange={(e) => handleDocumentChange(e.target.value)}
            className={`pl-10 pr-10 ${
              documentError ? 'border-destructive focus-visible:ring-destructive' :
              documentValid ? 'border-success focus-visible:ring-success' : ''
            }`}
            required
            disabled={loading}
            maxLength={selectedRole === 'locador' ? 18 : 14}
          />
          {document.replace(/\D/g, '').length >= 11 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {documentValid ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>
        {documentError && <p className="text-xs text-destructive">{documentError}</p>}
        <p className="text-xs text-muted-foreground">
          {selectedRole === 'locador'
            ? 'Pessoa física: CPF | Pessoa jurídica: CNPJ'
            : 'Digite seu CPF (apenas números)'}
        </p>
      </div>

      {/* CNH (motorista only) */}
      {selectedRole === 'motorista' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="cnh">CNH (Carteira de Habilitação)</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cnh"
                type="text"
                placeholder="000 0000 0000"
                value={cnh}
                onChange={(e) => handleCnhChange(e.target.value)}
                className={`pl-10 pr-10 ${
                  cnhError ? 'border-destructive focus-visible:ring-destructive' :
                  cnhValid ? 'border-success focus-visible:ring-success' : ''
                }`}
                required
                disabled={loading}
                maxLength={13}
              />
              {cnh.replace(/\D/g, '').length === 11 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cnhValid ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {cnhError && <p className="text-xs text-destructive">{cnhError}</p>}
            <p className="text-xs text-muted-foreground">Digite o número da sua CNH (11 dígitos)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnhExpiry">Validade da CNH</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cnhExpiry"
                type="date"
                value={cnhExpiry}
                onChange={(e) => handleCnhExpiryChange(e.target.value)}
                min={getMinDate()}
                className={`pl-10 pr-10 ${
                  cnhExpiryError ? 'border-destructive focus-visible:ring-destructive' :
                  cnhExpiryValid ? 'border-success focus-visible:ring-success' : ''
                }`}
                required
                disabled={loading}
              />
              {cnhExpiry && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cnhExpiryValid ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {cnhExpiryError && <p className="text-xs text-destructive">{cnhExpiryError}</p>}
            <p className="text-xs text-muted-foreground">A CNH deve estar válida para cadastro</p>
          </div>
        </>
      )}
    </>
  );
}
