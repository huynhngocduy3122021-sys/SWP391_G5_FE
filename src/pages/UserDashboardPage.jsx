import { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { useLocation } from 'react-router-dom';
=======
import { useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
>>>>>>> Stashed changes
import UserSidebar from '../components/user-dashboard/UserSidebar';
import Navbar from '../components/layout/Navbar';
import VehicleSection from '../components/user-dashboard/VehicleSection';
import ProfileSection from '../components/user-dashboard/ProfileSection';
import BookingsSection from '../components/user-dashboard/BookingsSection';

export default function UserDashboardPage() {
  const location = useLocation();
<<<<<<< Updated upstream
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || location.state?.tab || 'vehicles'); // 'profile', 'vehicles', 'bookings'

  useEffect(() => {
=======
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || location.state?.tab || 'vehicles'); // 'profile', 'vehicles', 'bookings'

  useEffect(() => {
    const paymentNotice = location.state?.paymentNotice;
    const successParam = searchParams.get('success');
    const message = paymentNotice?.message || searchParams.get('message') || '';
    const isSuccess = paymentNotice?.success ?? successParam === 'true';
    const isFailure = paymentNotice?.success === false || successParam === 'false';

    if (isSuccess) {
      setActiveTab('vehicles');
      toast.success(message || '🎉 Thanh toán thành công! Gói cước của bạn đang được xử lý.', { autoClose: 6000 });
    } else if (isFailure) {
      setActiveTab('vehicles');
      toast.error(message || 'Thanh toán thất bại hoặc đã bị huỷ!');
    }

    if (successParam || paymentNotice) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [location.state, searchParams]);

  useEffect(() => {
>>>>>>> Stashed changes
    const tabFromState = location.state?.activeTab || location.state?.tab;
    if (tabFromState) {
      setActiveTab(tabFromState);
    }
  }, [location.state]);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'vehicles':
        return <VehicleSection />;
      case 'bookings':
        return <BookingsSection />;
      default:
        return <VehicleSection />;
    }
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Global Navbar at top */}
      <div className="bg-white border-bottom shadow-sm">
        <Navbar />
      </div>

      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Sidebar - Cố định bên trái */}
        <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#ffffff', overflowY: 'auto' }}>
          <UserSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column overflow-auto">
          {/* Nội dung thay đổi (Scrollable) */}
          <main className="flex-grow-1 p-4 p-md-5">
            <div className="container-fluid max-w-1200 mx-auto" style={{ maxWidth: '1200px' }}>
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
