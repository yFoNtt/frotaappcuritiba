import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Eye,
  Car,
  MapPin
} from 'lucide-react';
import { mockVehicles, mockLocadores } from '@/data/mockData';
import { format } from 'date-fns';

export default function AdminVehicles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredVehicles = mockVehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const availableCount = mockVehicles.filter(v => v.status === 'available').length;
  const rentedCount = mockVehicles.filter(v => v.status === 'rented').length;
  const maintenanceCount = mockVehicles.filter(v => v.status === 'maintenance').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground">
            Todos os veículos cadastrados na plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockVehicles.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
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
                  <p className="text-2xl font-bold">{availableCount}</p>
                  <p className="text-sm text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rentedCount}</p>
                  <p className="text-sm text-muted-foreground">Alugados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Car className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{maintenanceCount}</p>
                  <p className="text-sm text-muted-foreground">Manutenção</p>
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
                  placeholder="Buscar por marca, modelo ou placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="rented">Alugado</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Locador</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor/Semana</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => {
                  const locador = mockLocadores.find(l => l.id === vehicle.locadorId);
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Car className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                            <p className="text-sm text-muted-foreground font-mono">{vehicle.plate}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{locador?.companyName || locador?.name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {vehicle.city}/{vehicle.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicle.status}>
                          {vehicle.status === 'available' && 'Disponível'}
                          {vehicle.status === 'rented' && 'Alugado'}
                          {vehicle.status === 'maintenance' && 'Manutenção'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {vehicle.weeklyPrice.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {format(vehicle.createdAt, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
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
