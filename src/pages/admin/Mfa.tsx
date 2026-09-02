import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { useAdminMfaUsers, useSetUserMfa } from '@/hooks/useAdminData';
import { format, parseISO } from 'date-fns';

export default function AdminMfa() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [mfaFilter, setMfaFilter] = useState<string>('all');

  const { data: users = [], isLoading } = useAdminMfaUsers();
  const setMfaMutation = useSetUserMfa();

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(term) ||
        (u.full_name ?? '').toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesMfa =
        mfaFilter === 'all' ||
        (mfaFilter === 'enabled' ? u.mfa_enabled : !u.mfa_enabled);
      return matchesSearch && matchesRole && matchesMfa;
    });
  }, [users, searchTerm, roleFilter, mfaFilter]);

  const enabledCount = users.filter((u) => u.mfa_enabled).length;
  const coverage = users.length ? Math.round((enabledCount / users.length) * 100) : 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-16" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verificação em Duas Etapas</h1>
          <p className="text-muted-foreground">
            Veja e gerencie quais usuários têm a MFA ativa na plataforma
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-success/10 p-2">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enabledCount}</p>
                <p className="text-sm text-muted-foreground">Com MFA ativa</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-destructive/10 p-2">
                <ShieldOff className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length - enabledCount}</p>
                <p className="text-sm text-muted-foreground">Sem MFA</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coverage}%</p>
                <p className="text-sm text-muted-foreground">Cobertura</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="locador">Locadores</SelectItem>
                  <SelectItem value="motorista">Motoristas</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mfaFilter} onValueChange={setMfaFilter}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Status MFA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="enabled">MFA ativa</SelectItem>
                  <SelectItem value="disabled">MFA desativada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {filtered.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status MFA</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="w-[120px] text-right">Gerenciar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium">{u.full_name || u.email || 'Sem identificação'}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.full_name ? u.email : `${u.id.slice(0, 8)}...`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.role === 'locador' ? 'default' : u.role === 'admin' ? 'destructive' : 'secondary'
                          }
                        >
                          {u.role === 'locador' ? 'Locador' : u.role === 'admin' ? 'Admin' : 'Motorista'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.mfa_enabled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success-soft-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" /> Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            <ShieldOff className="h-3.5 w-3.5" /> Desativada
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.last_sign_in_at
                          ? format(parseISO(u.last_sign_in_at), 'dd/MM/yyyy HH:mm')
                          : <span className="text-muted-foreground">Nunca</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={u.mfa_enabled}
                          disabled={setMfaMutation.isPending}
                          aria-label={`Alternar MFA de ${u.email || u.id}`}
                          onCheckedChange={(checked) =>
                            setMfaMutation.mutate({ userId: u.id, enabled: checked })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldCheck className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground">Ajuste os filtros para ver outros resultados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
