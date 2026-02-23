import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { useAvailableVehicles } from '@/hooks/useVehicles';
import { ArrowRight, Loader2, Car } from 'lucide-react';
import { motion } from 'framer-motion';

export function FeaturedVehicles() {
  const { data: vehicles = [], isLoading } = useAvailableVehicles();
  const featuredVehicles = vehicles.slice(0, 3);

  if (isLoading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (featuredVehicles.length === 0) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="container">
          <motion.div
            className="mx-auto max-w-2xl text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Marketplace</p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Veículos em Destaque
            </h2>
          </motion.div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Em breve!</h3>
            <p className="text-muted-foreground">
              Novos veículos serão cadastrados em breve. Volte mais tarde!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <motion.div
          className="mb-12 flex items-end justify-between"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Marketplace</p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Veículos em Destaque
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Confira as melhores opções disponíveis agora
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex gap-2 rounded-full">
            <Link to="/veiculos">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredVehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              <VehicleCard vehicle={vehicle} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center md:hidden">
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/veiculos">
              Ver todos os veículos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
