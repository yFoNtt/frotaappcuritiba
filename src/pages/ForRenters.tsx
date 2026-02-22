import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import {
  Car,
  Users,
  BarChart3,
  Bell,
  Wallet,
  Wrench,
  ArrowRight,
  Check,
  Building2,
} from 'lucide-react';

export default function ForRenters() {
  const features = [
    {
      icon: Car,
      title: 'Gestão de Veículos',
      description: 'Cadastre, edite e controle o status de todos os veículos da sua frota em um só lugar.',
    },
    {
      icon: Users,
      title: 'Gestão de Motoristas',
      description: 'Vincule motoristas aos veículos, acompanhe documentação e histórico de cada um.',
    },
    {
      icon: Wallet,
      title: 'Controle Financeiro',
      description: 'Dashboard completo com faturamento, despesas, lucro estimado e pagamentos.',
    },
    {
      icon: Wrench,
      title: 'Manutenção',
      description: 'Registre gastos de manutenção, tipo de serviço, quilometragem e histórico.',
    },
    {
      icon: BarChart3,
      title: 'Quilometragem',
      description: 'Controle mensal de km rodados e cálculo automático de multa por excesso.',
    },
    {
      icon: Bell,
      title: 'Alertas Automáticos',
      description: 'Notificações de revisão, IPVA, seguro e manutenção preventiva.',
    },
  ];

  const plans = [
    {
      name: 'Básico',
      price: 'R$ 99',
      period: '/mês',
      description: 'Para quem está começando',
      features: ['Até 5 veículos', 'Marketplace incluído', 'Dashboard básico', 'Suporte por email'],
    },
    {
      name: 'Profissional',
      price: 'R$ 199',
      period: '/mês',
      description: 'Para frotas médias',
      features: [
        'Até 20 veículos',
        'Marketplace prioritário',
        'Dashboard completo',
        'Gestão de motoristas',
        'Alertas automáticos',
        'Suporte prioritário',
      ],
      popular: true,
    },
    {
      name: 'Empresarial',
      price: 'R$ 399',
      period: '/mês',
      description: 'Para grandes frotas',
      features: [
        'Veículos ilimitados',
        'Destaque no marketplace',
        'Relatórios avançados',
        'API de integração',
        'Múltiplos usuários',
        'Suporte dedicado',
      ],
    },
  ];

  return (
    <PublicLayout>
      <SEO
        title="Para Locadores - Gestão de Frota Inteligente"
        description="Plataforma completa para locadores de veículos. Gerencie frota, motoristas, pagamentos e manutenções. Planos a partir de R$ 99/mês."
        canonical="/para-locadores"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FrotaApp para Locadores',
          applicationCategory: 'BusinessApplication',
          description: 'Plataforma de gestão de frota para locadores de veículos de aplicativo.',
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: '99',
            highPrice: '399',
            priceCurrency: 'BRL',
            offerCount: 3,
          },
        }}
      />
      {/* Hero */}
      <section className="hero-gradient py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
              <Building2 className="h-4 w-4" />
              Para Locadores e Empresas
            </div>
            <h1 className="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl">
              Gerencie sua frota com inteligência
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Plataforma completa para anunciar veículos, gerenciar motoristas e 
              ter controle total sobre suas operações.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" variant="hero" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/cadastro?tipo=locador">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Tudo o que você precisa
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ferramentas poderosas para gerenciar sua frota de forma eficiente
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Planos e Preços
            </h2>
            <p className="text-muted-foreground">
              Escolha o plano ideal para o tamanho da sua frota
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden ${
                  plan.popular ? 'border-primary shadow-lg' : 'border-border/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="mb-1 text-xl font-semibold text-foreground">{plan.name}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/cadastro?tipo=locador">Começar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Pronto para transformar sua gestão?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Cadastre-se agora e experimente gratuitamente por 7 dias.
          </p>
          <Button size="xl" asChild>
            <Link to="/cadastro?tipo=locador">
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
