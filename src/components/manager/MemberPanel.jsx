import { useState, useEffect, useCallback } from 'react';
import managerApi from '../../api/manager';
import { toast } from 'react-toastify';
import { Modal, Form, Button, Table, Badge, Card, Row, Col } from 'react-bootstrap';

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

export default function MemberPanel({ branchId }) {
  const [mainTab, setMainTab] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const cleanBranchId = (branchId && branchId !== 'undefined' && branchId !== 'null' && branchId !== '') ? String(branchId) : localStorage.getItem('parkingBranchId');
  const [branches, setBranches] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [rfidTab, setRfidTab] = useState('all');
  const [rfidSearch, setRfidSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('ALL');
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
  const EMPTY_FORM = { vehicleId: '', parkingCardId: '', guestName: '', guestPhone: '', startDate: todayISO(), endDate: thirtyDaysISO(), licensePlateSearch: '', vehicleSource: '', requestId: null };
  const [ticketForm, setTicketForm] = useState(EMPTY_FORM);
  const [showCreateEmpTicket, setShowCreateEmpTicket] = useState(false);
  const [submittingEmpTicket, setSubmittingEmpTicket] = useState(false);
  const EMPTY_EMP_FORM = { vehicleId: '', parkingCardId: '', startDate: todayISO(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10), licensePlateSearch: '' };
  const [empTicketForm, setEmpTicketForm] = useState(EMPTY_EMP_FORM);
  const [matchedEmpVehicle, setMatchedEmpVehicle] = useState(null);
  const [newCardCodeInput, setNewCardCodeInput] = useState('');
  const [newEmpCardCodeInput, setNewEmpCardCodeInput] = useState('');
  const RFID_TABS = [{ key: 'all', label: 'Tất cả' }, { key: 'AVAILABLE', label: 'Thẻ trống' }, { key: 'IN_USE', label: 'Đang dùng' }, { key: 'LOST', label: 'Báo mất' }, { key: 'DISABLED', label: 'Khóa' }];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, branchesRes, vehiclesRes, ticketsRes, reqRes] = await Promise.all([
        managerApi.getParkingCards(),
        managerApi.getParkingBranches(),
        managerApi.getAllVehicles().catch(() => []),
        managerApi.getAllMonthlyTickets().catch(() => []),
        managerApi.getAllMonthlyTicketRequests?.().catch(() => []) || []
      ]);
      const parsedCards = Array.isArray(cardsRes) ? cardsRes : [];
      const parsedBranches = Array.isArray(branchesRes) ? branchesRes : [];
      const parsedVehicles = Array.isArray(vehiclesRes) ? vehiclesRes : (vehiclesRes?.content || []);
      const parsedTickets = Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.content || []);
      const parsedReqs = Array.isArray(reqRes) ? reqRes : (reqRes?.content || []);
      const filteredCards = cleanBranchId ? parsedCards.filter(c => getBranchId(c) === cleanBranchId) : parsedCards;
      const filteredBranches = cleanBranchId ? parsedBranches.filter(b => getBranchId(b) === cleanBranchId) : parsedBranches;
      const branchCardIds = new Set(filteredCards.map(c => String(c.parkingCardId)));
      const filteredTickets = cleanBranchId ? parsedTickets.filter(t => branchCardIds.has(String(t.parkingCardId))) : parsedTickets;
      const filteredReqs = cleanBranchId ? parsedReqs.filter(r => String(r.parkingBranch?.parkingBranchId || r.parkingBranch?.id) === cleanBranchId) : parsedReqs;
      
      setAllCards(filteredCards);
      setBranches(filteredBranches);
      setVehicles(parsedVehicles);
      setTickets(filteredTickets);
      setRequests(filteredReqs);
      if (cleanBranchId) setCreateCardForm(prev => ({ ...prev, parkingBranchId: cleanBranchId }));
    } catch (err) { console.error(err); toast.error('Không tải được dữ liệu!'); }
    finally { setLoading(false); }
  }, [branchId, cleanBranchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!createCardForm.cardCode.trim()) return toast.warn('Vui lòng nhập mã thẻ!');
    if (!createCardForm.parkingBranchId) return toast.warn('Vui lòng chọn chi nhánh!');
    let code = createCardForm.cardCode.trim();
    if (createCardForm.cardType === 'MONTHLY' && !code.startsWith('MONTH-')) code = 'MONTH-' + code;
    else if (createCardForm.cardType === 'VIP' && !code.startsWith('VIP-')) code = 'VIP-' + code;
    else if (createCardForm.cardType === 'EMPLOYEE' && !code.startsWith('EMP-')) code = 'EMP-' + code;
    setSubmittingCard(true);
    try {
      await managerApi.createParkingCard({ 
        cardCode: code, 
        parking_branch_id: Number(createCardForm.parkingBranchId),
        parkingBranchId: Number(createCardForm.parkingBranchId),
        type: createCardForm.cardType === 'MONTHLY' ? 'MONTHLY' : createCardForm.cardType === 'VIP' ? 'VIP' : createCardForm.cardType === 'EMPLOYEE' ? 'EMPLOYEE' : 'REGULAR',
        cardType: createCardForm.cardType === 'MONTHLY' ? 'MONTHLY' : createCardForm.cardType === 'VIP' ? 'VIP' : createCardForm.cardType === 'EMPLOYEE' ? 'EMPLOYEE' : 'REGULAR',
        status: 'AVAILABLE'
      });
      toast.success('Đã thêm thẻ RFID mới!');
      setShowCreateCard(false);
      setCreateCardForm({ cardCode: '', parkingBranchId: cleanBranchId || '', cardType: 'NORMAL' });
      fetchAll();
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Không thể tạo thẻ!')); }
    finally { setSubmittingCard(false); }
  };

  const handleEditCard = async (e) => {
    e.preventDefault();
    if (!editCardForm.cardCode.trim()) return toast.warn('Nhập mã thẻ!');
    let code = editCardForm.cardCode.trim().replace(/^(MONTH-|VIP-|EMP-)/, '');
    if (editCardForm.cardType === 'MONTHLY') code = 'MONTH-' + code;
    else if (editCardForm.cardType === 'VIP') code = 'VIP-' + code;
    else if (editCardForm.cardType === 'EMPLOYEE') code = 'EMP-' + code;
    setSubmittingCard(true);
    try {
      await managerApi.updateParkingCard(selectedCard.parkingCardId, { 
        cardCode: code, 
        parking_branch_id: Number(editCardForm.parkingBranchId),
        parkingBranchId: Number(editCardForm.parkingBranchId), 
        status: editCardForm.status,
        type: editCardForm.cardType === 'MONTHLY' ? 'MONTHLY' : editCardForm.cardType === 'VIP' ? 'VIP' : editCardForm.cardType === 'EMPLOYEE' ? 'EMPLOYEE' : 'REGULAR',
        cardType: editCardForm.cardType === 'MONTHLY' ? 'MONTHLY' : editCardForm.cardType === 'VIP' ? 'VIP' : editCardForm.cardType === 'EMPLOYEE' ? 'EMPLOYEE' : 'REGULAR'
      });
      toast.success('Cập nhật thẻ thành công!');
      setShowEditCard(false); setSelectedCard(null); fetchAll();
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Lỗi!')); }
    finally { setSubmittingCard(false); }
  };

  const handleDeleteCard = async (id, code) => {
    if (!window.confirm('Xóa thẻ ' + code + '?')) return;
    try { await managerApi.deleteParkingCard(id); toast.success('Đã xóa!'); fetchAll(); }
    catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Lỗi!')); }
  };

  const openEditCard = (c) => {
    setSelectedCard(c);
    const code = c.cardCode || '';
    const isM = code.startsWith('MONTH-'), isV = code.startsWith('VIP-'), isE = code.startsWith('EMP-');
    setEditCardForm({ cardCode: isM ? code.replace('MONTH-', '') : isV ? code.replace('VIP-', '') : isE ? code.replace('EMP-', '') : code, parkingBranchId: c.parkingBranchId || '', status: c.status, cardType: isM ? 'MONTHLY' : isV ? 'VIP' : isE ? 'EMPLOYEE' : 'NORMAL' });
    setShowEditCard(true);
  };

  const matchedVehicle = ticketForm.vehicleId ? vehicles.find(v => String(v.vehicleId || v.vehiclesId || v.id) === String(ticketForm.vehicleId)) : null;

  const handleSearchVehicle = () => {
    const q = ticketForm.licensePlateSearch.trim().toUpperCase().replace(/\s/g, '');
    if (!q) return toast.warn('Nhập biển số xe để tìm!');
    const found = vehicles.find(v => (v.licensePlate || '').toUpperCase().replace(/\s/g, '') === q);
    if (!found) return toast.warn('Không tìm thấy xe!');
    const resolvedSource = found.userId || found.userFullName ? 'REGISTER' : (found.vehicleSource || 'GUEST');
    setTicketForm(prev => ({ ...prev, vehicleId: String(found.vehicleId || found.vehiclesId || found.id), vehicleSource: resolvedSource, guestName: '', guestPhone: '' }));
    toast.success('Tìm thấy: ' + found.licensePlate);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.vehicleId) return toast.warn('Vui lòng tìm và chọn xe!');
    if (!ticketForm.parkingCardId) return toast.warn('Vui lòng chọn thẻ RFID!');
    if (ticketForm.parkingCardId === 'new' && !newCardCodeInput.trim()) return toast.warn('Vui lòng nhập mã thẻ RFID mới!');
    if (!ticketForm.startDate || !ticketForm.endDate) return toast.warn('Chọn ngày hiệu lực!');
    
    setSubmittingTicket(true);
    try {
      let finalCardId = ticketForm.parkingCardId;
      let finalCardCode = '';
      
      if (ticketForm.parkingCardId === 'new') {
        let code = newCardCodeInput.trim();
        if (!code.startsWith('MONTH-')) code = 'MONTH-' + code;
        
        const createdCard = await managerApi.createParkingCard({ 
          cardCode: code, 
          parking_branch_id: Number(cleanBranchId),
          parkingBranchId: Number(cleanBranchId),
          type: 'MONTHLY',
          status: 'AVAILABLE'
        });
        
        finalCardId = createdCard.parkingCardId;
        finalCardCode = createdCard.cardCode;
      }
      
      const selectedCardObj = ticketForm.parkingCardId === 'new' 
        ? { parkingCardId: finalCardId, cardCode: finalCardCode, parkingBranchId: Number(cleanBranchId) }
        : allCards.find(c => String(c.parkingCardId) === String(ticketForm.parkingCardId));
        
      const isVipCard = selectedCardObj && (selectedCardObj.cardCode || '').startsWith('VIP-');
      const isGuest = matchedVehicle?.vehicleSource === 'GUEST';
      
      if (isVipCard && isGuest) return toast.error('Thẻ VIP bắt buộc chủ xe phải có tài khoản thành viên (không dành cho khách vãng lai)!');

      if (isGuest) {
        if (!ticketForm.guestName.trim()) return toast.warn('Nhập tên khách!');
        if (!ticketForm.guestPhone.trim()) return toast.warn('Nhập số điện thoại!');
      }
      
      const payload = { 
        vehicleId: Number(ticketForm.vehicleId), 
        parkingCardId: Number(finalCardId), 
        startDate: new Date(ticketForm.startDate).toISOString(), 
        endDate: new Date(ticketForm.endDate).toISOString(), 
        status: 1, 
        guestName: isGuest ? ticketForm.guestName.trim() : null, 
        guestPhone: isGuest ? ticketForm.guestPhone.trim() : null 
      };
      
      await managerApi.createMonthlyTicket(payload);
      
      if (selectedCardObj) {
        await managerApi.updateParkingCard(selectedCardObj.parkingCardId, {
          type: isVipCard ? 'VIP' : (selectedCardObj.cardCode || '').startsWith('MONTH-') ? 'MONTHLY' : 'REGULAR'
        }).catch(err => console.error("Failed to update card status:", err));
      }
      
      if (ticketForm.requestId && managerApi.updateMonthlyTicketRequestStatus) {
        await managerApi.updateMonthlyTicketRequestStatus(ticketForm.requestId, 1).catch(e => console.error("Failed to update request status:", e));
      }
      
      toast.success('Cấp vé tháng thành công!');
      setShowCreateTicket(false); setTicketForm(EMPTY_FORM); setNewCardCodeInput(''); fetchAll();
    } catch (err) { 
      toast.error(String(err.response?.data?.message || err.response?.data || 'Lỗi tạo vé!')); 
    } finally { 
      setSubmittingTicket(false); 
    }
  };

  const handleSearchEmpVehicle = () => {
    const q = empTicketForm.licensePlateSearch.trim().toUpperCase().replace(/\s/g, '');
    if (!q) return toast.warn('Nhập biển số xe nhân viên để tìm!');
    const found = vehicles.find(v => (v.licensePlate || '').toUpperCase().replace(/\s/g, '') === q);
    if (!found) return toast.warn('Không tìm thấy xe!');
    setMatchedEmpVehicle(found);
    setEmpTicketForm(prev => ({ ...prev, vehicleId: String(found.vehicleId || found.vehiclesId || found.id) }));
    toast.success('Tìm thấy xe: ' + found.licensePlate);
  };

  const handleCreateEmpTicket = async (e) => {
    e.preventDefault();
    if (!empTicketForm.vehicleId) return toast.warn('Vui lòng tìm và chọn xe nhân viên!');
    if (!empTicketForm.parkingCardId) return toast.warn('Vui lòng chọn thẻ RFID Nhân viên!');
    if (empTicketForm.parkingCardId === 'new' && !newEmpCardCodeInput.trim()) return toast.warn('Vui lòng nhập mã thẻ nhân viên mới!');
    if (!empTicketForm.startDate || !empTicketForm.endDate) return toast.warn('Chọn ngày hiệu lực!');
    
    setSubmittingEmpTicket(true);
    try {
      let finalCardId = empTicketForm.parkingCardId;
      let finalCardCode = '';
      
      if (empTicketForm.parkingCardId === 'new') {
        let code = newEmpCardCodeInput.trim();
        if (!code.startsWith('EMP-')) code = 'EMP-' + code;
        
        const createdCard = await managerApi.createParkingCard({ 
          cardCode: code, 
          parking_branch_id: Number(cleanBranchId),
          parkingBranchId: Number(cleanBranchId),
          type: 'REGULAR',
          status: 'AVAILABLE'
        });
        
        finalCardId = createdCard.parkingCardId;
        finalCardCode = createdCard.cardCode;
      }
      
      const selectedCardObj = empTicketForm.parkingCardId === 'new'
        ? { parkingCardId: finalCardId, cardCode: finalCardCode, parkingBranchId: Number(cleanBranchId) }
        : allCards.find(c => String(c.parkingCardId) === String(empTicketForm.parkingCardId));
      
      const payload = { 
        vehicleId: Number(empTicketForm.vehicleId), 
        parkingCardId: Number(finalCardId), 
        startDate: new Date(empTicketForm.startDate).toISOString(), 
        endDate: new Date(empTicketForm.endDate).toISOString(), 
        status: 1, 
        guestName: 'NHÂN VIÊN', 
        guestPhone: 'SYSTEM' 
      };
      
      await managerApi.createMonthlyTicket(payload);
      
      if (selectedCardObj) {
        await managerApi.updateParkingCard(selectedCardObj.parkingCardId, {
          type: 'EMPLOYEE'
        }).catch(err => console.error("Failed to update card status:", err));
      }
      
      toast.success('Cấp thẻ nhân viên thành công!');
      setShowCreateEmpTicket(false); 
      setEmpTicketForm(EMPTY_EMP_FORM); 
      setNewEmpCardCodeInput('');
      setMatchedEmpVehicle(null);
      fetchAll();
    } catch (err) { 
      toast.error(String(err.response?.data?.message || err.response?.data || 'Lỗi cấp thẻ nhân viên!')); 
    } finally { 
      setSubmittingEmpTicket(false); 
    }
  };
 
  const handleDeleteTicket = async (t) => {
    const tid = getTicketId(t);
    if (!tid) return toast.error("Không tìm thấy ID vé tháng!");
    if (!window.confirm('Xóa vé tháng này?')) return;
    try { 
      await managerApi.deleteMonthlyTicket(tid); 
      const assocCard = allCards.find(c => String(c.parkingCardId) === String(t.parkingCardId));
      if (assocCard) {
        await managerApi.updateParkingCard(assocCard.parkingCardId, {
          ...assocCard,
          status: 'AVAILABLE',
          type: assocCard.type || assocCard.cardType || 'MONTHLY',
          cardType: assocCard.cardType || assocCard.type || 'MONTHLY'
        }).catch(err => console.error("Failed to reset card status:", err));
      }
      toast.success('Đã xóa vé!'); 
      fetchAll(); 
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Lỗi!')); }
  };

  const handleToggleTicket = async (t) => {
    const tid = getTicketId(t);
    if (!tid) return toast.error("Không tìm thấy ID vé tháng!");
    const isActive = t.status === 1 || t.status === true;
    try {
      await managerApi.updateMonthlyTicket(tid, { vehicleId: t.vehicleId, parkingCardId: t.parkingCardId, guestName: t.guestName || null, guestPhone: t.guestPhone || null, startDate: t.startDate, endDate: t.endDate, status: isActive ? 0 : 1 });
      const cardId = t.parkingCardId || t.parkingCard?.parkingCardId || t.parkingCard?.id;
      const assocCard = allCards.find(c => String(c.parkingCardId) === String(cardId));
      if (assocCard) {
        await managerApi.updateParkingCard(assocCard.parkingCardId, {
          ...assocCard,
          status: isActive ? 'AVAILABLE' : 'IN_USE',
          type: assocCard.type || assocCard.cardType || 'MONTHLY',
          cardType: assocCard.cardType || assocCard.type || 'MONTHLY'
        }).catch(err => console.error("Failed to sync card status during toggle:", err));
      }
      toast.success(isActive ? 'Đã tạm dừng vé!' : 'Đã kích hoạt vé!'); fetchAll();
    } catch (err) { toast.error(String(err.response?.data?.message || err.response?.data || 'Lỗi!')); }
  };

  const handleApproveRequest = async (req) => {
    const veh = req.vehicle;
    // Tìm xem xe này đã có vé tháng trong hệ thống chưa
    const existingTicket = tickets.find(t => String(t.vehicleId || t.vehicle?.vehicleId) === String(veh?.vehicleId || veh?.vehiclesId || veh?.id));

    if (existingTicket) {
      // TRƯỜNG HỢP GIA HẠN: Manager chỉ duyệt, không cấp thẻ mới
      const confirmRenew = window.confirm(`Xác nhận duyệt GIA HẠN gói cước cho xe ${veh?.licensePlate || ''}?`);
      if (!confirmRenew) return;
      const months = 1;

      setLoading(true);
      try {
        // 1. Duyệt trạng thái yêu cầu
        if (managerApi.updateMonthlyTicketRequestStatus) {
          await managerApi.updateMonthlyTicketRequestStatus(req.id, 1);
        }
        
        // 2. Tính ngày hiệu lực mới
        const baseDurationDays = req.pricePolicy?.baseDurationMinutes ? (req.pricePolicy.baseDurationMinutes / (60 * 24)) : 30;
        const durationDays = baseDurationDays * months;
        const currentEnd = new Date(existingTicket.endDate);
        const baseDate = (currentEnd > new Date()) ? currentEnd : new Date();
        
        // Ngày bắt đầu của chu kỳ mới là hôm nay (để ghi nhận doanh thu hôm nay/tháng này)
        const newStartDateStr = new Date().toISOString(); 
        
        const endDateTime = new Date(baseDate);
        endDateTime.setDate(endDateTime.getDate() + durationDays);
        const newEndDateStr = endDateTime.toISOString();

        // 3. Cập nhật trạng thái vé cũ thành hết hiệu lực (status = 0) ĐỂ TRÁNH LỖI OVERLAP
        const oldTicketId = getTicketId(existingTicket);
        if (oldTicketId) {
          await managerApi.updateMonthlyTicket(oldTicketId, {
            vehicleId: Number(existingTicket.vehicleId || existingTicket.vehicle?.vehicleId),
            parkingCardId: Number(existingTicket.parkingCardId || existingTicket.parkingCard?.parkingCardId),
            guestName: existingTicket.guestName || null,
            guestPhone: existingTicket.guestPhone || null,
            startDate: existingTicket.startDate,
            endDate: existingTicket.endDate,
            status: 0 // Vô hiệu hoá vé cũ trước
          });
        }

        try {
          // 4. Tạo một bản ghi vé tháng mới
          await managerApi.createMonthlyTicket({
            vehicleId: Number(existingTicket.vehicleId || existingTicket.vehicle?.vehicleId),
            parkingCardId: Number(existingTicket.parkingCardId || existingTicket.parkingCard?.parkingCardId),
            guestName: existingTicket.guestName || null,
            guestPhone: existingTicket.guestPhone || null,
            startDate: newStartDateStr,
            endDate: newEndDateStr,
            status: 1
          });
        } catch (createErr) {
          // Revert old ticket if creation fails
          if (oldTicketId) {
            await managerApi.updateMonthlyTicket(oldTicketId, {
              vehicleId: Number(existingTicket.vehicleId || existingTicket.vehicle?.vehicleId),
              parkingCardId: Number(existingTicket.parkingCardId || existingTicket.parkingCard?.parkingCardId),
              guestName: existingTicket.guestName || null,
              guestPhone: existingTicket.guestPhone || null,
              startDate: existingTicket.startDate,
              endDate: existingTicket.endDate,
              status: 1
            });
          }
          throw createErr;
        }

        toast.success(`Đã gia hạn thành công xe ${veh?.licensePlate || ''}. Ngày hết hạn mới: ${new Date(newEndDateStr).toLocaleDateString('vi-VN')}`);
        fetchAll();
      } catch (err) {
        toast.error(String(err.response?.data?.message || err.response?.data || 'Lỗi gia hạn vé tháng!'));
      } finally {
        setLoading(false);
      }
    } else {
      // TRƯỜNG HỢP ĐĂNG KÝ MỚI: Mở modal cấp thẻ tháng như cũ
      setMainTab('monthly');
      if (veh && !vehicles.find(v => String(v.vehicleId || v.vehiclesId || v.id) === String(veh.vehicleId || veh.vehiclesId || veh.id))) {
        setVehicles(prev => [...prev, { ...veh, vehicleSource: 'REGISTER', userFullName: req.user?.fullName || req.user?.username }]);
      }
      
      setTicketForm(prev => ({
        ...EMPTY_FORM,
        vehicleId: String(veh?.vehicleId || veh?.vehiclesId || veh?.id),
        vehicleSource: 'REGISTER',
        licensePlateSearch: veh?.licensePlate || '',
        requestId: req.id
      }));
      setShowCreateTicket(true);
    }
  };

  const handleRejectRequest = async (req) => {
    if (!window.confirm('Từ chối yêu cầu đăng ký này?')) return;
    try {
      if (managerApi.updateMonthlyTicketRequestStatus) {
        await managerApi.updateMonthlyTicketRequestStatus(req.id, 2);
        toast.success("Đã từ chối yêu cầu!");
        fetchAll();
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const stColor = (s) => {
    switch (String(s || '').toUpperCase()) {
      case 'AVAILABLE': return { c: 'text-success', l: 'Còn trống' };
      case 'IN_USE': return { c: 'text-primary', l: 'Đang dùng' };
      case 'LOST': return { c: 'text-danger', l: 'Báo mất' };
      case 'DISABLED': return { c: 'text-secondary', l: 'Đã khóa' };
      default: return { c: 'text-secondary', l: String(s || '') };
    }
  };

  const filteredCards = allCards.filter(c => {
    const q = rfidSearch.toLowerCase();
    const matchQ = (c.cardCode || '').toLowerCase().includes(q) || (c.parkingBranchName || '').toLowerCase().includes(q);
    const matchT = rfidTab === 'all' || String(c.status || '').toUpperCase() === rfidTab;
    const code = c.cardCode || '';
    const isM = code.startsWith('MONTH-'), isV = code.startsWith('VIP-'), isE = code.startsWith('EMP-'), isN = !isM && !isV && !isE;
    let matchType = true;
    if (cardTypeFilter === 'NORMAL') matchType = isN;
    else if (cardTypeFilter === 'MONTHLY') matchType = isM;
    else if (cardTypeFilter === 'VIP') matchType = isV;
    else if (cardTypeFilter === 'EMPLOYEE') matchType = isE;
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

  const availableTicketCards = allCards.filter(c => {
    const isAssigned = tickets.some(t => String(t.parkingCardId) === String(c.parkingCardId));
    if (isAssigned) return false;
    const s = String(c.status || '').toUpperCase();
    const code = String(c.cardCode || '').toUpperCase();
    const type = String(c.type || '').toUpperCase();
    return (s === 'AVAILABLE' || s === '0' || s === '') && (code.startsWith('MONTH-') || type === 'MONTHLY');
  });

  const availableEmployeeCards = allCards.filter(c => {
    const isAssigned = tickets.some(t => String(t.parkingCardId) === String(c.parkingCardId));
    if (isAssigned) return false;
    const s = String(c.status || '').toUpperCase();
    const code = String(c.cardCode || '').toUpperCase();
    return (s === 'AVAILABLE' || s === '0' || s === '') && code.startsWith('EMP-');
  });

  const pendingRequests = requests.filter(r => r.status === 0);

  const stats = {
    total: allCards.length,
    inUse: allCards.filter(c => String(c.status || '').toUpperCase() === 'IN_USE').length,
    avail: allCards.filter(c => String(c.status || '').toUpperCase() === 'AVAILABLE').length,
    totalT: tickets.length,
    activeT: tickets.filter(t => t.status === 1 || t.status === true).length,
    pendingReq: pendingRequests.length
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2 className="text-primary fw-bold mb-1 fs-4">Quản lý Thành viên</h2>
          <p className="text-muted small m-0">Thẻ RFID và Vé đỗ xe tháng theo chi nhánh.</p>
        </div>
        <Button variant="light" className="border text-primary fw-semibold" onClick={fetchAll}>Làm mới</Button>
      </div>

      <Row className="g-3">
        {[{ l: 'TỔNG THẺ RFID', v: stats.total, c: 'text-primary' }, { l: 'ĐANG SỬ DỤNG', v: stats.inUse, c: 'text-primary' }, { l: 'THẺ TRỐNG', v: stats.avail, c: 'text-success' }, { l: 'VÉ THÁNG', v: stats.totalT, c: 'text-info' }, { l: 'YÊU CẦU ĐĂNG KÝ', v: stats.pendingReq, c: 'text-warning' }].map((s, i) => (
          <Col key={i}>
            <Card className="border-0 shadow-sm h-100 p-3">
              <div className="text-muted fw-bold small text-uppercase mb-1" style={{fontSize: '0.7rem'}}>{s.l}</div>
              <div className={`fs-2 fw-bolder ${s.c}`}>{s.v}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm">
        <div className="d-flex border-bottom">
          {[{ k: 'rfid', l: 'Thẻ RFID' }, { k: 'monthly', l: 'Vé Tháng' }, { k: 'requests', l: 'Yêu cầu đăng ký' }].map(t => (
            <button key={t.k} onClick={() => setMainTab(t.k)} className={`btn px-4 py-3 fw-semibold rounded-0 ${mainTab === t.k ? 'text-primary border-bottom border-dark border-2' : 'text-muted'}`}>
              {t.l} {t.k === 'requests' && stats.pendingReq > 0 && <Badge bg="danger" className="ms-2">{stats.pendingReq}</Badge>}
            </button>
          ))}
        </div>

        {mainTab === 'rfid' && (
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex gap-1">
                  {RFID_TABS.map(t => (<Button key={t.key} size="sm" variant={rfidTab === t.key ? 'light' : 'link'} className={`text-decoration-none ${rfidTab === t.key ? 'text-primary fw-bold' : 'text-muted'}`} onClick={() => setRfidTab(t.key)}>{t.label}</Button>))}
                </div>
                <div className="vr d-none d-md-block"></div>
                <div className="d-flex gap-1">
                  {[{ key: 'ALL', label: 'Tất cả thẻ' }, { key: 'NORMAL', label: 'Thường' }, { key: 'MONTHLY', label: 'Tháng' }, { key: 'VIP', label: 'VIP' }, { key: 'EMPLOYEE', label: 'Nhân viên' }].map(t => (
                    <Button key={t.key} size="sm" variant={cardTypeFilter === t.key ? 'primary' : 'link'} className={`text-decoration-none ${cardTypeFilter === t.key ? 'fw-bold' : 'text-muted'}`} onClick={() => setCardTypeFilter(t.key)}>{t.label}</Button>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2">
                <Form.Control size="sm" type="text" placeholder="Tìm mã thẻ..." value={rfidSearch} onChange={e => setRfidSearch(e.target.value)} style={{ width: 150 }} />
                <Button size="sm" variant="primary" className="fw-bold" onClick={() => { setCreateCardForm({ cardCode: '', parkingBranchId: cleanBranchId || '', cardType: 'NORMAL' }); setShowCreateCard(true); }}>+ Thêm Thẻ</Button>
              </div>
            </div>
            
            <div className="table-responsive">
              <Table hover className="align-middle border-top mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light text-muted small"><tr>{['MÃ THẺ RFID', 'CHI NHÁNH', 'LOẠI THẺ', 'TRẠNG THÁI', 'THAO TÁC'].map(h => <th key={h} className="fw-bold">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="text-center py-4 text-muted">Đang tải...</td></tr> : filteredCards.length === 0 ? <tr><td colSpan={5} className="text-center py-4 text-muted">Không có thẻ nào.</td></tr> : filteredCards.map(c => {
                    const code = c.cardCode || '', isM = code.startsWith('MONTH-'), isV = code.startsWith('VIP-'), isE = code.startsWith('EMP-'), display = isM ? code.replace('MONTH-', '') : isV ? code.replace('VIP-', '') : isE ? code.replace('EMP-', '') : code, st = stColor(c.status);
                    return (
                      <tr key={c.parkingCardId}>
                        <td className="fw-bold text-primary">{display}</td>
                        <td className="text-primary">{c.parkingBranchName || '—'}</td>
                        <td><Badge bg={isM ? 'info' : isV ? 'warning' : isE ? 'success' : 'primary'} text={isV ? 'dark' : 'white'}>{isM ? 'Thẻ tháng' : isV ? 'Thẻ VIP' : isE ? 'Thẻ nhân viên' : 'Thẻ thường'}</Badge></td>
                        <td className={`fw-semibold ${st.c}`}>● {st.l}</td>
                        <td>
                          <Button variant="link" size="sm" className="text-primary text-decoration-none px-1" onClick={() => openEditCard(c)}>Sửa</Button>
                          <Button variant="link" size="sm" className="text-danger text-decoration-none px-1" onClick={() => handleDeleteCard(c.parkingCardId, c.cardCode)}>Xóa</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {mainTab === 'monthly' && (
          <div className="p-3">
            <div className="alert alert-info py-2 small mb-3">Khách vãng lai (GUEST): bắt buộc nhập tên và SĐT. Có tài khoản (USER): hệ thống tự động liên kết xe với chủ hộ, không cần nhập thêm.</div>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="d-flex gap-1">
                {[{ k: 'all', l: 'Tất cả' }, { k: '1', l: 'Hiệu lực' }, { k: '0', l: 'Tạm dừng' }].map(t => (<Button key={t.k} size="sm" variant={ticketStatusFilter === t.k ? 'light' : 'link'} className={`text-decoration-none ${ticketStatusFilter === t.k ? 'text-primary fw-bold' : 'text-muted'}`} onClick={() => setTicketStatusFilter(t.k)}>{t.l}</Button>))}
              </div>
              <div className="d-flex gap-2">
                <Form.Control size="sm" type="text" placeholder="Biển số, tên khách..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} style={{ width: 200 }} />
                 <Button size="sm" variant="success" className="fw-bold text-nowrap" onClick={() => { setTicketForm({ ...EMPTY_FORM, parkingCardId: availableTicketCards.length === 0 ? 'new' : '' }); setNewCardCodeInput(''); setShowCreateTicket(true); }}>+ Cấp Vé Tháng</Button>
                <Button size="sm" variant="info" className="fw-bold text-white text-nowrap" onClick={() => { setEmpTicketForm({ ...EMPTY_EMP_FORM, parkingCardId: availableEmployeeCards.length === 0 ? 'new' : '' }); setNewEmpCardCodeInput(''); setMatchedEmpVehicle(null); setShowCreateEmpTicket(true); }}>+ Cấp Thẻ Nhân Viên</Button>
              </div>
            </div>
            <div className="table-responsive">
              <Table hover className="align-middle border-top mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light text-muted small"><tr>{['BIỂN SỐ', 'LOẠI XE', 'CHỦ XE / KHÁCH', 'NGUỒN', 'THẺ RFID', 'HIỆU LỰC', 'TRẠNG THÁI', 'THAO TÁC'].map(h => <th key={h} className="fw-bold">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} className="text-center py-4 text-muted">Đang tải vé tháng...</td></tr> : filteredTickets.length === 0 ? <tr><td colSpan={8} className="text-center py-4 text-muted">Chưa có vé tháng nào.</td></tr> : filteredTickets.map((t, i) => {
                    const veh = vehicles.find(v => String(v.vehicleId || v.vehiclesId || v.id) === String(t.vehicleId)) || t.vehicle || {};
                    const isGuest = !!t.guestName, owner = t.guestName || t.userFullName || veh.userFullName || '—', phone = t.guestPhone || '', plate = t.licensePlate || veh.licensePlate || '—', vtName = t.vehicleTypeName || veh.vehicleTypeName || '—', cardCode = t.cardCode || t.parkingCard?.cardCode || ('#' + t.parkingCardId), isActive = t.status === 1 || t.status === true, tid = getTicketId(t) || i;
                    return (
                      <tr key={tid}>
                        <td className="fw-bold text-primary">{plate}</td>
                        <td className="text-muted small">{vtName}</td>
                        <td><div className="fw-semibold text-primary">{owner}</div>{isGuest && phone && <div className="small text-muted">{phone}</div>}</td>
                        <td><Badge bg={isGuest ? 'warning' : 'success'} text={isGuest ? 'dark' : 'white'}>{isGuest ? 'Vãng lai' : 'Tài khoản'}</Badge></td>
                        <td className="text-muted small">{cardCode}</td>
                        <td className="small text-muted">{fmtDate(t.startDate)}<br />đến {fmtDate(t.endDate)}</td>
                        <td><Badge bg={isActive ? 'success' : 'secondary'}>{isActive ? 'Hiệu lực' : 'Tạm dừng'}</Badge></td>
                        <td>
                          <Button variant="link" size="sm" className={`text-decoration-none px-1 fw-bold ${isActive ? 'text-warning' : 'text-success'}`} onClick={() => handleToggleTicket(t)}>{isActive ? 'Dừng' : 'Kích hoạt'}</Button>
                          <Button variant="link" size="sm" className="text-danger text-decoration-none px-1" onClick={() => handleDeleteTicket(t)}>Xóa</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {mainTab === 'requests' && (
          <div className="p-3">
            <h5 className="fw-bold text-primary mb-3">Yêu cầu đăng ký thẻ tháng trực tuyến</h5>
            <div className="table-responsive">
              <Table hover className="align-middle border-top mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light text-muted small"><tr>{['THỜI GIAN', 'BIỂN SỐ', 'CHỦ XE', 'GÓI ĐĂNG KÝ', 'SỐ TIỀN', 'TRẠNG THÁI', 'THAO TÁC'].map(h => <th key={h} className="fw-bold">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} className="text-center py-4 text-muted">Đang tải yêu cầu...</td></tr> : requests.length === 0 ? <tr><td colSpan={7} className="text-center py-4 text-muted">Chưa có yêu cầu nào.</td></tr> : requests.map((r, i) => {
                    const plate = r.vehicle?.licensePlate || '—';
                    const owner = r.user?.fullName || r.user?.username || '—';
                    const policy = r.pricePolicy?.policyName || '—';
                    const isPending = r.status === 0;
                    const hasExisting = tickets.some(t => String(t.vehicleId || t.vehicle?.vehicleId) === String(r.vehicle?.vehicleId || r.vehicle?.id));
                    return (
                      <tr key={r.id || i}>
                        <td className="text-muted small">{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="fw-bold text-primary">{plate}</td>
                        <td className="fw-semibold">{owner}</td>
                        <td className="text-primary">
                          {policy}
                          <div>
                            {hasExisting ? (
                              <Badge bg="info" style={{ fontSize: '0.7rem' }}>🔄 Gia hạn</Badge>
                            ) : (
                              <Badge bg="primary" style={{ fontSize: '0.7rem' }}>✨ Đăng ký mới</Badge>
                            )}
                          </div>
                        </td>
                        <td className="fw-bold" style={{ color: '#059669' }}>
                          {r.pricePolicy?.basePrice ? `${Number(r.pricePolicy.basePrice).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td>
                          <Badge bg={r.status === 0 ? 'warning' : r.status === 1 ? 'success' : 'danger'} text={r.status === 0 ? 'dark' : 'white'}>
                            {r.status === 0 ? 'Chờ duyệt' : r.status === 1 ? 'Đã duyệt' : 'Từ chối'}
                          </Badge>
                        </td>
                        <td>
                          {isPending && (
                            <>
                              <Button variant="success" size="sm" className="fw-bold me-2 px-3" onClick={() => handleApproveRequest(r)}>
                                {hasExisting ? 'Duyệt gia hạn' : 'Duyệt / Cấp Thẻ'}
                              </Button>
                              <Button variant="danger" size="sm" className="fw-bold px-3" onClick={() => handleRejectRequest(r)}>Từ chối</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </Card>

      <Modal show={showCreateCard} onHide={() => setShowCreateCard(false)} centered>
        <Form onSubmit={handleCreateCard}>
          <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">Thêm thẻ RFID mới</Modal.Title></Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group><Form.Label className="small fw-bold text-muted">MÃ THẺ (RFID CODE)</Form.Label><Form.Control type="text" placeholder="VD: CARD-9921" value={createCardForm.cardCode} onChange={e => setCreateCardForm({ ...createCardForm, cardCode: e.target.value })} required /></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">LOẠI THẺ</Form.Label><Form.Select value={createCardForm.cardType} onChange={e => setCreateCardForm({ ...createCardForm, cardType: e.target.value })}><option value="NORMAL">Thẻ thường</option><option value="MONTHLY">Thẻ tháng (MONTH-)</option><option value="VIP">Thẻ VIP (VIP-)</option><option value="EMPLOYEE">Thẻ nhân viên (EMP-)</option></Form.Select></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">CHI NHÁNH</Form.Label><Form.Select value={createCardForm.parkingBranchId} onChange={e => setCreateCardForm({ ...createCardForm, parkingBranchId: e.target.value })} required disabled={!!cleanBranchId}><option value="">Chọn chi nhánh...</option>{branches.map(b => <option key={b.parkingBranchId} value={b.parkingBranchId}>{b.branchName || b.parkingBranchName}</option>)}</Form.Select></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowCreateCard(false)}>Hủy</Button><Button variant="primary" type="submit" disabled={submittingCard}>{submittingCard ? 'Đang xử lý...' : 'Lưu thẻ'}</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditCard} onHide={() => { setShowEditCard(false); setSelectedCard(null); }} centered>
        <Form onSubmit={handleEditCard}>
          <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">Chỉnh sửa thẻ RFID</Modal.Title></Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group><Form.Label className="small fw-bold text-muted">MÃ THẺ</Form.Label><Form.Control type="text" value={editCardForm.cardCode} onChange={e => setEditCardForm({ ...editCardForm, cardCode: e.target.value })} required /></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">LOẠI THẺ</Form.Label><Form.Select value={editCardForm.cardType} onChange={e => setEditCardForm({ ...editCardForm, cardType: e.target.value })}><option value="NORMAL">Thẻ thường</option><option value="MONTHLY">Thẻ tháng</option><option value="VIP">Thẻ VIP</option><option value="EMPLOYEE">Thẻ nhân viên</option></Form.Select></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">CHI NHÁNH</Form.Label><Form.Select value={editCardForm.parkingBranchId} onChange={e => setEditCardForm({ ...editCardForm, parkingBranchId: e.target.value })} disabled={!!cleanBranchId}><option value="">Chọn chi nhánh...</option>{branches.map(b => <option key={b.parkingBranchId} value={b.parkingBranchId}>{b.branchName || b.parkingBranchName}</option>)}</Form.Select></Form.Group>
            <Form.Group><Form.Label className="small fw-bold text-muted">TRẠNG THÁI</Form.Label><Form.Select value={editCardForm.status} onChange={e => setEditCardForm({ ...editCardForm, status: e.target.value })}><option value="AVAILABLE">Còn trống</option><option value="IN_USE">Đang sử dụng</option><option value="LOST">Báo mất</option><option value="DISABLED">Đã khóa</option></Form.Select></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={() => { setShowEditCard(false); setSelectedCard(null); }}>Hủy</Button><Button variant="primary" type="submit" disabled={submittingCard}>{submittingCard ? 'Đang xử lý...' : 'Lưu thay đổi'}</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showCreateTicket} onHide={() => setShowCreateTicket(false)} size="lg" centered>
        <Form onSubmit={handleCreateTicket}>
          <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">Cấp Vé Tháng mới</Modal.Title></Modal.Header>
          <Modal.Body className="d-flex flex-column gap-4">
            <div className="bg-light border rounded p-3">
              <div className="fw-bold text-primary small mb-2">Bước 1: Tìm xe theo biển số</div>
              <div className="d-flex gap-2">
                <Form.Control type="text" placeholder="Nhập biển số xe (VD: 59A1-55555)" value={ticketForm.licensePlateSearch} onChange={e => setTicketForm(prev => ({ ...prev, licensePlateSearch: e.target.value, vehicleId: '', vehicleSource: '' }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchVehicle())} />
                <Button variant="primary" className="fw-bold text-nowrap" onClick={handleSearchVehicle}>Tìm xe</Button>
              </div>
              {matchedVehicle && (
                <div className="bg-white border rounded p-2 mt-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold text-primary">{matchedVehicle.licensePlate}</div>
                    <div className="small text-muted">{[matchedVehicle.vehicleBrand, matchedVehicle.vehicleColor, matchedVehicle.vehicleTypeName].filter(Boolean).join(' - ')}</div>
                    {matchedVehicle.userFullName && <div className="small text-primary mt-1">Chủ xe: {matchedVehicle.userFullName}</div>}
                  </div>
                  <Badge bg={matchedVehicle.vehicleSource === 'GUEST' ? 'warning' : 'success'} text={matchedVehicle.vehicleSource === 'GUEST' ? 'dark' : 'white'}>{matchedVehicle.vehicleSource === 'GUEST' ? 'Khách vãng lai' : 'Có tài khoản'}</Badge>
                </div>
              )}
            </div>

            {matchedVehicle?.vehicleSource === 'GUEST' && (
              <div className="border border-warning bg-warning bg-opacity-10 rounded p-3">
                <div className="fw-bold text-warning small mb-2" style={{color: '#c2410c'}}>Bước 2: Thông tin khách vãng lai (bắt buộc)</div>
                <Row className="g-3">
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold text-muted">TÊN KHÁCH *</Form.Label><Form.Control type="text" placeholder="Nguyễn Văn A" value={ticketForm.guestName} onChange={e => setTicketForm(prev => ({ ...prev, guestName: e.target.value }))} /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold text-muted">SỐ ĐIỆN THOẠI *</Form.Label><Form.Control type="tel" placeholder="0909123456" value={ticketForm.guestPhone} onChange={e => setTicketForm(prev => ({ ...prev, guestPhone: e.target.value }))} /></Form.Group></Col>
                </Row>
              </div>
            )}

            <div className="bg-light border rounded p-3">
              <div className="fw-bold text-primary small mb-2">Bước {matchedVehicle?.vehicleSource === 'GUEST' ? '3' : '2'}: Chọn thẻ RFID và thời hạn</div>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">THẺ RFID *</Form.Label>
                    <Form.Select 
                      value={ticketForm.parkingCardId} 
                      onChange={e => {
                        setTicketForm(prev => ({ ...prev, parkingCardId: e.target.value }));
                        if (e.target.value !== 'new') setNewCardCodeInput('');
                      }} 
                      required
                    >
                      {availableTicketCards.length > 0 ? (
                        <>
                          <option value="">-- Chọn thẻ RFID --</option>
                          {availableTicketCards.map(c => { 
                            const code = (c.cardCode || '').startsWith('MONTH-') ? c.cardCode.replace('MONTH-', '') : c.cardCode; 
                            return <option key={c.parkingCardId} value={String(c.parkingCardId)}>{code} (TRỐNG)</option>; 
                          })}
                          <option value="new">+ Tạo thẻ mới</option>
                        </>
                      ) : (
                        <option value="new">Tạo thẻ mới (Không còn thẻ trống)</option>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">NGÀY BẮT ĐẦU *</Form.Label><Form.Control type="date" value={ticketForm.startDate} onChange={e => setTicketForm(prev => ({ ...prev, startDate: e.target.value }))} required /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">NGÀY KẾT THÚC *</Form.Label><Form.Control type="date" value={ticketForm.endDate} onChange={e => setTicketForm(prev => ({ ...prev, endDate: e.target.value }))} required /></Form.Group></Col>
              </Row>
              
              {ticketForm.parkingCardId === 'new' && (
                <Form.Group className="mt-3">
                  <Form.Label className="small fw-bold text-primary">MÃ THẺ RFID MỚI (Hệ thống tự tạo)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Nhập mã số thẻ mới (VD: 668899)" 
                    value={newCardCodeInput} 
                    onChange={e => setNewCardCodeInput(e.target.value)} 
                    required 
                  />
                  <small className="text-muted d-block mt-1">Thẻ mới với tiền tố MONTH- sẽ tự động được thêm và gán vào vé tháng này.</small>
                </Form.Group>
              )}
            </div>

            {ticketForm.vehicleId && ticketForm.parkingCardId && (
              <div className="bg-success bg-opacity-10 border border-success rounded p-3 small text-success">
                Xác nhận: Cấp vé cho xe {matchedVehicle?.licensePlate} → Thẻ {ticketForm.parkingCardId === 'new' ? `mới (MONTH-${newCardCodeInput})` : `ID #${ticketForm.parkingCardId}`}
                {matchedVehicle?.vehicleSource === 'GUEST' && ticketForm.guestName ? ' | Khách: ' + ticketForm.guestName + ' (' + ticketForm.guestPhone + ')' : matchedVehicle?.userFullName ? ' | Chủ xe: ' + matchedVehicle.userFullName : ''}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowCreateTicket(false)}>Hủy</Button><Button variant="success" type="submit" disabled={submittingTicket || !ticketForm.vehicleId}>{submittingTicket ? 'Đang xử lý...' : 'Cấp Vé Tháng'}</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showCreateEmpTicket} onHide={() => setShowCreateEmpTicket(false)} size="lg" centered>
        <Form onSubmit={handleCreateEmpTicket}>
          <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">Cấp thẻ Nhân viên mới</Modal.Title></Modal.Header>
          <Modal.Body className="d-flex flex-column gap-4">
            <div className="bg-light border rounded p-3">
              <div className="fw-bold text-primary small mb-2">Bước 1: Tìm xe nhân viên theo biển số</div>
              <div className="d-flex gap-2">
                <Form.Control type="text" placeholder="Nhập biển số xe nhân viên (VD: 30A-12345)" value={empTicketForm.licensePlateSearch} onChange={e => setEmpTicketForm(prev => ({ ...prev, licensePlateSearch: e.target.value, vehicleId: '' }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchEmpVehicle())} />
                <Button variant="primary" className="fw-bold text-nowrap" onClick={handleSearchEmpVehicle}>Tìm xe</Button>
              </div>
              {matchedEmpVehicle && (
                <div className="bg-white border rounded p-2 mt-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold text-primary">{matchedEmpVehicle.licensePlate}</div>
                    <div className="small text-muted">{[matchedEmpVehicle.vehicleBrand, matchedEmpVehicle.vehicleColor, matchedEmpVehicle.vehicleTypeName].filter(Boolean).join(' - ')}</div>
                    {matchedEmpVehicle.userFullName && <div className="small text-primary mt-1">Nhân viên: {matchedEmpVehicle.userFullName}</div>}
                  </div>
                  <Badge bg="success">Thành viên</Badge>
                </div>
              )}
            </div>

            <div className="bg-light border rounded p-3">
              <div className="fw-bold text-primary small mb-2">Bước 2: Chọn thẻ RFID nhân viên và thời hạn</div>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">THẺ NHÂN VIÊN (EMP-) *</Form.Label>
                    <Form.Select 
                      value={empTicketForm.parkingCardId} 
                      onChange={e => {
                        setEmpTicketForm(prev => ({ ...prev, parkingCardId: e.target.value }));
                        if (e.target.value !== 'new') setNewEmpCardCodeInput('');
                      }} 
                      required
                    >
                      {availableEmployeeCards.length > 0 ? (
                        <>
                          <option value="">-- Chọn thẻ RFID --</option>
                          {availableEmployeeCards.map(c => { 
                            const code = (c.cardCode || '').startsWith('EMP-') ? c.cardCode.replace('EMP-', '') : c.cardCode; 
                            return <option key={c.parkingCardId} value={String(c.parkingCardId)}>{code} (TRỐNG)</option>; 
                          })}
                          <option value="new">+ Tạo thẻ nhân viên mới</option>
                        </>
                      ) : (
                        <option value="new">Tạo thẻ mới (Không còn thẻ trống)</option>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">NGÀY BẮT ĐẦU *</Form.Label><Form.Control type="date" value={empTicketForm.startDate} onChange={e => setEmpTicketForm(prev => ({ ...prev, startDate: e.target.value }))} required /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">NGÀY KẾT THÚC *</Form.Label><Form.Control type="date" value={empTicketForm.endDate} onChange={e => setEmpTicketForm(prev => ({ ...prev, endDate: e.target.value }))} required /></Form.Group></Col>
              </Row>
              
              {empTicketForm.parkingCardId === 'new' && (
                <Form.Group className="mt-3">
                  <Form.Label className="small fw-bold text-primary">MÃ THẺ NHÂN VIÊN MỚI (Hệ thống tự tạo)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Nhập mã số thẻ nhân viên mới (VD: 775533)" 
                    value={newEmpCardCodeInput} 
                    onChange={e => setNewEmpCardCodeInput(e.target.value)} 
                    required 
                  />
                  <small className="text-muted d-block mt-1">Thẻ mới với tiền tố EMP- sẽ tự động được thêm và gán cho nhân viên này.</small>
                </Form.Group>
              )}
            </div>

            {empTicketForm.vehicleId && empTicketForm.parkingCardId && (
              <div className="bg-success bg-opacity-10 border border-success rounded p-3 small text-success">
                Xác nhận: Cấp thẻ nhân viên cho xe {matchedEmpVehicle?.licensePlate} → Thẻ {empTicketForm.parkingCardId === 'new' ? `mới (EMP-${newEmpCardCodeInput})` : `ID #${empTicketForm.parkingCardId}`}
                {matchedEmpVehicle?.userFullName ? ' | Nhân viên: ' + matchedEmpVehicle.userFullName : ''}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowCreateEmpTicket(false)}>Hủy</Button><Button variant="success" type="submit" disabled={submittingEmpTicket || !empTicketForm.vehicleId}>{submittingEmpTicket ? 'Đang xử lý...' : 'Cấp Thẻ Nhân Viên'}</Button></Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
