import { Search, FileText, Car, Star } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Busque',
    description: 'Pesquise veículos disponíveis na sua cidade com filtros por marca, preço e ano.',
  },
  {
    icon: FileText,
    step: '02',
    title: 'Contrate',
    description: 'Entre em contato com o locador, negocie e assine o contrato digital.',
  },
  {
    icon: Car,
    step: '03',
    title: 'Rode',
    description: 'Retire o veículo e comece a rodar nos apps de transporte imediatamente.',
  },
  {
    icon: Star,
    step: '04',
    title: 'Cresça',
    description: 'Acompanhe seus ganhos e construa seu histórico na plataforma.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Passo a passo</p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Como funciona?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Em poucos passos você já está rodando com o carro ideal.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-10 left-[60%] hidden h-px w-[80%] bg-gradient-to-r from-primary/30 to-transparent lg:block" />
              )}

              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/5 rotate-6 transition-transform group-hover:rotate-12" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-card border border-border shadow-card transition-all group-hover:shadow-card-hover group-hover:-translate-y-1">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
