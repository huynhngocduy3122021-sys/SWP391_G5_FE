import { useState } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import { CameraFeed } from './GateInPanel';
import ZoneOccupancyTable, { MOCK_ZONES } from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';
const PAY_METHODS = ['VNPAY', 'CASH'];

// Màn "Cổng ra" — khớp ảnh thiết kế (Payment Summary + Captured Entry/Exit)
export default function GateOutPanel() {
  // Mock theo ảnh — thay bằng staffApi.getExitPaymentSummary(plateNumber)
  const [summary, setSummary] = useState({
    entryPlate: '30K-888.88', exitPlate: '30K-888.88', matchAccuracy: 99.8,
    vehicleType: 'Sedan (Premium)', durationLabel: '02h 45m', rateLabel: '$2.00 / hour',
    paid: true, totalFee: 6.0,
  });
  const [cardCode, setCardCode] = useState('CARD-123');
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await staffApi.confirmExit({ gateId: GATE_ID, plateNumber: summary.exitPlate, totalFee: summary.totalFee, cardCode, paymentMethod: selectedMethod });
      toast.success(`Đã mở barie cho xe ${summary.exitPlate} ra!`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Xác nhận ra cổng thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi server khi check-out!');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', padding: '1.25rem' }}>
      {/* ── Cột trái: camera + ảnh chụp đối chiếu ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CameraFeed label={`LIVE EXIT - ${GATE_ID}`} sub="CAM 01: PLATE RECOGNITION" status="READY" tone="success" />
          <CameraFeed label="CAM 04: WIDE OVERVIEW" sub="CAM 02: OVERVIEW" status="ACTIVE" tone="info" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CapturedShot title="CAPTURED ENTRY (REFERENCE)" plate={summary.entryPlate} vehicleType={summary.vehicleType} />
          <CapturedShot title="CAPTURED EXIT (CURRENT)" plate={summary.exitPlate} matchAccuracy={summary.matchAccuracy} />
        </div>

        <ZoneOccupancyTable zones={MOCK_ZONES} />
      </div>

      {/* ── Cột phải: payment summary + support ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="vin-card">
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '1.25rem', fontSize: '1.1rem' }}>
            📋 THÔNG TIN CHECK-OUT
          </div>

          <div className="vin-field" style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>BIỂN SỐ XE</label>
            <input
              value={summary.exitPlate}
              onChange={(e) => setSummary({ ...summary, exitPlate: e.target.value.toUpperCase() })}
              style={{ fontSize: '1.2rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div className="vin-field" style={{ marginBottom: '1.25rem' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>CARD CODE (MÃ THẺ)</label>
            <input
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              style={{ fontSize: '1.2rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--vin-border)', margin: '1rem 0' }} />

          <div style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>
            PHƯƠNG THỨC THANH TOÁN
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {PAY_METHODS.map((m) => (
              <button key={m} 
                className={`vin-btn vin-btn--sm ${selectedMethod === m ? 'vin-btn--primary' : 'vin-btn--secondary'}`}
                onClick={() => setSelectedMethod(m)}
                style={{ py: '0.75rem', fontWeight: 600 }}
              >
                {m === 'CASH' ? '💵 TIỀN MẶT' : '📱 VNPAY'}
              </button>
            ))}
          </div>

          <button className="vin-btn vin-btn--full" style={{ background: 'var(--vin-success)', color: '#fff', padding: '0.85rem', fontSize: '1rem' }}
            disabled={confirming} onClick={handleConfirm}>
            {confirming ? <span className="vin-spinner" /> : '✅'} XÁC NHẬN & MỞ CỔNG RA
          </button>
        </div>

        <SupportPanel plateNumber={summary.exitPlate} gateId={GATE_ID} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function CapturedShot({ title, plate, vehicleType, matchAccuracy }) {
  return (
    <div className="vin-card" style={{ padding: '0.75rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{
        height: 90, borderRadius: 8, background: 'linear-gradient(135deg, #111827, #1f2937)',
        marginBottom: '0.5rem',
      }} />
      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{plate}</div>
      {vehicleType && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{vehicleType}</div>}
      {matchAccuracy != null && (
        <div style={{ fontSize: '0.75rem', color: 'var(--vin-success)' }}>● {matchAccuracy}% Match</div>
      )}
    </div>
  );
}
