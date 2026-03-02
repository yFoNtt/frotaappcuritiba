import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, ArrowRight, Shield, Users, TrendingUp, Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-fleet.jpg';

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Frota de veículos"
          className="h-full w-full object-cover" />

        <div className="absolute inset-0 bg-background/60 dark:bg-background/65" />
      </div>

      {/* Floating Elements - hidden on mobile/tablet */}
      <div className="absolute top-20 right-[10%] hidden xl:block">
        <div className="rounded-2xl bg-white/90 dark:bg-card/95 border border-border shadow-lg p-4 animate-fade-in" style={{ animationDelay: '0.8s', opacity: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
              <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">+12 veículos</p>
              <p className="text-xs text-muted-foreground">disponíveis agora</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-32 right-[15%] hidden xl:block">
        <div className="rounded-2xl bg-white/90 dark:bg-card/95 border border-border shadow-lg p-4 animate-fade-in" style={{ animationDelay: '1.2s', opacity: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">50+ cidades</p>
              <p className="text-xs text-muted-foreground">em todo Brasil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-primary dark:bg-primary/20 dark:text-primary animate-fade-in">
            <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Marketplace #1 de Locação para Apps</span>
          </div>

          {/* Heading */}
          <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground animate-slide-up">
            Alugue o carro ideal para{' '}
            <span className="text-gradient text-primary">rodar por app</span>
          </h1>

          {/* Description */}
          <p className="mb-6 sm:mb-8 max-w-lg text-base sm:text-lg md:text-xl text-muted-foreground animate-slide-up" style={{ animationDelay: '0.15s' }}>
            Encontre veículos prontos para Uber, 99 e outros apps. 
            Sem burocracia, com contratos claros e suporte completo.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" asChild className="bg-primary hover:brightness-105 active:brightness-95 text-primary-foreground shadow-lg shadow-primary/25 sm:size-xl">
              <Link to="/veiculos">
                <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Buscar Veículos
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-border text-foreground hover:bg-accent dark:border-border dark:text-foreground dark:hover:bg-accent sm:size-xl">
              <Link to="/para-locadores">
                Sou Locador
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-10 sm:mt-16 flex gap-6 sm:gap-8 md:gap-12 animate-slide-up" style={{ animationDelay: '0.45s' }}>
            {[
            { value: '500+', label: 'Veículos' },
            { value: '2.000+', label: 'Motoristas' },
            { value: '50+', label: 'Cidades' }].
            map((stat) =>
            <div key={stat.label}>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

}

export function FeaturesSection() {
  const features = [
  {
    icon: Shield,
    title: 'Segurança Garantida',
    description: 'Locadores verificados, contratos claros e transparentes para sua total proteção.',
    color: 'bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground'
  },
  {
    icon: Users,
    title: 'Conexão Direta',
    description: 'Fale diretamente com os locadores via WhatsApp. Sem intermediários.',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
  },
  {
    icon: TrendingUp,
    title: 'Gestão Completa',
    description: 'Dashboard para gerenciar frota, motoristas, financeiro e manutenções.',
    color: 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground'
  }];


  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}>

          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary mb-2 sm:mb-3">Vantagens</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Por que escolher o FrotaApp?
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            Uma plataforma pensada para facilitar a vida de motoristas e locadores.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {features.map((feature, index) =>
          <motion.div
            key={index}
            className="group relative rounded-2xl border border-border bg-card p-5 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-card-hover hover:-translate-y-1"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: index * 0.15 }}>

              <div className={`mb-4 sm:mb-6 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl transition-all duration-500 ${feature.color}`}>
                <feature.icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}