import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 space-y-3 sm:space-y-4">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">
                Frota<span className="text-primary">App</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              A plataforma completa para locação de veículos e gestão de frotas. 
              Conectamos motoristas a oportunidades.
            </p>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-2.5 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Links Rápidos</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/veiculos" className="text-muted-foreground hover:text-primary transition-colors">
                  Buscar Veículos
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link to="/para-locadores" className="text-muted-foreground hover:text-primary transition-colors">
                  Para Locadores
                </Link>
              </li>
              <li>
                <Link to="/cadastro" className="text-muted-foreground hover:text-primary transition-colors">
                  Cadastre-se
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Empresas */}
          <div className="space-y-2.5 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Para Empresas</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/para-locadores" className="text-muted-foreground hover:text-primary transition-colors">
                  Anunciar Veículos
                </Link>
              </li>
              <li>
                <Link to="/para-locadores" className="text-muted-foreground hover:text-primary transition-colors">
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  Área do Locador
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="col-span-2 sm:col-span-1 space-y-2.5 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Contato</h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 sm:flex-col sm:space-y-2.5 sm:gap-0 text-xs sm:text-sm">
              <li className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                contato@frotaapp.com.br
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                São Paulo, SP
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-12 border-t border-border pt-4 sm:pt-6">
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} FrotaApp. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
