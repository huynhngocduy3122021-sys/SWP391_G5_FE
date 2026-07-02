import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';

/* ── helpers ─────────────────────────────── */
const fmt     = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtTime = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} ${d.getDate()}/${d.getMonth()+1}`;
};
const zoneCap  = (z) => Number(z?.capacity || z?.totalSlots || 0);
const zoneUsed = (z) => Number(z?.usedSlots || z?.currentOccupancy || z?.used || 0);
const zoneName = (z) => z?.zoneName || z?.name || `Zone ${z?.parkingZoneId || z?.id}`;

/* ── main component ──────────────────────── */
export default function OverviewPanel({ onNavigate, branchId }) {
  const [zones,    setZones]    = useState([]);
  const [sessions, setSessions] = useState([]);
  const [incidents,setIncidents]= useState([]);
  const [cards,    setCards]    = useState([]);
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [chartFilter, setChartFilter] = useState('today');

  const fetchAll = async () => {
    setLoading(true);
    const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null') ? String(branchId) : localStorage.getItem('parkingBranchId');
    try {
      let zo;
      if (cleanBranchId) {
        try {
          zo = await managerApi.getParkingZonesByBranch(cleanBranchId);
        } catch (err) {
          console.warn("getParkingZonesByBranch failed, falling back to getAllZones", err);
          zo = await managerApi.getAllZones();
        }
      } else {
        zo = await managerApi.getAllZones();
      }

      const se = await managerApi.getAllSessions(cleanBranchId ? { parkingBranchId: Number(cleanBranchId), branchId: Number(cleanBranchId), size: 10000 } : { size: 10000 });
      
      const parsedZones = Array.isArray(zo) ? zo : (zo?.content || []);
      const parsedSessions = Array.isArray(se) ? se : (se?.content || []);

      const getBranchId = (obj) => {
        if (!obj) return '';
        if (obj.parkingBranchId) return String(obj.parkingBranchId);
        if (obj.branchId) return String(obj.branchId);
        if (obj.parkingBranch?.parkingBranchId) return String(obj.parkingBranch.parkingBranchId);
        if (obj.parkingBranch?.id) return String(obj.parkingBranch.id);
        if (obj.branch?.id) return String(obj.branch.id);
        if (obj.parkingBranch && (typeof obj.parkingBranch === 'number' || typeof obj.parkingBranch === 'string')) {
          return String(obj.parkingBranch);
        }
        if (obj.branch && (typeof obj.branch === 'number' || typeof obj.branch === 'string')) {
          return String(obj.branch);
        }
        return '';
      };

      setZones(cleanBranchId 
        ? parsedZones.filter(z => getBranchId(z) === cleanBranchId) 
        : parsedZones
      );
      setSessions(cleanBranchId 
        ? parsedSessions.filter(s => getBranchId(s) === cleanBranchId)
        : parsedSessions
      );

      // Incidents: cần token có quyền STAFF/MANAGER/ADMIN
      try {
        const inc = await managerApi.getIncidentReports({ page: 0, size: 100 });
        const incArr = inc?.content || inc || [];
        const parsedInc = Array.isArray(incArr) ? incArr : [];
        setIncidents(cleanBranchId 
          ? parsedInc.filter(i => getBranchId(i) === cleanBranchId)
          : parsedInc
        );
      } catch { setIncidents([]); }

      // Cards & Tickets
      try {
        const cardsData = await managerApi.getParkingCards();
        const parsedCards = Array.isArray(cardsData) ? cardsData : [];
        const filteredCards = cleanBranchId 
          ? parsedCards.filter(c => getBranchId(c) === cleanBranchId)
          : parsedCards;
        setCards(filteredCards);

        try {
          const ticketsData = await managerApi.getAllMonthlyTickets();
          const parsedTickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.content || []);
          const branchCardIds = new Set(filteredCards.map(c => String(c.parkingCardId || c.id)));
          setTickets(cleanBranchId 
            ? parsedTickets.filter(t => branchCardIds.has(String(t.parkingCardId || t.parkingCard?.parkingCardId || t.parkingCard?.id)))
            : parsedTickets
          );
        } catch (err) {
          console.warn("Failed to fetch tickets in dashboard", err);
          setTickets([]);
        }
      } catch (err) {
        console.warn("Failed to fetch cards in dashboard", err);
        setCards([]);
        setTickets([]);
      }

    } catch (err) {
      console.error("Overview fetch error:", err);
      setZones([]); setSessions([]); setCards([]); setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [branchId]);

  /* ── derived ── */
  const totalSlots = zones.reduce((a, z) => a + zoneCap(z), 0);
  const totalUsed  = zones.reduce((a, z) => a + zoneUsed(z), 0);
  
  // Đếm tổng số lượng tất cả các loại xe hiện đang gửi trong bãi (sessionStatus = ACTIVE)
  const activeVehicles = sessions.filter(s => s.sessionStatus === 'ACTIVE').length;

  const occupancy  = totalSlots > 0 ? Math.round((activeVehicles / totalSlots) * 100) : 0;

  // Lượt vào/ra và doanh thu hôm nay
  const today = new Date().toDateString();
  
  // Xe đi vào hôm nay (so khớp ngày check-in)
  const checkinsToday = sessions.filter(s => s.checkInTime && new Date(s.checkInTime).toDateString() === today).length;
  
  // Xe đi ra hôm nay (so khớp ngày check-out)
  const checkoutsToday = sessions.filter(s => s.checkOutTime && new Date(s.checkOutTime).toDateString() === today).length;

  // Doanh thu hôm nay (Tính trên các xe thực hiện thanh toán và đi ra hôm nay - checkOutTime, loại trừ thẻ tháng/VIP)
  const revenueToday = sessions
    .filter(s => {
      const isMOrV = (s.cardCode || s.parkingCard?.cardCode || '').startsWith('MONTH-') || 
                     (s.cardCode || s.parkingCard?.cardCode || '').startsWith('VIP-');
      return s.checkOutTime && new Date(s.checkOutTime).toDateString() === today && !isMOrV && s.totalAmount;
    })
    .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

  // Cảnh báo: incidents chưa resolve
  const openIncidents = incidents.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length;

  // Lọc vé còn hiệu lực (status === 1 hoặc true, và chưa hết hạn)
  const activeTickets = tickets.filter(t => {
    const isActive = t.status === 1 || t.status === true;
    const isNotExpired = !t.expiryDate || new Date(t.expiryDate) >= new Date();
    return isActive && isNotExpired;
  });

  const monthlyCardsCount = activeTickets.filter(t => {
    const code = t.cardCode || t.parkingCard?.cardCode || '';
    return code.startsWith('MONTH-');
  }).length;

  const vipCardsCount = activeTickets.filter(t => {
    const code = t.cardCode || t.parkingCard?.cardCode || '';
    return code.startsWith('VIP-');
  }).length;

  const STATS = [
    { label: 'DOANH THU HÔM NAY', value: fmt(revenueToday) + 'đ', color: mt.success },
    { label: 'LƯỢT VÀO / RA',     value: `${checkinsToday} / ${checkoutsToday}`, sub: 'Hôm nay', color: mt.warning },
    { label: 'TỶ LỆ LẤP ĐẦY',    value: `${occupancy}%`, sub: `${activeVehicles} / ${totalSlots} chỗ`, color: mt.text },
    { label: 'THẺ THÁNG / VIP',   value: String(monthlyCardsCount + vipCardsCount), sub: `${monthlyCardsCount} Tháng | ${vipCardsCount} VIP (Còn hiệu lực)`, color: mt.primary },
    { label: 'CẢNH BÁO HỆ THỐNG', value: String(openIncidents), sub: 'Sự cố chưa xử lý', color: openIncidents > 0 ? mt.danger : mt.success },
  ];

  // Zone occupancy cho sidebar
  const zoneStats = zones.map(z => {
    const cap  = zoneCap(z);
    const used = zoneUsed(z);
    const pct  = cap > 0 ? Math.round(used / cap * 100) : 0;
    return { name: zoneName(z), pct, color: pct >= 90 ? mt.danger : pct >= 70 ? mt.warning : mt.success };
  }).slice(0, 8);

  // 10 lượt xe gần nhất
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.checkInTime || 0) - new Date(a.checkInTime || 0))
    .slice(0, 10);

  // --- BIEU DO LUU LUONG ---
  const getReferenceDate = () => {
    if (sessions.length === 0) return new Date();
    const dates = sessions
      .map(s => s.checkOutTime || s.checkInTime ? new Date(s.checkOutTime || s.checkInTime) : null)
      .filter(Boolean);
    if (dates.length === 0) return new Date();
    return new Date(Math.max(...dates));
  };
  const now = getReferenceDate();
  const getCounts = (filterFn) => {
    const checkIns = sessions.filter(s => s.checkInTime && filterFn(new Date(s.checkInTime))).length;
    const checkOuts = sessions.filter(s => s.checkOutTime && filterFn(new Date(s.checkOutTime))).length;
    return { checkIns, checkOuts };
  };

  let chartData = [];
  if (chartFilter === 'today') {
    chartData = Array.from({ length: 24 }, (_, h) => {
      const { checkIns, checkOuts } = getCounts(d => d.toDateString() === now.toDateString() && d.getHours() === h);
      return { label: `${h}h`, in: checkIns, out: checkOuts, showLabel: h % 4 === 0 };
    });
  } else if (chartFilter === '7days') {
    chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const { checkIns, checkOuts } = getCounts(sd => sd.toDateString() === d.toDateString());
      return { label: `${d.getDate()}/${d.getMonth()+1}`, in: checkIns, out: checkOuts, showLabel: true };
    });
  } else if (chartFilter === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    chartData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const { checkIns, checkOuts } = getCounts(d => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === day);
      return { label: `${day}`, in: checkIns, out: checkOuts, showLabel: day % 5 === 1 || day === daysInMonth };
    });
  } else if (chartFilter === 'year') {
    chartData = Array.from({ length: 12 }, (_, i) => {
      const { checkIns, checkOuts } = getCounts(d => d.getFullYear() === now.getFullYear() && d.getMonth() === i);
      return { label: `T${i + 1}`, in: checkIns, out: checkOuts, showLabel: true };
    });
  }

  const maxBar = Math.max(...chartData.flatMap(d => [d.in, d.out]), 1);
  const totalChartIn = chartData.reduce((sum, d) => sum + d.in, 0);
  const totalChartOut = chartData.reduce((sum, d) => sum + d.out, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, letterSpacing: '0.03em', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{loading ? '...' : s.value}</div>
            {s.sub && <div style={{ fontSize: '0.75rem', color: mt.textMuted, marginTop: 6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>

        {/* Biểu đồ lưu lượng */}
        <div style={{...card, display: 'flex', flexDirection: 'column'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: mt.text, marginBottom: 4 }}>Lưu lượng xe ra/vào</div>
              <div style={{ fontSize: '0.75rem', color: mt.textMuted }}>
                <span style={{ color: mt.primary, fontWeight: 600 }}>{totalChartIn} vào</span> &nbsp;—&nbsp; <span style={{ color: mt.warning, fontWeight: 600 }}>{totalChartOut} ra</span>
              </div>
            </div>
            <select 
              value={chartFilter} 
              onChange={e => setChartFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.75rem', outline: 'none', background: '#f8fafc', color: mt.text, fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="today">Hôm nay</option>
              <option value="7days">7 Ngày qua</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: chartFilter === 'month' ? 1 : 4, padding: '10px 4px 0', minHeight: 180 }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', gap: 1 }}>
                  {/* Cột IN */}
                  <div
                    style={{
                      width: '45%', borderRadius: '3px 3px 0 0',
                      height: `${Math.max((d.in / maxBar) * 100, d.in > 0 ? 3 : 0)}%`,
                      background: d.in > 0 ? mt.primary : 'transparent',
                      transition: 'height 0.3s ease-out',
                    }}
                    title={`${d.label} — ${d.in} lượt vào`}
                  />
                  {/* Cột OUT */}
                  <div
                    style={{
                      width: '45%', borderRadius: '3px 3px 0 0',
                      height: `${Math.max((d.out / maxBar) * 100, d.out > 0 ? 3 : 0)}%`,
                      background: d.out > 0 ? mt.warning : 'transparent',
                      transition: 'height 0.3s ease-out',
                    }}
                    title={`${d.label} — ${d.out} lượt ra`}
                  />
                </div>
                {/* Nhãn trục X */}
                <div style={{ fontSize: '0.55rem', fontWeight: 600, color: mt.textMuted, height: 14, visibility: d.showLabel ? 'visible' : 'hidden', whiteSpace: 'nowrap' }}>
                  {d.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Chú giải */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: mt.textMuted, fontWeight: 500 }}>
               <div style={{ width: 10, height: 10, borderRadius: 2, background: mt.primary }}/> Lượt vào
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: mt.textMuted, fontWeight: 500 }}>
               <div style={{ width: 10, height: 10, borderRadius: 2, background: mt.warning }}/> Lượt ra
             </div>
          </div>
        </div>

        {/* Mật độ zone */}
        <div style={card}>
          <div style={{ fontWeight: 700, color: mt.text, marginBottom: 12 }}>Mật độ theo khu vực</div>
          {loading ? (
            <div style={{ color: mt.textMuted, fontSize: '0.85rem' }}>Đang tải...</div>
          ) : zoneStats.length === 0 ? (
            <div style={{ color: mt.textMuted, fontSize: '0.85rem' }}>Chưa có dữ liệu khu vực.</div>
          ) : zoneStats.map((z) => (
            <div key={z.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                <span style={{ color: mt.text, fontWeight: 600 }}>{z.name}</span>
                <span style={{ color: z.color, fontWeight: 700 }}>{z.pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9' }}>
                <div style={{ width: `${z.pct}%`, height: '100%', borderRadius: 4, background: z.color, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bảng lượt xe gần nhất */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: mt.text }}>Lượt xe ra vào gần nhất</div>
          <button type="button" onClick={() => onNavigate && onNavigate('zones')}
            style={{ border: 'none', background: 'transparent', color: mt.accent, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            Xem sơ đồ &rarr;
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: mt.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>BIỂN SỐ</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>GIỜ VÀO</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>GIỜ RA</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>LOẠI XE</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>CHI NHÁNH</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>THANH TOÁN</th>
              <th style={{ padding: '6px 8px', fontWeight: 600 }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center', color: mt.textMuted }}>Đang tải...</td></tr>
            ) : recentSessions.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center', color: mt.textMuted }}>Chưa có lượt xe nào hôm nay.</td></tr>
            ) : recentSessions.map((s) => {
              const status = s.sessionStatus;
              const statusColor = status === 'ACTIVE' ? mt.success : status === 'COMPLETED' ? mt.text : mt.danger;
              const statusLabel = { ACTIVE: '● Đang gửi', COMPLETED: '✓ Hoàn thành', CANCELLED: '✕ Hủy' }[status] || status;
              return (
                <tr key={s.parkingSessionId} style={{ borderTop: `1px solid ${mt.border}` }}>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{s.licensePlate || '—'}</td>
                  <td style={{ padding: '8px', color: mt.textMuted }}>{fmtTime(s.checkInTime)}</td>
                  <td style={{ padding: '8px', color: mt.textMuted }}>{s.checkOutTime ? fmtTime(s.checkOutTime) : '—'}</td>
                  <td style={{ padding: '8px' }}>{s.vehicleTypeName || '—'}</td>
                  <td style={{ padding: '8px', color: mt.textMuted }}>{s.parkingBranchName || '—'}</td>
                  <td style={{ padding: '8px', fontWeight: 600 }}>
                    {((s.cardCode || s.parkingCard?.cardCode || '').startsWith('MONTH-') || (s.cardCode || s.parkingCard?.cardCode || '').startsWith('VIP-')) 
                      ? '0đ (Thẻ tháng/VIP)' 
                      : (s.totalAmount ? fmt(s.totalAmount) + 'đ' : '—')}
                  </td>
                  <td style={{ padding: '8px', color: statusColor, fontWeight: 600 }}>{statusLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
