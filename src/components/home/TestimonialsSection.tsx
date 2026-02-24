import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'Motorista de App · São Paulo',
    content: 'Encontrei um carro excelente em menos de 24h. O processo foi super rápido e o locador muito profissional. Recomendo demais!',
    rating: 5,
    initials: 'CS',
  },
  {
    name: 'Ana Oliveira',
    role: 'Locadora · Belo Horizonte',
    content: 'O dashboard de gestão é fantástico. Controlo toda minha frota de 15 veículos num só lugar. Reduzi inadimplência em 40%.',
    rating: 5,
    initials: 'AO',
  },
  {
    name: 'Roberto Santos',
    role: 'Motorista de App · Rio de Janeiro',
    content: 'Já usei outras plataformas, mas o FrotaApp é o mais completo. Contrato claro, sem surpresas, e o suporte responde rápido.',
    rating: 5,
    initials: 'RS',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary mb-2 sm:mb-3">Depoimentos</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Quem usa, aprova
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            Veja o que motoristas e locadores estão dizendo sobre a plataforma.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="group relative rounded-2xl border border-border bg-card p-5 sm:p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-card-hover"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 sm:top-6 sm:right-6 h-6 w-6 sm:h-8 sm:w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

              {/* Stars */}
              <div className="mb-3 sm:mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Content */}
              <p className="mb-4 sm:mb-6 text-sm sm:text-base text-foreground/80 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary/10 text-xs sm:text-sm font-bold text-primary">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
