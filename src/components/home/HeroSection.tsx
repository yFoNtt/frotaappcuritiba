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
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="container relative z-10">
        <div className="grid min-h-[85vh] items-center gap-8 lg:grid-cols-1 py-12 lg:py-0">
          
          {/* Left — Copy */}
          <motion.div
            className="max-w-xl pt-8 lg:pt-0"
            variants={container}
            initial="hidden"
            animate="show"
          >

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08]"
            >
              Seu próximo carro para{' '}
              <span className="text-primary">app</span>{' '}
              está aqui
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 text-base sm:text-lg text-white/80 max-w-md leading-relaxed"
            >
              Alugue veículos prontos para Uber, 99 e iFood.
              Contratos flexíveis, sem burocracia e com suporte dedicado.
            </motion.p>

            {/* Checklist */}
            <motion.ul variants={item} className="mt-6 flex flex-col gap-2.5 text-sm text-white/90">
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
              <Button size="lg" variant="outline" asChild className="border-background/20 text-background bg-primary hover:bg-primary/90 text-base px-7 h-12">
                <Link to="/como-funciona">
                  <Play className="mr-2 h-4 w-4" />
                  Como Funciona
                </Link>
              </Button>
            </motion.div>

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
