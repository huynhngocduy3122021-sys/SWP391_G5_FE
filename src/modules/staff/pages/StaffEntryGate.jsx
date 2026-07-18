// StaffEntryGate - Màn hình cho nhân viên xử lý xe vào
import { useNavigate } from 'react-router-dom';
import StaffTopbar from '../components/StaffTopbar';
import GateInPanel from '../components/GateInPanel';

export default function StaffEntryGate() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--vin-bg-deep)', color: 'var(--vin-text-main)' }}>
      <StaffTopbar 
        mode="ENTRY" 
        onModeChange={(m) => navigate(m === 'ENTRY' ? '/staff/entry' : '/staff/exit')} 
      />
      <GateInPanel />
    </div>
  );
}
