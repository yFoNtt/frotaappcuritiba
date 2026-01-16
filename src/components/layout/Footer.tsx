import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Frota<span className="text-primary">App</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A plataforma completa para locação de veículos e gestão de frotas. 
              Conectamos motoristas a oportunidades.
            </p>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
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
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Para Empresas</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/para-locadores" className="text-muted-foreground hover:text-primary transition-colors">
                  Anunciar Veículos
                </Link>
              </li>
              <li>
                <Link to="/planos" className="text-muted-foreground hover:text-primary transition-colors">
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Área do Locador
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                contato@frotaapp.com.br
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                São Paulo, SP
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} FrotaApp. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
