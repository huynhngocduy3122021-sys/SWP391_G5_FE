import { useState, useEffect } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';
import { toast } from 'react-toastify';

export default function MemberPanel() {
  const [cards, setCards] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMonthlyAndVip, setOnlyMonthlyAndVip] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({ cardCode: '', parkingBranchId: '', cardType: 'NORMAL' });
  const [editForm, setEditForm] = useState({ cardCode: '', parkingBranchId: '', status: '', cardType: 'NORMAL' });
  const [submitting, setSubmitting] = useState(false);

  const TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'AVAILABLE', label: 'Thẻ trống' },
    { key: 'IN_USE', label: 'Đang hoạt động' },
    { key: 'LOST', label: 'Báo mất' },
    { key: 'DISABLED', label: 'Đã khóa' },
  ];

  const fetchCardsAndBranches = async () => {
    setLoading(true);
    try {
      const [cardsData, branchesData] = await Promise.all([
        managerApi.getParkingCards(),
        managerApi.getParkingBranches(),
      ]);
      setCards(Array.isArray(cardsData) ? cardsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (err) {
      console.error(err);
      toast.error('Không tải được dữ liệu thẻ hoặc chi nhánh!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardsAndBranches();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.cardCode.trim()) return toast.warn('Vui lòng nhập mã thẻ!');
    if (!createForm.parkingBranchId) return toast.warn('Vui lòng chọn chi nhánh!');

    let finalCode = createForm.cardCode.trim();
    if (createForm.cardType === 'MONTHLY' && !finalCode.startsWith('MONTH-')) {
      finalCode = 'MONTH-' + finalCode;
    } else if (createForm.cardType === 'VIP' && !finalCode.startsWith('VIP-')) {
      finalCode = 'VIP-' + finalCode;
    }

    setSubmitting(true);
    try {
      await managerApi.createParkingCard({
        cardCode: finalCode,
        parkingBranchId: Number(createForm.parkingBranchId)
      });
      toast.success('Đã thêm thẻ đỗ xe mới thành công!');
      setShowCreateModal(false);
      setCreateForm({ cardCode: '', parkingBranchId: '', cardType: 'NORMAL' });
      fetchCardsAndBranches();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể tạo thẻ!';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.cardCode.trim()) return toast.warn('Vui lòng nhập mã thẻ!');
    if (!editForm.parkingBranchId) return toast.warn('Vui lòng chọn chi nhánh!');

    let finalCode = editForm.cardCode.trim();
    if (finalCode.startsWith('MONTH-')) finalCode = finalCode.replace('MONTH-', '');
    if (finalCode.startsWith('VIP-')) finalCode = finalCode.replace('VIP-', '');

    if (editForm.cardType === 'MONTHLY') {
      finalCode = 'MONTH-' + finalCode;
    } else if (editForm.cardType === 'VIP') {
      finalCode = 'VIP-' + finalCode;
    }

    setSubmitting(true);
    try {
      await managerApi.updateParkingCard(selectedCard.parkingCardId, {
        cardCode: finalCode,
        parkingBranchId: Number(editForm.parkingBranchId),
        status: editForm.status
      });
      toast.success('Cập nhật thông tin thẻ thành công!');
      setShowEditModal(false);
      setSelectedCard(null);
      fetchCardsAndBranches();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể cập nhật thẻ!';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thẻ ${code}?`)) return;
    try {
      await managerApi.deleteParkingCard(id);
      toast.success('Đã xóa thẻ đỗ xe thành công!');
      fetchCardsAndBranches();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể xóa thẻ!';
      toast.error(String(msg));
    }
  };

  const openEditModal = (cardItem) => {
    setSelectedCard(cardItem);
    const code = cardItem.cardCode || '';
    const isMonthly = code.startsWith('MONTH-');
    const isVip = code.startsWith('VIP-');
    let cleanCode = code;
    if (isMonthly) cleanCode = cleanCode.replace('MONTH-', '');
    if (isVip) cleanCode = cleanCode.replace('VIP-', '');

    setEditForm({
      cardCode: cleanCode,
      parkingBranchId: cardItem.parkingBranchId || '',
      status: cardItem.status,
      cardType: isMonthly ? 'MONTHLY' : isVip ? 'VIP' : 'NORMAL'
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    switch(s) {
      case 'AVAILABLE': return { color: mt.success, marker: '●', label: 'Còn trống (Sẵn sàng)' };
      case 'IN_USE': return { color: '#3b82f6', marker: '●', label: 'Đang hoạt động' };
      case 'LOST': return { color: mt.danger, marker: '●', label: 'Đã báo mất' };
      case 'DISABLED': return { color: mt.textMuted, marker: '●', label: 'Đã khóa' };
      default: return { color: mt.textMuted, marker: '●', label: s };
    }
  };

  // Filter based on search query, active tab and Monthly/VIP type
  const filteredCards = cards.filter(c => {
    const codeMatches = (c.cardCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    const branchMatches = (c.parkingBranchName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatches = codeMatches || branchMatches;
    
    const matchesTab = activeTab === 'all' ? true : String(c.status || '').toUpperCase() === activeTab;
    
    let matchesType = true;
    if (onlyMonthlyAndVip) {
      const code = c.cardCode || '';
      matchesType = code.startsWith('MONTH-') || code.startsWith('VIP-');
    }
    
    return queryMatches && matchesTab && matchesType;
  });

  // Calculate statistics
  const totalCount = cards.length;
  const inUseCount = cards.filter(c => String(c.status || '').toUpperCase() === 'IN_USE').length;
  const availableCount = cards.filter(c => String(c.status || '').toUpperCase() === 'AVAILABLE').length;
  const lockedOrLostCount = cards.filter(c => ['LOST', 'DISABLED'].includes(String(c.status || '').toUpperCase())).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: mt.text, fontWeight: 700 }}>Quản lý Thẻ đỗ xe</h2>
          <p style={{ margin: '4px 0 0', color: mt.textMuted, fontSize: '0.875rem' }}>Quản trị hệ thống thẻ RFID sử dụng đỗ xe tại các chi nhánh.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: '#fff', border: `1px solid ${mt.border}`, padding: '8px 12px', borderRadius: 8, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, width: 250 }}>
            <span style={{ color: mt.textMuted }}>🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm mã thẻ, chi nhánh..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: mt.text }} 
            />
          </div>
          <button
            onClick={() => setOnlyMonthlyAndVip(!onlyMonthlyAndVip)}
            style={{
              background: onlyMonthlyAndVip ? '#f59e0b' : '#fff',
              color: onlyMonthlyAndVip ? '#fff' : mt.text,
              border: `1px solid ${onlyMonthlyAndVip ? '#f59e0b' : mt.border}`,
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            🌟 {onlyMonthlyAndVip ? 'Xem tất cả' : 'Chỉ xem Thẻ Tháng & VIP'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ background: mt.primary, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➕ Thêm Thẻ Mới
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>TỔNG SỐ THẺ</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: mt.text, marginBottom: 4 }}>{totalCount}</div>
            <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Mã thẻ hoạt động trên hệ thống</div>
          </div>
          <div style={{ background: '#f1f5f9', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            💳
          </div>
        </div>

        <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>ĐANG SỬ DỤNG</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', marginBottom: 4 }}>{inUseCount}</div>
            <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Thẻ đang gán trong các lượt gửi</div>
          </div>
          <div style={{ background: '#dbeafe', color: '#1d4ed8', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            🚗
          </div>
        </div>

        <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>THẺ CÒN TRỐNG</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: mt.success, marginBottom: 4 }}>{availableCount}</div>
            <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Thẻ sẵn sàng để cấp cho xe vào</div>
          </div>
          <div style={{ background: '#dcfce7', color: '#16a34a', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            ✔️
          </div>
        </div>

        <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mt.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>BÁO MẤT / BỊ KHÓA</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: mt.danger, marginBottom: 4 }}>{lockedOrLostCount}</div>
            <div style={{ color: mt.textMuted, fontSize: '0.8rem' }}>Thẻ bị khóa hoặc làm mất</div>
          </div>
          <div style={{ background: '#fee2e2', color: '#b91c1c', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            🔒
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${mt.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {TABS.map(t => (
              <button 
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{ 
                  background: activeTab === t.key ? '#f1f5f9' : 'none', border: 'none', padding: '6px 16px', 
                  fontSize: '0.875rem', fontWeight: activeTab === t.key ? 600 : 500, borderRadius: 6,
                  color: activeTab === t.key ? mt.primary : mt.textMuted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead style={{ background: '#fff' }}>
            <tr>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem', borderBottom: `1px solid ${mt.border}` }}>MÃ THẺ (RFID)</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem', borderBottom: `1px solid ${mt.border}` }}>CHI NHÁNH QUẢN LÝ</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem', borderBottom: `1px solid ${mt.border}` }}>LOẠI THẺ</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'left', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem', borderBottom: `1px solid ${mt.border}` }}>TRẠNG THÁI</th>
              <th style={{ padding: '12px 1.25rem', textAlign: 'center', fontWeight: 600, color: mt.textMuted, fontSize: '0.75rem', borderBottom: `1px solid ${mt.border}` }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>
                  ⏳ Đang tải dữ liệu thẻ đỗ xe từ server...
                </td>
              </tr>
            ) : filteredCards.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: mt.textMuted }}>
                  📭 Không tìm thấy thẻ nào khớp điều kiện.
                </td>
              </tr>
            ) : filteredCards.map((c) => {
              const statusStyle = getStatusColor(c.status);
              const isMonthly = (c.cardCode || '').startsWith('MONTH-');
              const isVip = (c.cardCode || '').startsWith('VIP-');
              const displayCode = isMonthly ? c.cardCode.replace('MONTH-', '') : isVip ? c.cardCode.replace('VIP-', '') : c.cardCode;
              return (
                <tr key={c.parkingCardId} style={{ borderBottom: `1px solid ${mt.border}` }}>
                  <td style={{ padding: '12px 1.25rem', fontWeight: 700, color: mt.text }}>{displayCode}</td>
                  <td style={{ padding: '12px 1.25rem', color: mt.text }}>{c.parkingBranchName || '—'}</td>
                  <td style={{ padding: '12px 1.25rem' }}>
                    <span style={{
                      backgroundColor: isMonthly ? '#f3e8ff' : isVip ? '#fef3c7' : '#e0f2fe',
                      color: isMonthly ? '#6b21a8' : isVip ? '#b45309' : '#0369a1',
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {isMonthly ? 'Thẻ tháng' : isVip ? 'Thẻ VIP' : 'Thẻ thường'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 1.25rem', color: statusStyle.color, fontWeight: 600 }}>
                    <span style={{ marginRight: 6 }}>{statusStyle.marker}</span> {statusStyle.label}
                  </td>
                  <td style={{ padding: '12px 1.25rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => openEditModal(c)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: mt.primary, marginRight: 12, fontSize: '1rem' }}
                      title="Chỉnh sửa thẻ"
                    >
                      ✎ Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(c.parkingCardId, c.cardCode)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: mt.danger, fontSize: '1rem' }}
                      title="Xóa thẻ"
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '1.5rem 2rem', borderRadius: 12, width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: mt.text, fontWeight: 700 }}>Thêm thẻ đỗ xe mới</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>MÃ THẺ (RFID CODE)</label>
                <input 
                  type="text" 
                  placeholder="Nhập mã thẻ (ví dụ: CARD-9921)"
                  value={createForm.cardCode}
                  onChange={e => setCreateForm({ ...createForm, cardCode: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.9rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>LOẠI THẺ</label>
                <select
                  value={createForm.cardType}
                  onChange={e => setCreateForm({ ...createForm, cardType: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.9rem', outline: 'none' }}
                  required
                >
                  <option value="NORMAL">Thẻ thường (Vào/Ra trong ngày)</option>
                  <option value="MONTHLY">Thẻ tháng (Thẻ hội viên đăng ký)</option>
                  <option value="VIP">Thẻ VIP (Thẻ đặc quyền VIP)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>CHI NHÁNH</label>
                <select
                  value={createForm.parkingBranchId}
                  onChange={e => setCreateForm({ ...createForm, parkingBranchId: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.9rem', outline: 'none' }}
                  required
                >
                  <option value="">Chọn chi nhánh quản lý thẻ...</option>
                  {branches.map(b => (
                    <option key={b.parkingBranchId} value={b.parkingBranchId}>{b.branchName || b.parkingBranchName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'transparent', border: `1px solid ${mt.border}`, color: mt.text, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  style={{ background: mt.primary, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                  disabled={submitting}
                >
                  {submitting ? 'Đang tạo...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '1.5rem 2rem', borderRadius: 12, width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: mt.text, fontWeight: 700 }}>Chỉnh sửa thẻ</h3>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>MÃ THẺ (RFID CODE)</label>
                <input 
                  type="text" 
                  placeholder="Nhập mã thẻ..."
                  value={editForm.cardCode}
                  onChange={e => setEditForm({ ...editForm, cardCode: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.9rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>LOẠI THẺ</label>
                <select
                  value={editForm.cardType}
                  onChange={e => setEditForm({ ...editForm, cardType: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.9rem', outline: 'none' }}
                  required
                >
                  <option value="NORMAL">Thẻ thường (Vào/Ra trong ngày)</option>
                  <option value="MONTHLY">Thẻ tháng (Thẻ hội viên đăng ký)</option>
                  <option value="VIP">Thẻ VIP (Thẻ đặc quyền VIP)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>CHI NHÁNH</label>
                <select
                  value={editForm.parkingBranchId}
                  onChange={e => setEditForm({ ...editForm, parkingBranchId: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.9rem', outline: 'none' }}
                  required
                >
                  <option value="">Chọn chi nhánh quản lý thẻ...</option>
                  {branches.map(b => (
                    <option key={b.parkingBranchId} value={b.parkingBranchId}>{b.branchName || b.parkingBranchName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: mt.textMuted }}>TRẠNG THÁI THẺ</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${mt.border}`, fontSize: '0.9rem', outline: 'none' }}
                  required
                >
                  <option value="AVAILABLE">Còn trống (AVAILABLE)</option>
                  <option value="IN_USE">Đang sử dụng (IN_USE)</option>
                  <option value="LOST">Báo mất (LOST)</option>
                  <option value="DISABLED">Đã khóa (DISABLED)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setSelectedCard(null); }}
                  style={{ background: 'transparent', border: `1px solid ${mt.border}`, color: mt.text, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  style={{ background: mt.primary, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
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
