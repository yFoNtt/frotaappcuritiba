import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import {
  Search,
  MessageCircle,
  Car,
  CheckCircle,
  ArrowRight,
  UserPlus,
  FileSignature,
  BarChart3,
} from 'lucide-react';
import { SEO } from '@/components/SEO';

const motoristaSteps = [
  { icon: Search, title: 'Busque um veículo', description: 'Filtre por cidade, preço e apps aceitos.' },
  { icon: MessageCircle, title: 'Entre em contato', description: 'Fale direto com o locador pelo WhatsApp.' },
  { icon: Car, title: 'Feche o contrato', description: 'Acerte valor, caução e KM franqueada.' },
  { icon: CheckCircle, title: 'Comece a rodar', description: 'Retire o veículo e comece a ganhar.' },
];

const locadorSteps = [
  { icon: UserPlus, title: 'Crie sua conta', description: 'Cadastro gratuito em menos de 2 minutos.' },
  { icon: Car, title: 'Cadastre veículos', description: 'Adicione fotos e configure preços com IA.' },
  { icon: FileSignature, title: 'Gere contratos', description: 'Vincule motoristas e formalize o aluguel.' },
  { icon: BarChart3, title: 'Gerencie tudo', description: 'Pagamentos, manutenções e alertas centralizados.' },
];

function StepsGrid({ steps }: { steps: typeof motoristaSteps }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.title} className="relative text-center">
          {index < steps.length - 1 && (
            <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-border lg:block" />
          )}
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
  );
}

export default function HowItWorks() {
  const faqs = [
    { q: 'Preciso ter CNH para alugar?', a: 'Sim, é necessário ter CNH válida categoria B ou superior.' },
    { q: 'Como funciona a caução?', a: 'Valor de segurança definido pelo locador, devolvido ao final do contrato se não houver pendências.' },
    { q: 'Posso usar o veículo em qualquer aplicativo?', a: 'Depende do locador. Cada anúncio especifica quais apps são permitidos (Uber, 99, InDriver, etc.).' },
    { q: 'O que acontece se eu ultrapassar o limite de quilometragem?', a: 'Cada contrato define um limite. Se ultrapassar, é cobrado um valor por km excedente.' },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <PublicLayout>
      <SEO
        title="Como Funciona - Aluguel de Veículos para Apps"
        description="Veja como o FrotaApp conecta motoristas e locadores em Curitiba. Processo simples para alugar ou anunciar veículos."
        canonical="/como-funciona"
        jsonLd={faqJsonLd}
      />

      <section className="bg-muted/30 py-16">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Como Funciona</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Alugar ou anunciar um veículo nunca foi tão simples.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Passo a passo</h2>
          <Tabs defaultValue="motorista" className="mx-auto max-w-5xl">
            <TabsList className="mx-auto mb-12 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="motorista">Para Motoristas</TabsTrigger>
              <TabsTrigger value="locador">Para Locadores</TabsTrigger>
            </TabsList>

            <TabsContent value="motorista">
              <StepsGrid steps={motoristaSteps} />
            </TabsContent>

            <TabsContent value="locador">
              <StepsGrid steps={locadorSteps} />
            </TabsContent>
          </Tabs>
        </div>
      </section>


      <section className="bg-muted/30 py-20">
        <div className="container">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Perguntas Frequentes</h2>
          <div className="mx-auto max-w-3xl space-y-4">
            {[
              {
                q: 'Preciso ter CNH para alugar?',
                a: 'Sim, é necessário ter CNH válida categoria B ou superior.',
              },
              {
                q: 'Como funciona a caução?',
                a: 'Valor de segurança definido pelo locador, devolvido ao final do contrato se não houver pendências.',
              },
              {
                q: 'Posso usar o veículo em qualquer aplicativo?',
                a: 'Depende do locador. Cada anúncio especifica quais apps são permitidos (Uber, 99, InDriver, etc.).',
              },
              {
                q: 'O que acontece se eu ultrapassar o limite de quilometragem?',
                a: 'Cada contrato define um limite. Se ultrapassar, é cobrado um valor por km excedente.',
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-2 font-semibold text-foreground">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">Pronto para começar?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Escolha o caminho que faz sentido para você.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" asChild>
              <Link to="/cadastro?tipo=locador">
                É locador? Cadastre-se
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/veiculos">
                É motorista? Encontre um veículo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
