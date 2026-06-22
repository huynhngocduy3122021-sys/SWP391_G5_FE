import { useNavigate } from 'react-router-dom';
import StaffTopbar, { MOCK_STATS } from '../../components/staff/StaffTopbar';
import GateOutPanel from '../../components/staff/GateOutPanel';

export default function StaffExitGate() {
  const navigate = useNavigate();

  return (
    <div className="dark-theme" style={{ minHeight: '100vh', background: 'var(--vin-bg-deep)', color: 'var(--vin-text-main)' }}>
      <StaffTopbar 
        mode="EXIT" 
        onModeChange={(m) => navigate(m === 'ENTRY' ? '/staff/entry' : '/staff/exit')} 
        stats={MOCK_STATS} 
      />
      <GateOutPanel />
    </div>
  );
}
