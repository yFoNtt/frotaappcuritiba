import { Search, FileText, Car, Star } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
      <div className="container">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary mb-2 sm:mb-3">Passo a passo</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Como funciona?
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            Em poucos passos você já está rodando com o carro ideal.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-4">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              className="relative text-center group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-10 left-[60%] hidden h-px w-[80%] bg-gradient-to-r from-primary/30 to-transparent lg:block" />
              )}

              <div className="relative mx-auto mb-4 sm:mb-6 flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-primary/5 rotate-6 transition-transform group-hover:rotate-12" />
                <div className="relative flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-card border border-border shadow-card transition-all group-hover:shadow-card-hover group-hover:-translate-y-1">
                  <item.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-primary text-[10px] sm:text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
              </div>

              <h3 className="mb-1 sm:mb-2 text-base sm:text-lg font-bold text-foreground">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
