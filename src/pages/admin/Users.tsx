import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { 
  Search, 
  Users,
  Building2,
  UserCog,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useAdminUsers, useAdminStats, useUpdateUserRole, useSetUserBlocked, AdminUser } from '@/hooks/useAdminData';
import { useAuth } from '@/hooks/useAuth';
import { AdminUserActionDialog, UserActionKind } from '@/components/admin/AdminUserActionDialog';
import { useAdminUserAction } from '@/hooks/useAdminData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionState, setActionState] = useState<{ action: UserActionKind; user: AdminUser | null } | null>(null);

  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const setBlockedMutation = useSetUserBlocked();
  const userActionMutation = useAdminUserAction();

  const isLoading = usersLoading || statsLoading;

  const handleAction = async (payload: Parameters<NonNullable<React.ComponentProps<typeof AdminUserActionDialog>['onSubmit']>>[0]) => {
    if (payload.action === 'block' || payload.action === 'unblock') {
      await setBlockedMutation.mutateAsync({ userId: payload.user_id, blocked: payload.action === 'block', reason: payload.reason });
    } else await userActionMutation.mutateAsync(payload);
  };


  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.id.toLowerCase().includes(searchLower) ||
        (user.email && user.email.toLowerCase().includes(searchLower));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
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
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários da plataforma
          </p>
          </div>
          <Button onClick={() => setActionState({ action: 'create', user: null })}><Plus className="mr-2 h-4 w-4" />Novo usuário</Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Building2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalLocadores || 0}</p>
                  <p className="text-sm text-muted-foreground">Locadores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalMotoristas || 0}</p>
                  <p className="text-sm text-muted-foreground">Motoristas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <UserCog className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou ID..."
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
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="locador">Locadores</SelectItem>
                  <SelectItem value="motorista">Motoristas</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            user.role === 'locador' ? 'bg-primary/10 text-primary' : 
                            user.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {user.role === 'locador' ? 'L' : user.role === 'admin' ? 'A' : 'M'}
                          </div>
                          <div>
                            <p className="font-medium">{user.email || 'Email não disponível'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'locador' ? 'default' : 
                          user.role === 'admin' ? 'destructive' : 
                          'secondary'
                        }>
                          {user.role === 'locador' ? 'Locador' : 
                           user.role === 'admin' ? 'Admin' : 
                           'Motorista'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.blocked_at ? (
                          <Badge variant="destructive" title={user.blocked_reason ?? ''}>
                            Bloqueado
                          </Badge>
                        ) : (
                          format(parseISO(user.created_at), 'dd/MM/yyyy')
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at 
                          ? format(parseISO(user.last_sign_in_at), 'dd/MM/yyyy HH:mm')
                          : <span className="text-muted-foreground">Nunca</span>
                        }
                      </TableCell>
                      <TableCell>
                         <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ações de ${user.email}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                           <DropdownMenuItem onSelect={() => setActionState({ action: 'reset', user })}>Enviar link de redefinição</DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => setActionState({ action: 'temporary-password', user })}>Definir senha temporária</DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => setActionState({ action: 'email', user })}>Alterar e-mail</DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => setActionState({ action: 'confirm-email', user })}>Confirmar e-mail</DropdownMenuItem>
                           <DropdownMenuItem disabled={user.id === currentUser?.id} onSelect={() => setActionState({ action: 'role', user })}>Alterar permissão</DropdownMenuItem>
                           <DropdownMenuItem disabled={user.role === 'admin' || user.id === currentUser?.id} onSelect={() => setActionState({ action: user.blocked_at ? 'unblock' : 'block', user })}>{user.blocked_at ? 'Desbloquear' : 'Bloquear'}</DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={user.role === 'admin' || user.id === currentUser?.id} onSelect={() => setActionState({ action: 'delete', user })}>Excluir usuário</DropdownMenuItem>
                         </DropdownMenuContent></DropdownMenu>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground">
                  {users.length === 0
                    ? 'Nenhum usuário cadastrado ainda.'
                    : 'Nenhum usuário corresponde aos filtros.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {actionState && <AdminUserActionDialog open action={actionState.action} user={actionState.user} pending={userActionMutation.isPending || setBlockedMutation.isPending} onOpenChange={(open) => !open && setActionState(null)} onSubmit={handleAction} />}
      </div>
    </AdminLayout>
  );
}