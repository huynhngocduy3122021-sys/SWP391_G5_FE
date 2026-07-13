import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import parkingApi from '../../api/parkingApi';
import { mapBranchToParkingLot } from '../../utils/mapBranch';

export default function StatusSection() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const branchesData = await parkingApi.getAllBranches();
        const branches = Array.isArray(branchesData) ? branchesData : (branchesData?.content || branchesData?.data || []);
        if (branches.length > 0) {
          setLots(branches.map(mapBranchToParkingLot));
        } else {
          setLots([]);
        }
      } catch (error) {
        console.error('Error fetching parking branches:', error);
        setLots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  return (
    <section id="locations" className="status-section">
      <div className="status-layout">
        <div className="status-table-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ color: 'var(--vin-text-main)', fontWeight: 700, margin: 0 }}>Trạng thái bãi đỗ thực tế</h2>
            <small style={{ color: 'var(--vin-text-muted)' }}>Cập nhật lúc: 14:02, 18/02/2026</small>
          </div>
          <div className="vin-card" style={{ padding: '0.75rem' }}>
            <div className="vin-table-wrap" style={{ border: 'none' }}>
              <table className="vin-table">
                <thead>
                  <tr>
                    <th>Tên bãi xe</th><th>Khu vực</th><th>Chỗ trống</th><th>Trạng thái</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--vin-text-muted)', padding: '20px' }}>
                        Đang tải trạng thái bãi đỗ...
                      </td>
                    </tr>
                  ) : lots.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--vin-text-muted)', padding: '20px' }}>
                        Không có dữ liệu bãi đỗ.
                      </td>
                    </tr>
                  ) : (
                    lots.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: 'var(--vin-text-main)' }}>{s.name}</td>
                      <td style={{ color: 'var(--vin-text-muted)' }}>{s.area}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: s.badgeCls.includes('success') ? '#10b981' : s.badgeCls.includes('danger') ? '#ef4444' : '#38bdf8' }}>
                          {s.free}
                        </span>
                        <span style={{ color: 'var(--vin-text-muted)' }}> / {s.total}</span>
                      </td>
                      <td><span className={`vin-badge ${s.badgeCls}`}>{s.status}</span></td>
                      <td>
                        <button 
                          className="vin-btn vin-btn--primary vin-btn--sm" 
                          onClick={() => navigate('/pricing', { state: { selectedLotId: s.id } })}
                        >
                          Đặt trước
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}