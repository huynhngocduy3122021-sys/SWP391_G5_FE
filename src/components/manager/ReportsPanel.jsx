import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Badge } from 'react-bootstrap';
import { mt } from './managerTheme';
import managerApi from '../../api/manager';

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';

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
  const basePrice = t.pricePolicy?.basePrice || t.amount || (isVip ? VIP_PRICE : MONTHLY_PRICE);
  
  let months = 1;
  if (t.startDate && t.endDate) {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    const ticketDurationDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    const baseDurationDays = t.pricePolicy?.baseDurationMinutes ? (t.pricePolicy.baseDurationMinutes / (60 * 24)) : 30;
    if (baseDurationDays > 0) {
        months = Math.max(1, Math.round(ticketDurationDays / baseDurationDays));
    }
  }
  return Number(basePrice) * months;
};

export default function ReportsPanel({ branchId }) {
  const [sessions, setSessions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [pricePolicies, setPricePolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc thời gian chính
  const [rangeType, setRangeType] = useState('week'); // 'today' | 'week' | 'month' | 'custom'
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  // View mode dành riêng cho chế độ xem 'today'
  const [todayViewMode, setTodayViewMode] = useState('transactions'); // 'transactions' | 'hourly'

  const fetchData = async () => {
    setLoading(true);
    const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null') ? String(branchId) : localStorage.getItem('parkingBranchId');
    try {
      const [data, ticketsData, policiesData] = await Promise.all([
        managerApi.getAllSessions(cleanBranchId ? { parkingBranchId: Number(cleanBranchId), branchId: Number(cleanBranchId) } : {}),
        managerApi.getAllMonthlyTickets().catch(() => []),
        managerApi.getPricePolicies().catch(() => [])
      ]);

      const parsed = Array.isArray(data) ? data : data?.content || [];
      const parsedTickets = Array.isArray(ticketsData) ? ticketsData : ticketsData?.content || [];
      setPricePolicies(Array.isArray(policiesData) ? policiesData : policiesData?.content || []);
      
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

      setSessions(cleanBranchId 
        ? parsed.filter(s => getBranchId(s) === cleanBranchId)
        : parsed
      );

      setTickets(cleanBranchId
        ? parsedTickets.filter(t => {
            const bId = t.parkingBranchId || t.branchId || t.parkingBranch?.parkingBranchId || t.parkingBranch?.id ||
                        t.parkingCard?.parkingBranchId || t.parkingCard?.parkingBranch?.parkingBranchId || t.parkingCard?.parkingBranch?.id;
            return String(bId) === cleanBranchId;
          })
        : parsedTickets
      );
    } catch (err) {
      console.error('Failed to fetch data for report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // Cấu hình đơn giá vé cước tháng/VIP
  const monthlyPolicy = pricePolicies.find(p => (p.policyName || '').startsWith('[Gói Tháng]'));
  const vipPolicy = pricePolicies.find(p => (p.policyName || '').startsWith('[Gói VIP President]'));
  const MONTHLY_PRICE = monthlyPolicy ? Number(monthlyPolicy.basePrice || 200000) : 200000;
  const VIP_PRICE = vipPolicy ? Number(vipPolicy.basePrice || 1000000) : 1000000;

  // Tính toán giới hạn thời gian dựa trên bộ lọc
  const getRangeBoundaries = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (rangeType === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (rangeType === 'week') {
      start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    } else if (rangeType === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (rangeType === 'custom') {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
    }
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getRangeBoundaries();

  // Lọc dữ liệu trong khoảng thời gian đã chọn
  const filteredSessions = sessions.filter(s => {
    if (!s.checkOutTime) return false;
    const checkoutDate = new Date(s.checkOutTime);
    return checkoutDate >= rangeStart && checkoutDate <= rangeEnd;
  });

  const filteredTickets = tickets.filter(t => {
    const dt = t.createdAt || t.startDate;
    if (!dt) return false;
    const ticketDate = new Date(dt);
    return ticketDate >= rangeStart && ticketDate <= rangeEnd;
  });

  // Tính doanh thu theo từng phần
  const totalWalkInRevenue = filteredSessions.reduce((sum, s) => {
    const isMOrV = checkIsMonthlyOrVip(s);
    const walkInFee = isMOrV ? 0 : Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
    return sum + walkInFee;
  }, 0);

  const totalLostCardRevenue = filteredSessions.reduce((sum, s) => {
    return sum + Number(s.penaltyFee || 0);
  }, 0);

  const totalTicketRevenue = filteredTickets.reduce((sum, t) => {
    const price = calculateTicketRevenue(t, VIP_PRICE, MONTHLY_PRICE);
    return sum + price;
  }, 0);

  const totalRevenue = totalWalkInRevenue + totalTicketRevenue + totalLostCardRevenue;

  // Lọc giao dịch có phát sinh tiền thực tế
  const payingTransactionsCount = filteredSessions.filter(s => {
    const isMOrV = checkIsMonthlyOrVip(s);
    return (!isMOrV && s.totalAmount) || s.penaltyFee;
  }).length;
  
  const transactionCount = payingTransactionsCount + filteredTickets.length;

  // PHÂN LOẠI CHI TIẾT
  // 1. Phân loại theo loại xe (Vehicle Classification)
  let breakdownByVehicle = {
    oto: { amount: 0, percentage: 0 },
    xemay: { amount: 0, percentage: 0 },
    xedien: { amount: 0, percentage: 0 }
  };

  filteredSessions.forEach(s => {
    const isMOrV = checkIsMonthlyOrVip(s);
    const walkInFee = isMOrV ? 0 : Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
    const vType = (s.vehicleTypeName || '').toLowerCase();
    
    if (vType.includes('ô tô') || vType.includes('car') || vType.includes('o to')) {
      breakdownByVehicle.oto.amount += walkInFee;
    } else if (vType.includes('xe máy') || vType.includes('moto') || vType.includes('bike') || vType.includes('xe may')) {
      breakdownByVehicle.xemay.amount += walkInFee;
    } else {
      breakdownByVehicle.xedien.amount += walkInFee;
    }
  });

  filteredTickets.forEach(t => {
    const amt = calculateTicketRevenue(t, VIP_PRICE, MONTHLY_PRICE);
    const vType = (t.vehicleType?.typeName || t.vehicleTypeName || '').toLowerCase();
    
    if (vType.includes('ô tô') || vType.includes('car') || vType.includes('o to')) {
      breakdownByVehicle.oto.amount += amt;
    } else if (vType.includes('xe máy') || vType.includes('moto') || vType.includes('bike') || vType.includes('xe may')) {
      breakdownByVehicle.xemay.amount += amt;
    } else {
      breakdownByVehicle.xedien.amount += amt;
    }
  });

  // 2. Phân loại theo hình thức dịch vụ (Service Type Classification)
  let breakdownByService = {
    walkIn: { amount: totalWalkInRevenue, percentage: 0 },
    ticket: { amount: totalTicketRevenue, percentage: 0 },
    lostCard: { amount: totalLostCardRevenue, percentage: 0 }
  };

  // Tính phần trăm phân loại
  if (totalRevenue > 0) {
    breakdownByVehicle.oto.percentage = Math.round((breakdownByVehicle.oto.amount / totalRevenue) * 100);
    breakdownByVehicle.xemay.percentage = Math.round((breakdownByVehicle.xemay.amount / totalRevenue) * 100);
    breakdownByVehicle.xedien.percentage = Math.max(0, 100 - breakdownByVehicle.oto.percentage - breakdownByVehicle.xemay.percentage);
    if (breakdownByVehicle.xedien.amount === 0) breakdownByVehicle.xedien.percentage = 0;

    breakdownByService.walkIn.percentage = Math.round((breakdownByService.walkIn.amount / totalRevenue) * 100);
    breakdownByService.ticket.percentage = Math.round((breakdownByService.ticket.amount / totalRevenue) * 100);
    breakdownByService.lostCard.percentage = Math.max(0, 100 - breakdownByService.walkIn.percentage - breakdownByService.ticket.percentage);
    if (breakdownByService.lostCard.amount === 0) breakdownByService.lostCard.percentage = 0;
  }

  // GOM NHÓM DỮ LIỆU ĐỂ VẼ BIỂU ĐỒ & BẢNG
  // 1. Nhóm theo Ngày (Dùng cho tuần, tháng hoặc khoảng ngày)
  const dailyGroups = filteredSessions.reduce((acc, s) => {
    const dateStr = new Date(s.checkOutTime).toLocaleDateString('vi-VN');
    if (!acc[dateStr]) {
      acc[dateStr] = { time: dateStr, oto: 0, xemay: 0, xedien: 0, thethang: 0, lostCard: 0, total: 0 };
    }
    
    const isMOrV = checkIsMonthlyOrVip(s);
    const walkInFee = isMOrV ? 0 : Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
    const penaltyFee = Number(s.penaltyFee || 0);
    
    acc[dateStr].total += walkInFee + penaltyFee;
    acc[dateStr].lostCard += penaltyFee;
    
    const vType = (s.vehicleTypeName || '').toLowerCase();
    if (vType.includes('ô tô') || vType.includes('car') || vType.includes('o to')) {
      acc[dateStr].oto += walkInFee;
    } else if (vType.includes('xe máy') || vType.includes('moto') || vType.includes('bike') || vType.includes('xe may')) {
      acc[dateStr].xemay += walkInFee;
    } else {
      acc[dateStr].xedien += walkInFee;
    }
    return acc;
  }, {});

  filteredTickets.forEach(t => {
    const dt = t.createdAt || t.startDate;
    if (dt) {
      const dateStr = new Date(dt).toLocaleDateString('vi-VN');
      if (!dailyGroups[dateStr]) {
        dailyGroups[dateStr] = { time: dateStr, oto: 0, xemay: 0, xedien: 0, thethang: 0, lostCard: 0, total: 0 };
      }
      const amt = calculateTicketRevenue(t, VIP_PRICE, MONTHLY_PRICE);
      dailyGroups[dateStr].total += amt;
      dailyGroups[dateStr].thethang += amt;
    }
  });

  const sortedDays = Object.values(dailyGroups)
    .sort((a, b) => {
      const [da, ma, ya] = a.time.split('/');
      const [db, mb, yb] = b.time.split('/');
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });

  // 2. Nhóm theo Giờ (Dùng riêng cho bộ lọc 'today')
  const hourlyGroups = Array.from({ length: 24 }, (_, h) => {
    return { time: `${h}h`, oto: 0, xemay: 0, xedien: 0, thethang: 0, lostCard: 0, total: 0 };
  });

  filteredSessions.forEach(s => {
    const hour = new Date(s.checkOutTime).getHours();
    const isMOrV = checkIsMonthlyOrVip(s);
    const walkInFee = isMOrV ? 0 : Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
    const penaltyFee = Number(s.penaltyFee || 0);

    hourlyGroups[hour].total += walkInFee + penaltyFee;
    hourlyGroups[hour].lostCard += penaltyFee;

    const vType = (s.vehicleTypeName || '').toLowerCase();
    if (vType.includes('ô tô') || vType.includes('car') || vType.includes('o to')) {
      hourlyGroups[hour].oto += walkInFee;
    } else if (vType.includes('xe máy') || vType.includes('moto') || vType.includes('bike') || vType.includes('xe may')) {
      hourlyGroups[hour].xemay += walkInFee;
    } else {
      hourlyGroups[hour].xedien += walkInFee;
    }
  });

  filteredTickets.forEach(t => {
    const dt = t.createdAt || t.startDate;
    if (dt) {
      const hour = new Date(dt).getHours();
      const amt = calculateTicketRevenue(t, VIP_PRICE, MONTHLY_PRICE);
      hourlyGroups[hour].total += amt;
      hourlyGroups[hour].thethang += amt;
    }
  });

  // Lấy dữ liệu vẽ xu hướng doanh thu tùy theo bộ lọc
  const trendData = rangeType === 'today' ? hourlyGroups : sortedDays;
  const maxTrendRevenue = Math.max(...trendData.map(d => d.total), 1);

  // 3. Danh sách giao dịch chi tiết đóng góp doanh thu (Dùng cho 'today')
  const transactionList = [];
  filteredSessions.forEach(s => {
    const isMOrV = checkIsMonthlyOrVip(s);
    const fee = isMOrV ? 0 : Number(s.parkingFee ?? (s.totalAmount - (s.penaltyFee || 0)) ?? 0);
    const penalty = Number(s.penaltyFee || 0);

    if (fee > 0 || penalty > 0) {
      transactionList.push({
        id: s.parkingSessionId || s.id,
        type: isMOrV ? 'Vé đặc biệt (Thẻ Tháng/VIP)' : 'Khách vãng lai',
        licensePlate: s.licensePlate,
        vehicleType: s.vehicleTypeName || '—',
        time: s.checkOutTime,
        paymentMethod: s.paymentMethod || 'Tiền mặt',
        amount: fee,
        penalty: penalty,
        total: fee + penalty,
        cardCode: s.cardCode || s.parkingCard?.cardCode || '—'
      });
    }
  });

  filteredTickets.forEach(t => {
    const code = String(t.cardCode || t.parkingCard?.cardCode || '').toUpperCase();
    const policyName = String(t.pricePolicy?.policyName || t.policyName || '').toUpperCase();
    const isVip = code.startsWith('VIP-') || code.startsWith('VP-') || code.startsWith('VP') || policyName.includes('VIP');
    const amt = calculateTicketRevenue(t, VIP_PRICE, MONTHLY_PRICE);
    transactionList.push({
      id: t.monthlyTicketId || t.id,
      type: isVip ? 'Đăng ký Vé VIP' : 'Đăng ký Vé Tháng',
      licensePlate: t.vehicle?.licensePlate || t.licensePlate || '—',
      vehicleType: t.vehicleType?.typeName || t.vehicleTypeName || '—',
      time: t.createdAt || t.startDate,
      paymentMethod: t.paymentMethod || 'Chuyển khoản',
      amount: amt,
      penalty: 0,
      total: amt,
      cardCode: t.cardCode || t.parkingCard?.cardCode || '—'
    });
  });
  transactionList.sort((a, b) => new Date(b.time) - new Date(a.time));

  // TÍNH TOÁN LƯU LƯỢNG XE (TRAFFIC) THEO KHOẢNG ĐÃ CHỌN
  const getTrafficDataForRange = () => {
    if (rangeType === 'today') {
      return Array.from({ length: 24 }, (_, h) => {
        const checkins = sessions.filter(s => {
          if (!s.checkInTime) return false;
          const d = new Date(s.checkInTime);
          return d >= rangeStart && d <= rangeEnd && d.getHours() === h;
        }).length;
        const checkouts = sessions.filter(s => {
          if (!s.checkOutTime) return false;
          const d = new Date(s.checkOutTime);
          return d >= rangeStart && d <= rangeEnd && d.getHours() === h;
        }).length;
        return { label: `${h}h`, checkins, checkouts, total: checkins + checkouts };
      });
    } else {
      const diffTime = Math.abs(rangeEnd - rangeStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Array.from({ length: Math.min(diffDays, 31) }, (_, i) => {
        const d = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
        const dStr = d.toDateString();
        const dLabel = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        
        const checkins = sessions.filter(s => s.checkInTime && new Date(s.checkInTime).toDateString() === dStr).length;
        const checkouts = sessions.filter(s => s.checkOutTime && new Date(s.checkOutTime).toDateString() === dStr).length;
        return { label: dLabel, checkins, checkouts, total: checkins + checkouts };
      });
    }
  };

  const activeTrafficData = getTrafficDataForRange();
  const maxTrafficVal = Math.max(...activeTrafficData.map(d => d.total), 1);

  const stats = [
    { label: 'TỔNG DOANH THU', value: loading ? '...' : fmt(totalRevenue), color: 'text-primary', amount: totalRevenue },
    { label: 'GỬI XE VÃNG LAI', value: loading ? '...' : fmt(totalWalkInRevenue), color: 'text-success', amount: totalWalkInRevenue },
    { label: 'VÉ THÁNG / VIP', value: loading ? '...' : fmt(totalTicketRevenue), color: 'text-warning', amount: totalTicketRevenue },
    { label: 'PHẠT MẤT THẺ', value: loading ? '...' : fmt(totalLostCardRevenue), color: 'text-danger', amount: totalLostCardRevenue },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      
      {/* TIÊU ĐỀ TRANG VÀ NÚT LÀM MỚI */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h2 className="text-primary fw-bold mb-1 fs-4">Báo cáo Doanh thu</h2>
          <p className="text-muted small m-0">Xem và phân tích chi tiết doanh số, lưu lượng và phân loại xe của chi nhánh.</p>
        </div>
        <Button variant="light" className="border text-primary fw-semibold" onClick={fetchData}>
          Làm mới
        </Button>
      </div>

      {/* THANH BỘ LỌC THỜI GIAN */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-dark small">Thời gian:</span>
            <div className="d-flex bg-light rounded p-1 border">
              {[
                { key: 'today', label: 'Hôm nay' },
                { key: 'week', label: '7 Ngày qua' },
                { key: 'month', label: 'Tháng này' },
                { key: 'custom', label: 'Khoảng ngày' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRangeType(item.key)}
                  className={`btn btn-sm py-1 px-3 border-0 fw-semibold rounded ${rangeType === item.key ? 'bg-white text-primary shadow-sm' : 'text-muted bg-transparent'}`}
                  style={{ fontSize: '0.75rem' }}
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
        </Card.Body>
      </Card>

      {/* HÀNG STATS CARDS */}
      <Row className="g-3">
        {stats.map((s, i) => (
          <Col key={i} xs={12} sm={6} md={3}>
            <Card className="border-0 shadow-sm h-100 p-3">
              <div className="text-muted fw-bold small text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>{s.label}</div>
              <div className={`fs-4 fw-bolder ${s.color}`}>{s.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* PHẦN PHÂN LOẠI CHI TIẾT */}
      <Row className="g-3">
        
        {/* Phân loại theo loại xe */}
        <Col xs={12} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-1">🚗 Phân loại doanh thu theo Loại xe</h6>
              <p className="text-muted small mb-4">Doanh thu đóng góp từ từng dòng phương tiện</p>
              
              <div className="d-flex flex-column gap-3">
                {/* Ô tô */}
                <div>
                  <div className="d-flex justify-content-between align-items-center small fw-bold mb-1">
                    <span className="text-dark">Ô tô (Cars)</span>
                    <span className="text-primary">{fmt(breakdownByVehicle.oto.amount)} ({breakdownByVehicle.oto.percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${breakdownByVehicle.oto.percentage}%`, borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Xe máy */}
                <div>
                  <div className="d-flex justify-content-between align-items-center small fw-bold mb-1">
                    <span className="text-dark">Xe máy (Motorbikes)</span>
                    <span className="text-success">{fmt(breakdownByVehicle.xemay.amount)} ({breakdownByVehicle.xemay.percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div className="progress-bar bg-success" role="progressbar" style={{ width: `${breakdownByVehicle.xemay.percentage}%`, borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Xe điện / Khác */}
                <div>
                  <div className="d-flex justify-content-between align-items-center small fw-bold mb-1">
                    <span className="text-dark">Xe điện & Khác</span>
                    <span className="text-warning">{fmt(breakdownByVehicle.xedien.amount)} ({breakdownByVehicle.xedien.percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${breakdownByVehicle.xedien.percentage}%`, borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Phân loại theo hình thức dịch vụ */}
        <Col xs={12} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-1">💎 Phân loại doanh thu theo Loại dịch vụ</h6>
              <p className="text-muted small mb-4">Phần trăm doanh thu từ lượt vãng lai, đăng ký tháng/VIP, phạt</p>
              
              <div className="d-flex flex-column gap-3">
                {/* Lượt vãng lai */}
                <div>
                  <div className="d-flex justify-content-between align-items-center small fw-bold mb-1">
                    <span className="text-dark">Lượt gửi vãng lai</span>
                    <span className="text-primary">{fmt(breakdownByService.walkIn.amount)} ({breakdownByService.walkIn.percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div className="progress-bar bg-info" role="progressbar" style={{ width: `${breakdownByService.walkIn.percentage}%`, borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Thẻ tháng/VIP */}
                <div>
                  <div className="d-flex justify-content-between align-items-center small fw-bold mb-1">
                    <span className="text-dark">Vé đăng ký cước (Tháng/VIP)</span>
                    <span className="text-warning">{fmt(breakdownByService.ticket.amount)} ({breakdownByService.ticket.percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${breakdownByService.ticket.percentage}%`, borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Phạt mất thẻ */}
                <div>
                  <div className="d-flex justify-content-between align-items-center small fw-bold mb-1">
                    <span className="text-dark">Phạt mất thẻ đỗ</span>
                    <span className="text-danger">{fmt(breakdownByService.lostCard.amount)} ({breakdownByService.lostCard.percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${breakdownByService.lostCard.percentage}%`, borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* BIỂU ĐỒ XU HƯỚNG DOANH THU & LƯU LƯỢNG */}
      <Row className="g-3">
        
        {/* Xu hướng doanh thu */}
        <Col xs={12} lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 d-flex flex-column">
              <h6 className="fw-bold text-dark mb-1">📈 Biểu đồ Xu hướng Doanh thu</h6>
              <p className="text-muted small mb-4">
                {rangeType === 'today' ? 'Biểu diễn doanh thu phát sinh theo từng khung giờ trong ngày' : 'Biểu diễn doanh thu phát sinh theo từng ngày đỗ xe thực tế'}
              </p>

              {loading ? (
                <div className="flex-grow-1 bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px' }}>
                  ⏳ Đang tải dữ liệu doanh thu...
                </div>
              ) : trendData.length === 0 ? (
                <div className="flex-grow-1 bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px' }}>
                  Chưa có dữ liệu thanh toán nào.
                </div>
              ) : (
                <div className="bg-light rounded p-3 d-flex align-items-end gap-2 flex-grow-1" style={{ minHeight: '220px', overflowX: 'auto' }}>
                  {trendData.map((d, index) => {
                    const heightPct = Math.max((d.total / maxTrendRevenue) * 150, 4);
                    const showLabel = rangeType !== 'month' || index % 3 === 0 || index === trendData.length - 1;
                    return (
                      <div key={index} className="flex-grow-1 d-flex flex-column align-items-center gap-2" style={{ minWidth: rangeType === 'month' ? '12px' : '24px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: mt.primary, visibility: d.total > 0 ? 'visible' : 'hidden' }}>
                          {Math.round(d.total / 1000)}k
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: `${heightPct}px`,
                            background: 'linear-gradient(to top, #1e293b, #164e63)',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.5s'
                          }}
                          title={`${d.time}: ${fmt(d.total)}`}
                        />
                        <span className="text-muted fw-semibold" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                          {showLabel ? d.time : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Lưu lượng ra vào */}
        <Col xs={12} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 d-flex flex-column">
              <h6 className="fw-bold text-dark mb-1">🔄 Lưu lượng xe Ra / Vào</h6>
              <p className="text-muted small mb-4">Tổng hợp số lượng lượt xe ra vào trong kỳ</p>

              {loading ? (
                <div className="flex-grow-1 bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px' }}>
                  ⏳ Đang tải lưu lượng...
                </div>
              ) : activeTrafficData.length === 0 ? (
                <div className="flex-grow-1 bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px' }}>
                  Không có dữ liệu xe.
                </div>
              ) : (
                <div className="bg-light rounded p-3 d-flex align-items-end gap-1 flex-grow-1" style={{ minHeight: '200px', overflowX: 'auto' }}>
                  {activeTrafficData.map((d, index) => {
                    const heightPct = Math.max((d.total / maxTrafficVal) * 120, 4);
                    const showLabel = rangeType !== 'month' || index % 4 === 0 || index === activeTrafficData.length - 1;
                    return (
                      <div key={index} className="flex-grow-1 d-flex flex-column align-items-center gap-2" style={{ minWidth: rangeType === 'month' ? '8px' : '18px' }}>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '120px' }}>
                          <div className="d-flex gap-1 h-100 align-items-end">
                            <div
                              style={{
                                flex: 1,
                                height: d.total > 0 ? `${(d.checkins / maxTrafficVal) * 120}px` : '2px',
                                background: '#10b981',
                                borderRadius: '1px'
                              }}
                              title={`Vào: ${d.checkins}`}
                            />
                            <div
                              style={{
                                flex: 1,
                                height: d.total > 0 ? `${(d.checkouts / maxTrafficVal) * 120}px` : '2px',
                                background: '#ef4444',
                                borderRadius: '1px'
                              }}
                              title={`Ra: ${d.checkouts}`}
                            />
                          </div>
                        </div>
                        <span className="text-muted fw-semibold" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                          {showLabel ? d.label : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="d-flex gap-3 justify-content-center mt-3" style={{ fontSize: '0.75rem' }}>
                <div className="d-flex align-items-center gap-1">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                  <span className="text-muted">Lượt vào</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
                  <span className="text-muted">Lượt ra</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      {/* CHI TIẾT DOANH THU CHI NHÁNH */}
      <Card className="border-0 shadow-sm">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="fw-bold text-dark m-0">
            {rangeType === 'today' ? 'Chi tiết giao dịch phát sinh hôm nay' : 'Chi tiết doanh thu hàng ngày'}
          </h6>

          {rangeType === 'today' && (
            <div className="d-flex bg-light rounded p-1 border">
              <button 
                type="button"
                onClick={() => setTodayViewMode('transactions')}
                className={`btn btn-sm py-1 px-3 border-0 fw-semibold rounded ${todayViewMode === 'transactions' ? 'bg-white text-primary shadow-sm' : 'text-muted bg-transparent'}`}
                style={{ fontSize: '0.75rem' }}
              >
                Giao dịch đơn lẻ
              </button>
              <button 
                type="button"
                onClick={() => setTodayViewMode('hourly')}
                className={`btn btn-sm py-1 px-3 border-0 fw-semibold rounded ${todayViewMode === 'hourly' ? 'bg-white text-primary shadow-sm' : 'text-muted bg-transparent'}`}
                style={{ fontSize: '0.75rem' }}
              >
                Tổng hợp theo Giờ
              </button>
            </div>
          )}
        </div>

        {rangeType === 'today' && todayViewMode === 'transactions' ? (
          /* Bảng giao dịch chi tiết dành cho hôm nay */
          <Table hover responsive className="mb-0 align-middle text-nowrap" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '0.75rem' }}>
                <th className="fw-semibold text-muted py-3 px-3">MÃ THẺ / VÉ</th>
                <th className="fw-semibold text-muted py-3">BIỂN SỐ xe</th>
                <th className="fw-semibold text-muted py-3">LOẠI XE</th>
                <th className="fw-semibold text-muted py-3">HÌNH THỨC</th>
                <th className="fw-semibold text-muted py-3">PHƯƠNG THỨC</th>
                <th className="fw-semibold text-muted py-3">THỜI GIAN</th>
                <th className="fw-semibold text-muted py-3">PHÍ GỬI XE</th>
                <th className="fw-semibold text-muted py-3 text-danger">PHẠT MẤT THẺ</th>
                <th className="fw-semibold text-muted py-3 text-end px-3">TỔNG CỘNG</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    ⏳ Đang tải danh sách giao dịch từ server...
                  </td>
                </tr>
              ) : transactionList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    Không có giao dịch tài chính nào phát sinh hôm nay.
                  </td>
                </tr>
              ) : (
                transactionList.map((t, idx) => (
                  <tr key={t.id || idx}>
                    <td className="px-3 fw-semibold text-secondary">{t.cardCode}</td>
                    <td className="fw-bold text-dark">{t.licensePlate}</td>
                    <td>{t.vehicleType}</td>
                    <td>
                      <Badge bg={t.type.includes('Vé') ? 'warning-subtle' : 'info-subtle'} className={t.type.includes('Vé') ? 'text-warning border border-warning-subtle' : 'text-info border border-info-subtle'}>
                        {t.type}
                      </Badge>
                    </td>
                    <td className="text-muted">{t.paymentMethod}</td>
                    <td className="text-muted">
                      {new Date(t.time).toLocaleTimeString('vi-VN')} {new Date(t.time).toLocaleDateString('vi-VN')}
                    </td>
                    <td>{fmt(t.amount)}</td>
                    <td className={t.penalty > 0 ? 'text-danger fw-bold' : 'text-muted'}>{t.penalty > 0 ? fmt(t.penalty) : '—'}</td>
                    <td className="text-end px-3 fw-bold text-primary">{fmt(t.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        ) : (
          /* Bảng tổng hợp (theo giờ cho ngày hôm nay, hoặc theo ngày cho các lựa chọn khác) */
          <Table hover responsive className="mb-0 align-middle text-nowrap" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '0.75rem' }}>
                <th className="fw-semibold text-muted py-3 px-3">{rangeType === 'today' ? 'KHUNG GIỜ' : 'NGÀY'}</th>
                <th className="fw-semibold text-muted py-3">Ô TÔ</th>
                <th className="fw-semibold text-muted py-3">XE MÁY</th>
                <th className="fw-semibold text-muted py-3">XE ĐIỆN & KHÁC</th>
                <th className="fw-semibold text-muted py-3">ĐĂNG KÝ VÉ THÁNG/VIP</th>
                <th className="fw-semibold text-muted py-3 text-danger">PHẠT MẤT THẺ</th>
                <th className="fw-semibold text-muted py-3 text-end px-3">TỔNG DOANH THU</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    ⏳ Đang tải dữ liệu thống kê từ server...
                  </td>
                </tr>
              ) : (rangeType === 'today' ? hourlyGroups : sortedDays).length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Không tìm thấy dữ liệu thống kê doanh thu.
                  </td>
                </tr>
              ) : (
                [...(rangeType === 'today' ? hourlyGroups : sortedDays)].reverse().map((r, idx) => (
                  <tr key={r.time || idx}>
                    <td className="px-3 fw-bold text-dark">{r.time}</td>
                    <td>{Number(r.oto).toLocaleString('vi-VN')} đ</td>
                    <td>{Number(r.xemay).toLocaleString('vi-VN')} đ</td>
                    <td>{Number(r.xedien).toLocaleString('vi-VN')} đ</td>
                    <td className="text-warning fw-semibold">{Number(r.thethang || 0).toLocaleString('vi-VN')} đ</td>
                    <td className="text-danger fw-semibold">{Number(r.lostCard || 0).toLocaleString('vi-VN')} đ</td>
                    <td className="text-end px-3 fw-bold text-primary">{Number(r.total).toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>

    </div>
  );
}
