import { useState } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';
import { CameraFeed } from './GateInPanel';
import ZoneOccupancyTable, { MOCK_ZONES } from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';
const PAY_METHODS = ['E-WALLET PAID', 'QR PAYMENT', 'CASH', 'RE-PRINT', 'INVOICE'];

// Màn "Cổng ra" — khớp ảnh thiết kế (Payment Summary + Captured Entry/Exit)
export default function GateOutPanel() {
  // Mock theo ảnh — thay bằng staffApi.getExitPaymentSummary(plateNumber)
  const [summary, setSummary] = useState({
    entryPlate: '47-B2-722.38', exitPlate: '59-S1-777.58', matchAccuracy: 99.8,
    vehicleType: 'Sedan (Premium)', durationLabel: '02h 45m', rateLabel: '$2.00 / hour',
    paid: true, totalFee: 6.0,
  });
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await staffApi.confirmExit({ gateId: GATE_ID, plateNumber: summary.exitPlate, totalFee: summary.totalFee });
      toast.success(`Đã mở barie cho xe ${summary.exitPlate} ra!`);
    } catch {
      toast.error('Xác nhận ra cổng thất bại!');
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
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>💳 PAYMENT SUMMARY</div>

          <SummaryRow label="Duration" value={summary.durationLabel} />
          <SummaryRow label="Parking Rate" value={summary.rateLabel} />
          <SummaryRow
            label="Trạng thái thanh toán"
            value={<span className="vin-badge vin-badge--success">✅ ĐÃ THANH TOÁN</span>}
          />

          <div style={{ borderTop: '1px solid var(--vin-border)', margin: '0.75rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>TOTAL FEE</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--vin-success)' }}>
              ${summary.totalFee.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {PAY_METHODS.map((m) => (
              <button key={m} className="vin-btn vin-btn--secondary vin-btn--sm">{m}</button>
            ))}
          </div>

          <button className="vin-btn vin-btn--full" style={{ background: 'var(--vin-success)', color: '#fff' }}
            disabled={confirming} onClick={handleConfirm}>
            {confirming ? <span className="vin-spinner" /> : '✅'} CONFIRM & OPEN
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
