import { useNavigate } from 'react-router-dom';

export default function UserSidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const fullName = localStorage.getItem('fullName') || 'Khách hàng';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=164e63&color=fff`;

  const menuItems = [
    { id: 'profile', label: 'Hồ sơ của tôi', icon: '👤' },
    { id: 'vehicles', label: 'Phương tiện & Gói cước', icon: '🚗' },
    { id: 'wallet', label: 'Ví và thanh toán', icon: '💳' },
    { id: 'history', label: 'Lịch sử giao dịch', icon: '🕒' },
  ];

  return (
    <div className="d-flex flex-column h-100 p-3">
      {/* Logo */}


      {/* User Info Card */}
      <div className="mb-4 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle bg-secondary overflow-hidden" style={{ width: '48px', height: '48px' }}>
            <img src={avatarUrl} alt="Avatar" className="w-100 h-100 object-fit-cover" />
          </div>
          <div>
            <h6 className="fw-bold m-0 text-dark">{fullName}</h6>
            <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>SmartPark Resident</small>
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.7rem' }}>
              ● Kích hoạt
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="d-flex flex-column gap-1 flex-grow-1">
        <small className="text-muted fw-bold mb-2 px-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>MENU CHÍNH</small>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`btn text-start d-flex align-items-center gap-3 py-2 px-3 rounded-3 border-0 fw-medium transition-all ${
              activeTab === item.id ? 'bg-light text-dark' : 'bg-transparent text-muted hover-bg-light'
            }`}
            style={{ 
              color: activeTab === item.id ? '#164e63' : '',
              borderLeft: activeTab === item.id ? '4px solid #164e63' : '4px solid transparent'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 border-top">

        
        <div className="d-flex flex-column gap-1">
          <button className="btn text-start text-muted bg-transparent border-0 d-flex align-items-center gap-2 py-2">
            <span>❓</span> Trợ giúp
          </button>
          <button onClick={() => navigate('/auth')} className="btn text-start text-danger bg-transparent border-0 d-flex align-items-center gap-2 py-2">
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
