import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HeroSection from '../components/landing/HeroSection';
import StatusSection from '../components/landing/StatusSection';
import FeaturedSection from '../components/landing/FeaturedSection';
import AppSection from '../components/landing/AppSection';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success');
    const message = searchParams.get('message');
    if (success === 'true') {
      toast.success(message || 'Thanh toán thành công! Giao dịch của bạn đã hoàn tất.');
      window.history.replaceState(null, '', window.location.pathname);
    } else if (success === 'false') {
      toast.error(message || 'Thanh toán thất bại hoặc đã bị huỷ!');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <HeroSection />
      <StatusSection />
      <FeaturedSection />
      <AppSection />
    </div>
  );
}
