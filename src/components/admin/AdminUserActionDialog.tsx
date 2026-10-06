import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { AdminUser, AdminUserAction } from '@/hooks/useAdminData';

export type UserActionKind = 'create' | 'reset' | 'temporary-password' | 'email' | 'confirm-email' | 'role' | 'delete' | 'block' | 'unblock';

const schema = z.object({
  email: z.string().optional(),
  fullName: z.string().optional(),
  role: z.enum(['admin', 'locador', 'motorista']).default('motorista'),
  mode: z.enum(['invite', 'temporary_password']).default('invite'),
  temporaryPassword: z.string().optional(),
  reason: z.string().trim().min(3, 'Informe o motivo').max(500),
  confirmPromotion: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.email && !z.string().email().safeParse(data.email).success) ctx.addIssue({ code: 'custom', path: ['email'], message: 'E-mail inválido' });
  if (data.temporaryPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(data.temporaryPassword)) {
    ctx.addIssue({ code: 'custom', path: ['temporaryPassword'], message: 'Use 8 caracteres, maiúscula, minúscula, número e especial' });
  }
});

type Values = z.infer<typeof schema>;

const titles: Record<UserActionKind, string> = {
  create: 'Novo usuário', reset: 'Enviar redefinição de senha', 'temporary-password': 'Definir senha temporária',
  email: 'Alterar e-mail', 'confirm-email': 'Confirmar e-mail', role: 'Alterar permissão', delete: 'Excluir usuário',
  block: 'Bloquear usuário', unblock: 'Desbloquear usuário',
};

interface Props {
  open: boolean;
  action: UserActionKind;
  user: AdminUser | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (action: AdminUserAction | { action: 'block' | 'unblock'; user_id: string; reason: string }) => Promise<void>;
}

export function AdminUserActionDialog({ open, action, user, pending, onOpenChange, onSubmit }: Props) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', fullName: '', role: 'motorista', mode: 'invite', temporaryPassword: '', reason: '', confirmPromotion: false } });
  const mode = form.watch('mode');
  const selectedRole = form.watch('role');
  const isDestructive = action === 'delete' || action === 'block';

  useEffect(() => {
    if (open) form.reset({ email: action === 'email' ? user?.email ?? '' : '', fullName: '', role: user?.role ?? 'motorista', mode: 'invite', temporaryPassword: '', reason: '', confirmPromotion: false });
  }, [action, form, open, user]);

  const submit = async (values: Values) => {
    if (action === 'create') {
      if (!values.email) return form.setError('email', { message: 'Informe o e-mail' });
      if (!values.fullName?.trim()) return form.setError('fullName', { message: 'Informe o nome' });
      if (values.mode === 'temporary_password' && !values.temporaryPassword) return form.setError('temporaryPassword', { message: 'Informe a senha temporária' });
      await onSubmit({ action: 'create_user', email: values.email ?? '', full_name: values.fullName ?? '', role: values.role === 'admin' ? 'motorista' : values.role, mode: values.mode, temporary_password: values.temporaryPassword || undefined, reason: values.reason });
    } else if (user) {
      if (action === 'reset') await onSubmit({ action: 'send_password_reset', user_id: user.id, reason: values.reason });
      if (action === 'temporary-password') {
        if (!values.temporaryPassword) return form.setError('temporaryPassword', { message: 'Informe a senha temporária' });
        await onSubmit({ action: 'set_temporary_password', user_id: user.id, temporary_password: values.temporaryPassword, reason: values.reason });
      }
      if (action === 'email') {
        if (!values.email) return form.setError('email', { message: 'Informe o e-mail' });
        await onSubmit({ action: 'update_email', user_id: user.id, email: values.email, reason: values.reason });
      }
      if (action === 'confirm-email') await onSubmit({ action: 'confirm_email', user_id: user.id, reason: values.reason });
      if (action === 'role') {
        if (values.role === 'admin' && !values.confirmPromotion) return form.setError('confirmPromotion', { message: 'Confirme a promoção para administrador' });
        await onSubmit({ action: 'change_role', user_id: user.id, role: values.role, confirm_admin_promotion: values.confirmPromotion, reason: values.reason });
      }
      if (action === 'delete') await onSubmit({ action: 'delete_user', user_id: user.id, reason: values.reason });
      if (action === 'block' || action === 'unblock') await onSubmit({ action, user_id: user.id, reason: values.reason });
    }
    onOpenChange(false);
  };

  const content = (
    <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      {(action === 'create' || action === 'email') && <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>} />}
      {action === 'create' && <>
        <FormField control={form.control} name="fullName" render={({ field }) => <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="role" render={({ field }) => <FormItem><FormLabel>Tipo de usuário</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="locador">Locador</SelectItem><SelectItem value="motorista">Motorista</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
        <FormField control={form.control} name="mode" render={({ field }) => <FormItem><FormLabel>Primeiro acesso</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="invite">Convite por e-mail</SelectItem><SelectItem value="temporary_password">Senha temporária</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
      </>}
      {(action === 'temporary-password' || (action === 'create' && mode === 'temporary_password')) && <FormField control={form.control} name="temporaryPassword" render={({ field }) => <FormItem><FormLabel>Senha temporária</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} />}
      {action === 'role' && <><FormField control={form.control} name="role" render={({ field }) => <FormItem><FormLabel>Nova permissão</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="locador">Locador</SelectItem><SelectItem value="motorista">Motorista</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />{selectedRole === 'admin' && <FormField control={form.control} name="confirmPromotion" render={({ field }) => <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} /></FormControl><FormLabel>Confirmo a promoção para administrador</FormLabel></FormItem>} />}</>}
      <FormField control={form.control} name="reason" render={({ field }) => <FormItem><FormLabel>Motivo</FormLabel><FormControl><Textarea {...field} placeholder="Informe o motivo desta ação" /></FormControl><FormMessage /></FormItem>} />
    </form></Form>
  );

  if (isDestructive) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{titles[action]}</AlertDialogTitle><AlertDialogDescription>{action === 'delete' ? `A conta ${user?.email ?? ''} será excluída e seus dados pessoais serão anonimizados. Esta ação não pode ser desfeita.` : `A conta ${user?.email ?? ''} perderá o acesso ao sistema.`}</AlertDialogDescription></AlertDialogHeader>
          {content}
          <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={pending} onClick={(event) => { event.preventDefault(); void form.handleSubmit(submit)(); }}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{titles[action]}</DialogTitle><DialogDescription>{user ? `Conta: ${user.email}` : 'Cadastre uma nova conta e defina seu acesso inicial.'}</DialogDescription></DialogHeader>
        {content}
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="button" disabled={pending} onClick={form.handleSubmit(submit)}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}