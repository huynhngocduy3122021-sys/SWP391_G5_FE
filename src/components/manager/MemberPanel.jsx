import { useState, useEffect, useCallback } from 'react';
import { mt, card } from './managerTheme';
import managerApi from '../../api/manager';
import { toast } from 'react-toastify';

const getBranchId = (obj) => {
  if (!obj) return '';
  if (obj.parkingBranchId) return String(obj.parkingBranchId);
  if (obj.branchId) return String(obj.branchId);
  if (obj.parkingBranch?.parkingBranchId) return String(obj.parkingBranch.parkingBranchId);
  if (obj.parkingBranch?.id) return String(obj.parkingBranch.id);
  if (obj.branch?.id) return String(obj.branch.id);
  if (obj.parkingBranch && (typeof obj.parkingBranch === 'number' || typeof obj.parkingBranch === 'string')) return String(obj.parkingBranch);
  if (obj.branch && (typeof obj.branch === 'number' || typeof obj.branch === 'string')) return String(obj.branch);
  return '';
};
const getTicketId = (t) => {
  if (!t) return null;
  if (t.monthlyTicketId) return t.monthlyTicketId;
  if (t.id) return t.id;
  if (t.ticketId) return t.ticketId;
  if (t.monthly_ticket_id) return t.monthly_ticket_id;
  return null;
};
const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; } };
const todayISO = () => new Date().toISOString().slice(0, 10);
const thirtyDaysISO = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };
const inp = { padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: wide ? 680 : 440, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>x</button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>{label}</label>
      {children}
    </div>
  );
}
function ModalActions({ onCancel, loading, submitLabel, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '0.75rem' }}>
      <button type="button" onClick={onCancel} disabled={loading} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>Huy</button>
      <button type="submit" disabled={loading || disabled} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', opacity: (loading || disabled) ? 0.6 : 1 }}>{loading ? 'Dang xu ly...' : submitLabel}</button>
    </div>
  );
}

export default function MemberPanel({ branchId }) {
  const [mainTab, setMainTab] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null' && branchId !== '') ? String(branchId) : null;
  const [branches, setBranches] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [rfidTab, setRfidTab] = useState('all');
  const [rfidSearch, setRfidSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('ALL'); // 'ALL', 'NORMAL', 'MONTHLY', 'VIP'
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [createCardForm, setCreateCardForm] = useState({ cardCode: '', parkingBranchId: '', cardType: 'NORMAL' });
  const [editCardForm, setEditCardForm] = useState({ cardCode: '', parkingBranchId: '', status: '', cardType: 'NORMAL' });
  const [submittingCard, setSubmittingCard] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const EMPTY_FORM = { vehicleId: '', parkingCardId: '', guestName: '', guestPhone: '', startDate: todayISO(), endDate: thirtyDaysISO(), licensePlateSearch: '', vehicleSource: '' };
  const [ticketForm, setTicketForm] = useState(EMPTY_FORM);
  const RFID_TABS = [{ key: 'all', label: 'Tat ca' }, { key: 'AVAILABLE', label: 'Trong' }, { key: 'IN_USE', label: 'Dang dung' }, { key: 'LOST', label: 'Bao mat' }, { key: 'DISABLED', label: 'Khoa' }];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, branchesRes, vehiclesRes, ticketsRes] = await Promise.all([
        managerApi.getParkingCards(),
        managerApi.getParkingBranches(),
        managerApi.getAllVehicles().catch(() => []),
        managerApi.getAllMonthlyTickets().catch(() => []),
      ]);
      const parsedCards = Array.isArray(cardsRes) ? cardsRes : [];
      const parsedBranches = Array.isArray(branchesRes) ? branchesRes : [];
      const parsedVehicles = Array.isArray(vehiclesRes) ? vehiclesRes : (vehiclesRes?.content || []);
      const parsedTickets = Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.content || []);
      const filteredCards = cleanBranchId ? parsedCards.filter(c => getBranchId(c) === cleanBranchId) : parsedCards;
      const filteredBranches = cleanBranchId ? parsedBranches.filter(b => getBranchId(b) === cleanBranchId) : parsedBranches;
      const branchCardIds = new Set(filteredCards.map(c => String(c.parkingCardId)));
      const filteredTickets = cleanBranchId ? parsedTickets.filter(t => branchCardIds.has(String(t.parkingCardId))) : parsedTickets;
      setAllCards(filteredCards);
      setBranches(filteredBranches);
      setVehicles(parsedVehicles);
      setTickets(filteredTickets);
      if (cleanBranchId) setCreateCardForm(prev => ({ ...prev, parkingBranchId: cleanBranchId }));
    } catch (err) { console.error(err); toast.error('Khong tai duoc du lieu!'); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!createCardForm.cardCode.trim()) return toast.warn('Vui long nhap ma the!');
    if (!createCardForm.parkingBranchId) return toast.warn('Vui long chon chi nhanh!');
    let code = createCardForm.cardCode.trim();
    if (createCardForm.cardType === 'MONTHLY' && !code.startsWith('MONTH-')) code = 'MONTH-' + code;
    else if (createCardForm.cardType === 'VIP' && !code.startsWith('VIP-')) code = 'VIP-' + code;
    setSubmittingCard(true);
    try {
      await managerApi.createParkingCard({ 
        cardCode: code, 
        parkingBranchId: Number(createCardForm.parkingBranchId),
        type: createCardForm.cardType === 'MONTHLY' ? 'MONTHLY' : createCardForm.cardType === 'VIP' ? 'VIP' : 'REGULAR',
        status: 'AVAILABLE'
      });
      toast.success('Da them the RFID moi!');
      setShowCreateCard(false);
      setCreateCardForm({ cardCode: '', parkingBranchId: cleanBranchId || '', cardType: 'NORMAL' });
      fetchAll();
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Khong the tao the!')); }
    finally { setSubmittingCard(false); }
  };

  const handleEditCard = async (e) => {
    e.preventDefault();
    if (!editCardForm.cardCode.trim()) return toast.warn('Nhap ma the!');
    let code = editCardForm.cardCode.trim().replace(/^(MONTH-|VIP-)/, '');
    if (editCardForm.cardType === 'MONTHLY') code = 'MONTH-' + code;
    else if (editCardForm.cardType === 'VIP') code = 'VIP-' + code;
    setSubmittingCard(true);
    try {
      await managerApi.updateParkingCard(selectedCard.parkingCardId, { 
        cardCode: code, 
        parkingBranchId: Number(editCardForm.parkingBranchId), 
        status: editCardForm.status,
        type: editCardForm.cardType === 'MONTHLY' ? 'MONTHLY' : editCardForm.cardType === 'VIP' ? 'VIP' : 'REGULAR'
      });
      toast.success('Cap nhat the thanh cong!');
      setShowEditCard(false); setSelectedCard(null); fetchAll();
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Loi!')); }
    finally { setSubmittingCard(false); }
  };

  const handleDeleteCard = async (id, code) => {
    if (!window.confirm('Xoa the ' + code + '?')) return;
    try { await managerApi.deleteParkingCard(id); toast.success('Da xoa!'); fetchAll(); }
    catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Loi!')); }
  };

  const openEditCard = (c) => {
    setSelectedCard(c);
    const code = c.cardCode || '';
    const isM = code.startsWith('MONTH-'), isV = code.startsWith('VIP-');
    setEditCardForm({ cardCode: isM ? code.replace('MONTH-', '') : isV ? code.replace('VIP-', '') : code, parkingBranchId: c.parkingBranchId || '', status: c.status, cardType: isM ? 'MONTHLY' : isV ? 'VIP' : 'NORMAL' });
    setShowEditCard(true);
  };

  const matchedVehicle = ticketForm.vehicleId ? vehicles.find(v => String(v.vehicleId) === String(ticketForm.vehicleId)) : null;

  const handleSearchVehicle = () => {
    const q = ticketForm.licensePlateSearch.trim().toUpperCase().replace(/\s/g, '');
    if (!q) return toast.warn('Nhap bien so xe de tim!');
    const found = vehicles.find(v => (v.licensePlate || '').toUpperCase().replace(/\s/g, '') === q);
    if (!found) return toast.warn('Khong tim thay xe!');
    setTicketForm(prev => ({ ...prev, vehicleId: String(found.vehicleId), vehicleSource: found.vehicleSource || 'REGISTER', guestName: '', guestPhone: '' }));
    toast.success('Tim thay: ' + found.licensePlate);
  };  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.vehicleId) return toast.warn('Vui long tim va chon xe!');
    if (!ticketForm.parkingCardId) return toast.warn('Vui long chon the RFID!');
    if (!ticketForm.startDate || !ticketForm.endDate) return toast.warn('Chon ngay hieu luc!');
    
    const selectedCardObj = allCards.find(c => String(c.parkingCardId) === String(ticketForm.parkingCardId));
    const isVipCard = selectedCardObj && (selectedCardObj.cardCode || '').startsWith('VIP-');
    const isGuest = matchedVehicle?.vehicleSource === 'GUEST';
    
    if (isVipCard && isGuest) {
      return toast.error('Thẻ VIP bắt buộc chủ xe phải có tài khoản thành viên (không dành cho khách vãng lai)!');
    }

    if (isGuest) {
      if (!ticketForm.guestName.trim()) return toast.warn('Nhap ten khach!');
      if (!ticketForm.guestPhone.trim()) return toast.warn('Nhap so dien thoai!');
    }
    const payload = { vehicleId: Number(ticketForm.vehicleId), parkingCardId: Number(ticketForm.parkingCardId), startDate: new Date(ticketForm.startDate).toISOString(), endDate: new Date(ticketForm.endDate).toISOString(), status: 1, guestName: isGuest ? ticketForm.guestName.trim() : null, guestPhone: isGuest ? ticketForm.guestPhone.trim() : null };
    setSubmittingTicket(true);
    try {
      await managerApi.createMonthlyTicket(payload);
      
      // Chuyển trạng thái thẻ sang IN_USE
      if (selectedCardObj) {
        await managerApi.updateParkingCard(selectedCardObj.parkingCardId, {
          cardCode: selectedCardObj.cardCode,
          parkingBranchId: Number(selectedCardObj.parkingBranchId || cleanBranchId),
          status: 'IN_USE',
          type: isVipCard ? 'VIP' : (selectedCardObj.cardCode || '').startsWith('MONTH-') ? 'MONTHLY' : 'REGULAR'
        }).catch(err => console.error("Failed to update card status:", err));
      }

      toast.success('Cap ve thang thanh cong!');
      setShowCreateTicket(false); setTicketForm(EMPTY_FORM); fetchAll();
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Loi tao ve!')); }
    finally { setSubmittingTicket(false); }
  };
 
  const handleDeleteTicket = async (t) => {
    const tid = getTicketId(t);
    if (!tid) {
      console.error("Monthly ticket ID not found in object:", t);
      toast.error("Không tìm thấy ID vé tháng!");
      return;
    }
    if (!window.confirm('Xoa ve thang nay?')) return;
    try { 
      await managerApi.deleteMonthlyTicket(tid); 
      
      // Trả lại trạng thái thẻ sang AVAILABLE
      const assocCard = allCards.find(c => String(c.parkingCardId) === String(t.parkingCardId));
      if (assocCard) {
        await managerApi.updateParkingCard(assocCard.parkingCardId, {
          cardCode: assocCard.cardCode,
          parkingBranchId: Number(assocCard.parkingBranchId || cleanBranchId),
          status: 'AVAILABLE'
        }).catch(err => console.error("Failed to reset card status:", err));
      }

      toast.success('Da xoa ve!'); 
      fetchAll(); 
    } catch (err) { 
      toast.error(String(err.response?.data?.message || err.response?.data || 'Loi!')); 
    }
  };

  const handleToggleTicket = async (t) => {
    const tid = getTicketId(t);
    if (!tid) {
      console.error("Monthly ticket ID not found in object:", t);
      toast.error("Không tìm thấy ID vé tháng!");
      return;
    }
    const isActive = t.status === 1 || t.status === true;
    try {
      await managerApi.updateMonthlyTicket(tid, { vehicleId: t.vehicleId, parkingCardId: t.parkingCardId, guestName: t.guestName || null, guestPhone: t.guestPhone || null, startDate: t.startDate, endDate: t.endDate, status: isActive ? 0 : 1 });
      
      // Đồng bộ trạng thái thẻ rfid tương ứng
      const cardId = t.parkingCardId || t.parkingCard?.parkingCardId || t.parkingCard?.id;
      const assocCard = allCards.find(c => String(c.parkingCardId) === String(cardId));
      if (assocCard) {
        const nextStatus = isActive ? 'DISABLED' : 'IN_USE';
        await managerApi.updateParkingCard(assocCard.parkingCardId, {
          cardCode: assocCard.cardCode,
          parkingBranchId: Number(assocCard.parkingBranchId || cleanBranchId),
          status: nextStatus
        }).catch(err => console.error("Failed to sync card status during toggle:", err));
      }

      toast.success(isActive ? 'Da tam dung ve!' : 'Da kich hoat ve!'); fetchAll();
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Loi!')); }
  };

  const stColor = (s) => {
    switch (String(s || '').toUpperCase()) {
      case 'AVAILABLE': return { c: '#10b981', l: 'Con trong' };
      case 'IN_USE': return { c: '#3b82f6', l: 'Dang dung' };
      case 'LOST': return { c: '#ef4444', l: 'Bao mat' };
      case 'DISABLED': return { c: '#94a3b8', l: 'Da khoa' };
      default: return { c: '#94a3b8', l: String(s || '') };
    }
  };

  const filteredCards = allCards.filter(c => {
    const q = rfidSearch.toLowerCase();
    const matchQ = (c.cardCode || '').toLowerCase().includes(q) || (c.parkingBranchName || '').toLowerCase().includes(q);
    const matchT = rfidTab === 'all' || String(c.status || '').toUpperCase() === rfidTab;
    
    const code = c.cardCode || '';
    const isM = code.startsWith('MONTH-');
    const isV = code.startsWith('VIP-');
    const isN = !isM && !isV;
    
    let matchType = true;
    if (cardTypeFilter === 'NORMAL') matchType = isN;
    else if (cardTypeFilter === 'MONTHLY') matchType = isM;
    else if (cardTypeFilter === 'VIP') matchType = isV;
    
    return matchQ && matchT && matchType;
  });

  const filteredTickets = tickets.filter(t => {
    const q = ticketSearch.toLowerCase();
    const plate = (t.licensePlate || t.vehicle?.licensePlate || '').toLowerCase();
    const name = (t.guestName || t.userFullName || t.vehicle?.userFullName || '').toLowerCase();
    const cardC = (t.cardCode || t.parkingCard?.cardCode || '').toLowerCase();
    const matchQ = !q || plate.includes(q) || name.includes(q) || cardC.includes(q);
    const isActive = t.status === 1 || t.status === true;
    const matchS = ticketStatusFilter === 'all' || (ticketStatusFilter === '1' && isActive) || (ticketStatusFilter === '0' && !isActive);
    return matchQ && matchS;
  });

  const availableCards = allCards.filter(c => String(c.status || '').toUpperCase() === 'AVAILABLE');
  const availableTicketCards = availableCards.filter(c => {
    const code = c.cardCode || '';
    return code.startsWith('MONTH-') || code.startsWith('VIP-');
  });
  const stats = {
    total: allCards.length,
    inUse: allCards.filter(c => String(c.status || '').toUpperCase() === 'IN_USE').length,
    avail: allCards.filter(c => String(c.status || '').toUpperCase() === 'AVAILABLE').length,
    totalT: tickets.length,
    activeT: tickets.filter(t => t.status === 1 || t.status === true).length,
  };
  const thSt = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '0.68rem', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };
  const tdSt = { padding: '10px 12px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 700 }}>Quan ly Thanh vien</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>The RFID va Ve do xe thang cho chi nhanh.</p>
        </div>
        <button onClick={fetchAll} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Lam moi</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem' }}>
        {[{ l: 'TONG THE RFID', v: stats.total, c: '#0f172a' }, { l: 'DANG SU DUNG', v: stats.inUse, c: '#3b82f6' }, { l: 'THE TRONG', v: stats.avail, c: '#10b981' }, { l: 'VE THANG', v: stats.totalT, c: '#8b5cf6' }, { l: 'VE HIEU LUC', v: stats.activeT, c: '#10b981' }].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{s.l}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {[{ k: 'rfid', l: 'The RFID' }, { k: 'monthly', l: 'Ve Thang' }].map(t => (
            <button key={t.k} onClick={() => setMainTab(t.k)} style={{ padding: '13px 24px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: mainTab === t.k ? 700 : 500, color: mainTab === t.k ? '#0f172a' : '#64748b', borderBottom: mainTab === t.k ? '2px solid #0f172a' : '2px solid transparent', marginBottom: -1 }}>{t.l}</button>
          ))}
        </div>

        {mainTab === 'rfid' && (
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {RFID_TABS.map(t => (<button key={t.key} onClick={() => setRfidTab(t.key)} style={{ background: rfidTab === t.key ? '#f1f5f9' : 'none', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: rfidTab === t.key ? 700 : 500, color: rfidTab === t.key ? '#0f172a' : '#64748b', cursor: 'pointer' }}>{t.label}</button>))}
                </div>
                <div style={{ height: 16, width: 1, background: '#e2e8f0' }} />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[
                    { key: 'ALL', label: 'Tất cả thẻ' },
                    { key: 'NORMAL', label: 'Thường' },
                    { key: 'MONTHLY', label: 'Tháng' },
                    { key: 'VIP', label: 'VIP' }
                  ].map(t => (
                    <button 
                      key={t.key} 
                      onClick={() => setCardTypeFilter(t.key)} 
                      style={{ 
                        background: cardTypeFilter === t.key ? '#0f172a' : 'none', 
                        color: cardTypeFilter === t.key ? '#fff' : '#64748b', 
                        border: 'none',
                        padding: '5px 12px', 
                        borderRadius: 6, 
                        fontSize: '0.8rem', 
                        fontWeight: cardTypeFilter === t.key ? 700 : 500, 
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="text" placeholder="Tim ma the..." value={rfidSearch} onChange={e => setRfidSearch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: 150, fontSize: '0.85rem' }} />
                </div>
                <button onClick={() => { setCreateCardForm({ cardCode: '', parkingBranchId: cleanBranchId || '', cardType: 'NORMAL' }); setShowCreateCard(true); }} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>+ Them The</button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead><tr style={{ background: '#f8fafc' }}>{['MA THE RFID', 'CHI NHANH', 'LOAI THE', 'TRANG THAI', 'THAO TAC'].map(h => <th key={h} style={thSt}>{h}</th>)}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Dang tai...</td></tr>
                  : filteredCards.length === 0 ? <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Khong co the nao.</td></tr>
                    : filteredCards.map(c => {
                      const code = c.cardCode || '';
                      const isM = code.startsWith('MONTH-'), isV = code.startsWith('VIP-');
                      const display = isM ? code.replace('MONTH-', '') : isV ? code.replace('VIP-', '') : code;
                      const st = stColor(c.status);
                      return (
                        <tr key={c.parkingCardId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ ...tdSt, fontWeight: 700, color: '#0f172a' }}>{display}</td>
                          <td style={{ ...tdSt, fontSize: '0.85rem', color: '#0f172a' }}>{c.parkingBranchName || '—'}</td>
                          <td style={tdSt}><span style={{ background: isM ? '#f3e8ff' : isV ? '#fef3c7' : '#e0f2fe', color: isM ? '#6b21a8' : isV ? '#b45309' : '#0369a1', padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>{isM ? 'The thang' : isV ? 'The VIP' : 'The thuong'}</span></td>
                          <td style={{ ...tdSt, color: st.c, fontWeight: 600, fontSize: '0.82rem' }}>● {st.l}</td>
                          <td style={tdSt}>
                            <button onClick={() => openEditCard(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a', marginRight: 10, fontSize: '0.82rem' }}>Sua</button>
                            <button onClick={() => handleDeleteCard(c.parkingCardId, c.cardCode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.82rem' }}>Xoa</button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}

        {mainTab === 'monthly' && (
          <div style={{ padding: '1.25rem' }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: '0.8rem', color: '#1e40af' }}>
              Khach vang lai (GUEST): bat buoc nhap ten va SDT. Co tai khoan (USER): he thong tu JOIN vehicle to users, khong can nhap them.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ k: 'all', l: 'Tat ca' }, { k: '1', l: 'Hieu luc' }, { k: '0', l: 'Tam dung' }].map(t => (<button key={t.k} onClick={() => setTicketStatusFilter(t.k)} style={{ background: ticketStatusFilter === t.k ? '#f1f5f9' : 'none', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: ticketStatusFilter === t.k ? 700 : 500, color: ticketStatusFilter === t.k ? '#0f172a' : '#64748b', cursor: 'pointer' }}>{t.l}</button>))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="text" placeholder="Bien so, ten khach..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: 200, fontSize: '0.85rem' }} />
                </div>
                <button onClick={() => { setTicketForm(EMPTY_FORM); setShowCreateTicket(true); }} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>+ Cap Ve Thang</button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: '#f8fafc' }}>{['BIEN SO', 'LOAI XE', 'CHU XE / KHACH', 'NGUON', 'THE RFID', 'HIEU LUC', 'TRANG THAI', 'THAO TAC'].map(h => <th key={h} style={thSt}>{h}</th>)}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Dang tai ve thang...</td></tr>
                  : filteredTickets.length === 0 ? <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chua co ve thang nao.</td></tr>
                    : filteredTickets.map((t, i) => {
                      const isGuest = !!t.guestName;
                      const owner = t.guestName || t.userFullName || t.vehicle?.userFullName || '—';
                      const phone = t.guestPhone || '';
                      const plate = t.licensePlate || t.vehicle?.licensePlate || '—';
                      const vtName = t.vehicleTypeName || t.vehicle?.vehicleTypeName || '—';
                      const cardCode = t.cardCode || t.parkingCard?.cardCode || ('#' + t.parkingCardId);
                      const isActive = t.status === 1 || t.status === true;
                      const tid = getTicketId(t) || i;
                      return (
                        <tr key={tid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ ...tdSt, fontWeight: 700, color: '#0f172a' }}>{plate}</td>
                          <td style={{ ...tdSt, color: '#64748b', fontSize: '0.78rem' }}>{vtName}</td>
                          <td style={tdSt}>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.83rem' }}>{owner}</div>
                            {isGuest && phone && <div style={{ fontSize: '0.73rem', color: '#64748b' }}>{phone}</div>}
                          </td>
                          <td style={tdSt}><span style={{ background: isGuest ? '#fff7ed' : '#f0fdf4', color: isGuest ? '#c2410c' : '#166534', padding: '3px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 }}>{isGuest ? 'Vang lai' : 'Tai khoan'}</span></td>
                          <td style={{ ...tdSt, color: '#64748b', fontSize: '0.78rem' }}>{cardCode}</td>
                          <td style={{ ...tdSt, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(t.startDate)}<br />to {fmtDate(t.endDate)}</td>
                          <td style={tdSt}><span style={{ background: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#166534' : '#64748b', padding: '3px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700 }}>{isActive ? 'Hieu luc' : 'Tam dung'}</span></td>
                          <td style={{ ...tdSt, whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleToggleTicket(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#f59e0b' : '#10b981', marginRight: 8, fontSize: '0.78rem', fontWeight: 600 }}>{isActive ? 'Dung' : 'Kich hoat'}</button>
                            <button onClick={() => handleDeleteTicket(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.78rem' }}>Xoa</button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateCard && (
        <Modal title="Them the RFID moi" onClose={() => setShowCreateCard(false)}>
          <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="MA THE (RFID CODE)"><input type="text" placeholder="VD: CARD-9921" value={createCardForm.cardCode} onChange={e => setCreateCardForm({ ...createCardForm, cardCode: e.target.value })} style={inp} required /></Field>
            <Field label="LOAI THE"><select value={createCardForm.cardType} onChange={e => setCreateCardForm({ ...createCardForm, cardType: e.target.value })} style={inp}><option value="NORMAL">The thuong</option><option value="MONTHLY">The thang (MONTH-)</option><option value="VIP">The VIP (VIP-)</option></select></Field>
            <Field label="CHI NHANH"><select value={createCardForm.parkingBranchId} onChange={e => setCreateCardForm({ ...createCardForm, parkingBranchId: e.target.value })} style={inp} required disabled={!!cleanBranchId}><option value="">Chon chi nhanh...</option>{branches.map(b => <option key={b.parkingBranchId} value={b.parkingBranchId}>{b.branchName || b.parkingBranchName}</option>)}</select></Field>
            <ModalActions onCancel={() => setShowCreateCard(false)} loading={submittingCard} submitLabel="Luu the" />
          </form>
        </Modal>
      )}

      {showEditCard && selectedCard && (
        <Modal title="Chinh sua the RFID" onClose={() => { setShowEditCard(false); setSelectedCard(null); }}>
          <form onSubmit={handleEditCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="MA THE"><input type="text" value={editCardForm.cardCode} onChange={e => setEditCardForm({ ...editCardForm, cardCode: e.target.value })} style={inp} required /></Field>
            <Field label="LOAI THE"><select value={editCardForm.cardType} onChange={e => setEditCardForm({ ...editCardForm, cardType: e.target.value })} style={inp}><option value="NORMAL">The thuong</option><option value="MONTHLY">The thang</option><option value="VIP">The VIP</option></select></Field>
            <Field label="CHI NHANH"><select value={editCardForm.parkingBranchId} onChange={e => setEditCardForm({ ...editCardForm, parkingBranchId: e.target.value })} style={inp} disabled={!!cleanBranchId}><option value="">Chon chi nhanh...</option>{branches.map(b => <option key={b.parkingBranchId} value={b.parkingBranchId}>{b.branchName || b.parkingBranchName}</option>)}</select></Field>
            <Field label="TRANG THAI"><select value={editCardForm.status} onChange={e => setEditCardForm({ ...editCardForm, status: e.target.value })} style={inp}><option value="AVAILABLE">Con trong</option><option value="IN_USE">Dang su dung</option><option value="LOST">Bao mat</option><option value="DISABLED">Da khoa</option></select></Field>
            <ModalActions onCancel={() => { setShowEditCard(false); setSelectedCard(null); }} loading={submittingCard} submitLabel="Luu thay doi" />
          </form>
        </Modal>
      )}

      {showCreateTicket && (
        <Modal title="Cap Ve Thang moi" onClose={() => setShowCreateTicket(false)} wide>
          <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: 10 }}>Buoc 1: Tim xe theo bien so</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="Nhap bien so xe (VD: 59A1-55555)" value={ticketForm.licensePlateSearch} onChange={e => setTicketForm(prev => ({ ...prev, licensePlateSearch: e.target.value, vehicleId: '', vehicleSource: '' }))} style={{ ...inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchVehicle())} />
                <button type="button" onClick={handleSearchVehicle} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Tim xe</button>
              </div>
              {matchedVehicle && (
                <div style={{ marginTop: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{matchedVehicle.licensePlate}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{[matchedVehicle.vehicleBrand, matchedVehicle.vehicleColor, matchedVehicle.vehicleTypeName].filter(Boolean).join(' - ')}</div>
                    {matchedVehicle.userFullName && <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: 2 }}>Chu xe: {matchedVehicle.userFullName}</div>}
                  </div>
                  <span style={{ background: matchedVehicle.vehicleSource === 'GUEST' ? '#fff7ed' : '#f0fdf4', color: matchedVehicle.vehicleSource === 'GUEST' ? '#c2410c' : '#166534', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{matchedVehicle.vehicleSource === 'GUEST' ? 'Khach vang lai' : 'Co tai khoan'}</span>
                </div>
              )}
            </div>

            {matchedVehicle?.vehicleSource === 'GUEST' && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#c2410c', marginBottom: 10 }}>Buoc 2: Thong tin khach vang lai (bat buoc)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="TEN KHACH *"><input type="text" placeholder="Nguyen Van A" value={ticketForm.guestName} onChange={e => setTicketForm(prev => ({ ...prev, guestName: e.target.value }))} style={inp} /></Field>
                  <Field label="SO DIEN THOAI *"><input type="tel" placeholder="0909123456" value={ticketForm.guestPhone} onChange={e => setTicketForm(prev => ({ ...prev, guestPhone: e.target.value }))} style={inp} /></Field>
                </div>
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: 10 }}>Buoc {matchedVehicle?.vehicleSource === 'GUEST' ? '3' : '2'}: Chon the RFID va thoi han</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <Field label="THE RFID *">
                  <select value={ticketForm.parkingCardId} onChange={e => setTicketForm(prev => ({ ...prev, parkingCardId: e.target.value }))} style={inp} required>
                    <option value="">-- Chon the RFID --</option>
                    {availableTicketCards.map(c => { const code = (c.cardCode || '').startsWith('MONTH-') ? c.cardCode.replace('MONTH-', '') : c.cardCode; return <option key={c.parkingCardId} value={c.parkingCardId}>{code} (AVAILABLE)</option>; })}
                  </select>
                </Field>
                <Field label="NGAY BAT DAU *"><input type="date" value={ticketForm.startDate} onChange={e => setTicketForm(prev => ({ ...prev, startDate: e.target.value }))} style={inp} required /></Field>
                <Field label="NGAY KET THUC *"><input type="date" value={ticketForm.endDate} onChange={e => setTicketForm(prev => ({ ...prev, endDate: e.target.value }))} style={inp} required /></Field>
              </div>
            </div>

            {ticketForm.vehicleId && ticketForm.parkingCardId && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#166534' }}>
                Xac nhan: Cap ve cho xe {matchedVehicle?.licensePlate} → The #{ticketForm.parkingCardId}
                {matchedVehicle?.vehicleSource === 'GUEST' && ticketForm.guestName ? ' | Khach: ' + ticketForm.guestName + ' (' + ticketForm.guestPhone + ')' : matchedVehicle?.userFullName ? ' | Chu: ' + matchedVehicle.userFullName : ''}
              </div>
            )}

            <ModalActions onCancel={() => setShowCreateTicket(false)} loading={submittingTicket} submitLabel="Cap Ve Thang" disabled={!ticketForm.vehicleId} />
          </form>
        </Modal>
      )}
    </div>
  );
}
