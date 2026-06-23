import HeroSection from '../components/landing/HeroSection';
import StatusSection from '../components/landing/StatusSection';
import FeaturedSection from '../components/landing/FeaturedSection';
import AppSection from '../components/landing/AppSection';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <HeroSection />
      <StatusSection />
      <FeaturedSection />
      <AppSection />
    </div>
  );
}
