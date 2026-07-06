import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Card, Button, Form, Row, Col, Badge, Table, Spinner, ButtonGroup } from 'react-bootstrap';
import staffApi from '../../api/staffApi';
import parkingApi from '../../api/parkingApi';
import managerApi from '../../api/manager';
import ZoneOccupancyTable from './ZoneOccupancyTable';
import SupportPanel from './SupportPanel';

const GATE_ID = 'GATE-04';

export default function GateInPanel() {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  
  const [detected] = useState({ plateNumber: '', entryTime: '' });
  const [licensePlate, setLicensePlate] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [zones, setZones] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [isAutoPopulated, setIsAutoPopulated] = useState(false);
  const [vipVehicles, setVipVehicles] = useState([]);
  const [vipOwnerName, setVipOwnerName] = useState('');
  const [selectedVipVehicleId, setSelectedVipVehicleId] = useState('');
  const [isMonthlyOrVipCard, setIsMonthlyOrVipCard] = useState(false);

  const fetchStatsData = async () => {
    try {
      const data = await managerApi.getAllZones();
      const zoneList = Array.isArray(data) ? data : (data?.content || []);
      const formatted = zoneList.map(z => {
        const used = z.capacity - z.availableCapacity;
        return { category: z.zoneName, current: used, max: z.capacity, status: z.availableCapacity === 0 ? 'FULL' : 'NORMAL', flowPerHour: Math.max(1, Math.round(used / 4)) };
      });
      setZones(formatted);
    } catch (err) { console.error("Failed to fetch zones for table:", err); }

    try {
      const data = await managerApi.getAllSessions();
      const sessionList = Array.isArray(data) ? data : (data?.content || []);
      const sorted = sessionList.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)).slice(0, 6);
      setRecentSessions(sorted);
    } catch (err) { console.error("Failed to fetch recent sessions:", err); }
  };

  useEffect(() => {
    fetchStatsData();
    const interval = setInterval(fetchStatsData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const types = await staffApi.getVehicleTypes();
        setVehicleTypes(types);
        if (types && types.length > 0) setVehicleTypeId(types[0].vehicleTypeId);
      } catch (err) { toast.error('Không tải được danh sách loại xe từ server!'); }
    };
    fetchVehicleTypes();
  }, []);

  useEffect(() => { if (detected.plateNumber) setLicensePlate(detected.plateNumber); }, [detected.plateNumber]);

  useEffect(() => {
    const fetchVehiclesList = async () => {
      try {
        const data = await managerApi.getAllVehicles();
        setVehiclesList(Array.isArray(data) ? data : (data?.content || []));
      } catch (err) { console.error("Failed to load vehicles list for lookup:", err); }
    };
    fetchVehiclesList();
  }, []);

  const checkIsMonthlyOrVip = (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return false;
    return cleanCode.startsWith('MONTH-') || cleanCode.startsWith('VIP-') || isMonthlyOrVipCard;
  };

  const lookupCardCode = async (cleanCode) => {
    try {
      const ticketsData = await managerApi.getAllMonthlyTickets();
      const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.content || []);
      
      const matchTicket = tickets.find(t => {
        const tCode = (t.cardCode || t.parkingCard?.cardCode || '').trim().toUpperCase();
        return tCode === cleanCode || tCode === `MONTH-${cleanCode}` || tCode === `VIP-${cleanCode}` || cleanCode === `MONTH-${tCode}` || cleanCode === `VIP-${tCode}`;
      });
      
      if (matchTicket) {
        let v = matchTicket.vehicle || {};
        const ticketVehicleId = matchTicket.vehicleId || v.vehicleId;
        
        if (ticketVehicleId) {
          try {
            const fetched = await managerApi.getVehicleById(ticketVehicleId);
            if (fetched) v = fetched;
          } catch (err) {}
        }
        
        if (!v.vehicleColor || !v.vehicleBrand) {
          const localMatch = vehiclesList.find(x => String(x.vehicleId) === String(ticketVehicleId) || (x.licensePlate && v.licensePlate && x.licensePlate.toUpperCase().replace(/\s/g, '') === v.licensePlate.toUpperCase().replace(/\s/g, '')));
          if (localMatch) v = { ...localMatch, ...v };
        }

        const isVip = cleanCode.startsWith('VIP-') || (matchTicket.cardCode || '').startsWith('VIP-') || (matchTicket.parkingCard?.cardCode || '').startsWith('VIP-');
        
        if (isVip) {
          const ownerId = matchTicket.userId || matchTicket.user?.id || matchTicket.user?.userId || v.userId || v.user?.id || v.user?.userId;
          const ownerName = matchTicket.userFullName || matchTicket.user?.fullName || v.userFullName || v.user?.fullName || 'VIP Member';
          setVipOwnerName(ownerName);
          const uVehicles = vehiclesList.filter(x => {
            if (ownerId && String(x.userId || x.user?.id || x.user?.userId) === String(ownerId)) return true;
            if (ownerName && (x.userFullName || x.user?.fullName) === ownerName) return true;
            return false;
          });
          setVipVehicles(uVehicles.length > 0 ? uVehicles : [v]);
          setSelectedVipVehicleId(v.vehicleId || v.id || '');
        } else {
          setVipVehicles([]); setVipOwnerName(''); setSelectedVipVehicleId('');
        }

        const plate = v.licensePlate || matchTicket.licensePlate || '';
        setLicensePlate(plate);
        setVehicleColor(v.vehicleColor || '');
        setVehicleBrand(v.vehicleBrand || '');
        setIsAutoPopulated(true);
        setIsMonthlyOrVipCard(true);
        
        const vTypeId = v.vehicleTypeId || v.vehicleType?.vehicleTypeId || v.vehicleType?.id || matchTicket.vehicleTypeId;
        if (vTypeId) {
          setVehicleTypeId(vTypeId);
        } else {
          const matchTypeName = (v.vehicleTypeName || v.vehicleType?.typeName || '').toLowerCase();
          if (matchTypeName) {
            const matchedType = vehicleTypes.find(vt => (vt.typeName || '').toLowerCase().includes(matchTypeName) || matchTypeName.includes((vt.typeName || '').toLowerCase()));
            if (matchedType) setVehicleTypeId(matchedType.vehicleTypeId);
          }
        }
        toast.success(`Tìm thấy vé tháng/VIP hoạt động cho xe: ${plate}!`);
        return true;
      }

      const matchVehicle = vehiclesList.find(v => {
        const vCode = (v.cardCode || v.parkingCard?.cardCode || v.rfidCard?.cardCode || '').trim().toUpperCase();
        return vCode === cleanCode || vCode === `MONTH-${cleanCode}` || vCode === `VIP-${cleanCode}` || cleanCode === `MONTH-${vCode}` || cleanCode === `VIP-${vCode}`;
      });
      
      if (matchVehicle) {
        let v = matchVehicle;
        if (v.vehicleId) {
          try {
            const fetched = await managerApi.getVehicleById(v.vehicleId);
            if (fetched) v = fetched;
          } catch (err) {}
        }
        const isVip = cleanCode.startsWith('VIP-') || (v.cardCode || '').startsWith('VIP-') || (v.parkingCard?.cardCode || '').startsWith('VIP-') || (v.rfidCard?.cardCode || '').startsWith('VIP-');
        
        if (isVip) {
          const ownerId = v.userId || v.user?.id || v.user?.userId;
          const ownerName = v.userFullName || v.user?.fullName || 'VIP Member';
          setVipOwnerName(ownerName);
          const uVehicles = vehiclesList.filter(x => {
            if (ownerId && String(x.userId || x.user?.id || x.user?.userId) === String(ownerId)) return true;
            if (ownerName && (x.userFullName || x.user?.fullName) === ownerName) return true;
            return false;
          });
          setVipVehicles(uVehicles.length > 0 ? uVehicles : [v]);
          setSelectedVipVehicleId(v.vehicleId || v.id || '');
        } else {
          setVipVehicles([]); setVipOwnerName(''); setSelectedVipVehicleId('');
        }

        const plate = v.licensePlate || '';
        setLicensePlate(plate);
        setVehicleColor(v.vehicleColor || '');
        setVehicleBrand(v.vehicleBrand || '');
        setIsAutoPopulated(true);
        setIsMonthlyOrVipCard(isVip);
        
        const vTypeId = v.vehicleTypeId || v.vehicleType?.vehicleTypeId || v.vehicleType?.id;
        if (vTypeId) {
          setVehicleTypeId(vTypeId);
        } else {
          const matchTypeName = (v.vehicleTypeName || v.vehicleType?.typeName || '').toLowerCase();
          if (matchTypeName) {
            const matchedType = vehicleTypes.find(vt => (vt.typeName || '').toLowerCase().includes(matchTypeName) || matchTypeName.includes((vt.typeName || '').toLowerCase()));
            if (matchedType) setVehicleTypeId(matchedType.vehicleTypeId);
          }
        }
        toast.success(`Tìm thấy thông tin xe đăng ký: ${plate}`);
        return true;
      }
    } catch (err) { console.error("Lỗi khi tìm kiếm thông tin thẻ:", err); }
    return false;
  };

  useEffect(() => {
    const cleanCode = cardCode.trim().toUpperCase();
    if (!cleanCode) {
      if (isAutoPopulated) {
        setLicensePlate(''); setVehicleColor(''); setVehicleBrand('');
        if (vehicleTypes.length > 0) setVehicleTypeId(vehicleTypes[0].vehicleTypeId);
        setIsAutoPopulated(false); setIsMonthlyOrVipCard(false); setVipVehicles([]); setVipOwnerName(''); setSelectedVipVehicleId('');
      }
      return;
    }
    const isSpecial = cleanCode.startsWith('MONTH-') || cleanCode.startsWith('VIP-') || cleanCode.length >= 4;
    if (!isSpecial) return;

    const delayDebounce = setTimeout(async () => {
      const found = await lookupCardCode(cleanCode);
      if (!found && isAutoPopulated) {
        setLicensePlate(''); setVehicleColor(''); setVehicleBrand('');
        if (vehicleTypes.length > 0) setVehicleTypeId(vehicleTypes[0].vehicleTypeId);
        setIsAutoPopulated(false); setIsMonthlyOrVipCard(false); setVipVehicles([]); setVipOwnerName(''); setSelectedVipVehicleId('');
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [cardCode, vehiclesList, vehicleTypes]);

  const handleVipVehicleChange = (e) => {
    const vId = e.target.value;
    setSelectedVipVehicleId(vId);
    const chosen = vipVehicles.find(v => String(v.vehicleId || v.id) === String(vId));
    if (chosen) {
      setLicensePlate(chosen.licensePlate || '');
      setVehicleColor(chosen.vehicleColor || '');
      setVehicleBrand(chosen.vehicleBrand || '');
      const vTypeId = chosen.vehicleTypeId || chosen.vehicleType?.vehicleTypeId || chosen.vehicleType?.id;
      if (vTypeId) setVehicleTypeId(vTypeId);
      else {
        const matchTypeName = (chosen.vehicleTypeName || chosen.vehicleType?.typeName || '').toLowerCase();
        if (matchTypeName) {
          const matchedType = vehicleTypes.find(vt => (vt.typeName || '').toLowerCase().includes(matchTypeName) || matchTypeName.includes((vt.typeName || '').toLowerCase()));
          if (matchedType) setVehicleTypeId(matchedType.vehicleTypeId);
        }
      }
    }
  };

  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const handleLookupBooking = async () => {
    if (!bookingCode.trim()) return toast.error('Vui lòng nhập mã đặt chỗ!');
    try {
      const res = await parkingApi.getBookingByCode(bookingCode.trim());
      if (res) {
        setLicensePlate(res.licensePlate || '');
        if (res.vehicleTypeId) setVehicleTypeId(res.vehicleTypeId);
        setVehicleColor(res.vehicleColor || res.color || '');
        setVehicleBrand(res.vehicleBrand || res.brand || '');
        toast.success(`Tìm thấy đặt chỗ xe ${res.licensePlate} (${res.vehicleTypeName || 'Ô tô/Xe máy'})!`);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Không tìm thấy thông tin đặt chỗ!'); }
  };

  const handleConfirm = async () => {
    const isMOrV = checkIsMonthlyOrVip(cardCode);
    if (isBooking && !bookingCode.trim()) return toast.error('Vui lòng nhập mã đặt chỗ!');
    if (!isMOrV && !licensePlate) return toast.error('Vui lòng nhập biển số xe!');
    if (!cardCode) return toast.error('Vui lòng nhập mã thẻ!');
    if (!isMOrV && !vehicleTypeId) return toast.error('Vui lòng chọn loại xe!');
    if (selectedFiles.length === 0) return toast.error('Vui lòng chụp/tải lên ít nhất 1 ảnh phương tiện để AI kiểm tra!');

    setSubmitting(true);
    try {
      const verifyRes = await staffApi.verifyLicensePlate(licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''), selectedFiles[0]);
      if (verifyRes.matched) toast.success(`AI: ${verifyRes.message}`);
      else {
        toast.error(`AI Cảnh báo: ${verifyRes.message}`);
        setSubmitting(false);
        return;
      }

      let parkingSessionId;
      if (isBooking) {
        const checkInResult = await parkingApi.checkInBooking(bookingCode.trim(), cardCode.trim());
        parkingSessionId = checkInResult.parkingSessionId;
      } else {
        const checkInResult = await staffApi.confirmEntry({ licensePlate: licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''), vehicleTypeId: Number(vehicleTypeId), cardCode: cardCode.trim(), vehicleColor: vehicleColor.trim(), vehicleBrand: vehicleBrand.trim() });
        parkingSessionId = checkInResult.parkingSessionId;
      }

      if (selectedFiles.length > 0 && parkingSessionId) {
        await staffApi.uploadVehicleImages(parkingSessionId, 'CHECK_IN', selectedFiles);
      }

      toast.success(`Đã cấp thẻ & mở barie cho ${licensePlate}!`);
      setSelectedFiles([]); setCardCode(''); setLicensePlate('');
      if (isBooking) setBookingCode('');
      fetchStatsData();
    } catch (err) {
      let errorStr = err.message === 'Network Error' ? 'Không thể kết nối tới Backend!' : (err.response?.data?.message || err.response?.data || 'Lỗi server khi check-in!');
      toast.error(typeof errorStr === 'string' ? errorStr : 'Lỗi server khi check-in!');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-3 bg-dark text-white " style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Row className="g-4">
        {/* L/H Column */}
        <Col lg={8} className="d-flex flex-column gap-3">
          <CameraFeed label={`LÀN VÀO - ${GATE_ID}`} sub="CAM 01: NHẬN DIỆN BIỂN SỐ" status="SẴN SÀNG" tone="success" imageUrl={previewUrls.length > 0 ? previewUrls[0] : null} />

          <Card className="bg-secondary bg-opacity-25 border-0 shadow-sm p-3 text-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small text-light fw-bold">⚙️ Chi tiết phương tiện</span>
              <ButtonGroup size="sm">
                <Button variant={!isBooking ? 'info' : 'outline-light'} onClick={() => setIsBooking(false)} className="fw-bold">Khách vãng lai</Button>
                <Button variant={isBooking ? 'info' : 'outline-light'} onClick={() => setIsBooking(true)} className="fw-bold">Đã đặt trước</Button>
              </ButtonGroup>
            </div>

            {isBooking && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-light mb-1">MÃ ĐẶT CHỖ (NẾU CÓ)</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control type="text" className="bg-light text-dark border-0 fw-bold" placeholder="Nhập mã đặt chỗ..." value={bookingCode} onChange={e => setBookingCode(e.target.value)} />
                  <Button variant="primary" className="fw-bold px-4" onClick={handleLookupBooking}>Tra cứu</Button>
                </div>
              </Form.Group>
            )}

            {checkIsMonthlyOrVip(cardCode) && (
              <div className="p-2 rounded bg-info bg-opacity-25 border border-info text-info small fw-bold mb-3">
                🎟️ Hệ thống tự động nhận diện thông tin xe từ thẻ đăng ký. Chỉ cần nhập thẻ và xác nhận.
              </div>
            )}

            {vipVehicles.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-warning mb-1">⭐ CHỌN PHƯƠNG TIỆN VIP (CHỦ XE: {vipOwnerName.toUpperCase()})</Form.Label>
                <Form.Select className="bg-warning bg-opacity-10 border-warning text-warning fw-bold" value={selectedVipVehicleId} onChange={handleVipVehicleChange}>
                  {vipVehicles.map(v => <option key={v.vehicleId || v.id} value={v.vehicleId || v.id} className="bg-dark text-white">{v.licensePlate} — {v.vehicleBrand || 'Không rõ'} {v.vehicleColor || ''} ({v.vehicleTypeName || v.vehicleType?.typeName || 'Xe'})</option>)}
                </Form.Select>
              </Form.Group>
            )}

            {(() => {
              const isMOrV = checkIsMonthlyOrVip(cardCode);
              return (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className={`small fw-bold mb-1 ${isMOrV ? 'text-info' : 'text-light'}`}>BIỂN SỐ {isMOrV && '— THẺ ĐĂNG KÝ'}</Form.Label>
                    <Form.Control type="text" className={`fw-bold fs-5 ${isMOrV ? 'bg-info bg-opacity-25 text-info border-info' : 'bg-light text-dark border-0'}`} value={licensePlate} onChange={e => setLicensePlate(e.target.value)} readOnly={isMOrV} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-light mb-1">MÃ THẺ (QUẸT THẺ)</Form.Label>
                    <Form.Control type="text" className="bg-light text-dark border-0 fw-bold" value={cardCode} onChange={e => setCardCode(e.target.value)} />
                  </Form.Group>
                  <Row className="g-3 mb-3">
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className={`small fw-bold mb-1 ${isMOrV ? 'text-info' : 'text-light'}`}>MÀU XE</Form.Label>
                        <Form.Control type="text" className={`fw-bold ${isMOrV ? 'bg-info bg-opacity-25 text-info border-info' : 'bg-light text-dark border-0'}`} value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} readOnly={isMOrV} />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className={`small fw-bold mb-1 ${isMOrV ? 'text-info' : 'text-light'}`}>HIỆU XE</Form.Label>
                        <Form.Control type="text" className={`fw-bold ${isMOrV ? 'bg-info bg-opacity-25 text-info border-info' : 'bg-light text-dark border-0'}`} value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} readOnly={isMOrV} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="g-3 mb-3">
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-light mb-1">THỜI GIAN VÀO</Form.Label>
                        <Form.Control type="text" className="bg-light text-dark border-0 opacity-75" value={detected.entryTime} readOnly />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className={`small fw-bold mb-1 ${isMOrV ? 'text-info' : 'text-light'}`}>LOẠI XE</Form.Label>
                        <Form.Select className={`fw-bold ${isMOrV ? 'bg-info bg-opacity-25 text-info border-info' : 'bg-light text-dark border-0'}`} value={vehicleTypeId} onChange={e => setVehicleTypeId(e.target.value)} disabled={isMOrV}>
                          {vehicleTypes.map((type) => <option key={type.vehicleTypeId} value={type.vehicleTypeId}>{type.typeName}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              );
            })()}

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-light mb-1">ẢNH PHƯƠNG TIỆN</Form.Label>
              <Form.Control type="file" multiple accept="image/*" className="bg-light text-dark border-0 mb-2" onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  setSelectedFiles(prev => [...prev, ...newFiles.filter(nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size))]);
                  e.target.value = '';
                }
              }} />
              {selectedFiles.length > 0 && (
                <div className="bg-dark border border-secondary p-2 rounded">
                  <div className="small fw-bold text-success mb-2">Đã chọn ({selectedFiles.length}):</div>
                  <ul className="list-unstyled mb-0" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {selectedFiles.map((file, idx) => (
                      <li key={idx} className="d-flex justify-content-between align-items-center small text-light py-1">
                        <span className="text-truncate" style={{ maxWidth: '85%' }}>📷 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <Button variant="link" size="sm" className="text-danger p-0 text-decoration-none fw-bold" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}>✕</Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Form.Group>

            <Button variant="success" size="lg" className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2" disabled={submitting} onClick={handleConfirm}>
              {submitting ? <Spinner animation="border" size="sm" /> : '⚡'} PHÁT THẺ & MỞ BARIE
            </Button>
          </Card>
          
          <ZoneOccupancyTable zones={zones} />
        </Col>

        {/* R/H Column */}
        <Col lg={4} className="d-flex flex-column gap-3">
          <SupportPanel plateNumber={detected.plateNumber || licensePlate} gateId={GATE_ID} />

          <Card className="bg-secondary bg-opacity-25 border-0 shadow-sm p-3 text-white h-100">
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-2">
              <span className="fw-bold small">🚗 LƯỢT XE GỬI GẦN ĐÂY</span>
              <span className="small text-light fw-bold">Mới nhất</span>
            </div>
            <Table hover variant="dark" size="sm" className="align-middle small m-0 border-transparent bg-transparent">
              <thead><tr><th>BIỂN SỐ</th><th>THỜI GIAN</th><th>LOẠI XE</th><th>TRẠNG THÁI</th></tr></thead>
              <tbody>
                {recentSessions.length === 0 ? <tr><td colSpan="4" className="text-center text-light py-3">Chưa có lượt gửi xe nào gần đây</td></tr> : recentSessions.map((s, idx) => {
                  const checkInTimeStr = s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
                  const isActive = s.sessionStatus === 'ACTIVE' || (!s.checkOutTime && s.checkInTime);
                  return (
                    <tr key={s.parkingSessionId || idx}>
                      <td className="fw-bold text-info">{s.licensePlate}</td>
                      <td className="text-light">{checkInTimeStr}</td>
                      <td className="text-light">{s.vehicleTypeName || s.vehicleType?.typeName || 'Xe máy'}</td>
                      <td><Badge bg={isActive ? 'success' : 'info'}>{isActive ? 'Đang đỗ' : 'Đã ra'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export function CameraFeed({ label, sub, status = 'SẴN SÀNG', tone = 'success', imageUrl }) {
  return (
    <Card className="bg-secondary bg-opacity-25 border-0 overflow-hidden text-white shadow-sm">
      <div className="d-flex justify-content-between align-items-center p-2 px-3 border-bottom border-secondary small">
        <span className="text-light fw-bold">📷 {label}</span>
        <Badge bg={tone}>{status}</Badge>
      </div>
      <div className="position-relative d-flex align-items-center justify-content-center bg-black" style={{ height: 220, background: imageUrl ? `url(${imageUrl}) center/contain no-repeat #000` : 'linear-gradient(135deg, #0b1120, #111827)' }}>
        {!imageUrl && <span className="text-light small">{sub}</span>}
        <Badge bg="success" className="bg-opacity-25 text-success border border-success position-absolute bottom-0 start-0 m-2 px-2 py-1">● ĐANG NHẬN DIỆN...</Badge>
      </div>
    </Card>
  );
}
