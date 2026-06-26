import { useState } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import ZoneOccupancyTable, { MOCK_ZONES } from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';

// Màn "Vận hành Cổng VÀO" — khớp ảnh thiết kế (AI Smart Allocation + Issue Card)
export default function GateInPanel() {
  // Dữ liệu camera AI trả về — mock theo ảnh, thay bằng staffApi.getLiveEntryDetection(GATE_ID)
  const [detected, setDetected] = useState({ plateNumber: '30K-888.88', entryTime: '14:42:05' });
  const [vehicleType, setVehicleType] = useState('Sedan / SUV');
  const [cardCode, setCardCode] = useState('CARD-123');
  const [suggestion, setSuggestion] = useState({
    slotCode: 'B1-A05', matchPercent: 98.4, location: 'Level B1 - Sector A (Premium)', proximity: 'Near Elevator #4 (12m)',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSuggest = async () => {
    try {
      const res = await staffApi.suggestSlotAllocation(detected.plateNumber, vehicleType);
      setSuggestion(res);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không lấy được gợi ý vị trí từ AI!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối AI!');
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await staffApi.confirmEntry({
        gateId: GATE_ID, plateNumber: detected.plateNumber, vehicleType,
        entryTime: detected.entryTime, slotCode: suggestion.slotCode, cardCode
      });
      toast.success(`Đã cấp thẻ & mở barie cho ${detected.plateNumber}!`);
    } catch (err) {
      console.error("Check-in Error:", err.response?.data || err.message);
      let errorStr = 'Lỗi server khi check-in!';
      if (err.message === 'Network Error') {
        errorStr = 'Không thể kết nối tới Backend. Hãy chắc chắn Spring Boot đang chạy ở port 8081!';
      } else {
        const msg = err.response?.data;
        if (typeof msg === 'string' && msg.trim() !== '') {
          errorStr = msg;
        }
      }
      toast.error(errorStr);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', padding: '1.25rem' }}>
      {/* ── Cột trái: camera + form nhận xe ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CameraFeed label={`LIVE ENTRY - ${GATE_ID}`} sub="CAM 01: PLATE RECOGNITION" status="READY" tone="success" />

        <div className="vin-card">
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
            ⚙️ Vehicle Details
          </div>

          <div className="vin-field" style={{ marginBottom: '0.75rem' }}>
            <label>LICENSE PLATE (AI DETECTED)</label>
            <input
              value={detected.plateNumber}
              onChange={(e) => setDetected({ ...detected, plateNumber: e.target.value })}
              style={{ fontSize: '1.1rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div className="vin-field" style={{ marginBottom: '0.75rem' }}>
            <label>CARD CODE (QUẸT THẺ)</label>
            <input
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              style={{ fontSize: '1.1rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="vin-field">
              <label>ENTRY TIME</label>
              <input value={detected.entryTime} onChange={(e) => setDetected({ ...detected, entryTime: e.target.value })} />
            </div>
            <div className="vin-field">
              <label>VEHICLE TYPE</label>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                <option>Sedan / SUV</option>
                <option>Xe máy</option>
                <option>Xe tải nhỏ</option>
              </select>
            </div>
          </div>

          <button className="vin-btn vin-btn--full" style={{ background: 'var(--vin-success)', color: '#fff' }}
            disabled={submitting} onClick={handleConfirm}>
            {submitting ? <span className="vin-spinner" /> : '⚡'} ISSUE CARD & OPEN BARRIER
          </button>
        </div>

        <ZoneOccupancyTable zones={MOCK_ZONES} />
      </div>

      {/* ── Cột phải: AI suggestion + support ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="ai-card">
          <div className="ai-card__title" style={{ justifyContent: 'space-between' }}>
            <span>🤖 AI SMART ALLOCATION</span>
            <span className="vin-badge vin-badge--success">{suggestion.matchPercent}% MATCH</span>
          </div>
          <div className="ai-card__desc">SUGGESTED SLOT</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            {suggestion.slotCode}
          </div>
          <div className="ai-card__row"><span>📍 LOCATION</span></div>
          <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{suggestion.location}</div>
          <div className="ai-card__row"><span>🚶 PROXIMITY</span></div>
          <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '1rem' }}>{suggestion.proximity}</div>
          <button className="vin-btn vin-btn--full vin-btn--primary" onClick={handleSuggest}>
            ✅ CONFIRM ALLOCATION
          </button>
        </div>

        <SupportPanel plateNumber={detected.plateNumber} gateId={GATE_ID} />
      </div>
    </div>
  );
}

// Khung camera dùng chung cho cả entry/exit feed
export function CameraFeed({ label, sub, status = 'READY', tone = 'success' }) {
  return (
    <div className="vin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5rem 0.85rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)',
      }}>
        <span>📷 {label}</span>
        <span className={`vin-badge ${tone === 'success' ? 'vin-badge--success' : 'vin-badge--info'}`}>{status}</span>
      </div>
      <div style={{
        height: 220, background: 'linear-gradient(135deg, #0b1120, #111827)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', borderTop: '1px solid var(--vin-border)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>{sub}</span>
        <span style={{
          position: 'absolute', bottom: 10, left: 10, fontSize: '0.7rem',
          color: '#22c55e', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4,
        }}>
          ● LIVE RECOGNIZING...
        </span>
      </div>
    </div>
  );
}
