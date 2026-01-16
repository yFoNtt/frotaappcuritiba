import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { mockVehicles, mockLocadores } from '@/data/mockData';
import {
  ArrowLeft,
  MapPin,
  Fuel,
  Calendar,
  Gauge,
  Shield,
  MessageCircle,
  Phone,
  Car,
  DollarSign,
  FileText,
} from 'lucide-react';

const statusLabels = {
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
};

const fuelLabels = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
};

const appLabels = {
  uber: 'Uber',
  '99': '99',
  indrive: 'InDrive',
  other: 'Outro',
};

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const vehicle = mockVehicles.find((v) => v.id === id);
  const locador = vehicle ? mockLocadores.find((l) => l.id === vehicle.locadorId) : null;

  if (!vehicle) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <Car className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Veículo não encontrado</h1>
          <p className="mb-6 text-muted-foreground">
            O veículo que você procura não existe ou foi removido.
          </p>
          <Button asChild>
            <Link to="/veiculos">Ver todos os veículos</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const whatsappLink = locador
    ? `https://wa.me/${locador.whatsapp}?text=Olá! Vi o anúncio do ${vehicle.brand} ${vehicle.model} no FrotaApp e gostaria de mais informações.`
    : '#';

  return (
    <PublicLayout>
      <div className="container py-8">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/veiculos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para veículos
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              <img
                src={vehicle.images[0] || '/placeholder.svg'}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4">
                <Badge
                  variant={
                    vehicle.status === 'available'
                      ? 'available'
                      : vehicle.status === 'rented'
                      ? 'rented'
                      : 'maintenance'
                  }
                  className="text-sm"
                >
                  {statusLabels[vehicle.status]}
                </Badge>
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {vehicle.city}, {vehicle.state}
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <Calendar className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="font-semibold">{vehicle.year}</div>
                <div className="text-xs text-muted-foreground">Ano</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <Fuel className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="font-semibold">{fuelLabels[vehicle.fuelType]}</div>
                <div className="text-xs text-muted-foreground">Combustível</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <Gauge className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="font-semibold">{vehicle.kmLimit.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-muted-foreground">KM/Mês</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <div className="mx-auto mb-2 h-5 w-5 rounded bg-muted text-xs font-bold leading-5 text-muted-foreground">
                  {vehicle.color.charAt(0)}
                </div>
                <div className="font-semibold">{vehicle.color}</div>
                <div className="text-xs text-muted-foreground">Cor</div>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{vehicle.description}</p>
              </CardContent>
            </Card>

            {/* Allowed Apps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Aplicativos Permitidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vehicle.allowedApps.map((app) => (
                    <Badge key={app} variant="secondary" className="text-sm">
                      {appLabels[app]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Valor do Aluguel</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    R$ {vehicle.weeklyPrice.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-muted-foreground">por semana</div>
                </div>

                <Separator />

                {/* Contract Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Limite de KM/mês</span>
                    <span className="font-medium">{vehicle.kmLimit.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Excesso por KM</span>
                    <span className="font-medium">R$ {vehicle.excessKmFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Caução</span>
                    <span className="font-medium">R$ {vehicle.deposit.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <Separator />

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button size="lg" variant="whatsapp" className="w-full" asChild>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <Phone className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat Interno
                  </Button>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    Para sua segurança, negocie apenas pela plataforma ou pelo WhatsApp verificado do locador.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Locador Info */}
            {locador && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Anunciante</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {locador.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{locador.companyName || locador.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {locador.city}, {locador.state}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
