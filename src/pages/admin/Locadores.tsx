import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  Eye,
  Building2,
  Car,
  Users
} from 'lucide-react';
import { useAdminLocadores, useAdminStats } from '@/hooks/useAdminData';
import { format, parseISO } from 'date-fns';

export default function AdminLocadores() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: locadores = [], isLoading: locadoresLoading } = useAdminLocadores();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  const isLoading = locadoresLoading || statsLoading;

  const filteredLocadores = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return locadores.filter(locador =>
      locador.id.toLowerCase().includes(searchLower) ||
      (locador.email && locador.email.toLowerCase().includes(searchLower))
    );
  }, [locadores, searchTerm]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locadores</h1>
          <p className="text-muted-foreground">
            Visualize todos os locadores cadastrados na plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalLocadores || 0}</p>
                  <p className="text-sm text-muted-foreground">Total de Locadores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Car className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalVehicles || 0}</p>
                  <p className="text-sm text-muted-foreground">Veículos Cadastrados</p>
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
                  <p className="text-2xl font-bold">{stats?.totalDrivers || 0}</p>
                  <p className="text-sm text-muted-foreground">Motoristas Vinculados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredLocadores.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locador</TableHead>
                    <TableHead>Veículos</TableHead>
                    <TableHead>Motoristas</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocadores.map((locador) => (
                    <TableRow key={locador.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {locador.email ? locador.email.charAt(0).toUpperCase() : 'L'}
                          </div>
                          <div>
                            <p className="font-medium">{locador.email || 'Email não disponível'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{locador.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Car className="h-3 w-3" />
                          {locador.vehicleCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {locador.driverCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(locador.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Car className="mr-2 h-4 w-4" />
                              Ver veículos
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Ver motoristas
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhum locador encontrado</h3>
                <p className="text-muted-foreground">
                  {locadores.length === 0
                    ? 'Nenhum locador cadastrado ainda.'
                    : 'Nenhum locador corresponde à busca.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}