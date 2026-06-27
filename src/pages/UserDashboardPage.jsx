import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserSidebar from '../components/user-dashboard/UserSidebar';
import Navbar from '../components/layout/Navbar';
import VehicleSection from '../components/user-dashboard/VehicleSection';
import WalletSection from '../components/user-dashboard/WalletSection';
import ProfileSection from '../components/user-dashboard/ProfileSection';
import HistorySection from '../components/user-dashboard/HistorySection';

export default function UserDashboardPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || location.state?.tab || 'vehicles'); // 'profile', 'vehicles', 'wallet', 'history'

  useEffect(() => {
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
      case 'wallet':
        return <WalletSection />;
      case 'history':
        return <HistorySection />;
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
