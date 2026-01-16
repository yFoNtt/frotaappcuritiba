import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 md:p-12 lg:p-16">
          {/* Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
                <Building2 className="h-4 w-4" />
                Para Locadores e Empresas
              </div>
              <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
                Gerencie sua frota de forma inteligente
              </h2>
              <p className="mb-6 text-lg text-primary-foreground/80">
                Dashboard completo para gerenciar veículos, motoristas, pagamentos e manutenções. 
                Tudo em um só lugar, com relatórios e alertas automáticos.
              </p>
              <ul className="mb-8 space-y-2 text-primary-foreground/80">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-xs text-success-foreground">✓</span>
                  Anuncie seus veículos no marketplace
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-xs text-success-foreground">✓</span>
                  Controle financeiro completo
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-xs text-success-foreground">✓</span>
                  Gestão de motoristas vinculados
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-xs text-success-foreground">✓</span>
                  Alertas de revisão, IPVA e seguro
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">
              <Button size="xl" variant="hero" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/cadastro?tipo=locador">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-primary-foreground/60">
                Planos a partir de R$ 99/mês
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
