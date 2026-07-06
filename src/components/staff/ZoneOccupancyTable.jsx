import { useState, useEffect } from 'react';
import API from '../../api/config';

export default function ZoneOccupancyTable() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const branchIdStr = localStorage.getItem('parkingBranchId');
  const branchId = branchIdStr ? Number(branchIdStr) : null;

  const fetchRecentSessions = async () => {
    try {
      const res = await API.get('/api/parking-sessions');
      const list = Array.isArray(res.data) ? res.data : [];
      
      // Lọc các phiên thuộc chi nhánh của Staff hiện tại đang đăng nhập
      const branchSessions = branchId 
        ? list.filter(s => s.parkingBranchId === branchId)
        : list;

      // Sắp xếp theo mốc thời gian hoạt động mới nhất lên đầu (check-out hoặc check-in)
      const sorted = branchSessions.sort((a, b) => {
        const timeA = new Date(b.checkOutTime || b.checkInTime || 0);
        const timeB = new Date(a.checkOutTime || a.checkInTime || 0);
        return timeA - timeB;
      });

      setSessions(sorted.slice(0, 10)); // Lấy 10 lượt gần nhất
    } catch (err) {
      console.error('Failed to fetch recent sessions for staff activity feed', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRecentSessions().finally(() => setLoading(false));

    // Định kỳ quét lấy dữ liệu mới mỗi 10 giây
    const interval = setInterval(fetchRecentSessions, 10000);
    return () => clearInterval(interval);
  }, [branchId]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="vin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--vin-border)',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--vin-text-main)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
          🕒 HOẠT ĐỘNG VÀO / RA GẦN ĐÂY
        </span>
        <button 
          onClick={fetchRecentSessions} 
          style={{ background: 'transparent', border: 'none', color: 'var(--vin-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
        >
          🔄 Cập nhật
        </button>
      </div>

      <div className="vin-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table className="vin-table">
          <thead>
            <tr>
              <th>BIỂN SỐ XE</th>
              <th>LOẠI XE</th>
              <th>GIỜ</th>
              <th>HOẠT ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {loading && sessions.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '1.5rem' }}>
                  Đang tải dữ liệu hoạt động...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '1.5rem' }}>
                  Chưa có lượt xe vào/ra nào hôm nay.
                </td>
              </tr>
            ) : sessions.map((s) => {
              const isExit = !!s.checkOutTime;
              const time = isExit ? s.checkOutTime : s.checkInTime;
              return (
                <tr key={s.parkingSessionId} style={{ borderTop: '1px solid var(--vin-border)' }}>
                  <td style={{ fontWeight: 700, color: 'var(--vin-text-main)' }}>{s.licensePlate || '—'}</td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{s.vehicleTypeName || '—'}</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{formatTime(time)}</td>
                  <td>
                    <span className={`vin-badge ${isExit ? 'vin-badge--success' : 'vin-badge--info'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                      {isExit ? 'XE RA' : 'XE VÀO'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
