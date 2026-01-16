import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Wrench, 
  DollarSign,
  Gauge,
  Calendar
} from 'lucide-react';
import { mockVehicles } from '@/data/mockData';
import { mockMaintenanceRecords, mockKmRecords } from '@/data/mockDriversPayments';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LocadorMaintenance() {
  const locadorId = '1';
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const myVehicles = mockVehicles.filter(v => v.locadorId === locadorId);
  const myMaintenanceRecords = mockMaintenanceRecords.filter(m => 
    myVehicles.some(v => v.id === m.vehicleId)
  );
  const myKmRecords = mockKmRecords.filter(k => 
    myVehicles.some(v => v.id === k.vehicleId)
  );

  const filteredRecords = myMaintenanceRecords.filter(record => {
    const vehicle = mockVehicles.find(v => v.id === record.vehicleId);
    
    const matchesSearch = 
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle?.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalCost = myMaintenanceRecords.reduce((acc, r) => acc + r.cost, 0);
  const totalExcessFees = myKmRecords.reduce((acc, r) => acc + r.feeCharged, 0);

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Manutenção registrada com sucesso!');
    setIsAddDialogOpen(false);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      preventive: 'Preventiva',
      corrective: 'Corretiva',
      revision: 'Revisão',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const getTypeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
      preventive: 'success',
      corrective: 'destructive',
      revision: 'default',
      other: 'secondary' as 'default',
    };
    return variants[type] || 'default';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manutenção</h1>
            <p className="text-muted-foreground">
              Registre e acompanhe as manutenções dos veículos
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Manutenção</DialogTitle>
                <DialogDescription>
                  Adicione um registro de manutenção para o veículo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMaintenance} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Veículo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {myVehicles.length === 0 && (
                        <SelectItem value="no-vehicles" disabled>Nenhum veículo disponível</SelectItem>
                      )}
                      {myVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.brand} {v.model} - {v.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">Preventiva</SelectItem>
                        <SelectItem value="corrective">Corretiva</SelectItem>
                        <SelectItem value="revision">Revisão</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Custo (R$)</Label>
                    <Input id="cost" type="number" step="0.01" placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="km">Quilometragem</Label>
                    <Input id="km" type="number" placeholder="45000" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva os serviços realizados..."
                    rows={3}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <DollarSign className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {totalCost.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">Gasto em Manutenção</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Gauge className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {totalExcessFees.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">Multas Excesso Km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myMaintenanceRecords.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Registros</p>
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
                  placeholder="Buscar por descrição ou veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="preventive">Preventiva</SelectItem>
                  <SelectItem value="corrective">Corretiva</SelectItem>
                  <SelectItem value="revision">Revisão</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
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
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const vehicle = mockVehicles.find(v => v.id === record.vehicleId);
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{vehicle?.brand} {vehicle?.model}</p>
                            <p className="text-xs text-muted-foreground">{vehicle?.plate}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(record.type)}>
                          {getTypeLabel(record.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(record.date, 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                          {record.km.toLocaleString('pt-BR')} km
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        -R$ {record.cost.toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Km Records */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Controle de Quilometragem</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myKmRecords.map((record) => {
                const vehicle = mockVehicles.find(v => v.id === record.vehicleId);
                const kmUsed = record.finalKm - record.initialKm;
                
                return (
                  <div key={record.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium">{vehicle?.brand} {vehicle?.model}</p>
                      <Badge variant="outline">
                        {record.month}/{record.year}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Km Inicial:</span>
                        <span>{record.initialKm.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Km Final:</span>
                        <span>{record.finalKm.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Km Rodados:</span>
                        <span>{kmUsed.toLocaleString('pt-BR')}</span>
                      </div>
                      {record.excessKm > 0 && (
                        <>
                          <div className="flex justify-between text-warning">
                            <span>Excesso:</span>
                            <span>{record.excessKm.toLocaleString('pt-BR')} km</span>
                          </div>
                          <div className="flex justify-between text-success font-medium">
                            <span>Multa:</span>
                            <span>+R$ {record.feeCharged}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
