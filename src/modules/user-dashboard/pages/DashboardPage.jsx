// DashboardPage - Trang thống kê tổng quan (dashboard chung)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import SlotsSection from '../components/SlotsSection';
import UsersSection from '../components/UsersSection';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('slots');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    toast.info('Đã đăng xuất!');
    navigate('/');
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: 'var(--vin-bg-deep)' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <main className="flex-grow-1 overflow-auto">
        {activeTab === 'slots' && <SlotsSection />}
        {activeTab === 'users' && <UsersSection />}
      </main>
    </div>
  );
}
