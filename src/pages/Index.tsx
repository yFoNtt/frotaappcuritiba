import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection, FeaturesSection } from '@/components/home/HeroSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { FeaturedVehicles } from '@/components/home/FeaturedVehicles';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import { SEO } from '@/components/SEO';

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FrotaApp',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  description: 'Marketplace de locação de veículos para motoristas de aplicativo. Encontre carros para Uber, 99 e outros apps.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${typeof window !== 'undefined' ? window.location.origin : ''}/veiculos?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FrotaApp',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  logo: `${typeof window !== 'undefined' ? window.location.origin : ''}/favicon.ico`,
  description: 'Plataforma de locação de veículos e gestão de frotas para apps de transporte.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contato@frotaapp.com.br',
    contactType: 'customer service',
    areaServed: 'BR',
    availableLanguage: 'Portuguese',
  },
};

const Index = () => {
  return (
    <PublicLayout>
      <SEO
        title="FrotaApp - Marketplace de Locação de Veículos para Apps"
        description="Encontre veículos para alugar e rodar com Uber, 99 e outros apps. Plataforma completa para motoristas e locadores com gestão de frota."
        canonical="/"
        jsonLd={[websiteJsonLd, organizationJsonLd]}
      />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FeaturedVehicles />
      <TestimonialsSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
