import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Car, CheckCircle, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Busque um Veículo',
      description: 'Use nossos filtros para encontrar o veículo ideal para trabalhar com apps de transporte.',
    },
    {
      icon: MessageCircle,
      title: 'Entre em Contato',
      description: 'Fale diretamente com o locador pelo WhatsApp ou chat interno para tirar dúvidas.',
    },
    {
      icon: Car,
      title: 'Feche o Contrato',
      description: 'Acerte os detalhes do aluguel: valor, caução, quilometragem e regras do contrato.',
    },
    {
      icon: CheckCircle,
      title: 'Comece a Trabalhar',
      description: 'Retire o veículo e comece a ganhar dinheiro com Uber, 99 e outros aplicativos.',
    },
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-muted/30 py-16">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Como Funciona
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Alugar um veículo para trabalhar com aplicativos nunca foi tão fácil. 
            Veja como o FrotaApp conecta você a oportunidades.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-border lg:block" />
                )}
                
                {/* Step Number */}
                <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary/10" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                    {index + 1}
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            Perguntas Frequentes
          </h2>

          <div className="mx-auto max-w-3xl space-y-4">
            {[
              {
                q: 'Preciso ter CNH para alugar?',
                a: 'Sim, é necessário ter CNH válida categoria B ou superior para alugar veículos na plataforma.',
              },
              {
                q: 'Como funciona a caução?',
                a: 'A caução é um valor de segurança definido pelo locador, geralmente entre R$ 800 e R$ 1.500, devolvido ao final do contrato se não houver pendências.',
              },
              {
                q: 'Posso usar o veículo em qualquer aplicativo?',
                a: 'Depende do locador. Cada anúncio especifica quais aplicativos são permitidos (Uber, 99, InDrive, etc.).',
              },
              {
                q: 'O que acontece se eu ultrapassar o limite de quilometragem?',
                a: 'Cada contrato define um limite mensal de km. Se ultrapassar, é cobrado um valor por km excedente, especificado no anúncio.',
              },
            ].map((faq, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-2 font-semibold text-foreground">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Pronto para começar?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Encontre seu próximo veículo agora e comece a trabalhar com aplicativos de transporte.
          </p>
          <Button size="xl" asChild>
            <Link to="/veiculos">
              Buscar Veículos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
