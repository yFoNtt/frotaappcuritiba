import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection, FeaturesSection } from '@/components/home/HeroSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { FeaturedVehicles } from '@/components/home/FeaturedVehicles';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <PublicLayout>
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
