import { useRef } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  ArrowRight,
  FileSignature,
  Wallet,
  LayoutDashboard,
  Car,
  Users,
  BarChart3,
  Bell,
  Check,
  Building2,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

export default function ForRenters() {
  const benefits = [
    {
      icon: FileSignature,
      title: 'Contratos digitais',
      description: 'Crie e gerencie contratos sem papel, com histórico completo.',
    },
    {
      icon: Wallet,
      title: 'Pagamentos automáticos',
      description: 'Geração semanal automática, nunca perca um vencimento.',
    },
    {
      icon: LayoutDashboard,
      title: 'Gestão completa',
      description: 'Manutenção, vistoria, quilometragem e documentos centralizados.',
    },
  ];

  const steps = [
    {
      icon: Car,
      title: 'Cadastre seus veículos',
      description: 'Adicione carros e configure preços com sugestão de IA.',
    },
    {
      icon: Users,
      title: 'Vincule motoristas',
      description: 'Cadastre motoristas e gere contratos em minutos.',
    },
    {
      icon: BarChart3,
      title: 'Acompanhe o dashboard',
      description: 'Pagamentos, manutenções e vistorias em tempo real.',
    },
    {
      icon: Bell,
      title: 'Receba alertas',
      description: 'CNH, manutenções e pagamentos próximos do vencimento.',
    },
  ];

  const plans = [
    {
      name: 'Básico',
      price: 'Grátis',
      description: 'Para quem está começando.',
      features: ['Até 3 veículos', 'Marketplace incluído', 'Dashboard essencial', 'Suporte por email'],
      cta: 'Começar agora',
      ctaTo: '/cadastro?tipo=locador',
      disabled: false,
      badge: null as string | null,
    },
    {
      name: 'Profissional',
      price: 'Em breve',
      description: 'Para frotas em crescimento.',
      features: ['Até 15 veículos', 'IA do assistente', 'Alertas avançados', 'Suporte prioritário'],
      cta: 'Em breve',
      ctaTo: '#',
      disabled: true,
      badge: 'Em breve',
    },
    {
      name: 'Enterprise',
      price: 'Em breve',
      description: 'Para grandes operações.',
      features: ['Veículos ilimitados', 'Relatórios avançados', 'API de integração', 'Suporte dedicado'],
      cta: 'Em breve',
      ctaTo: '#',
      disabled: true,
      badge: 'Em breve',
    },
  ];

  const benefitsRef = useRef<HTMLElement | null>(null);
  const scrollToBenefits = () => {
    benefitsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <PublicLayout>
      <SEO
        title="Para Locadores - Gestão de Frota em Curitiba"
        description="Transforme sua frota em renda garantida. Gerencie veículos, motoristas, contratos e pagamentos em um só lugar. Plano gratuito para começar."
        canonical="/para-locadores"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 md:py-28">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              Para Locadores em Curitiba
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Transforme sua frota em <span className="text-primary">renda garantida</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Gerencie seus veículos, motoristas e contratos em um só lugar.
              Feito para locadores de Curitiba que alugam para motoristas de app.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="xl" asChild>
                <Link to="/cadastro?tipo=locador">
                  Começar agora grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" onClick={() => scrollTo('beneficios')}>
                Ver demonstração
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Tudo que você precisa para crescer
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ferramentas pensadas para locadores que querem profissionalizar a operação.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="h-full rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{b.title}</h3>
                  <p className="text-muted-foreground">{b.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Como funciona
            </h2>
            <p className="text-muted-foreground">Em 4 passos sua operação está rodando.</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {i + 1}
                  </div>
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Planos e preços
            </h2>
            <p className="text-muted-foreground">Comece grátis. Cresça quando precisar.</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card
                  className={`relative h-full overflow-hidden ${
                    plan.disabled ? 'border-border/50 opacity-80' : 'border-primary shadow-md'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute right-3 top-3">
                      <Badge variant="warning">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="mb-1 text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    </div>
                    <ul className="mb-6 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success" />
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.disabled ? (
                      <Button className="w-full" variant="outline" disabled>
                        {plan.cta}
                      </Button>
                    ) : (
                      <Button className="w-full" asChild>
                        <Link to={plan.ctaTo}>{plan.cta}</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Pronto para começar?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Crie sua conta gratuita e cadastre seu primeiro veículo em minutos.
            </p>
            <Button size="xl" asChild>
              <Link to="/cadastro?tipo=locador">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
