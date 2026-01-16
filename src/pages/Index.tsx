import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection, FeaturesSection } from '@/components/home/HeroSection';
import { FeaturedVehicles } from '@/components/home/FeaturedVehicles';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <FeaturesSection />
      <FeaturedVehicles />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
