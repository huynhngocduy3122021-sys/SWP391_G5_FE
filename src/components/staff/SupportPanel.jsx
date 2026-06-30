import { useState } from 'react';
import { toast } from 'react-toastify';
import staffApi from '../../api/staffApi';

const INCIDENT_TYPES = ['Mất thẻ', 'Sai biển số', 'Barie kẹt', 'Khách không thanh toán', 'Khác'];

// Panel "XỬ LÝ CÁC NGOẠI LỆ KHÁC" — xuất hiện ở cả màn Cổng VÀO và Cổng RA
export default function SupportPanel({ plateNumber, gateId, activeSession }) {
  const [type, setType] = useState(INCIDENT_TYPES[0]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      if (type === 'Mất thẻ') {
        if (!activeSession) {
           toast.error('Vui lòng tìm kiếm phiên gửi xe trước khi báo mất thẻ!');
           setSending(false);
           return;
        }
        await staffApi.reportLostCard({
          description: note || 'Báo mất thẻ cho xe ' + plateNumber,
          parkingSessionId: activeSession.parkingSessionId,
          cardCode: activeSession.cardCode || activeSession.parkingCard?.cardCode
        });
      } else {
        await staffApi.reportIncident({ type, note, plateNumber, gateId });
      }
      toast.success('Đã gửi yêu cầu hỗ trợ!');
      setNote('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Gửi yêu cầu thất bại!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="vin-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span className="vin-badge vin-badge--danger">HỆ THỐNG HỖ TRỢ</span>
      </div>
      <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>
        🛎️ XỬ LÝ CÁC NGOẠI LỆ KHÁC
      </h6>

      <div className="vin-field" style={{ marginBottom: '0.75rem' }}>
        <label>LOẠI NGOẠI LỆ</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="vin-field" style={{ marginBottom: '1rem' }}>
        <label>GHI CHÚ VẬN HÀNH</label>
        <textarea
          rows={4}
          placeholder="Nhập chi tiết sự cố tại đây..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.85rem',
            outline: 'none', resize: 'vertical',
          }}
        />
      </div>

      <button
        className="vin-btn vin-btn--full"
        style={{ background: 'var(--vin-success)', color: '#fff' }}
        disabled={sending}
        onClick={handleSend}
      >
        {sending ? <span className="vin-spinner" /> : '🛟'} GỬI YÊU CẦU HỖ TRỢ
      </button>
    </div>
  );
}
