import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageGallery } from '@/components/vehicles/ImageGallery';
import { VehicleInspectionHistory } from '@/components/vehicles/VehicleInspectionHistory';
import { useVehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
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
  FileText,
  Palette,
} from 'lucide-react';

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
  inactive: 'Inativo',
};

const fuelLabels: Record<string, string> = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
};

const appLabels: Record<string, string> = {
  Uber: 'Uber',
  '99': '99',
  InDriver: 'InDriver',
  uber: 'Uber',
  indrive: 'InDriver',
  other: 'Outro',
};

function VehicleDetailsSkeleton() {
  return (
    <PublicLayout>
      <div className="container py-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="h-12 w-3/4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading, error } = useVehicle(id);
  const { user } = useAuth();

  // Check if the current user is the owner of the vehicle
  const isOwner = user && vehicle && vehicle.locador_id === user.id;

  if (isLoading) {
    return <VehicleDetailsSkeleton />;
  }

  if (error || !vehicle) {
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

  const whatsappMessage = encodeURIComponent(
    `Olá! Vi o anúncio do ${vehicle.brand} ${vehicle.model} no FrotaApp e gostaria de mais informações.`
  );
  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;

  const vehicleImages = vehicle.images ?? [];
  const kmLimit = vehicle.km_limit ?? 0;
  const excessKmFee = vehicle.excess_km_fee ?? 0;
  const deposit = vehicle.deposit ?? 0;
  const allowedApps = vehicle.allowed_apps ?? [];

  return (
    <PublicLayout>
      <SEO
        title={`${vehicle.brand} ${vehicle.model} ${vehicle.year} - Aluguel em ${vehicle.city}`}
        description={`Alugue ${vehicle.brand} ${vehicle.model} ${vehicle.year} em ${vehicle.city}, ${vehicle.state}. R$ ${Number(vehicle.weekly_price).toFixed(2)}/semana. ${vehicle.description || 'Veículo disponível para apps de transporte.'}`}
        canonical={`/veiculos/${id}`}
        ogType="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
          description: vehicle.description || `Veículo ${vehicle.brand} ${vehicle.model} disponível para locação em ${vehicle.city}.`,
          image: vehicleImages[0] || undefined,
          offers: {
            '@type': 'Offer',
            price: Number(vehicle.weekly_price),
            priceCurrency: 'BRL',
            availability: vehicle.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          brand: { '@type': 'Brand', name: vehicle.brand },
          color: vehicle.color,
          vehicleModelDate: String(vehicle.year),
          fuelType: vehicle.fuel_type,
        }}
      />
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
            {/* Image Gallery with Fullscreen */}
            <div className="relative">
              <ImageGallery
                images={vehicleImages}
                alt={`${vehicle.brand} ${vehicle.model}`}
              />
              <div className="absolute left-4 top-4 z-10">
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
                  {statusLabels[vehicle.status] || vehicle.status}
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
                <div className="font-semibold">{fuelLabels[vehicle.fuel_type] || vehicle.fuel_type}</div>
                <div className="text-xs text-muted-foreground">Combustível</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <Gauge className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="font-semibold">{kmLimit.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-muted-foreground">KM/Mês</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <Palette className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="font-semibold">{vehicle.color}</div>
                <div className="text-xs text-muted-foreground">Cor</div>
              </div>
            </div>

            {/* Description */}
            {vehicle.description && (
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
            )}

            {/* Allowed Apps */}
            {allowedApps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Aplicativos Permitidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {allowedApps.map((app) => (
                      <Badge key={app} variant="secondary" className="text-sm">
                        {appLabels[app] || app}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Especificações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Placa</span>
                    <span className="font-medium">{vehicle.plate}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Marca</span>
                    <span className="font-medium">{vehicle.brand}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Modelo</span>
                    <span className="font-medium">{vehicle.model}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Ano</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inspection History - Only visible to the owner */}
            {isOwner && id && (
              <VehicleInspectionHistory
                vehicleId={id}
                vehicleName={`${vehicle.brand} ${vehicle.model}`}
                vehiclePlate={vehicle.plate}
              />
            )}
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
                    R$ {Number(vehicle.weekly_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-muted-foreground">por semana</div>
                </div>

                <Separator />

                {/* Contract Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Limite de KM/mês</span>
                    <span className="font-medium">{kmLimit.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Excesso por KM</span>
                    <span className="font-medium">R$ {excessKmFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Caução</span>
                    <span className="font-medium">R$ {deposit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
