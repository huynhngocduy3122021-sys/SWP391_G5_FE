import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Table, Badge, InputGroup, Spinner, ButtonGroup } from 'react-bootstrap';
import { Download, Filter, Eye, Search, DollarSign, Activity, Building, RefreshCcw, BarChart2, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import managerApi from '../../manager/api/manager';
import adminApi from '../api/admin';

const checkIsMonthlyOrVip = (s) => {
  if (!s) return false;
  const code = String(s.cardCode || s.parkingCard?.cardCode || '').toUpperCase();
  const type = String(s.cardType || s.parkingCard?.cardType || '').toUpperCase();
  return code.startsWith('MONTH-') || code.startsWith('MT-') || code.startsWith('MT') ||
         code.startsWith('VIP-') || code.startsWith('VP-') || code.startsWith('VP') ||
         type === 'MONTHLY' || type === 'VIP';
};

const getFormatKey = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit'
  });

  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || String(d.getDate()).padStart(2, '0');
  const month = parts.find(p => p.type === 'month')?.value || String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

export default function RevenueReportPage() {
  const [loading, setLoading] = useState(false);
  const [rangeType, setRangeType] = useState('month'); // 'today' | 'week' | 'month' | 'custom'
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState('Tất cả chi nhánh');
  const [searchQuery, setSearchQuery] = useState('');
  const [revenueChartType, setRevenueChartType] = useState('ALL'); // 'ALL' | 'WALK_IN' | 'CARD' | 'LOST_CARD'

  // Data states
  const [sessions, setSessions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pricePolicies, setPricePolicies] = useState([]);
  const [cards, setCards] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);

  const fetchReportData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [sessionsRes, ticketsRes, branchesRes, policiesRes, cardsRes, reqsRes, paymentsRes] = await Promise.all([
        adminApi.getAllSessions().catch(() => []),
        managerApi.getAllMonthlyTickets().catch(() => []),
        managerApi.getParkingBranches().catch(() => []),
        managerApi.getPricePolicies().catch(() => []),
        managerApi.getParkingCards().catch(() => []),
        managerApi.getAllMonthlyTicketRequests?.().catch(() => []) || [],
        adminApi.getAllPayments().catch(() => []),
      ]);

      const getArray = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.content)) return res.content;
        return [];
      };

      setSessions(getArray(sessionsRes));
      setTickets(getArray(ticketsRes));
      setBranches(getArray(branchesRes));
      setPricePolicies(getArray(policiesRes));
      setCards(getArray(cardsRes));
      setRequests(getArray(reqsRes));
      setPayments(getArray(paymentsRes));
    } catch (err) {
      console.error(err);
      if (!isSilent) toast.error('Không tải được dữ liệu báo cáo!');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(false);

    // Refresh every 5 seconds (real-time)
    const interval = setInterval(() => {
      fetchReportData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRangeBoundaries = (refDate = new Date()) => {
    let start = new Date(refDate);
    let end = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);

    if (rangeType === 'today') {
      start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
    } else if (rangeType === 'week') {
      start = new Date(refDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    } else if (rangeType === 'month') {
      start = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (rangeType === 'custom') {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
    }
    return { start, end };
  };

  const getFilteredData = () => {
    const { start: rangeStart, end: rangeEnd } = getRangeBoundaries(new Date());

    // Filter sessions
    const filteredSessions = sessions.filter(s => {
      if (!s.checkOutTime) return false;
      const outDate = new Date(s.checkOutTime);
      if (Number.isNaN(outDate.getTime())) return false;
      const matchTime = outDate >= rangeStart && outDate <= rangeEnd;
      if (!matchTime) return false;
      const matchBranch = branchFilter === 'Tất cả chi nhánh' || s.parkingBranchName === branchFilter;
      return matchBranch;
    });

    // Build unified ticket revenue events:
    // Priority 1: Payment records (have actual paidAt = time customer paid)
    // Priority 2: Approved requests without a payment (manager approved directly)
    const paymentRequestIds = new Set(
      payments.filter(p => p.monthlyTicketRequestId).map(p => String(p.monthlyTicketRequestId))
    );

    const allTicketEvents = [];

    // From payments (preferred source - uses paidAt or createdAt if status is not explicitly PAID)
    payments.forEach(p => {
      const isPaid = p.paymentStatus === 'PAID' || p.paymentStatus === 'SUCCESS' || p.paymentStatus === 'COMPLETED' || p.paymentStatus === 1 || p.paymentStatus === true || Boolean(p.paidAt);
      if (!isPaid) return;
      const dt = p.paidAt || p.createdAt || p.updatedAt;
      if (!dt) return;
      const eventDate = new Date(dt);
      if (Number.isNaN(eventDate.getTime())) return;
      const matchTime = eventDate >= rangeStart && eventDate <= rangeEnd;
      if (!matchTime) return;
      const branchName = p.branchName || p.branch?.branchName || p.branch?.name || 'Khác';
      const matchBranch = branchFilter === 'Tất cả chi nhánh' || branchName === branchFilter;
      if (!matchBranch) return;

      allTicketEvents.push({
        id: `PAY-${p.paymentId || p.id}`,
        time: dt,
        branchName,
        policyName: p.policyName || p.pricePolicy?.policyName || '',
        amount: Number(p.policyBasePrice || p.amount || p.totalAmount || p.price || 0),
        plate: p.vehicleLicensePlate || p.vehicle?.licensePlate || '—',
        userName: p.userName || '',
        source: 'payment'
      });
    });

    // From approved requests that have NO matching payment
    requests.forEach(r => {
      if (Number(r.status) !== 2) return; // APPROVED
      if (paymentRequestIds.has(String(r.id))) return; // Already counted via payment
      const dt = r.createdAt;
      if (!dt) return;
      const eventDate = new Date(dt);
      const matchTime = eventDate >= rangeStart && eventDate <= rangeEnd;
      if (!matchTime) return;
      let branchName = 'Khác';
      if (r.parkingBranch) {
        branchName = r.parkingBranch.branchName || r.parkingBranch.name || 'Khác';
      }
      const matchBranch = branchFilter === 'Tất cả chi nhánh' || branchName === branchFilter;
      if (!matchBranch) return;

      const pName = r.pricePolicy?.policyName || '';
      const isVip = pName.toUpperCase().includes('VIP');
      const basePrice = Number(r.pricePolicy?.basePrice || (isVip ? VIP_PRICE : MONTHLY_PRICE)) || 0;

      allTicketEvents.push({
        id: `REQ-${r.id}`,
        time: dt,
        branchName,
        policyName: pName,
        amount: basePrice,
        plate: r.vehicle?.licensePlate || '—',
        userName: '',
        source: 'request'
      });
    });

    return { filteredSessions, filteredTicketPayments: allTicketEvents };
  };

  const { filteredSessions, filteredTicketPayments } = getFilteredData();

  const monthlyPolicy = pricePolicies.find(p => (p.policyName || '').startsWith('[Gói Tháng]'));
  const vipPolicy = pricePolicies.find(p => (p.policyName || '').startsWith('[Gói VIP President]'));
  const MONTHLY_PRICE = monthlyPolicy ? Number(monthlyPolicy.basePrice || 200000) : 200000;
  const VIP_PRICE = vipPolicy ? Number(vipPolicy.basePrice || 1000000) : 1000000;

  // Calculate revenues
  const walkInRevenue = filteredSessions
    .filter(s => !checkIsMonthlyOrVip(s))
    .reduce((sum, s) => {
      const penalty = Number(s.penaltyFee) || 0;
      const total = Number(s.totalAmount) || 0;
      const parkingFee = Number(s.parkingFee) || 0;
      const fee = s.parkingFee !== null && s.parkingFee !== undefined 
        ? parkingFee 
        : Math.max(0, total - penalty);
      return sum + (fee || 0);
    }, 0);

  const ticketRevenue = filteredTicketPayments.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const lostCardRevenue = filteredSessions.reduce((sum, s) => sum + (Number(s.penaltyFee) || 0), 0);
  const totalRevenue = walkInRevenue + ticketRevenue + lostCardRevenue;
  const totalTransactions = filteredSessions.length;

  // Group revenue by branch name
  const branchRevenueMap = {};
  
  // Initialize with all active branches
  branches.forEach(b => {
    branchRevenueMap[b.branchName] = 0;
  });

  // Group session revenue (walk-in + lost card penalty)
  filteredSessions.forEach(s => {
    const name = s.parkingBranchName || 'Khác';
    branchRevenueMap[name] = (branchRevenueMap[name] || 0) + Number(s.totalAmount || 0);
  });

  // Group ticket revenue by branch
  filteredTicketPayments.forEach(e => {
    const branchName = e.branchName || 'Khác';
    branchRevenueMap[branchName] = (branchRevenueMap[branchName] || 0) + (Number(e.amount) || 0);
  });

  const branchRevenues = Object.keys(branchRevenueMap).map((name, index) => ({
    branchId: index + 1,
    branchName: name,
    amount: branchRevenueMap[name]
  })).sort((a, b) => b.amount - a.amount);

  const topBranchObj = branchRevenues.length > 0 ? branchRevenues[0] : null;
  const topBranchName = topBranchObj && topBranchObj.amount > 0 ? topBranchObj.branchName : '—';
  const topBranchRev = topBranchObj && topBranchObj.amount > 0 ? Number(topBranchObj.amount).toLocaleString('vi-VN') : '0';

  // Calculate renewal rate
  const approvedRenewals = requests.filter(r => {
    const hasExisting = tickets.some(t => {
      const tVehId = t.vehicleId || t.vehicle?.vehicleId || t.vehicle?.id || t.vehicle?.vehiclesId;
      const rVehId = r.vehicle?.vehicleId || r.vehicle?.id || r.vehicleId || r.vehicle?.vehiclesId;
      return tVehId && rVehId && String(tVehId) === String(rVehId);
    });
    return hasExisting && Number(r.status) === 2;
  }).length;
  const totalApproved = requests.filter(r => Number(r.status) === 2).length;
  const renewalRateVal = totalApproved > 0 ? `${Math.round((approvedRenewals / totalApproved) * 100)}%` : '85%';

  // Unified Transactions
  const allTxns = [
    ...filteredSessions.map(s => ({
      id: `TXN-S${s.parkingSessionId || s.id}`,
      time: s.checkOutTime ? new Date(s.checkOutTime).toLocaleString('vi-VN') : '—',
      dateObj: s.checkOutTime ? new Date(s.checkOutTime) : new Date(),
      branch: s.parkingBranchName || 'Khác',
      type: checkIsMonthlyOrVip(s) ? 'Vé tháng (Sử dụng)' : (s.penaltyFee > 0 ? 'Phạt mất thẻ' : 'Vé lượt'),
      plate: s.licensePlate || '—',
      amount: Number(s.totalAmount || 0),
      status: 'Thành công'
    })),
    ...filteredTicketPayments.map(e => ({
      id: e.id,
      time: e.time ? new Date(e.time).toLocaleString('vi-VN') : '—',
      dateObj: e.time ? new Date(e.time) : new Date(),
      branch: e.branchName || 'Khác',
      type: 'Đăng ký/Gia hạn vé tháng',
      plate: e.plate || '—',
      amount: Number(e.amount || 0),
      status: 'Thành công'
    }))
  ].sort((a, b) => b.dateObj - a.dateObj);

  const displayTxns = allTxns.filter(t => {
    const matchBranch = branchFilter === 'Tất cả chi nhánh' || t.branch === branchFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchQuery = !query || t.id.toLowerCase().includes(query) || t.plate.toLowerCase().includes(query) || t.type.toLowerCase().includes(query);
    return matchBranch && matchQuery;
  });

  // Trend Chart Data (Adapts dynamically to the selected time filter/custom range)
  const getTrendChartData = () => {
    // 1. If today, group by 6 hourly blocks: 0h-4h, 4h-8h, 8h-12h, 12h-16h, 16h-20h, 20h-24h
    if (rangeType === 'today') {
      const hours = [
        { label: '0h-4h', start: 0, end: 4, walkIn: 0, monthly: 0, vip: 0, lostCard: 0 },
        { label: '4h-8h', start: 4, end: 8, walkIn: 0, monthly: 0, vip: 0, lostCard: 0 },
        { label: '8h-12h', start: 8, end: 12, walkIn: 0, monthly: 0, vip: 0, lostCard: 0 },
        { label: '12h-16h', start: 12, end: 16, walkIn: 0, monthly: 0, vip: 0, lostCard: 0 },
        { label: '16h-20h', start: 16, end: 20, walkIn: 0, monthly: 0, vip: 0, lostCard: 0 },
        { label: '20h-24h', start: 20, end: 24, walkIn: 0, monthly: 0, vip: 0, lostCard: 0 }
      ];

      filteredSessions.forEach(s => {
        if (!s.checkOutTime) return;
        const h = new Date(s.checkOutTime).getHours();
        const block = hours.find(b => h >= b.start && h < b.end);
        if (block) {
          const penaltyFee = Number(s.penaltyFee) || 0;
          const totalAmount = Number(s.totalAmount) || 0;
          const parkingFee = Number(s.parkingFee) || 0;

          if (checkIsMonthlyOrVip(s)) {
            block.lostCard += penaltyFee;
          } else {
            const fee = s.parkingFee !== null && s.parkingFee !== undefined 
              ? parkingFee 
              : Math.max(0, totalAmount - penaltyFee);
            block.walkIn += fee;
            block.lostCard += penaltyFee;
          }
        }
      });

      filteredTicketPayments.forEach(p => {
        const dt = p.time;
        if (!dt) return;
        const h = new Date(dt).getHours();
        const block = hours.find(b => h >= b.start && h < b.end);
        if (block) {
          const policyName = String(p.policyName || '').toUpperCase();
          const isVip = policyName.includes('VIP');
          const amt = Number(p.amount || 0);
          
          if (isVip) {
            block.vip += amt;
          } else {
            block.monthly += amt;
          }
        }
      });

      return hours.map(h => ({
        label: h.label,
        walkIn: h.walkIn,
        monthly: h.monthly,
        vip: h.vip,
        lostCard: h.lostCard,
        total: h.walkIn + h.monthly + h.vip + h.lostCard
      }));
    }

    // 2. Otherwise (7 days, month, custom), group by date
    const refDate = new Date();
    const { start: rangeStart, end: rangeEnd } = getRangeBoundaries(refDate);
    const durationDays = Math.round((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) || 1;
    
    const dates = [];
    for (let i = durationDays - 1; i >= 0; i--) {
      const d = new Date(rangeEnd);
      d.setDate(rangeEnd.getDate() - i);
      const label = getFormatKey(d);
      dates.push({
        dateKey: label,
        dayLabel: label,
        walkIn: 0,
        monthly: 0,
        vip: 0,
        lostCard: 0
      });
    }

    filteredSessions.forEach(s => {
      const key = getFormatKey(s.checkOutTime);
      const dayObj = dates.find(d => d.dateKey === key);
      if (dayObj) {
        const penaltyFee = Number(s.penaltyFee) || 0;
        const totalAmount = Number(s.totalAmount) || 0;
        const parkingFee = Number(s.parkingFee) || 0;

        if (checkIsMonthlyOrVip(s)) {
          dayObj.lostCard += penaltyFee;
        } else {
          const fee = s.parkingFee !== null && s.parkingFee !== undefined 
            ? parkingFee 
            : Math.max(0, totalAmount - penaltyFee);
          dayObj.walkIn += fee;
          dayObj.lostCard += penaltyFee;
        }
      }
    });
    
    filteredTicketPayments.forEach(p => {
      const key = getFormatKey(p.time);
      const dayObj = dates.find(d => d.dateKey === key);
      if (dayObj) {
        const policyName = String(p.policyName || '').toUpperCase();
        const isVip = policyName.includes('VIP');
        const amt = Number(p.amount || 0);
        
        if (isVip) {
          dayObj.vip += amt;
        } else {
          dayObj.monthly += amt;
        }
      }
    });

    return dates.map(d => ({
      label: d.dayLabel,
      walkIn: d.walkIn,
      monthly: d.monthly,
      vip: d.vip,
      lostCard: d.lostCard,
      total: d.walkIn + d.monthly + d.vip + d.lostCard
    }));
  };

  const trendChartData = getTrendChartData();

  const maxRevenue = Math.max(...trendChartData.map(d => {
    let val = d.total;
    if (revenueChartType === 'WALK_IN') val = d.walkIn;
    else if (revenueChartType === 'CARD') val = d.monthly + d.vip;
    else if (revenueChartType === 'LOST_CARD') val = d.lostCard;
    return val;
  }), 10000);

  // Donut Segment (Color slices based on branch revenue percentage)
  const getDonutSlices = () => {
    const total = branchRevenues.reduce((acc, b) => acc + b.amount, 0) || 1;
    const colors = ['var(--vin-primary)', '#0d9488', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#64748b'];
    
    let accumulatedPercent = 0;
    const slices = branchRevenues.map((br, idx) => {
      const pct = total > 0 ? (br.amount / total) * 100 : 0;
      const roundedPct = Math.round(pct);
      const dashArrayVal = (pct / 100) * 314.159;
      const offsetVal = -(accumulatedPercent / 100) * 314.159;
      
      accumulatedPercent += pct;
      
      return {
        name: br.branchName,
        pct: roundedPct,
        amount: br.amount,
        dashArray: `${dashArrayVal} 314.159`,
        dashOffset: offsetVal,
        color: colors[idx % colors.length]
      };
    });
    
    return slices;
  };

  const donutSlices = getDonutSlices();

  // Service Distribution Pct
  const walkInPct = totalRevenue > 0 ? Math.round((walkInRevenue / totalRevenue) * 100) : 0;
  const ticketPct = totalRevenue > 0 ? Math.round((ticketRevenue / totalRevenue) * 100) : 0;
  const lostCardPct = totalRevenue > 0 ? Math.max(0, 100 - walkInPct - ticketPct) : 0;

  const handleFilter = () => {
    setLoading(true);
    fetchReportData(true).then(() => {
      setLoading(false);
      toast.success('Đã lọc kết quả thành công!');
    });
  };

  return (
    <div className="d-flex flex-column gap-3 text-dark" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* FILTER SECTION */}
      <Card className="border-0 shadow-sm p-3 mb-2">
        <Row className="g-3 align-items-center">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small text-muted fw-bold mb-1">Chi nhánh</Form.Label>
              <Form.Select 
                size="sm" 
                value={branchFilter} 
                onChange={e => setBranchFilter(e.target.value)}
                className="shadow-none border-light bg-light fw-medium text-dark"
              >
                <option>Tất cả chi nhánh</option>
                {branches.map(b => (
                  <option key={b.parkingBranchId || b.id}>{b.branchName || b.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={9} className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark small">Thời gian:</span>
              <div className="d-flex bg-light rounded p-1 border">
                {[
                  { key: 'today', label: 'Hôm nay' },
                  { key: 'week', label: '7 ngày qua' },
                  { key: 'month', label: 'Tháng này' },
                  { key: 'custom', label: 'Khoảng ngày' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRangeType(item.key)}
                    className={`btn btn-sm py-1 px-3 border-0 fw-semibold rounded ${rangeType === item.key ? 'bg-white shadow-sm' : 'text-muted bg-transparent'}`}
                    style={{ 
                      fontSize: '0.75rem', 
                      color: rangeType === item.key ? 'var(--vin-primary)' : 'inherit',
                      fontWeight: rangeType === item.key ? '700' : '600'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {rangeType === 'custom' && (
              <div className="d-flex gap-2 align-items-center">
                <Form.Control 
                  type="date" 
                  size="sm"
                  value={customStart} 
                  onChange={e => setCustomStart(e.target.value)} 
                  style={{ width: '130px', fontSize: '0.75rem' }}
                />
                <span className="text-muted small">đến</span>
                <Form.Control 
                  type="date" 
                  size="sm"
                  value={customEnd} 
                  onChange={e => setCustomEnd(e.target.value)} 
                  style={{ width: '130px', fontSize: '0.75rem' }}
                />
              </div>
            )}

            <div className="d-flex gap-2">
              <Button 
                size="sm" 
                className="d-flex align-items-center gap-2 fw-bold px-3 border-0" 
                style={{ backgroundColor: 'var(--vin-primary)' }}
                onClick={handleFilter}
              >
                <Filter size={14} /> Lọc kết quả
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="d-flex align-items-center gap-2 fw-bold bg-white text-muted px-3"
                onClick={() => toast.success('Báo cáo đã được xuất thành công!')}
              >
                <Download size={14} /> Xuất
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" style={{ color: 'var(--vin-primary)' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {/* METRICS CARDS */}
          <Row className="g-3">
            <Col md={3}>
              <Card className="border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded text-success" style={{ color: 'var(--vin-primary) !important' }}>
                    <DollarSign size={20} style={{ color: 'var(--vin-primary)' }} />
                  </div>
                </div>
                <div className="small text-muted fw-bold mt-2">Tổng doanh thu</div>
                <div className="fs-5 fw-bolder mb-1" style={{ color: 'var(--vin-primary)' }}>{Number(totalRevenue).toLocaleString('vi-VN')} đ</div>
                <div className="small text-muted" style={{ fontSize: '0.65rem', lineHeight: '1.4' }}>
                  Vé lượt: {walkInRevenue.toLocaleString('vi-VN')} đ | Vé tháng: {ticketRevenue.toLocaleString('vi-VN')} đ | Phạt: {lostCardRevenue.toLocaleString('vi-VN')} đ
                </div>
                <div className="mt-2 bg-light rounded overflow-hidden" style={{ height: 4 }}>
                  <div className="h-100" style={{ width: '100%', backgroundColor: 'var(--vin-primary)' }}></div>
                </div>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded text-success">
                    <Activity size={20} style={{ color: 'var(--vin-primary)' }} />
                  </div>
                </div>
                <div className="small text-muted fw-bold mt-2">Tổng số giao dịch</div>
                <div className="fs-5 fw-bolder text-dark mb-1">{totalTransactions.toLocaleString('vi-VN')}</div>
                <div className="small text-muted" style={{ fontSize: '0.7rem' }}>Giao dịch thành công</div>
                <div className="mt-2 bg-light rounded overflow-hidden" style={{ height: 4 }}>
                  <div className="h-100" style={{ width: '80%', backgroundColor: 'var(--vin-primary)' }}></div>
                </div>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded text-success">
                    <Building size={20} style={{ color: 'var(--vin-primary)' }} />
                  </div>
                </div>
                <div className="small text-muted fw-bold mt-2">Chi nhánh dẫn đầu</div>
                <div className="fs-5 fw-bolder mb-1 text-dark text-truncate" title={topBranchName}>{topBranchName}</div>
                <div className="small text-muted fw-bold" style={{ fontSize: '0.7rem' }}>{topBranchRev} đ</div>
                <div className="mt-2 bg-light rounded overflow-hidden" style={{ height: 4 }}>
                  <div className="h-100" style={{ width: '90%', backgroundColor: 'var(--vin-primary)' }}></div>
                </div>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded text-success">
                    <RefreshCcw size={20} style={{ color: 'var(--vin-primary)' }} />
                  </div>
                </div>
                <div className="small text-muted fw-bold mt-2">Tỉ lệ gia hạn</div>
                <div className="fs-5 fw-bolder text-dark mb-1">{renewalRateVal}</div>
                <div className="small text-muted" style={{ fontSize: '0.7rem' }}>Vé tháng active</div>
                <div className="mt-2 bg-light rounded overflow-hidden" style={{ height: 4 }}>
                  <div className="h-100" style={{ width: '88%', backgroundColor: 'var(--vin-primary)' }}></div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* CHARTS SECTION */}
          <Row className="g-3">
            {/* Bar Chart Area */}
            <Col md={8}>
              <Card className="border-0 shadow-sm p-4 h-100">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                  <h6 className="fw-bold m-0 text-dark">Biểu đồ xu hướng doanh thu</h6>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-none d-md-flex gap-2 small text-muted fw-bold">
                      <span className="d-flex align-items-center gap-1"><div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#a8a29e' }}></div> Vé lượt</span>
                      <span className="d-flex align-items-center gap-1"><div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: 'var(--vin-primary)' }}></div> Vé tháng</span>
                      <span className="d-flex align-items-center gap-1"><div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#f59e0b' }}></div> Vé VIP</span>
                      <span className="d-flex align-items-center gap-1"><div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#ef4444' }}></div> Phạt</span>
                    </div>
                    <ButtonGroup size="sm" className="bg-light p-1 rounded border">
                      {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'WALK_IN', label: 'Vé lượt' },
                        { key: 'CARD', label: 'Vé tháng/VIP' },
                        { key: 'LOST_CARD', label: 'Phạt' }
                      ].map(opt => (
                        <Button 
                          key={opt.key} 
                          variant={revenueChartType === opt.key ? 'white' : 'transparent'} 
                          className={`border-0 rounded shadow-sm py-1 px-3 ${revenueChartType === opt.key ? 'text-dark fw-bold bg-white' : 'text-muted bg-transparent'}`} 
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setRevenueChartType(opt.key)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </div>
                </div>
                
                <div className="overflow-auto w-100 pb-2">
                  <div 
                    className="d-flex align-items-end justify-content-between pt-3" 
                    style={{ 
                      height: '220px', 
                      gap: '12px',
                      minWidth: trendChartData.length > 8 ? `${trendChartData.length * 50}px` : 'auto'
                    }}
                  >
                    {trendChartData.map((data, idx) => {
                      let showVal = data.total;
                      if (revenueChartType === 'WALK_IN') showVal = data.walkIn;
                      else if (revenueChartType === 'CARD') showVal = data.monthly + data.vip;
                      else if (revenueChartType === 'LOST_CARD') showVal = data.lostCard;

                      const walkInPct = showVal > 0 && revenueChartType !== 'CARD' && revenueChartType !== 'LOST_CARD' ? (data.walkIn / maxRevenue) * 100 : 0;
                      const monthlyPct = showVal > 0 && revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' ? (data.monthly / maxRevenue) * 100 : 0;
                      const vipPct = showVal > 0 && revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' ? (data.vip / maxRevenue) * 100 : 0;
                      const lostCardPct = showVal > 0 && revenueChartType !== 'WALK_IN' && revenueChartType !== 'CARD' ? (data.lostCard / maxRevenue) * 100 : 0;

                      const totalPct = Math.max(5, walkInPct + monthlyPct + vipPct + lostCardPct);
                      const labelAmount = showVal > 0 ? (showVal >= 1000000 ? `${(showVal / 1000000).toFixed(1)}M` : `${Math.round(showVal / 1000)}k`) : '';

                      return (
                        <div 
                          key={idx} 
                          className="d-flex flex-column align-items-center h-100 justify-content-end gap-1 flex-grow-1" 
                          style={{ width: '50px', minWidth: '40px' }}
                          title={`Tổng cộng: ${showVal.toLocaleString('vi-VN')} đ`}
                        >
                          <span className="text-muted fw-bold" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{labelAmount}</span>
                          <div 
                            className="w-100 d-flex flex-column justify-content-end rounded-top overflow-hidden" 
                            style={{ height: `${totalPct * 0.8}%`, minHeight: '5px' }}
                          >
                            {revenueChartType !== 'WALK_IN' && revenueChartType !== 'CARD' && data.lostCard > 0 && (
                              <div 
                                className="bg-danger w-100" 
                                style={{ height: `${(data.lostCard / showVal) * 100}%`, transition: 'height 0.3s', cursor: 'pointer' }} 
                                title={`Phạt mất thẻ: ${data.lostCard.toLocaleString('vi-VN')} đ`}
                              />
                            )}
                            {revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' && data.vip > 0 && (
                              <div 
                                className="w-100" 
                                style={{ height: `${(data.vip / showVal) * 100}%`, transition: 'height 0.3s', backgroundColor: '#f59e0b', cursor: 'pointer' }} 
                                title={`Thẻ VIP: ${data.vip.toLocaleString('vi-VN')} đ`}
                              />
                            )}
                            {revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' && data.monthly > 0 && (
                              <div 
                                className="w-100" 
                                style={{ height: `${(data.monthly / showVal) * 100}%`, transition: 'height 0.3s', backgroundColor: 'var(--vin-primary)', cursor: 'pointer' }} 
                                title={`Thẻ Tháng: ${data.monthly.toLocaleString('vi-VN')} đ`}
                              />
                            )}
                            {revenueChartType !== 'CARD' && revenueChartType !== 'LOST_CARD' && data.walkIn > 0 && (
                              <div 
                                className="w-100" 
                                style={{ height: `${(data.walkIn / showVal) * 100}%`, transition: 'height 0.3s', backgroundColor: '#a8a29e', cursor: 'pointer' }} 
                                title={`Vé lượt: ${data.walkIn.toLocaleString('vi-VN')} đ`}
                              />
                            )}
                          </div>
                          <span className="small text-muted fw-bold" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{data.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </Card>
            </Col>

             {/* Donut Chart Area */}
             <Col md={4}>
               <Card className="border-0 shadow-sm p-4 h-100">
                 <h6 className="fw-bold m-0 mb-4 text-dark">Doanh thu theo Chi nhánh</h6>
                 
                 <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 position-relative" style={{ minHeight: '180px' }}>
                   <div className="position-relative d-flex align-items-center justify-content-center mb-4" style={{ width: '140px', height: '140px' }}>
                     <svg width="140" height="140" viewBox="0 0 140 140" className="position-absolute" style={{ transform: 'rotate(-90deg)' }}>
                       {/* Background Track */}
                       <circle cx="70" cy="70" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                       {/* Active Colored Slices */}
                       {donutSlices.map((slice, idx) => (
                         slice.pct > 0 && (
                           <circle
                             key={idx}
                             cx="70"
                             cy="70"
                             r="50"
                             fill="none"
                             stroke={slice.color}
                             strokeWidth="12"
                             strokeDasharray={slice.dashArray}
                             strokeDashoffset={slice.dashOffset}
                             style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                           />
                         )
                       ))}
                     </svg>
                     <div className="text-center position-relative z-1">
                       <div className="fs-5 fw-bolder text-dark" style={{ fontSize: '1.05rem' }}>
                         {totalRevenue >= 1000000000 
                           ? `${(totalRevenue / 1000000000).toFixed(1)}B` 
                           : totalRevenue >= 1000000 
                             ? `${(totalRevenue / 1000000).toFixed(1)}M`
                             : `${Math.round(totalRevenue / 1000)}K`}
                       </div>
                       <div className="small text-muted" style={{ fontSize: '0.65rem' }}>Tổng VNĐ</div>
                     </div>
                   </div>
                   
                   <div className="w-100 d-flex flex-column gap-2 small mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                     {donutSlices.length === 0 || totalRevenue === 0 ? (
                       <span className="text-muted text-center">Chưa có doanh thu</span>
                     ) : (
                       donutSlices.map((slice, index) => (
                         slice.pct > 0 && (
                           <div key={index} className="d-flex justify-content-between align-items-center">
                             <span className="d-flex align-items-center gap-2 text-muted fw-medium text-truncate" style={{ maxWidth: '80%' }}>
                               <div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: slice.color, flexShrink: 0 }}></div> 
                               {slice.name}
                             </span>
                             <span className="text-muted fw-bold">{slice.pct}%</span>
                           </div>
                         )
                       ))
                     )}
                   </div>
                 </div>
               </Card>
             </Col>
          </Row>



          {/* DETAILED TRANSACTIONS LIST */}
          <Card className="border-0 shadow-sm p-0 overflow-hidden">
            <div className="p-4 d-flex justify-content-between align-items-center border-bottom border-light">
              <h6 className="fw-bold m-0 text-dark">Danh sách giao dịch chi tiết</h6>
              <InputGroup style={{ width: '250px' }} size="sm">
                <InputGroup.Text className="bg-white text-muted border-end-0"><Search size={14} /></InputGroup.Text>
                <Form.Control 
                  placeholder="Tìm kiếm biển số, loại..." 
                  className="border-start-0 shadow-none ps-0" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </div>
            <Table responsive hover className="m-0 align-middle text-muted border-white" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light text-muted border-bottom-0">
                <tr>
                  <th className="ps-4 py-3 fw-bold border-0">Mã Giao Dịch</th>
                  <th className="py-3 fw-bold border-0">Thời Gian</th>
                  <th className="py-3 fw-bold border-0">Chi Nhánh</th>
                  <th className="py-3 fw-bold border-0">Loại Giao Dịch</th>
                  <th className="py-3 fw-bold border-0">Biển Số Xe</th>
                  <th className="py-3 fw-bold border-0">Số Tiền (VNĐ)</th>
                  <th className="py-3 fw-bold border-0">Trạng Thái</th>
                  <th className="text-center pe-4 py-3 fw-bold border-0">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {displayTxns.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">Không tìm thấy giao dịch nào.</td>
                  </tr>
                ) : (
                  displayTxns.slice(0, 10).map((t, idx) => (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="ps-4 fw-bold" style={{ color: 'var(--vin-primary)' }}>{t.id}</td>
                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>{t.time}</td>
                      <td className="fw-medium text-dark">{t.branch}</td>
                      <td className="text-muted">{t.type}</td>
                      <td><Badge bg="light" text="dark" className="border px-2 py-1 fw-bold text-muted">{t.plate}</Badge></td>
                      <td className="fw-bold text-dark">{t.amount.toLocaleString('vi-VN')} đ</td>
                      <td className="fw-bold">
                        <span className="d-flex align-items-center gap-2 text-success">
                          <div className="rounded-circle bg-success" style={{ width: 6, height: 6 }}></div>
                          <span>{t.status}</span>
                        </span>
                      </td>
                      <td className="text-center pe-4">
                        <Button variant="link" className="text-muted p-0 text-decoration-none hover-primary">
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
