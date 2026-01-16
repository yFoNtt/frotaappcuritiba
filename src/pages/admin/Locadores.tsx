import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Users,
  MapPin
} from 'lucide-react';
import { mockLocadores } from '@/data/mockData';
import { mockVehicles } from '@/data/mockData';
import { mockMotoristas } from '@/data/mockDriversPayments';
import { format } from 'date-fns';

export default function AdminLocadores() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocadores = mockLocadores.filter(locador =>
    locador.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locador.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocadorStats = (locadorId: string) => {
    const vehicles = mockVehicles.filter(v => v.locadorId === locadorId);
    const drivers = mockMotoristas.filter(m => m.locadorId === locadorId);
    return { vehicles: vehicles.length, drivers: drivers.length };
  };

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
                  <p className="text-2xl font-bold">{mockLocadores.length}</p>
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
                  <p className="text-2xl font-bold">{mockVehicles.length}</p>
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
                  <p className="text-2xl font-bold">{mockMotoristas.length}</p>
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
                placeholder="Buscar por nome, e-mail ou empresa..."
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locador</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Veículos</TableHead>
                  <TableHead>Motoristas</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocadores.map((locador) => {
                  const stats = getLocadorStats(locador.id);
                  return (
                    <TableRow key={locador.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {locador.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{locador.companyName || locador.name}</p>
                            <p className="text-sm text-muted-foreground">{locador.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {locador.city}/{locador.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Car className="h-3 w-3" />
                          {stats.vehicles}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {stats.drivers}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(locador.createdAt, 'dd/MM/yyyy')}
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
