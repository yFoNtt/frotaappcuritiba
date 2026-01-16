import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, ArrowRight, Shield, Users, TrendingUp } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative py-20 md:py-28 lg:py-36">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
            <Car className="h-4 w-4" />
            Marketplace de Locação de Veículos
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Alugue veículos para{' '}
            <span className="relative">
              aplicativos
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full text-primary-foreground/30"
                viewBox="0 0 200 12"
                fill="currentColor"
              >
                <path d="M1 8.5c30-7 60-7 90 0s60 7 90 0" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
            Encontre o veículo ideal para trabalhar com Uber, 99 e outros apps. 
            Conectamos motoristas a locadores de forma simples e segura.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="xl" variant="hero" asChild>
              <Link to="/veiculos">
                Buscar Veículos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="heroOutline" asChild>
              <Link to="/para-locadores">
                Sou Locador
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-primary-foreground/20 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground md:text-4xl">500+</div>
              <div className="text-sm text-primary-foreground/70">Veículos Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground md:text-4xl">50+</div>
              <div className="text-sm text-primary-foreground/70">Cidades Atendidas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground md:text-4xl">2.000+</div>
              <div className="text-sm text-primary-foreground/70">Motoristas Ativos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'Segurança Garantida',
      description: 'Todos os locadores são verificados. Contratos claros e transparentes para sua proteção.',
    },
    {
      icon: Users,
      title: 'Conexão Direta',
      description: 'Fale diretamente com os locadores via WhatsApp ou chat interno da plataforma.',
    },
    {
      icon: TrendingUp,
      title: 'Gestão Completa',
      description: 'Para locadores: dashboard completo para gerenciar frota, motoristas e financeiro.',
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Por que escolher o FrotaApp?
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma plataforma pensada para facilitar a vida de motoristas e locadores.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
