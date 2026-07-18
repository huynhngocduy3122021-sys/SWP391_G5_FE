// StaffExitGate - Màn hình cho nhân viên xử lý xe ra
import { useNavigate } from 'react-router-dom';
import StaffTopbar from '../components/StaffTopbar';
import GateOutPanel from '../components/GateOutPanel';

export default function StaffExitGate() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--vin-bg-deep)', color: 'var(--vin-text-main)' }}>
      <StaffTopbar 
        mode="EXIT" 
        onModeChange={(m) => navigate(m === 'ENTRY' ? '/staff/entry' : '/staff/exit')} 
      />
      <GateOutPanel />
    </div>
  );
}
