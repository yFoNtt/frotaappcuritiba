import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Users, TrendingUp, Search, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-fleet.jpg';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-foreground">
      {/* Split layout */}
      <div className="container relative z-10">
        <div className="grid min-h-[90vh] items-center gap-8 lg:grid-cols-2 lg:gap-12 py-12 lg:py-0">
          
          {/* Left — Copy */}
          <motion.div
            className="max-w-xl pt-8 lg:pt-0"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item} className="mb-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Vagas abertas em 50+ cidades
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-background leading-[1.08]"
            >
              Seu próximo carro para{' '}
              <span className="text-primary">app</span>{' '}
              está aqui
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 text-base sm:text-lg text-background/70 max-w-md leading-relaxed"
            >
              Alugue veículos prontos para Uber, 99 e iFood.
              Contratos flexíveis, sem burocracia e com suporte dedicado.
            </motion.p>

            {/* Checklist */}
            <motion.ul variants={item} className="mt-6 flex flex-col gap-2.5 text-sm text-background/80">
              {['Sem entrada ou fiador', 'Carros revisados e documentados', 'Suporte 7 dias por semana'].map((text) => (
                <li key={text} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  {text}
                </li>
              ))}
            </motion.ul>

            {/* CTA */}
            <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" asChild className="bg-primary hover:brightness-110 active:brightness-95 text-primary-foreground shadow-lg shadow-primary/30 text-base px-7 h-12">
                <Link to="/veiculos">
                  <Search className="mr-2 h-5 w-5" />
                  Ver Veículos Disponíveis
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-background/20 text-background hover:bg-background/10 text-base px-7 h-12">
                <Link to="/como-funciona">
                  <Play className="mr-2 h-4 w-4" />
                  Como Funciona
                </Link>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={item}
              className="mt-10 flex items-center gap-8 border-t border-background/10 pt-8"
            >
              {[
                { value: '500+', label: 'Veículos' },
                { value: '2.000+', label: 'Motoristas ativos' },
                { value: '4.8★', label: 'Avaliação média' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl font-bold text-background">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-background/50">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Image */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              <img
                src={heroImage}
                alt="Frota de veículos disponíveis para locação"
                className="h-[540px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

              {/* Floating card */}
              <motion.div
                className="absolute bottom-6 left-6 right-6 rounded-2xl bg-card/95 backdrop-blur-sm border border-border p-5 shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                      <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">12 veículos disponíveis</p>
                      <p className="text-xs text-muted-foreground">na sua região agora</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild className="text-xs">
                    <Link to="/veiculos">
                      Ver todos
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
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
      description: 'Locadores verificados, contratos claros e transparentes para sua total proteção.',
      color: 'bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground',
    },
    {
      icon: Users,
      title: 'Conexão Direta',
      description: 'Fale diretamente com os locadores via WhatsApp. Sem intermediários.',
      color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    },
    {
      icon: TrendingUp,
      title: 'Gestão Completa',
      description: 'Dashboard para gerenciar frota, motoristas, financeiro e manutenções.',
      color: 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary mb-2 sm:mb-3">Vantagens</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Por que escolher o FrotaApp?
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            Uma plataforma pensada para facilitar a vida de motoristas e locadores.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative rounded-2xl border border-border bg-card p-5 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-card-hover hover:-translate-y-1"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className={`mb-4 sm:mb-6 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl transition-all duration-500 ${feature.color}`}>
                <feature.icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
