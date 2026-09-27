import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, CreditCard, FileText, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { isProfileComplete, useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { formatCNH, formatDocument } from '@/lib/documentValidation';
import {
  profileCompletionSchema,
  type ProfileCompletionValues,
} from '@/components/auth/profileCompletionSchema';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const accountRole = role === 'motorista' ? 'motorista' : 'locador';
  const dashboardPath = accountRole === 'motorista' ? '/motorista' : '/locador';

  const form = useForm<ProfileCompletionValues>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      role: accountRole,
      document: profile?.document_number ?? '',
      cnh: profile?.cnh_number ?? '',
      cnhExpiry: profile?.cnh_expiry ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      role: accountRole,
      document: profile?.document_number ?? '',
      cnh: profile?.cnh_number ?? '',
      cnhExpiry: profile?.cnh_expiry ?? '',
    });
  }, [accountRole, form, profile]);

  useEffect(() => {
    if (isProfileComplete(profile, role)) {
      navigate(dashboardPath, { replace: true });
    }
  }, [dashboardPath, navigate, profile, role]);

  const onSubmit = async (values: ProfileCompletionValues) => {
    if (values.role === 'locador') {
      const documentNumber = values.document.replace(/\D/g, '');
      await updateProfile.mutateAsync({
        document_type: documentNumber.length === 11 ? 'cpf' : 'cnpj',
        document_number: documentNumber,
      });
    } else {
      await updateProfile.mutateAsync({
        cnh_number: values.cnh.replace(/\D/g, ''),
        cnh_expiry: values.cnhExpiry,
      });
    }
    navigate(dashboardPath, { replace: true });
  };

  return (
    <PublicLayout>
      <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete seu perfil</CardTitle>
            <CardDescription>
              Precisamos destes dados obrigatórios antes de liberar seu painel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <input type="hidden" {...form.register('role')} />
                {accountRole === 'locador' ? (
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF ou CNPJ</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              {...field}
                              className="pl-10"
                              maxLength={18}
                              placeholder="000.000.000-00 ou 00.000.000/0000-00"
                              onChange={(event) => field.onChange(formatDocument(event.target.value))}
                              disabled={updateProfile.isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="cnh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNH</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                {...field}
                                className="pl-10"
                                maxLength={13}
                                placeholder="000 0000 0000"
                                onChange={(event) => field.onChange(formatCNH(event.target.value))}
                                disabled={updateProfile.isPending}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnhExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validade da CNH</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                {...field}
                                type="date"
                                className="pl-10"
                                disabled={updateProfile.isPending}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar e continuar
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}