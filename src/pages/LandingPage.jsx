import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import HeroSection from '../components/landing/HeroSection';
import StatusSection from '../components/landing/StatusSection';
import FeaturedSection from '../components/landing/FeaturedSection';
import AppSection from '../components/landing/AppSection';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success');
    const hasVnpayResult =
      searchParams.has('vnp_ResponseCode') ||
      searchParams.has('vnp_TransactionStatus');

    if (success === 'true' || success === 'false' || hasVnpayResult) {
      navigate(`/payment-result?${searchParams.toString()}`, {
        replace: true,
      });
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <HeroSection />
      <StatusSection />
      <FeaturedSection />
      <AppSection />
    </div>
  );
}
