import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Car, Shield, BarChart3, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  { icon: Car, text: 'Anuncie seus veículos no marketplace' },
  { icon: BarChart3, text: 'Controle financeiro completo' },
  { icon: Shield, text: 'Gestão de motoristas vinculados' },
  { icon: Bell, text: 'Alertas automáticos de revisão e IPVA' },
];

export function CTASection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <motion.div
          className="relative overflow-hidden rounded-3xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative grid gap-10 p-8 md:p-12 lg:grid-cols-2 lg:items-center lg:p-16">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground border border-primary-foreground/10">
                <Car className="h-4 w-4" />
                Para Locadores e Empresas
              </p>
              <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
                Gerencie sua frota de forma inteligente
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/70">
                Dashboard completo para gerenciar veículos, motoristas, pagamentos e manutenções.
                Tudo em um só lugar.
              </p>

              <ul className="mb-8 space-y-3">
                {benefits.map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-3 text-primary-foreground/80"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                      <item.icon className="h-4 w-4 text-primary-foreground" />
                    </span>
                    {item.text}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Right */}
            <motion.div
              className="flex flex-col items-start gap-6 lg:items-end"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 p-6 w-full lg:max-w-sm">
                <div className="mb-4 text-center">
                  <p className="text-sm text-primary-foreground/60">Comece agora</p>
                  <p className="text-3xl font-bold text-primary-foreground mt-1">Grátis</p>
                  <p className="text-sm text-primary-foreground/60 mt-1">para começar</p>
                </div>
                <Button size="xl" asChild className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                  <Link to="/cadastro?tipo=locador">
                    Criar Conta de Locador
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="mt-3 text-center text-xs text-primary-foreground/50">
                  Sem cartão de crédito · Cancele quando quiser
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
