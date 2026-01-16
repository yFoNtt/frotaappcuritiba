import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { motoristaVehicle } from '@/data/mockMotoristaData';

export default function MotoristaVehicle() {
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
                <img
                  src={motoristaVehicle.imagem}
                  alt={`${motoristaVehicle.marca} ${motoristaVehicle.modelo}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {motoristaVehicle.marca} {motoristaVehicle.modelo}
                    </h2>
                    <p className="text-lg text-muted-foreground">{motoristaVehicle.ano}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">
                    {motoristaVehicle.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Placa</p>
                      <p className="font-semibold">{motoristaVehicle.placa}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Fuel className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Combustível</p>
                      <p className="font-semibold">{motoristaVehicle.combustivel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Gauge className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quilometragem</p>
                      <p className="font-semibold">{motoristaVehicle.km.toLocaleString('pt-BR')} km</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cor</p>
                      <p className="font-semibold">{motoristaVehicle.cor}</p>
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
                <p className="text-lg font-semibold">{motoristaVehicle.locador.nome}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{motoristaVehicle.locador.telefone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{motoristaVehicle.locador.email}</span>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="font-semibold">
                    {new Date(motoristaVehicle.contrato.inicio).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Término</p>
                  <p className="font-semibold">
                    {new Date(motoristaVehicle.contrato.fim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Semanal</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {motoristaVehicle.contrato.valorSemanal.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dia de Vencimento</p>
                  <p className="font-semibold">{motoristaVehicle.contrato.diaVencimento}</p>
                </div>
              </div>
              <Separator />
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Ver Contrato Completo
              </Button>
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
