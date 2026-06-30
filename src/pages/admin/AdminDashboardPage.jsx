import React, { useState, useEffect } from 'react';
import managerApi from '../../api/manager';
import adminApi from '../../api/admin';
import { toast } from 'react-toastify';
import { RefreshCw, Activity, CreditCard, DollarSign, Users, Search, BarChart2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Tháng này');

  // Data states
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [zones, setZones] = useState([]);

  // Branch CRUD modal & form states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ branchName: '', address: '', phoneNumber: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, sessionsRes, bookingsRes, branchesRes, zonesRes] = await Promise.all([
        adminApi.getAllUsers().catch(() => []),
        adminApi.getAllSessions().catch(() => []),
        adminApi.getAllBookings().catch(() => []),
        managerApi.getParkingBranches().catch(() => []),
        managerApi.getAllZones().catch(() => []),
      ]);

      setUsers(Array.isArray(usersRes) ? usersRes : (usersRes?.content || []));
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.content || []));
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.content || []));
      setBranches(Array.isArray(branchesRes) ? branchesRes : (branchesRes?.content || []));
      setZones(Array.isArray(zonesRes) ? zonesRes : (zonesRes?.content || []));
    } catch (err) {
      console.error(err);
      toast.error('Không tải được dữ liệu Dashboard!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Lấy ngày mốc tham chiếu mới nhất từ dữ liệu thực tế (đề phòng dữ liệu seed năm cũ như 2024/2025)
  const getReferenceDate = () => {
    if (sessions.length === 0) return new Date();
    const dates = sessions
      .map(s => s.checkOutTime ? new Date(s.checkOutTime) : null)
      .filter(Boolean);
    if (dates.length === 0) return new Date();
    return new Date(Math.max(...dates));
  };

  const refDate = getReferenceDate();

  // Định dạng ngày dạng DD/MM không phụ thuộc Locale hệ thống
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

  // Lọc các lượt gửi dựa trên phạm vi thời gian được chọn
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
    return true; // 'Tất cả'
  });

  // Tính toán KPI Doanh thu
  const totalRevenue = filteredSessions.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const totalTransactions = filteredSessions.length;
  
  const cashlessCount = filteredSessions.filter(s => String(s.paymentMethod || '').toUpperCase() === 'VNPAY').length;
  const cashlessRate = totalTransactions > 0 ? Math.round((cashlessCount / totalTransactions) * 100) : 0;

  // Tính toán các KPI Hệ thống khác
  const totalUsersCount = users.length;
  const currentlyParkedCount = sessions.filter(s => s.sessionStatus === 'ACTIVE').length;

  // Doanh thu gom nhóm theo chi nhánh
  const branchRevenueMap = filteredSessions.reduce((acc, s) => {
    const name = s.parkingBranchName || 'Khác';
    acc[name] = (acc[name] || 0) + Number(s.totalAmount || 0);
    return acc;
  }, {});

  const branchRevenues = Object.keys(branchRevenueMap).map(name => ({
    name,
    amount: branchRevenueMap[name]
  })).sort((a, b) => b.amount - a.amount);

  // Nhóm doanh thu để vẽ biểu đồ
  const getChartData = () => {
    const dates = {};
    const now = refDate;

    if (timeFilter === 'Hôm nay') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(now.getHours() - i);
        const hourStr = String(d.getHours()).padStart(2, '0') + 'h';
        dates[hourStr] = 0;
      }
      
      filteredSessions.forEach(s => {
        const hourStr = getHourKey(s.checkOutTime);
        if (dates[hourStr] !== undefined) {
          dates[hourStr] += Number(s.totalAmount || 0);
        }
      });
    } else if (timeFilter === 'Tháng này') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= numDays; i++) {
        const day = String(i).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        dates[`${day}/${monthStr}`] = 0;
      }

      filteredSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key] += Number(s.totalAmount || 0);
        }
      });
    } else if (timeFilter === '7 ngày qua') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates[getFormatKey(d)] = 0;
      }

      filteredSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key] += Number(s.totalAmount || 0);
        }
      });
    } else {
      for (let i = 14; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates[getFormatKey(d)] = 0;
      }

      filteredSessions.forEach(s => {
        const key = getFormatKey(s.checkOutTime);
        if (dates[key] !== undefined) {
          dates[key] += Number(s.totalAmount || 0);
        }
      });
    }

    return Object.keys(dates).map(key => ({
      label: key,
      revenue: dates[key]
    }));
  };

  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 10000);

  // Branch CRUD Handlers
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
      const msg = err.response?.data?.message || err.response?.data || 'Thao tác chi nhánh thất bại!';
      toast.error(String(msg));
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
      const msg = err.response?.data?.message || err.response?.data || 'Không thể đổi trạng thái chi nhánh!';
      toast.error(String(msg));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
            Hệ thống Quản lý Bãi xe VinParking (Dashboard Overview)
          </h1>
          <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: '13px' }}>Báo cáo doanh thu, tình trạng vận hành và quản trị chi nhánh bãi xe.</p>
        </div>
        
        {/* Time filters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
            {['Hôm nay', '7 ngày qua', 'Tháng này', 'Tất cả'].map(tab => (
              <button 
                key={tab}
                onClick={() => setTimeFilter(tab)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: timeFilter === tab ? '#fff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: timeFilter === tab ? '#1b6eff' : '#475569',
                  fontWeight: timeFilter === tab ? '600' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: timeFilter === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchDashboardData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#1b6eff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px', fontWeight: '700' }}>
            TỔNG DOANH THU <DollarSign size={14} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
            {Number(totalRevenue || 0).toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Phạm vi: {timeFilter}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px', fontWeight: '700' }}>
            LƯỢT XE ĐÃ THANH TOÁN <Activity size={14} color="#10b981" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
            {totalTransactions} giao dịch
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Hóa đơn checkout thành công</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px', fontWeight: '700' }}>
            TỶ LỆ ONLINE (VNPAY) <CreditCard size={14} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
            {cashlessRate}%
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Còn lại: Tiền mặt/Thẻ RFID</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px', fontWeight: '700' }}>
            XE ĐANG GỬI HIỆN TẠI <Users size={14} color="#ef4444" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
            {currentlyParkedCount} xe
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Tổng số User tài khoản: {totalUsersCount}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        
        {/* Daily Revenue Chart */}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Biểu đồ Doanh thu theo Ngày</h3>
          
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ 
              display: 'flex', alignItems: 'flex-end', height: '130px', 
              gap: timeFilter === 'Tháng này' ? '6px' : '16px', 
              padding: '6px 0', borderBottom: '1px solid #cbd5e1',
              minWidth: timeFilter === 'Tháng này' ? '600px' : 'auto'
            }}>
              {chartData.map((d, index) => {
                const heightPct = Math.max(5, Math.round((d.revenue / maxRevenue) * 100));
                const labelAmount = d.revenue > 0 ? (d.revenue >= 1000000 ? `${(d.revenue / 1000000).toFixed(1)}M` : `${Math.round(d.revenue / 1000)}k`) : '';
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '8px', fontWeight: '700', color: '#1b6eff', whiteSpace: 'nowrap' }}>{labelAmount}</span>
                    <div style={{
                      width: '100%', height: `${heightPct}%`, backgroundColor: '#1b6eff', borderRadius: '2px 2px 0 0',
                      transition: 'height 0.3s'
                    }} />
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Doughnut Chart */}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a', alignSelf: 'flex-start' }}>Cổng Thanh toán</h3>
          
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: `conic-gradient(#1b6eff ${cashlessRate}%, #cbd5e1 ${cashlessRate}% 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '94px', height: '94px', borderRadius: '50%',
              backgroundColor: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{cashlessRate}%</div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b' }}>VNPAY ONLINE</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', width: '100%', justifyContent: 'space-around' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#1b6eff' }}></div> Online: {cashlessRate}%
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#cbd5e1' }}></div> Tiền mặt: {100 - cashlessRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Branch & Transaction Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        
        {/* Branch revenues */}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '200px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Doanh thu theo Chi nhánh</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {branchRevenues.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#64748b' }}>Chưa có doanh thu nào được ghi nhận.</span>
            ) : branchRevenues.map((br, index) => {
              const maxAmount = branchRevenues[0]?.amount || 1;
              const pct = Math.round((br.amount / maxAmount) * 100);
              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
                    <span style={{ color: '#334155' }}>{br.name}</span>
                    <span style={{ color: '#0f172a' }}>{Number(br.amount || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#1b6eff', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '200px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Các Giao dịch Checkout Gần nhất</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600' }}>
                <th style={{ padding: '6px 0' }}>BIỂN SỐ</th>
                <th style={{ padding: '6px 0' }}>CHI NHÁNH</th>
                <th style={{ padding: '6px 0' }}>SỐ TIỀN</th>
                <th style={{ padding: '6px 0', textAlign: 'right' }}>THANH TOÁN</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '1rem 0', textAlign: 'center', color: '#64748b' }}>Không có giao dịch nào phù hợp.</td>
                </tr>
              ) : filteredSessions.slice(0, 5).map((s, i) => (
                <tr key={s.parkingSessionId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', color: '#1b6eff', fontWeight: '700' }}>{s.licensePlate}</td>
                  <td style={{ padding: '8px 0', color: '#475569' }}>{s.parkingBranchName}</td>
                  <td style={{ padding: '8px 0', color: '#0f172a', fontWeight: '700' }}>{Number(s.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    <span style={{
                      backgroundColor: String(s.paymentMethod || '').toUpperCase() === 'VNPAY' ? '#dcfce7' : '#fee2e2',
                      color: String(s.paymentMethod || '').toUpperCase() === 'VNPAY' ? '#166534' : '#991b1b',
                      padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: '700'
                    }}>
                      {s.paymentMethod || 'CASH'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Management Section */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Quản lý Chi nhánh Bãi xe</h4>
            <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0 0' }}>Xem danh sách và cấu hình vận hành của các chi nhánh đỗ xe.</p>
          </div>
          <button
            onClick={() => { setEditingBranch(null); setBranchForm({ branchName: '', address: '', phoneNumber: '', description: '' }); setShowBranchModal(true); }}
            style={{ padding: '6px 12px', backgroundColor: '#1b6eff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
          >
            ➕ Thêm Chi Nhánh
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eef0f3', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>
              <th style={{ padding: '8px' }}>CHI NHÁNH</th>
              <th style={{ padding: '8px' }}>ĐỊA CHỈ</th>
              <th style={{ padding: '8px' }}>ĐIỆN THOẠI</th>
              <th style={{ padding: '8px' }}>TRẠNG THÁI</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Chưa có chi nhánh nào được tạo.</td>
              </tr>
            ) : branches.map(b => (
              <tr key={b.parkingBranchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px', fontWeight: '700', color: '#1e293b' }}>{b.branchName}</td>
                <td style={{ padding: '8px', color: '#475569' }}>{b.address || '—'}</td>
                <td style={{ padding: '8px', color: '#475569' }}>{b.phoneNumber || '—'}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{
                    backgroundColor: b.active ? '#dcfce7' : '#fee2e2',
                    color: b.active ? '#166534' : '#991b1b',
                    padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600'
                  }}>
                    {b.active ? 'Hoạt động' : 'Tắt'}
                  </span>
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => openEditBranchModal(b)}
                    style={{ background: 'none', border: 'none', color: '#1b6eff', cursor: 'pointer', fontWeight: '600', marginRight: '10px' }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleToggleBranchStatus(b.parkingBranchId, b.active)}
                    style={{ background: 'none', border: 'none', color: b.active ? '#ef4444' : '#10b981', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {b.active ? 'Tắt' : 'Bật'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BRANCH CREATE/EDIT MODAL */}
      {showBranchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              {editingBranch ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh bãi xe mới'}
            </h3>
            <form onSubmit={handleSaveBranch} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>TÊN CHI NHÁNH *</label>
                <input
                  type="text"
                  placeholder="Nhập tên chi nhánh (ví dụ: Landmark 81)"
                  value={branchForm.branchName}
                  onChange={e => setBranchForm({ ...branchForm, branchName: e.target.value })}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>ĐỊA CHỈ</label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ..."
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>ĐIỆN THOẠI</label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại..."
                  value={branchForm.phoneNumber}
                  onChange={e => setBranchForm({ ...branchForm, phoneNumber: e.target.value })}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>MÔ TẢ CHI NHÁNH</label>
                <textarea
                  placeholder="Mô tả bãi..."
                  value={branchForm.description}
                  onChange={e => setBranchForm({ ...branchForm, description: e.target.value })}
                  rows="2"
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 12px', backgroundColor: '#1b6eff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}