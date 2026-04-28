import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Car, 
  Fuel, 
  Calendar,
  Gauge,
  Phone,
  Mail,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useMotoristaFullData } from '@/hooks/useMotoristaData';

export default function MotoristaVehicle() {
  const { driver, vehicle, contract, isLoading } = useMotoristaFullData();

  if (isLoading) {
    return (
      <MotoristaLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
          <Skeleton className="h-96" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </MotoristaLayout>
    );
  }

  if (!vehicle) {
    return (
      <MotoristaLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Meu Veículo</h1>
            <p className="text-muted-foreground">Informações do veículo alugado</p>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Car className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Nenhum veículo vinculado</h3>
              <p className="mt-2 text-muted-foreground">
                Você ainda não está vinculado a nenhum veículo.
                Entre em contato com seu locador para iniciar.
              </p>
            </CardContent>
          </Card>
        </div>
      </MotoristaLayout>
    );
  }

  return (
    <MotoristaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Meu Veículo</h1>
          <p className="text-muted-foreground">Informações completas do veículo alugado</p>
        </div>

        {/* Vehicle Hero */}
        <Card>
          <CardContent className="p-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="aspect-video overflow-hidden lg:aspect-auto lg:h-full">
                {vehicle.images?.[0] ? (
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[300px] items-center justify-center bg-muted">
                    <Car className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {vehicle.brand} {vehicle.model}
                    </h2>
                    <p className="text-lg text-muted-foreground">{vehicle.year}</p>
                  </div>
                  <Badge className="bg-success-soft text-success-soft-foreground">
                    Em uso
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Placa</p>
                      <p className="font-semibold">{vehicle.plate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Fuel className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Combustível</p>
                      <p className="font-semibold capitalize">{vehicle.fuel_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Gauge className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preço Semanal</p>
                      <p className="font-semibold">R$ {Number(vehicle.weekly_price).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cor</p>
                      <p className="font-semibold">{vehicle.color}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Locador Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Locador
              </CardTitle>
              <CardDescription>Informações de contato do locador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">Seu Locador</p>
                <p className="text-sm text-muted-foreground">
                  Entre em contato pelo aplicativo
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Contato via sistema</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  Ligar
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Mensagem
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contrato
              </CardTitle>
              <CardDescription>Detalhes do contrato de locação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Início</p>
                      <p className="font-semibold">
                        {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Término</p>
                      <p className="font-semibold">
                        {contract.end_date 
                          ? new Date(contract.end_date).toLocaleDateString('pt-BR')
                          : 'Indeterminado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Semanal</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {Number(contract.weekly_price).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dia de Vencimento</p>
                      <p className="font-semibold capitalize">{contract.payment_day}</p>
                    </div>
                  </div>
                  <Separator />
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Contrato Completo
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">Nenhum contrato ativo</p>
                  <p className="text-sm text-muted-foreground">
                    Entre em contato com seu locador
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                Mantenha os documentos do veículo sempre em dia e dentro do carro.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                Em caso de acidente, entre em contato imediatamente com o locador.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                Realize as manutenções preventivas conforme orientação do locador.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                Não faça modificações no veículo sem autorização prévia.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MotoristaLayout>
  );
}
