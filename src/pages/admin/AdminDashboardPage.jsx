import React, { useState, useEffect } from 'react';
import managerApi from '../../api/manager';
import adminApi from '../../api/admin';
import { toast } from 'react-toastify';
import { RefreshCw, Activity, CreditCard, DollarSign, Users } from 'lucide-react';
import { Row, Col, Card, Badge, Button, ButtonGroup, Table, Modal, Form } from 'react-bootstrap';

const checkIsMonthlyOrVip = (s) => {
  if (!s) return false;
  const code = String(s.cardCode || s.parkingCard?.cardCode || '').toUpperCase();
  const type = String(s.cardType || s.parkingCard?.cardType || '').toUpperCase();
  return code.startsWith('MONTH-') || code.startsWith('MT-') || code.startsWith('MT') ||
         code.startsWith('VIP-') || code.startsWith('VP-') || code.startsWith('VP') ||
         type === 'MONTHLY' || type === 'VIP';
};

const calculateTicketRevenue = (t, VIP_PRICE, MONTHLY_PRICE) => {
  const code = String(t.cardCode || t.parkingCard?.cardCode || '').toUpperCase();
  const policyName = String(t.pricePolicy?.policyName || t.policyName || '').toUpperCase();
  const isVip = code.startsWith('VIP-') || code.startsWith('VP-') || code.startsWith('VP') || policyName.includes('VIP');
  const basePrice = Number(t.pricePolicy?.basePrice || t.amount || (isVip ? VIP_PRICE : MONTHLY_PRICE)) || 0;
  
  let months = 1;
  if (t.startDate && t.endDate) {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    const ticketDurationDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) || 0;
    const baseDurationDays = t.pricePolicy?.baseDurationMinutes ? (t.pricePolicy.baseDurationMinutes / (60 * 24)) : 30;
    if (baseDurationDays > 0) {
        months = Math.max(1, Math.round(ticketDurationDays / baseDurationDays)) || 1;
    }
  }
  return basePrice * months;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Tháng này');
  const [revenueChartType, setRevenueChartType] = useState('ALL'); // 'ALL', 'WALK_IN', 'CARD'

  // Data states
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [zones, setZones] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [cards, setCards] = useState([]);
  const [pricePolicies, setPricePolicies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);

  // Branch CRUD modal & form states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ branchName: '', address: '', phoneNumber: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [usersRes, sessionsRes, bookingsRes, branchesRes, zonesRes, ticketsRes, policiesRes, cardsRes, reqsRes, paymentsRes] = await Promise.all([
        adminApi.getAllUsers().catch(() => []),
        adminApi.getAllSessions().catch(() => []),
        adminApi.getAllBookings().catch(() => []),
        managerApi.getParkingBranches().catch(() => []),
        managerApi.getAllZones().catch(() => []),
        managerApi.getAllMonthlyTickets().catch(() => []),
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

      setUsers(getArray(usersRes));
      setSessions(getArray(sessionsRes));
      setBookings(getArray(bookingsRes));
      setBranches(getArray(branchesRes));
      setZones(getArray(zonesRes));
      setTickets(getArray(ticketsRes));
      setPricePolicies(getArray(policiesRes));
      setCards(getArray(cardsRes));
      setRequests(getArray(reqsRes));
      setPayments(getArray(paymentsRes));
    } catch (err) {
      console.error(err);
      if (!isSilent) toast.error('Không tải được dữ liệu Dashboard!');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);

    // Call API every 5 seconds for real-time update
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getReferenceDate = () => {
    return new Date();
  };

  const refDate = getReferenceDate();

  const getFormatKey = (dateVal) => {
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getHourKey = (dateVal) => {
    const d = new Date(dateVal);
    return String(d.getHours()).padStart(2, '0') + 'h';
  };

  const filteredSessions = sessions.filter(s => {
    if (!s.checkOutTime) return false;
    const outDate = new Date(s.checkOutTime);
    const now = refDate;
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    if (timeFilter === 'Hôm nay') {
      return outDate >= todayStart && outDate <= todayEnd;
    } else if (timeFilter === '7 ngày qua') {
      const sevenDaysAgoStart = new Date(todayStart);
      sevenDaysAgoStart.setDate(todayStart.getDate() - 6);
      return outDate >= sevenDaysAgoStart && outDate <= todayEnd;
    } else if (timeFilter === 'Tháng này') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return outDate >= monthStart && outDate <= monthEnd;
    }
    return true;
  });

  const monthlyPolicy = pricePolicies.find(p => (p.policyName || '').startsWith('[Gói Tháng]'));
  const vipPolicy = pricePolicies.find(p => (p.policyName || '').startsWith('[Gói VIP President]'));
  
  const MONTHLY_PRICE = monthlyPolicy ? Number(monthlyPolicy.basePrice || 200000) : 200000;
  const VIP_PRICE = vipPolicy ? Number(vipPolicy.basePrice || 1000000) : 1000000;

  const walkInSessions = filteredSessions.filter(s => {
    return !checkIsMonthlyOrVip(s);
  });

  const walkInRevenue = walkInSessions.reduce((sum, s) => sum + Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0), 0);
  const lostCardRevenue = filteredSessions.reduce((sum, s) => sum + Number(s.penaltyFee || 0), 0);

  // Build unified ticket events based on actual payment dates
  const paymentRequestIds = new Set(
    payments.filter(p => p.monthlyTicketRequestId).map(p => String(p.monthlyTicketRequestId))
  );

  const allTicketEvents = [];

  // From payments (preferred source - has paidAt)
  payments.forEach(p => {
    if (p.paymentStatus !== 'PAID') return;
    if (!p.monthlyTicketRequestId) return;
    const dt = p.paidAt || p.createdAt;
    if (!dt) return;
    
    allTicketEvents.push({
      id: `PAY-${p.paymentId}`,
      time: dt,
      policyName: p.policyName || '',
      amount: Number(p.policyBasePrice || p.amount || 0),
      source: 'payment'
    });
  });

  // From approved requests that have NO matching payment (approved manually by manager)
  requests.forEach(r => {
    if (r.status !== 1) return; // Only approved
    if (paymentRequestIds.has(String(r.id))) return; // Already counted via payment
    const dt = r.createdAt;
    if (!dt) return;
    
    const pName = r.pricePolicy?.policyName || '';
    const isVip = pName.toUpperCase().includes('VIP');
    const basePrice = Number(r.pricePolicy?.basePrice || (isVip ? VIP_PRICE : MONTHLY_PRICE)) || 0;

    allTicketEvents.push({
      id: `REQ-${r.id}`,
      time: dt,
      policyName: pName,
      amount: basePrice,
      source: 'request'
    });
  });

  const filteredTicketEvents = allTicketEvents.filter(t => {
    const dt = t.time;
    if (!dt) return false;
    const ticketDate = new Date(dt);
    const now = refDate;
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    if (timeFilter === 'Hôm nay') {
      return ticketDate >= todayStart && ticketDate <= todayEnd;
    } else if (timeFilter === '7 ngày qua') {
      const sevenDaysAgoStart = new Date(todayStart);
      sevenDaysAgoStart.setDate(todayStart.getDate() - 6);
      return ticketDate >= sevenDaysAgoStart && ticketDate <= todayEnd;
    } else if (timeFilter === 'Tháng này') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return ticketDate >= monthStart && ticketDate <= monthEnd;
    }
    return true;
  });

  const totalCardRevenue = filteredTicketEvents.reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalRevenue = walkInRevenue + totalCardRevenue + lostCardRevenue;
  
  const totalTransactions = filteredSessions.length;
  const cashlessCount = filteredSessions.filter(s => String(s.paymentMethod || '').toUpperCase() === 'VNPAY').length;
  const cashlessRate = totalTransactions > 0 ? Math.round((cashlessCount / totalTransactions) * 100) : 0;

  const totalUsersCount = users.length;
  const currentlyParkedCount = sessions.filter(s => s.sessionStatus === 'ACTIVE').length;

  const branchRevenueMap = filteredSessions.reduce((acc, s) => {
    const name = s.parkingBranchName || 'Khác';
    acc[name] = (acc[name] || 0) + Number(s.totalAmount || 0);
    return acc;
  }, {});

  const branchRevenues = Object.keys(branchRevenueMap).map(name => ({
    name,
    amount: branchRevenueMap[name]
  })).sort((a, b) => b.amount - a.amount);

  const getChartData = () => {
    const dates = {};
    const now = refDate;

    if (timeFilter === 'Hôm nay') {
      for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0') + 'h';
        dates[hourStr] = { walkIn: 0, monthly: 0, vip: 0, lostCard: 0 };
      }
      
      walkInSessions.forEach(s => {
        const hourStr = getHourKey(s.checkOutTime);
        if (dates[hourStr] !== undefined) {
          dates[hourStr].walkIn += Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
        }
      });

      filteredSessions.forEach(s => {
        const hourStr = getHourKey(s.checkOutTime);
        if (dates[hourStr] !== undefined) {
          dates[hourStr].lostCard += Number(s.penaltyFee || 0);
        }
      });

      filteredTicketEvents.forEach(t => {
        const dt = t.time;
        if (!dt) return;
        const hourStr = getHourKey(dt);
        if (dates[hourStr] !== undefined) {
          const isVip = t.policyName.toUpperCase().includes('VIP') || t.policyName.toUpperCase().includes('PRESIDENT');
          const amt = Number(t.amount) || 0;
          if (isVip) {
            dates[hourStr].vip += amt;
          } else {
            dates[hourStr].monthly += amt;
          }
        }
      });
    } else if (timeFilter === 'Tháng này') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= numDays; i++) {
        const day = String(i).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        dates[`${day}/${monthStr}`] = { walkIn: 0, monthly: 0, vip: 0, lostCard: 0 };
      }

      walkInSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key].walkIn += Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
        }
      });

      filteredSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key].lostCard += Number(s.penaltyFee || 0);
        }
      });

      filteredTicketEvents.forEach(t => {
        const dt = t.time;
        if (!dt) return;
        const key = getFormatKey(dt);
        if (dates[key] !== undefined) {
          const isVip = t.policyName.toUpperCase().includes('VIP') || t.policyName.toUpperCase().includes('PRESIDENT');
          const amt = Number(t.amount) || 0;
          if (isVip) {
            dates[key].vip += amt;
          } else {
            dates[key].monthly += amt;
          }
        }
      });
    } else if (timeFilter === '7 ngày qua') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates[getFormatKey(d)] = { walkIn: 0, monthly: 0, vip: 0, lostCard: 0 };
      }

      walkInSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key].walkIn += Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
        }
      });

      filteredSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key].lostCard += Number(s.penaltyFee || 0);
        }
      });

      filteredTicketEvents.forEach(t => {
        const dt = t.time;
        if (!dt) return;
        const key = getFormatKey(dt);
        if (dates[key] !== undefined) {
          const isVip = t.policyName.toUpperCase().includes('VIP') || t.policyName.toUpperCase().includes('PRESIDENT');
          const amt = Number(t.amount) || 0;
          if (isVip) {
            dates[key].vip += amt;
          } else {
            dates[key].monthly += amt;
          }
        }
      });
    } else {
      for (let i = 14; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates[getFormatKey(d)] = { walkIn: 0, monthly: 0, vip: 0, lostCard: 0 };
      }

      walkInSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key].walkIn += Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
        }
      });

      filteredSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key].lostCard += Number(s.penaltyFee || 0);
        }
      });

      filteredTicketEvents.forEach(t => {
        const dt = t.time;
        if (!dt) return;
        const key = getFormatKey(dt);
        if (dates[key] !== undefined) {
          const isVip = t.policyName.toUpperCase().includes('VIP') || t.policyName.toUpperCase().includes('PRESIDENT');
          const amt = Number(t.amount) || 0;
          if (isVip) {
            dates[key].vip += amt;
          } else {
            dates[key].monthly += amt;
          }
        }
      });
    }

    return Object.keys(dates).map(key => ({
      label: key,
      walkIn: dates[key].walkIn,
      monthly: dates[key].monthly,
      vip: dates[key].vip,
      lostCard: dates[key].lostCard,
      total: dates[key].walkIn + dates[key].monthly + dates[key].vip + dates[key].lostCard
    }));
  };

  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map(d => d.total), 10000);

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.branchName.trim()) return toast.warn('Vui lòng nhập tên chi nhánh!');
    setSubmitting(true);
    try {
      if (editingBranch) {
        await managerApi.updateParkingBranch(editingBranch.parkingBranchId, branchForm);
        toast.success('Cập nhật chi nhánh thành công!');
      } else {
        await managerApi.createParkingBranch(branchForm);
        toast.success('Thêm chi nhánh mới thành công!');
      }
      setShowBranchModal(false);
      setEditingBranch(null);
      setBranchForm({ branchName: '', address: '', phoneNumber: '', description: '' });
      fetchDashboardData();
    } catch (err) {
      toast.error(String(err.response?.data?.message || err.response?.data || 'Thao tác chi nhánh thất bại!'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBranchStatus = async (id, active) => {
    try {
      await managerApi.updateParkingBranchStatus(id, !active);
      toast.success('Cập nhật trạng thái chi nhánh thành công!');
      fetchDashboardData();
    } catch (err) {
      toast.error(String(err.response?.data?.message || err.response?.data || 'Không thể đổi trạng thái chi nhánh!'));
    }
  };

  const openEditBranchModal = (branch) => {
    setEditingBranch(branch);
    setBranchForm({
      branchName: branch.branchName || '',
      address: branch.address || '',
      phoneNumber: branch.phoneNumber || '',
      description: branch.description || ''
    });
    setShowBranchModal(true);
  };

  return (
    <div className="d-flex flex-column gap-3 text-dark " style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h4 fw-bold m-0 text-dark">Hệ thống Quản lý Bãi xe VinParking</h1>
          <p className="text-muted m-0 small">Báo cáo doanh thu, tình trạng vận hành và quản trị chi nhánh bãi xe.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <ButtonGroup size="sm" className="bg-light p-1 rounded border">
            {['Hôm nay', '7 ngày qua', 'Tháng này', 'Tất cả'].map(tab => (
              <Button key={tab} variant={timeFilter === tab ? 'white' : 'transparent'} className={`border-0 rounded shadow-sm ${timeFilter === tab ? 'text-primary fw-bold' : 'text-muted'}`} onClick={() => setTimeFilter(tab)}>{tab}</Button>
            ))}
          </ButtonGroup>
          <Button size="sm" variant="primary" className="fw-bold d-flex align-items-center gap-1" onClick={fetchDashboardData}><RefreshCw size={14} /> Làm mới</Button>
        </div>
      </div>

      <Row className="g-3">
        {[
          { title: 'TỔNG DOANH THU', icon: <DollarSign size={14} color="#3b82f6" />, val: `${Number(totalRevenue || 0).toLocaleString('vi-VN')} đ`, s1: `Vãng lai: ${Number(walkInRevenue).toLocaleString('vi-VN')}đ | Thẻ Tháng/VIP: ${Number(totalCardRevenue).toLocaleString('vi-VN')}đ`, s2: `Phạt mất thẻ: ${Number(lostCardRevenue).toLocaleString('vi-VN')}đ` },
          { title: 'LƯỢT XE ĐÃ THANH TOÁN', icon: <Activity size={14} color="#10b981" />, val: `${totalTransactions} giao dịch`, s1: 'Hóa đơn checkout thành công' },
          { title: 'TỶ LỆ ONLINE (VNPAY)', icon: <CreditCard size={14} color="#8b5cf6" />, val: `${cashlessRate}%`, s1: 'Còn lại: Tiền mặt/Thẻ RFID' },
          { title: 'XE ĐANG GỬI HIỆN TẠI', icon: <Users size={14} color="#ef4444" />, val: `${currentlyParkedCount} xe`, s1: `Tổng số User tài khoản: ${totalUsersCount}` }
        ].map((k, i) => (
          <Col md={3} key={i}>
            <Card className="border-0 shadow-sm h-100 p-3">
              <div className="d-flex justify-content-between text-muted fw-bold mb-2" style={{ fontSize: '0.7rem' }}><span>{k.title}</span>{k.icon}</div>
              <div className="fs-4 fw-bolder text-dark mb-2">{k.val}</div>
              <div className="small text-muted border-top pt-2 mt-auto">
                <div className="d-flex justify-content-between"><span>{k.s1}</span></div>
                {k.s2 && <div className="d-flex justify-content-between"><span>{k.s2}</span></div>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3">
        <Col md={8}>
          <Card className="border-0 shadow-sm p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 fs-6">Biểu đồ Doanh thu phân bổ</h5>
              <ButtonGroup size="sm" className="bg-light p-1 rounded border">
                {[{ key: 'ALL', label: 'Tất cả' }, { key: 'WALK_IN', label: 'Vãng lai' }, { key: 'CARD', label: 'Thẻ Tháng/VIP' }, { key: 'LOST_CARD', label: 'Phạt mất thẻ' }].map(opt => (
                  <Button key={opt.key} variant={revenueChartType === opt.key ? 'white' : 'transparent'} className={`border-0 rounded shadow-sm ${revenueChartType === opt.key ? 'text-dark fw-bold' : 'text-muted'}`} onClick={() => setRevenueChartType(opt.key)}>{opt.label}</Button>
                ))}
              </ButtonGroup>
            </div>
            
            <div className="overflow-auto w-100 pb-2">
              <div className="d-flex align-items-end border-bottom pb-2" style={{ height: 140, gap: (timeFilter === 'Tháng này' || timeFilter === 'Hôm nay') ? 6 : 16, minWidth: (timeFilter === 'Tháng này' || timeFilter === 'Hôm nay') ? 600 : 'auto' }}>
                {chartData.map((d, index) => {
                  let showVal = d.total;
                  if (revenueChartType === 'WALK_IN') showVal = d.walkIn;
                  else if (revenueChartType === 'CARD') showVal = d.monthly + d.vip;
                  else if (revenueChartType === 'LOST_CARD') showVal = d.lostCard;
 
                  const walkInPct = showVal > 0 && revenueChartType !== 'CARD' && revenueChartType !== 'LOST_CARD' ? (d.walkIn / maxRevenue) * 100 : 0;
                  const monthlyPct = showVal > 0 && revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' ? (d.monthly / maxRevenue) * 100 : 0;
                  const vipPct = showVal > 0 && revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' ? (d.vip / maxRevenue) * 100 : 0;
                  const lostCardPct = showVal > 0 && revenueChartType !== 'WALK_IN' && revenueChartType !== 'CARD' ? (d.lostCard / maxRevenue) * 100 : 0;
                  
                  const totalPct = Math.max(5, walkInPct + monthlyPct + vipPct + lostCardPct);
                  const labelAmount = showVal > 0 ? (showVal >= 1000000 ? `${(showVal / 1000000).toFixed(1)}M` : `${Math.round(showVal / 1000)}k`) : '';
                  
                  return (
                    <div key={index} className="flex-grow-1 d-flex flex-column align-items-center h-100 justify-content-end gap-1">
                      <span className="text-muted fw-bold" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{labelAmount}</span>
                      <div className="w-100 d-flex flex-column justify-content-end rounded-top overflow-hidden" style={{ height: `${totalPct}%` }}>
                        {revenueChartType !== 'WALK_IN' && revenueChartType !== 'CARD' && d.lostCard > 0 && <div className="bg-danger w-100" style={{ height: `${(d.lostCard / showVal) * 100}%`, transition: 'height 0.3s' }} title={`Phạt mất thẻ: ${d.lostCard.toLocaleString()}đ`} />}
                        {revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' && d.vip > 0 && <div className="bg-warning w-100" style={{ height: `${(d.vip / showVal) * 100}%`, transition: 'height 0.3s' }} title={`Thẻ VIP: ${d.vip.toLocaleString()}đ`} />}
                        {revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' && d.monthly > 0 && <div className="bg-success w-100" style={{ height: `${(d.monthly / showVal) * 100}%`, transition: 'height 0.3s' }} title={`Thẻ Tháng: ${d.monthly.toLocaleString()}đ`} />}
                        {revenueChartType !== 'CARD' && revenueChartType !== 'LOST_CARD' && d.walkIn > 0 && <div className="bg-primary w-100" style={{ height: `${(d.walkIn / showVal) * 100}%`, transition: 'height 0.3s' }} title={`Khách vãng lai: ${d.walkIn.toLocaleString()}đ`} />}
                      </div>
                      <span className="text-muted fw-bold" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="d-flex justify-content-center gap-3 mt-3 small">
              {revenueChartType !== 'CARD' && revenueChartType !== 'LOST_CARD' && <div className="d-flex align-items-center gap-1 text-muted"><div className="bg-primary rounded" style={{ width: 12, height: 12 }} /> Khách vãng lai</div>}
              {revenueChartType !== 'WALK_IN' && revenueChartType !== 'LOST_CARD' && (
                <><div className="d-flex align-items-center gap-1 text-muted"><div className="bg-success rounded" style={{ width: 12, height: 12 }} /> Thẻ Tháng</div>
                <div className="d-flex align-items-center gap-1 text-muted"><div className="bg-warning rounded" style={{ width: 12, height: 12 }} /> Thẻ VIP</div></>
              )}
              {revenueChartType !== 'WALK_IN' && revenueChartType !== 'CARD' && <div className="d-flex align-items-center gap-1 text-muted"><div className="bg-danger rounded" style={{ width: 12, height: 12 }} /> Phạt mất thẻ</div>}
            </div>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm p-3 h-100 d-flex flex-column align-items-center justify-content-center">
            <h5 className="fw-bold m-0 fs-6 align-self-start mb-3">Cổng Thanh toán</h5>
            <div className="d-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 120, height: 120, background: `conic-gradient(var(--vin-primary) ${cashlessRate}%, #cbd5e1 ${cashlessRate}% 100%)` }}>
              <div className="bg-white rounded-circle d-flex flex-column align-items-center justify-content-center" style={{ width: 94, height: 94 }}>
                <div className="fs-4 fw-bolder text-dark">{cashlessRate}%</div>
                <div className="fw-bold text-muted" style={{ fontSize: '0.55rem' }}>VNPAY ONLINE</div>
              </div>
            </div>
            <div className="d-flex w-100 justify-content-around small text-muted">
              <span className="d-flex align-items-center gap-1"><div className="bg-primary rounded" style={{ width: 8, height: 8 }} /> Online: {cashlessRate}%</span>
              <span className="d-flex align-items-center gap-1"><div className="bg-secondary rounded" style={{ width: 8, height: 8 }} /> Tiền mặt: {100 - cashlessRate}%</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <Card className="border-0 shadow-sm p-3 h-100" style={{ maxHeight: 250, overflowY: 'auto' }}>
            <h5 className="fw-bold fs-6 mb-3">Doanh thu theo Chi nhánh</h5>
            <div className="d-flex flex-column gap-3">
              {branchRevenues.length === 0 ? <span className="small text-muted">Chưa có doanh thu.</span> : branchRevenues.map((br, index) => {
                const maxAmount = branchRevenues[0]?.amount || 1;
                const pct = Math.round((br.amount / maxAmount) * 100);
                return (
                  <div key={index}>
                    <div className="d-flex justify-content-between mb-1 small fw-bold"><span>{br.name}</span><span>{Number(br.amount || 0).toLocaleString('vi-VN')} đ</span></div>
                    <div className="bg-light rounded" style={{ height: 6 }}><div className="bg-primary rounded h-100" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm p-3 h-100" style={{ maxHeight: 250, overflowY: 'auto' }}>
            <h5 className="fw-bold fs-6 mb-3">Các Giao dịch Checkout Gần nhất</h5>
            <Table hover size="sm" className="align-middle text-muted" style={{ fontSize: '0.8rem' }}>
              <thead className="table-light text-muted"><tr><th>BIỂN SỐ</th><th>CHI NHÁNH</th><th>SỐ TIỀN</th><th className="text-end">THANH TOÁN</th></tr></thead>
              <tbody>
                {filteredSessions.length === 0 ? <tr><td colSpan="4" className="text-center py-3">Không có giao dịch nào.</td></tr> : filteredSessions.slice(0, 5).map(s => (
                  <tr key={s.parkingSessionId}>
                    <td className="fw-bold text-primary">{s.licensePlate}</td>
                    <td>{s.parkingBranchName}</td>
                    <td className="fw-bold text-dark">{Number(s.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
                    <td className="text-end"><Badge bg={String(s.paymentMethod || '').toUpperCase() === 'VNPAY' ? 'success' : 'danger'}>{s.paymentMethod || 'CASH'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold m-0 fs-6">Quản lý Chi nhánh Bãi xe</h5>
            <p className="text-muted m-0 small">Xem danh sách và cấu hình vận hành của các chi nhánh đỗ xe.</p>
          </div>
          <Button size="sm" variant="primary" className="fw-bold" onClick={() => { setEditingBranch(null); setBranchForm({ branchName: '', address: '', phoneNumber: '', description: '' }); setShowBranchModal(true); }}>➕ Thêm Chi Nhánh</Button>
        </div>

        <Table hover responsive className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
          <thead className="table-light text-muted"><tr><th>CHI NHÁNH</th><th>ĐỊA CHỈ</th><th>ĐIỆN THOẠI</th><th>TRẠNG THÁI</th><th className="text-center">HÀNH ĐỘNG</th></tr></thead>
          <tbody>
            {branches.length === 0 ? <tr><td colSpan="5" className="text-center py-3 text-muted">Chưa có chi nhánh nào.</td></tr> : branches.map(b => (
              <tr key={b.parkingBranchId}>
                <td className="fw-bold text-dark">{b.branchName}</td>
                <td className="text-muted">{b.address || '—'}</td>
                <td className="text-muted">{b.phoneNumber || '—'}</td>
                <td><Badge bg={b.active ? 'success' : 'danger'}>{b.active ? 'Hoạt động' : 'Tắt'}</Badge></td>
                <td className="text-center">
                  <Button variant="link" size="sm" className="text-primary text-decoration-none fw-bold" onClick={() => openEditBranchModal(b)}>Sửa</Button>
                  <Button variant="link" size="sm" className={`text-decoration-none fw-bold ${b.active ? 'text-danger' : 'text-success'}`} onClick={() => handleToggleBranchStatus(b.parkingBranchId, b.active)}>{b.active ? 'Tắt' : 'Bật'}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showBranchModal} onHide={() => setShowBranchModal(false)} centered>
        <Form onSubmit={handleSaveBranch}>
          <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">{editingBranch ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh bãi xe mới'}</Modal.Title></Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group><Form.Label className="small fw-bold text-muted">TÊN CHI NHÁNH *</Form.Label><Form.Control type="text" placeholder="Nhập tên chi nhánh (ví dụ: Landmark 81)" value={branchForm.branchName} onChange={e => setBranchForm({ ...branchForm, branchName: e.target.value })} required /></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">ĐỊA CHỈ</Form.Label><Form.Control type="text" placeholder="Nhập địa chỉ..." value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} /></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">ĐIỆN THOẠI</Form.Label><Form.Control type="text" placeholder="Nhập số điện thoại..." value={branchForm.phoneNumber} onChange={e => setBranchForm({ ...branchForm, phoneNumber: e.target.value })} /></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">MÔ TẢ CHI NHÁNH</Form.Label><Form.Control as="textarea" rows={2} placeholder="Mô tả bãi..." value={branchForm.description} onChange={e => setBranchForm({ ...branchForm, description: e.target.value })} style={{ resize: 'none' }} /></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowBranchModal(false)} disabled={submitting}>Hủy bỏ</Button><Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu lại'}</Button></Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
