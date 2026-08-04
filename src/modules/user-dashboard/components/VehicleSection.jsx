// VehicleSection - Quản lý danh sách phương tiện của người dùng
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import parkingApi from '../../search/api/parkingApi';
import { formatDate } from '../../../shared/utils/format';
import { isVehicleCompatibleWithPolicy, getPolicyVehicleTypeId, getVehicleTypeId } from '../../../shared/utils/vehiclePackageValidation';

const getDaysLeft = (dateStr) => {
  if (!dateStr) return null;
  const diffTime = new Date(dateStr) - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function VehicleSection() {
  const location = useLocation();
  const userId = localStorage.getItem('userId');

  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [packages, setPackages] = useState([]);
  const [branches, setBranches] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Vehicle Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({ licensePlate: '', vehicleColor: '', vehicleBrand: '', vehicleTypeId: '' });
  const [submitting, setSubmitting] = useState(false);

  // Subscribe / Renew Modal
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: form, 2: payment, 3: completed
  const [subscribeMode, setSubscribeMode] = useState('new'); // 'new' | 'renew'
  const [renewTicket, setRenewTicket] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [subscribeVehicleId, setSubscribeVehicleId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [newVehicleData, setNewVehicleData] = useState({ licensePlate: '', vehicleColor: '', vehicleBrand: '' });
  // Payment result
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentQrData, setPaymentQrData] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState(null);
  const [submittedLicensePlate, setSubmittedLicensePlate] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [vehRes, typeRes, pkgRes, brRes, ticketsRes, reqsRes] = await Promise.all([
        parkingApi.getAllVehicles().catch(() => []),
        parkingApi.getAllVehicleTypes().catch(() => []),
        parkingApi.getAllPricePolicies().catch(() => []),
        parkingApi.getAllBranches().catch(() => []),
        parkingApi.getMyMonthlyTickets().catch(() => []),
        parkingApi.getMyMonthlyTicketRequests().catch(() => []),
      ]);
      const allVeh = Array.isArray(vehRes) ? vehRes : (vehRes?.content || vehRes?.data || []);
      setVehicles(allVeh.filter(v => String(v.userId) === String(userId) && !v.deleted));
      setMyTickets(Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.content || ticketsRes?.data || []));
      setMyRequests(Array.isArray(reqsRes) ? reqsRes : (reqsRes?.content || reqsRes?.data || []));

      if (typeRes) {
        const tList = Array.isArray(typeRes) ? typeRes : (typeRes?.content || typeRes?.data || []);
        setVehicleTypes(tList);
        if (tList.length > 0) setFormData(prev => ({ ...prev, vehicleTypeId: tList[0].vehicleTypeId }));
      }
      if (pkgRes) {
        const pList = Array.isArray(pkgRes) ? pkgRes : (pkgRes?.content || pkgRes?.data || []);
        setPackages(pList.filter(p => p.active && (p.policyName || '').startsWith('[Gói')));
      }
      if (brRes) {
        const bList = Array.isArray(brRes) ? brRes : (brRes?.content || brRes?.data || []);
        setBranches(bList);
        if (bList.length > 0) setSelectedBranchId(String(bList[0].parkingBranchId || bList[0].id));
      }
    } catch (err) {
      console.error('Failed to load vehicle data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  // ---- Vehicle CRUD ----
  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedVehicle(null);
    setFormData({ licensePlate: '', vehicleColor: '', vehicleBrand: '', vehicleTypeId: vehicleTypes[0]?.vehicleTypeId || '' });
    setShowModal(true);
  };
  const handleOpenEdit = (v) => {
    setModalMode('edit');
    setSelectedVehicle(v);
    setFormData({ licensePlate: v.licensePlate || '', vehicleColor: v.vehicleColor || '', vehicleBrand: v.vehicleBrand || '', vehicleTypeId: v.vehicleTypeId || '' });
    setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.licensePlate.trim()) return toast.warning('Vui lòng nhập biển số xe!');
    setSubmitting(true);
    try {
      const payload = {
        licensePlate: formData.licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''),
        vehicleColor: formData.vehicleColor.trim(),
        vehicleBrand: formData.vehicleBrand.trim(),
        vehicleTypeId: Number(formData.vehicleTypeId),
        userId: Number(userId),
      };
      if (modalMode === 'add') { await parkingApi.createVehicle(payload); toast.success('Thêm phương tiện mới thành công!'); }
      else { await parkingApi.updateVehicle(selectedVehicle.vehicleId, payload); toast.success('Cập nhật thông tin phương tiện thành công!'); }
      setShowModal(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Lỗi lưu thông tin phương tiện!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally { setSubmitting(false); }
  };
  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phương tiện này?')) return;
    try { await parkingApi.deleteVehicle(vehicleId); toast.success('Xóa phương tiện thành công!'); loadData(); }
    catch { toast.error('Không thể xóa phương tiện này!'); }
  };

  // ---- Subscribe / Renew ----
  const handleSubscribeClick = (pkg) => {
    if (getPackageStatusForUser(pkg) === 'FULLY_REGISTERED') {
      toast.info('Phương tiện thuộc loại xe này đã có thẻ đỗ xe/vé tháng hoạt động.');
      return;
    }
    setSubscribeMode('new');
    setRenewTicket(null);
    setSelectedPackage(pkg);
    const matching = vehicles.filter(v => isVehicleCompatibleWithPolicy(v, pkg) && !isVehicleRegistered(v));
    setSubscribeVehicleId(matching.length > 0 ? String(matching[0].vehicleId || matching[0].vehiclesId || matching[0].id) : 'new');
    const defaultTypeId = getPolicyVehicleTypeId(pkg) || (vehicleTypes.length > 0 ? String(vehicleTypes[0].vehicleTypeId || vehicleTypes[0].id) : '');
    setNewVehicleData({ licensePlate: '', vehicleBrand: '', vehicleColor: '', vehicleTypeId: defaultTypeId });
    setModalStep(1);
    setPaymentUrl(''); setPaymentQrData(''); setPaymentError('');
    setShowSubscribeModal(true);
  };

  const handleRenewClick = (ticket) => {
    const vehicleId = ticket.vehicle?.vehicleId
      || ticket.vehicle?.vehiclesId
      || ticket.vehicleId
      || ticket.vehiclesId;
    const vehicle = vehicles.find(v =>
      String(v.vehicleId || v.vehiclesId || v.id) === String(vehicleId)
    ) || ticket.vehicle;
    const policyId = ticket.pricePolicy?.pricePolicyId
      || ticket.pricePolicyId
      || ticket.policy?.pricePolicyId
      || ticket.policyId;
    const policyName = ticket.pricePolicy?.policyName
      || ticket.policy?.policyName
      || ticket.policyName;
    const pkg = packages.find(p =>
      policyId != null && String(p.pricePolicyId || p.id) === String(policyId)
    ) || packages.find(p =>
      policyName && p.policyName === policyName && isVehicleCompatibleWithPolicy(vehicle, p)
    );

    if (!pkg) {
      toast.error('Không tìm thấy đúng gói hiện tại của vé. Vui lòng liên hệ quản lý để kiểm tra dữ liệu gói.');
      return;
    }

    if (!vehicle || !isVehicleCompatibleWithPolicy(vehicle, pkg)) {
      toast.error('Gói hiện tại không phù hợp với loại phương tiện. Không thể gia hạn.');
      return;
    }

    setSubscribeMode('renew');
    setRenewTicket(ticket);
    setSelectedPackage(pkg);
    const branchId = ticket.branch?.parkingBranchId || ticket.branchId || ticket.parkingBranchId;
    setSelectedBranchId(branchId ? String(branchId) : (branches.length > 0 ? String(branches[0].parkingBranchId || branches[0].id) : ''));
    setSubscribeVehicleId(String(vehicleId));
    setNewVehicleData({ licensePlate: '', vehicleBrand: '', vehicleColor: '' });
    setModalStep(1);
    setPaymentUrl(''); setPaymentQrData(''); setPaymentError('');
    setShowSubscribeModal(true);
  };

  useEffect(() => {
    if (packages.length > 0 && location.state?.autoSubscribePackage) {
      const targetPkg = packages.find(p => String(p.pricePolicyId || p.id) === String(location.state.autoSubscribePackage.policyId || location.state.autoSubscribePackage.id));
      if (targetPkg) { handleSubscribeClick(targetPkg); window.history.replaceState({}, document.title); }
    }
  }, [packages, location.state]);

  const handleConfirmSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedBranchId) return toast.warning('Vui lòng chọn chi nhánh đăng ký!');
    if (!selectedPackage) return toast.warning('Vui lòng chọn gói dịch vụ!');

    if (subscribeVehicleId !== 'new' && subscribeMode !== 'renew') {
      const selectedVehicle = vehicles.find(v =>
        String(v.vehicleId || v.vehiclesId || v.id) === String(subscribeVehicleId)
      );
      if (!selectedVehicle) return toast.error('Không tìm thấy phương tiện đã chọn.');
      if (!isVehicleCompatibleWithPolicy(selectedVehicle, selectedPackage)) {
        return toast.error('Loại phương tiện không phù hợp với gói dịch vụ đã chọn.');
      }
      if (isVehicleRegistered(selectedVehicle)) {
        return toast.error('Phương tiện này đã có thẻ tháng hoặc yêu cầu đang được xử lý.');
      }
    }

    const renewalTicketId = renewTicket?.ticketId || renewTicket?.monthlyTicketId || renewTicket?.id;
    if (subscribeMode === 'renew' && !renewalTicketId) {
      return toast.error('Không tìm thấy mã vé hiện tại để gia hạn.');
    }
    let finalLicensePlate = '';
    let createdRequestId = null;
    setSubmitting(true);
    setPaymentUrl('');
    setPaymentQrData('');
    setPaymentError('');
    try {
      // Step 1: Create/find vehicle & submit ticket request
      let vehicleId;
      if (subscribeVehicleId === 'new') {
        if (!newVehicleData.licensePlate.trim()) { setSubmitting(false); return toast.warning('Vui lòng nhập biển số xe!'); }
        const policyVehicleTypeId = newVehicleData.vehicleTypeId || getPolicyVehicleTypeId(selectedPackage) || (vehicleTypes.length > 0 ? vehicleTypes[0].vehicleTypeId : null);
        if (!policyVehicleTypeId) { setSubmitting(false); return toast.error('Vui lòng chọn loại phương tiện.'); }
        const created = await parkingApi.createVehicle({
          licensePlate: newVehicleData.licensePlate.trim().replace(/[^A-Za-z0-9\-.]/g, ''),
          vehicleColor: newVehicleData.vehicleColor.trim(),
          vehicleBrand: newVehicleData.vehicleBrand.trim(),
          vehicleTypeId: Number(policyVehicleTypeId),
          userId: Number(userId),
        });
        vehicleId = created.vehicleId || created.vehiclesId || created.id;
        finalLicensePlate = created.licensePlate;
      } else {
        const vehicle = vehicles.find(v => String(v.vehicleId || v.vehiclesId || v.id) === String(subscribeVehicleId));
        vehicleId = vehicle?.vehicleId || vehicle?.vehiclesId || vehicle?.id;
        finalLicensePlate = vehicle?.licensePlate;
      }

      const requestPayload = {
        policyId: selectedPackage.pricePolicyId || selectedPackage.id,
        branchId: Number(selectedBranchId),
      };

      const reqResult = subscribeMode === 'renew'
        ? await parkingApi.submitRenewalRequest(renewalTicketId, requestPayload)
        : await parkingApi.submitMonthlyTicketRequest({
          ...requestPayload,
          vehicleId,
        });
      createdRequestId = reqResult?.requestId
        || reqResult?.monthlyTicketRequestId
        || reqResult?.monthlyTicketRequest?.id
        || reqResult?.id;
      setSubmittedRequestId(createdRequestId);
      setSubmittedLicensePlate(finalLicensePlate);

      // Step 2: Try to get VNPay payment URL
      if (createdRequestId) {
        try {
          const payRes = await parkingApi.createMonthlyTicketPayment(createdRequestId);
          const pUrl = payRes?.paymentUrl || payRes?.url || payRes?.redirectUrl || payRes;
          if (typeof pUrl === 'string' && pUrl.startsWith('http')) {
            setPaymentUrl(pUrl);
            setPaymentQrData(pUrl);
          } else if (payRes?.qrCode) {
            setPaymentQrData(payRes.qrCode);
          } else {
            setPaymentError('no_payment_url');
          }
        } catch (payErr) {
          console.warn('Payment URL fetch failed:', payErr);
          setPaymentError('api_error');
        }
      } else {
        setPaymentError('no_request_id');
      }

      setModalStep(2);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Lỗi gửi yêu cầu!';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi kết nối server!');
    } finally { setSubmitting(false); }
  };

  const handleCloseSubscribeModal = () => {
    setShowSubscribeModal(false);
    setModalStep(1);
    setPaymentUrl('');
    setPaymentQrData('');
    setPaymentError('');
    setSubmittedRequestId(null);
  };

  const getRequestId = (request) => request?.requestId || request?.monthlyTicketRequestId || request?.id;

  const handlePayPendingRequest = async (request) => {
    const requestId = getRequestId(request);
    if (!requestId) {
      toast.error('Không tìm thấy mã yêu cầu để thanh toán.');
      return;
    }

    const policyId = request.pricePolicy?.pricePolicyId || request.pricePolicyId || request.policy?.pricePolicyId || request.policyId;
    const packageForRequest = packages.find(p => String(p.pricePolicyId || p.id) === String(policyId))
      || packages.find(p => p.policyName === (request.pricePolicy?.policyName || request.policyName))
      || request.pricePolicy
      || request.policy;
    const vehicleId = request.vehicle?.vehicleId || request.vehicle?.vehiclesId || request.vehicle?.id || request.vehicleId || request.vehiclesId;
    const branchId = request.branch?.parkingBranchId || request.branch?.id || request.parkingBranchId || request.branchId;

    setProcessingRequestId(String(requestId));
    setSelectedPackage(packageForRequest || null);
    setSubscribeVehicleId(vehicleId ? String(vehicleId) : '');
    setSelectedBranchId(branchId ? String(branchId) : '');
    setSubmittedRequestId(requestId);
    setSubmittedLicensePlate(request.vehicle?.licensePlate || request.licensePlate || '');
    setPaymentUrl('');
    setPaymentQrData('');
    setPaymentError('');

    try {
      const paymentResponse = await parkingApi.createMonthlyTicketPayment(requestId);
      const url = paymentResponse?.paymentUrl || paymentResponse?.url || paymentResponse?.redirectUrl || paymentResponse;
      if (typeof url === 'string' && url.startsWith('http')) {
        setPaymentUrl(url);
        setPaymentQrData(url);
      } else if (paymentResponse?.qrCode) {
        setPaymentQrData(paymentResponse.qrCode);
      } else {
        setPaymentError('no_payment_url');
      }
      setModalStep(2);
      setShowSubscribeModal(true);
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data || 'Không thể tạo liên kết thanh toán VNPay.';
      toast.error(typeof message === 'string' ? message : 'Không thể tạo liên kết thanh toán VNPay.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleCancelPendingRequest = async (request) => {
    const requestId = getRequestId(request);
    if (!requestId) {
      toast.error('Không tìm thấy mã yêu cầu để hủy.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu đăng ký gói này?')) return;

    setProcessingRequestId(String(requestId));
    try {
      await parkingApi.cancelMyMonthlyTicketRequest(requestId);
      toast.success('Đã hủy yêu cầu đăng ký gói.');
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data || 'Không thể hủy yêu cầu vào lúc này.';
      toast.error(typeof message === 'string' ? message : 'Không thể hủy yêu cầu vào lúc này.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const activeTickets = myTickets.filter(t => t.status === 1 || t.status === true || t.status === 'ACTIVE');
  const expiredTickets = myTickets.filter(t => t.status === 0 || t.status === false || t.status === 'EXPIRED' || t.status === 'INACTIVE');

  // Requests currently pending approval
  const pendingRequests = myRequests.filter(r => {
    const st = String(r.status ?? '').toUpperCase();
    return st !== 'REJECTED' && st !== 'CANCELLED' && st !== 'REJECTED_BY_USER' && st !== 'APPROVED' && st !== '2';
  });

  const activeVehicleIds = new Set(
    activeTickets.map(t => t.vehicle?.vehicleId || t.vehicle?.vehiclesId || t.vehicle?.id || t.vehicleId || t.vehiclesId).filter(Boolean).map(String)
  );
  const activeLicensePlates = new Set(
    activeTickets.map(t => t.vehicle?.licensePlate || t.licensePlate).filter(Boolean)
  );

  const isVehicleActive = (v) => {
    if (!v) return false;
    const id = String(v.vehicleId || v.vehiclesId || v.id || '');
    const plate = v.licensePlate;
    return (id && activeVehicleIds.has(id)) || (plate && activeLicensePlates.has(plate));
  };

  const pendingVehicleIds = new Set(
    pendingRequests.map(r => r.vehicle?.vehicleId || r.vehicle?.vehiclesId || r.vehicle?.id || r.vehicleId || r.vehiclesId).filter(Boolean).map(String)
  );
  const pendingLicensePlates = new Set(
    pendingRequests.map(r => r.vehicle?.licensePlate || r.licensePlate).filter(Boolean)
  );

  const isVehiclePending = (v) => {
    if (!v) return false;
    const id = String(v.vehicleId || v.vehiclesId || v.id || '');
    const plate = v.licensePlate;
    return (id && pendingVehicleIds.has(id)) || (plate && pendingLicensePlates.has(plate));
  };

  const registeredVehicleIds = new Set([...activeVehicleIds, ...pendingVehicleIds]);
  const registeredLicensePlates = new Set([...activeLicensePlates, ...pendingLicensePlates]);

  const isVehicleRegistered = (v) => {
    if (!v) return false;
    const id = String(v.vehicleId || v.vehiclesId || v.id || '');
    const plate = v.licensePlate;
    return (id && registeredVehicleIds.has(id)) || (plate && registeredLicensePlates.has(plate));
  };

  const getPackageStatusForUser = (pkg) => {
    const compatible = vehicles.filter(v => isVehicleCompatibleWithPolicy(v, pkg));

    if (compatible.length > 0) {
      const activeCompatible = compatible.filter(v => isVehicleActive(v));
      if (activeCompatible.length === compatible.length) {
        return 'FULLY_REGISTERED';
      }
      const unregistered = compatible.filter(v => !isVehicleRegistered(v));
      if (unregistered.length === 0) {
        return 'PENDING_APPROVAL';
      }
      return 'CAN_REGISTER';
    }

    const policyVehicleTypeId = getPolicyVehicleTypeId(pkg);
    const hasActiveTicketForType = activeTickets.some(t => {
      const tPolicyTypeId = getPolicyVehicleTypeId(t.pricePolicy || t.policy);
      const tVehicleTypeId = t.vehicle ? getVehicleTypeId(t.vehicle) : null;
      return policyVehicleTypeId && (
        String(tPolicyTypeId) === String(policyVehicleTypeId) ||
        String(tVehicleTypeId) === String(policyVehicleTypeId)
      );
    });
    if (hasActiveTicketForType) return 'FULLY_REGISTERED';

    const hasPendingReqForType = pendingRequests.some(r => {
      const rPolicyTypeId = getPolicyVehicleTypeId(r.pricePolicy || r.policy);
      const rVehicleTypeId = r.vehicle ? getVehicleTypeId(r.vehicle) : null;
      return policyVehicleTypeId && (
        String(rPolicyTypeId) === String(policyVehicleTypeId) ||
        String(rVehicleTypeId) === String(policyVehicleTypeId)
      );
    });
    if (hasPendingReqForType) return 'PENDING_APPROVAL';

    return 'CAN_REGISTER';
  };

  const matchingVehicles = selectedPackage
    ? vehicles.filter(v => isVehicleCompatibleWithPolicy(v, selectedPackage) && !isVehicleRegistered(v))
    : vehicles.filter(v => !isVehicleRegistered(v));

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border" style={{ color: '#164e63' }} role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: '#164e63' }}>Phương tiện &amp; Gói cước</h3>
        <p className="text-muted m-0">Quản lý các phương tiện đã đăng ký và đăng ký các gói dịch vụ đỗ xe của bạn.</p>
      </div>

      {/* ===== GÓI CƯỚC ĐÃ ĐĂNG KÝ HOẶC ĐANG DUYỆT ===== */}
      {(activeTickets.length > 0 || pendingRequests.length > 0 || expiredTickets.length > 0) && (
        <div className="mb-5">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <span className="text-success fs-5">🎟️</span> Gói cước đã đăng ký &amp; yêu cầu
          </h6>

          {/* Thẻ / Yêu cầu đang trong quá trình duyệt */}
          {pendingRequests.length > 0 && (
            <div className="d-flex flex-column gap-3 mb-3">
              {pendingRequests.map((req, idx) => {
                const requestId = getRequestId(req);
                const isProcessing = String(processingRequestId) === String(requestId);
                const plate = req.vehicle?.licensePlate || req.licensePlate || '—';
                const rawName = req.pricePolicy?.policyName || req.policyName || 'Gói tháng';
                const pName = rawName.replace('[Gói Tháng] ', '').replace('[Gói VIP President] ', '').replace('[Gói ', '').replace(']', '');
                const bName = req.branch?.branchName || req.branchName || req.parkingBranchName || '—';
                const statusStr = String(req.status ?? '').toUpperCase();
                const isAwaitingPayment = statusStr === 'PENDING_PAYMENT' || statusStr === '0';
                const isAwaitingApproval = statusStr === 'PENDING_APPROVAL' || statusStr === '1';
                return (
                  <div key={req.requestId || req.monthlyTicketRequestId || req.id || idx}
                    className="card rounded-4 shadow-sm overflow-hidden"
                    style={{ border: '1.5px solid #facc15', background: 'linear-gradient(135deg, #fefce8, #fef08a)' }}>
                    <div className="px-4 py-2 d-flex justify-content-between align-items-center" style={{ background: '#eab308' }}>
                      <span className="text-dark fw-bold small">
                        {isAwaitingPayment ? '💳 Chờ thanh toán' : '⏳ Đang trong quá trình duyệt'}
                      </span>
                      <span className="text-dark small fw-semibold opacity-90">
                        {isAwaitingPayment ? 'Vui lòng hoàn tất thanh toán' : 'Chờ Ban Quản Lý phê duyệt'}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <div className="row g-3 align-items-center">
                        <div className="col-md">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 52, height: 52, background: '#fef9c3', fontSize: '1.6rem' }}>📝</div>
                            <div className="flex-grow-1">
                              <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>{pName}</div>
                              <div className="d-flex flex-wrap gap-3 small text-muted">
                                <span>🚗 Biển số: <strong className="text-dark">{plate}</strong></span>
                                <span>📍 Bãi đỗ: <strong className="text-dark">{bName}</strong></span>
                              </div>
                              <div className="small text-warning-emphasis mt-1 fw-medium" style={{ fontSize: '0.8rem', color: '#854d0e' }}>
                                {isAwaitingPayment
                                  ? 'ℹ️ Yêu cầu đã được ghi nhận. Vui lòng thanh toán để gửi cho Ban Quản Lý phê duyệt.'
                                  : 'ℹ️ Đã thanh toán thành công. Yêu cầu đang chờ Ban Quản Lý phê duyệt & kích hoạt.'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-auto d-flex gap-2 justify-content-md-end">
                          {isAwaitingPayment && (
                            <button
                              type="button"
                              className="btn btn-primary fw-bold rounded-pill px-3"
                              disabled={isProcessing}
                              onClick={() => handlePayPendingRequest(req)}
                            >
                              {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-danger fw-bold rounded-pill px-3"
                            disabled={isProcessing}
                            onClick={() => handleCancelPendingRequest(req)}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTickets.length > 0 && (
            <div className="d-flex flex-column gap-3 mb-3">
              {activeTickets.map((ticket, idx) => {
                const daysLeft = getDaysLeft(ticket.endDate || ticket.expiryDate);
                const expiring = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
                const plate = ticket.vehicle?.licensePlate || ticket.licensePlate || '—';
                const rawName = ticket.pricePolicy?.policyName || ticket.policyName || 'Gói tháng';
                const pName = rawName.replace('[Gói Tháng] ', '').replace('[Gói VIP President] ', '').replace('[Gói ', '').replace(']', '');
                const bName = ticket.branch?.branchName || ticket.branchName || ticket.parkingBranchName || '—';
                const cardCode = ticket.parkingCard?.cardCode || ticket.cardCode;
                return (
                  <div key={ticket.monthlyTicketId || ticket.id || idx}
                    className="card rounded-4 shadow-sm overflow-hidden"
                    style={{ border: `1.5px solid ${expiring ? '#f59e0b' : '#86efac'}`, background: expiring ? 'linear-gradient(135deg,#fffbeb,#fef9c3)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                    <div className="px-4 py-2 d-flex justify-content-between align-items-center" style={{ background: expiring ? '#f59e0b' : '#16a34a' }}>
                      <span className="text-white fw-bold small">{expiring ? '⚠️ Sắp hết hạn' : '✅ Đang hoạt động'}</span>
                      {daysLeft !== null && <span className="text-white small fw-semibold opacity-90">{daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Hết hạn hôm nay'}</span>}
                    </div>
                    <div className="px-4 py-3">
                      <div className="row g-3 align-items-center">
                        <div className="col-md-8">
                          <div className="d-flex align-items-start gap-3">
                            <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 52, height: 52, background: expiring ? '#fef3c7' : '#dcfce7', fontSize: '1.6rem' }}>🎫</div>
                            <div>
                              <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>{pName}</div>
                              <div className="d-flex flex-wrap gap-3 small text-muted">
                                <span>🚗 <strong className="text-dark">{plate}</strong></span>
                                <span>📍 {bName}</span>
                                {cardCode && <span>🪪 Thẻ: <strong className="text-dark">{cardCode}</strong></span>}
                              </div>
                              <div className="d-flex flex-wrap gap-3 small text-muted mt-1">
                                {ticket.startDate && <span>📅 Bắt đầu: {formatDate(ticket.startDate)}</span>}
                                {(ticket.endDate || ticket.expiryDate) && (
                                  <span>⏰ Hết hạn: <strong style={{ color: expiring ? '#b45309' : '#15803d' }}>{formatDate(ticket.endDate || ticket.expiryDate)}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 d-flex flex-column gap-2 align-items-md-end">
                          <button
                            className="btn fw-bold px-4 rounded-pill text-white d-flex align-items-center gap-2"
                            style={{ background: expiring ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#164e63,#0e7490)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                            onClick={() => handleRenewClick(ticket)}>
                            🔄 Gia hạn gói
                          </button>
                          {expiring && (
                            <span className="badge text-warning bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-pill px-3 py-1 small">
                              ⚠️ Hãy gia hạn trước khi hết hạn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {expiredTickets.length > 0 && (
            <div className="d-flex flex-column gap-2">
              <p className="small text-muted fw-semibold mb-1">Gói đã hết hạn:</p>
              {expiredTickets.map((ticket, idx) => {
                const plate = ticket.vehicle?.licensePlate || ticket.licensePlate || '—';
                const rawName = ticket.pricePolicy?.policyName || ticket.policyName || 'Gói tháng';
                const pName = rawName.replace('[Gói Tháng] ', '').replace('[Gói VIP President] ', '');
                const bName = ticket.branch?.branchName || ticket.branchName || '—';
                return (
                  <div key={ticket.monthlyTicketId || ticket.id || idx}
                    className="card rounded-3 border p-3 d-flex flex-row align-items-center justify-content-between gap-3"
                    style={{ background: '#f8fafc', borderColor: '#e2e8f0', opacity: 0.85 }}>
                    <div className="d-flex align-items-center gap-3">
                      <span style={{ fontSize: '1.3rem', opacity: 0.5 }}>🎫</span>
                      <div>
                        <div className="fw-semibold text-muted small">{pName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>🚗 {plate} &nbsp;·&nbsp; 📍 {bName} &nbsp;·&nbsp; Hết hạn: {formatDate(ticket.endDate || ticket.expiryDate)}</div>
                      </div>
                    </div>
                    <button className="btn btn-sm fw-bold rounded-pill px-3"
                      style={{ border: '1.5px solid #164e63', color: '#164e63', background: 'white' }}
                      onClick={() => handleRenewClick(ticket)}>Đăng ký lại</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="row g-4">
        {/* Cột Trái */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
            <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <span className="text-info fs-5">🚘</span> Phương tiện của tôi
            </h6>
            <button className="btn btn-sm text-white fw-medium px-3 rounded-pill" style={{ backgroundColor: '#164e63' }} onClick={handleOpenAdd}>
              + Thêm phương tiện mới
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="card border p-5 text-center text-muted rounded-4 shadow-sm" style={{ borderStyle: 'dashed' }}>
              <span className="fs-1">🚗</span>
              <p className="mt-3 mb-0">Bạn chưa đăng ký phương tiện nào.</p>
              <small className="text-muted">Nhấn nút bên trên để đăng ký xe của bạn.</small>
            </div>
          ) : (
            <div className="row g-3 mb-5">
              {vehicles.map((v) => (
                <div className="col-md-6" key={v.vehicleId}>
                  <div className="card border p-3 rounded-4 h-100 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="bg-light rounded p-2 text-secondary">
                        {v.vehicleTypeName?.toLowerCase().includes('máy') || v.vehicleTypeName?.toLowerCase().includes('moto') ? '🛵' : '🚙'}
                      </div>
                      <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1" style={{ fontSize: '0.7rem' }}>
                        ● Đã xác minh
                      </span>
                    </div>
                    <div className="mb-3 mt-2">
                      <div className="text-muted small">{v.vehicleBrand || 'Hãng xe'} {v.vehicleColor ? `(${v.vehicleColor})` : ''}</div>
                      <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '1px', color: '#164e63' }}>{v.licensePlate}</h4>
                      <div className="text-muted small mt-1">
                        {v.vehicleTypeName || 'Phương tiện'} • {
                          isVehicleActive(v) ? (
                            <span className="text-success fw-semibold">🎫 Đã có thẻ tháng</span>
                          ) : isVehiclePending(v) ? (
                            <span className="text-warning fw-semibold" style={{ color: '#b45309' }}>⏳ Đang trong quá trình duyệt</span>
                          ) : (
                            'Chưa đăng ký gói'
                          )
                        }
                      </div>
                    </div>
                    <div className="mt-auto border-top pt-2 d-flex justify-content-between">
                      <button className="btn btn-link text-danger text-decoration-none p-0 fw-bold small" onClick={() => handleDelete(v.vehicleId)}>Xóa</button>
                      <button className="btn btn-link text-decoration-none p-0 fw-bold small" style={{ color: '#164e63' }} onClick={() => handleOpenEdit(v)}>Chỉnh sửa</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <span className="text-info fs-5">🎫</span> Gói cước đỗ xe tháng &amp; VIP
          </h6>
          {packages.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center text-muted" style={{ background: '#ffffff' }}>
              Chưa có gói cước tháng nào được cấu hình từ hệ thống.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3 mb-4">
              {packages.map((pkg) => {
                const status = getPackageStatusForUser(pkg);
                const isFullyRegistered = status === 'FULLY_REGISTERED';
                return (
                  <div className="card border rounded-4 shadow-sm" key={pkg.pricePolicyId || pkg.id} style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                    <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-info bg-opacity-10 text-info rounded-3 d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>💎</div>
                        <div>
                          <h6 className="fw-bold text-dark m-0">{pkg.policyName}</h6>
                          <small className="text-muted">
                            Thời lượng: {pkg.baseDurationMinutes / 60 / 24} ngày
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-dark fs-5">{pkg.basePrice?.toLocaleString('vi-VN')} VNĐ</span>
                        {status === 'FULLY_REGISTERED' ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.85rem' }}>
                            <span>✓</span> Đã có thẻ đỗ xe
                          </span>
                        ) : status === 'PENDING_APPROVAL' ? (
                          <span className="badge border px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', color: '#854d0e', backgroundColor: '#fef9c3', borderColor: '#fde047' }}>
                            <span>⏳</span> Đang trong quá trình duyệt
                          </span>
                        ) : (
                          <button className="btn fw-bold text-white px-4 rounded-pill" style={{ backgroundColor: '#164e63' }} onClick={() => handleSubscribeClick(pkg)}>Đăng ký gói</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột Phải */}
        <div className="col-lg-4">
          <h6 className="fw-bold text-dark mb-3 mt-2 d-flex align-items-center gap-2">
            <span className="text-info fs-5">ℹ️</span> Thông tin dịch vụ
          </h6>
          <div className="card border shadow-sm rounded-4 p-4" style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
            <h6 className="fw-bold text-dark mb-3">Quy trình cấp thẻ tháng:</h6>
            <ol className="small text-muted ps-3 mb-4" style={{ lineHeight: '1.8' }}>
              <li>Khai báo và thêm biển số xe chính chủ ở cột bên trái.</li>
              <li>Lựa chọn gói đỗ xe tháng tương ứng (Ví dụ: Gói Xe máy, Gói Ô tô).</li>
              <li>Bấm <strong>Đăng ký gói</strong> để gửi yêu cầu lên ban quản lý.</li>
              <li>Đến quầy kỹ thuật bãi đỗ xe để nhận thẻ cư dân vật lý đã liên kết.</li>
            </ol>
            <div className="border-top pt-3 mb-2">
              <p className="small text-muted mb-0">💡 <strong>Gia hạn gói:</strong> Khi gói sắp hết hạn, nhấn <strong>"Gia hạn gói"</strong> trên thẻ gói cước để gửi yêu cầu gia hạn.</p>
            </div>
            <div className="border-top pt-3 text-center">
              <small className="text-muted d-block">Mọi thắc mắc vui lòng liên hệ</small>
              <strong style={{ color: '#164e63' }}>Hotline: 1900 8868 (Phím 2)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* === Vehicle Modal === */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card border-0 shadow-lg p-4 rounded-4" style={{ width: '100%', maxWidth: '450px', background: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark m-0">{modalMode === 'add' ? '🚘 Thêm phương tiện mới' : '⚙️ Chỉnh sửa phương tiện'}</h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Biển số xe</label>
                <input type="text" required className="form-control" value={formData.licensePlate} onChange={e => setFormData({ ...formData, licensePlate: e.target.value })} placeholder="Ví dụ: 30G12345" />
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Không chứa ký tự đặc biệt ngoài '-' hoặc '.'</small>
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Hãng xe / Nhãn hiệu</label>
                <input type="text" className="form-control" value={formData.vehicleBrand} onChange={e => setFormData({ ...formData, vehicleBrand: e.target.value })} placeholder="Ví dụ: VinFast, Honda" />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Màu sắc xe</label>
                <input type="text" className="form-control" value={formData.vehicleColor} onChange={e => setFormData({ ...formData, vehicleColor: e.target.value })} placeholder="Ví dụ: Trắng, Đen, Đỏ" />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Loại phương tiện</label>
                <select className="form-select" value={formData.vehicleTypeId} onChange={e => setFormData({ ...formData, vehicleTypeId: e.target.value })}>
                  {vehicleTypes.map(type => <option key={type.vehicleTypeId} value={type.vehicleTypeId}>{type.typeName}</option>)}
                </select>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light fw-bold" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn text-white fw-bold" style={{ backgroundColor: '#164e63' }} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu thông tin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Subscribe / Renew Modal === */}
      {showSubscribeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card border-0 shadow-lg p-4 rounded-4" style={{ width: '100%', maxWidth: '450px', background: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark m-0">
                🎫 Đăng ký Gói tháng
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowSubscribeModal(false)}></button>
            </div>

            <div className="mb-4 bg-light p-3 rounded-3 border">
              <h6 className="fw-bold text-primary mb-1">{selectedPackage?.policyName}</h6>
              <h4 className="fw-bold m-0 mt-2" style={{ color: '#164e63' }}>{selectedPackage?.basePrice?.toLocaleString('vi-VN')}đ <span className="fs-6 text-muted fw-normal">/ {selectedPackage?.baseDurationMinutes / 60 / 24} ngày</span></h4>
            </div>

            {/* Step indicator */}
            <div className="d-flex justify-content-center gap-2 pt-3 pb-1 px-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              {[{ n: 1, label: 'Thông tin' }, { n: 2, label: 'Thanh toán' }, { n: 3, label: 'Hoàn tất' }].map(s => (
                <div key={s.n} className="d-flex align-items-center gap-1">
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold small"
                    style={{ width: 26, height: 26, background: modalStep >= s.n ? '#164e63' : '#e2e8f0', color: modalStep >= s.n ? '#fff' : '#94a3b8', fontSize: '0.75rem' }}>
                    {modalStep > s.n ? '✓' : s.n}
                  </div>
                  <span className="small fw-semibold" style={{ color: modalStep >= s.n ? '#164e63' : '#94a3b8' }}>{s.label}</span>
                  {s.n < 3 && <span style={{ color: '#cbd5e1', margin: '0 4px' }}>›</span>}
                </div>
              ))}
            </div>

            <div className="p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

              {/* ===== STEP 1: FORM ===== */}
              {modalStep === 1 && (
                <>
                  {/* Renewal info banner */}
                  {subscribeMode === 'renew' && renewTicket && (
                    <div className="rounded-3 mb-4 py-2 px-3 d-flex align-items-start gap-2 small"
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
                      <span>ℹ️</span>
                      <div>
                        <strong>Gia hạn gói hiện tại:</strong><br />
                        Gói sẽ được tính tiếp nối từ ngày hết hạn <strong>{formatDate(renewTicket.endDate || renewTicket.expiryDate)}</strong>. Ban quản lý sẽ duyệt và kích hoạt gia hạn cho bạn.
                      </div>
                    </div>
                  )}

                  {/* Package info / selector */}
                  {selectedPackage ? (
                    <div className="mb-4 p-3 rounded-3" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="fw-bold mb-1" style={{ color: '#0369a1' }}>{selectedPackage.policyName}</h6>
                          <small className="text-muted">Thời lượng: {selectedPackage.baseDurationMinutes / 60 / 24} ngày</small>
                        </div>
                        <h5 className="fw-bold m-0" style={{ color: '#164e63' }}>{selectedPackage.basePrice?.toLocaleString('vi-VN')}đ</h5>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-semibold mb-2">📦 Chọn gói</label>
                      <select className="form-select" onChange={e => { const pkg = packages.find(p => String(p.pricePolicyId || p.id) === e.target.value); setSelectedPackage(pkg || null); }}>
                        <option value="">-- Chọn gói --</option>
                        {packages.map(p => <option key={p.pricePolicyId || p.id} value={p.pricePolicyId || p.id}>{p.policyName} — {p.basePrice?.toLocaleString('vi-VN')}đ</option>)}
                      </select>
                    </div>
                  )}

                  <form onSubmit={handleConfirmSubscribe}>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-semibold mb-2">📍 Chọn chi nhánh</label>
                      <select className="form-select mb-3" value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required>
                        <option value="">-- Chọn chi nhánh --</option>
                        {branches.map(b => <option key={b.parkingBranchId || b.id} value={b.parkingBranchId || b.id}>{b.branchName || b.parkingBranchName || b.name}</option>)}
                      </select>

                      <label className="form-label small text-muted fw-semibold mb-2">
                        {matchingVehicles.length > 0 ? '🚗 Chọn phương tiện' : '🚗 Thông tin phương tiện đăng ký'}
                      </label>

                      {matchingVehicles.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {matchingVehicles.map(v => (
                            <div key={v.vehicleId || v.vehiclesId || v.id} className="card p-3 flex-grow-1 shadow-sm"
                              style={{ cursor: subscribeMode === 'renew' ? 'default' : 'pointer', borderColor: String(subscribeVehicleId) === String(v.vehicleId || v.vehiclesId || v.id) ? '#2563eb' : '#e2e8f0', backgroundColor: String(subscribeVehicleId) === String(v.vehicleId || v.vehiclesId || v.id) ? '#eff6ff' : '#fff', borderWidth: '2px', minWidth: '150px' }}
                              onClick={() => subscribeMode !== 'renew' && setSubscribeVehicleId(String(v.vehicleId || v.vehiclesId || v.id))}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-bold" style={{ color: String(subscribeVehicleId) === String(v.vehicleId || v.vehiclesId || v.id) ? '#1e3a8a' : '#334155' }}>{v.vehicleBrand || 'Xe cá nhân'}</span>
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderColor: String(subscribeVehicleId) === String(v.vehicleId || v.vehiclesId || v.id) ? '#2563eb' : '#cbd5e1', backgroundColor: String(subscribeVehicleId) === String(v.vehicleId || v.vehiclesId || v.id) ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {String(subscribeVehicleId) === String(v.vehicleId || v.vehiclesId || v.id) && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />}
                                </div>
                              </div>
                              <span className="text-muted small">{v.licensePlate}</span>
                            </div>
                          ))}
                          {subscribeMode !== 'renew' && <div className="card p-3 flex-grow-1 shadow-sm"
                            style={{ cursor: 'pointer', borderColor: subscribeVehicleId === 'new' ? '#2563eb' : '#e2e8f0', backgroundColor: subscribeVehicleId === 'new' ? '#eff6ff' : '#fff', borderWidth: '2px', minWidth: '150px' }}
                            onClick={() => setSubscribeVehicleId('new')}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold" style={{ color: subscribeVehicleId === 'new' ? '#1e3a8a' : '#334155' }}>+ Thêm xe mới</span>
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderColor: subscribeVehicleId === 'new' ? '#2563eb' : '#cbd5e1', backgroundColor: subscribeVehicleId === 'new' ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {subscribeVehicleId === 'new' && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />}
                              </div>
                            </div>
                            <span className="text-muted small">Nhập thông tin mới</span>
                          </div>}
                        </div>
                      )}

                      {subscribeVehicleId === 'new' && (
                        <div className="p-3 bg-light rounded border shadow-sm mt-2">
                          <div className="mb-2">
                            <label className="form-label small fw-bold text-dark">Biển số xe *</label>
                            <input type="text" required className="form-control" value={newVehicleData.licensePlate} onChange={e => setNewVehicleData({ ...newVehicleData, licensePlate: e.target.value })} placeholder="Ví dụ: 30A-123.45" />
                          </div>
                          <div className="mb-2">
                            <label className="form-label small fw-bold text-dark">Loại phương tiện *</label>
                            <select
                              className="form-select"
                              value={newVehicleData.vehicleTypeId || getPolicyVehicleTypeId(selectedPackage) || (vehicleTypes[0]?.vehicleTypeId ? String(vehicleTypes[0].vehicleTypeId) : '')}
                              onChange={e => setNewVehicleData({ ...newVehicleData, vehicleTypeId: e.target.value })}
                            >
                              {vehicleTypes.map(t => (
                                <option key={t.vehicleTypeId || t.id} value={t.vehicleTypeId || t.id}>
                                  {t.typeName || t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="row g-2 mt-1">
                            <div className="col-6">
                              <label className="form-label small fw-bold text-dark">Hãng xe</label>
                              <input type="text" className="form-control" value={newVehicleData.vehicleBrand} onChange={e => setNewVehicleData({ ...newVehicleData, vehicleBrand: e.target.value })} placeholder="Ví dụ: VinFast" />
                            </div>
                            <div className="col-6">
                              <label className="form-label small fw-bold text-dark">Màu xe</label>
                              <input type="text" className="form-control" value={newVehicleData.vehicleColor} onChange={e => setNewVehicleData({ ...newVehicleData, vehicleColor: e.target.value })} placeholder="Ví dụ: Đen" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2 justify-content-end mt-4">
                      <button type="button" className="btn btn-light fw-bold" onClick={handleCloseSubscribeModal}>Hủy</button>
                      <button type="submit" className="btn text-white fw-bold px-4"
                        style={{ backgroundColor: subscribeMode === 'renew' ? '#0ea5e9' : '#164e63' }}
                        disabled={submitting || !subscribeVehicleId || !selectedPackage}>
                        {submitting
                          ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Đang xử lý...</>
                          : subscribeMode === 'renew' ? '🔄 Xác nhận gia hạn →' : 'Xác nhận đăng ký →'
                        }
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ===== STEP 2: PAYMENT METHOD SELECTION ===== */}
              {modalStep === 2 && (
                <div className="py-2 text-center">
                  <div className="mb-3">
                    <h5 className="fw-bold text-dark mb-1">Chọn hình thức thanh toán</h5>
                    <p className="text-muted small mb-0">
                      Gói <strong>{selectedPackage?.policyName?.replace('[Gói Tháng] ', '').replace('[Gói VIP President] ', '')}</strong> cho xe <strong>{submittedLicensePlate}</strong>
                    </p>
                  </div>

                  <div className="mb-4 text-start">
                    <label className="form-label small text-muted fw-semibold mb-2">💳 Phương thức thanh toán *</label>
                    <div className="card p-3 rounded-3 shadow-sm" style={{ border: '2px solid #2563eb', backgroundColor: '#eff6ff' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: '#dbeafe' }}>
                          <span style={{ fontSize: '1.2rem' }}>💳</span>
                        </div>
                        <div>
                          <div className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Thanh toán qua VNPay (Ngân hàng / QR)</div>
                          <div className="text-muted small">Thanh toán trực tuyến nhanh chóng qua VNPay</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="rounded-3 p-3 mb-4 text-start" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Gói dịch vụ</span>
                      <strong className="text-dark">{selectedPackage?.policyName?.replace('[Gói Tháng] ', '').replace('[Gói VIP President] ', '')}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Phương tiện</span>
                      <strong className="text-dark">{submittedLicensePlate}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Thời hạn</span>
                      <strong className="text-dark">{selectedPackage?.baseDurationMinutes / 60 / 24} ngày</strong>
                    </div>
                    <div className="border-top pt-2 mt-2 d-flex justify-content-between">
                      <span className="fw-bold">Tổng thanh toán</span>
                      <strong className="fs-5" style={{ color: '#164e63' }}>{selectedPackage?.basePrice?.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="small text-muted mb-3 text-start">
                      Nhấp nút VNPay bên dưới để mở cổng thanh toán ngân hàng trực tuyến.
                    </p>
                    {paymentUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(paymentUrl, '_blank')}
                        className="btn fw-bold px-5 py-3 rounded-pill text-white d-inline-flex align-items-center justify-content-center gap-3 w-100 mb-3"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)', fontSize: '1.05rem', border: 'none' }}
                      >
                        <img src="https://vincheck.vn/wp-content/uploads/2021/05/logo-vnpay.png" alt="VNPay" style={{ height: 24, width: 'auto', filter: 'brightness(0) invert(1)' }} />
                        Thanh toán qua VNPay
                      </button>
                    )}
                    <button
                      className="btn btn-outline-primary fw-bold rounded-pill w-100 py-2"
                      onClick={() => setModalStep(3)}
                    >
                      Đã hoàn tất / Chuyển sang bước Hoàn tất →
                    </button>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: COMPLETION / SUCCESS ===== */}
              {modalStep === 3 && (
                <div className="text-center py-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', fontSize: '2.5rem', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>🎉</div>
                  <h4 className="fw-bold text-dark mb-1">Yêu cầu đăng ký hoàn tất!</h4>
                  <p className="text-muted small mb-4">
                    Gói <strong>{selectedPackage?.policyName?.replace('[Gói Tháng] ', '').replace('[Gói VIP President] ', '')}</strong> cho xe <strong>{submittedLicensePlate}</strong> đã được ghi nhận vào hệ thống.
                  </p>

                  <div className="rounded-3 p-3 mb-4 text-start" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Gói dịch vụ</span>
                      <strong className="text-dark">{selectedPackage?.policyName?.replace('[Gói Tháng] ', '').replace('[Gói VIP President] ', '')}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Phương tiện</span>
                      <strong className="text-dark">{submittedLicensePlate}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Hình thức thanh toán</span>
                      <span className="badge border fw-bold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                        💳 VNPay / Ngân hàng
                      </span>
                    </div>
                    <div className="border-top pt-2 mt-2 d-flex justify-content-between">
                      <span className="fw-bold">Tổng thanh toán</span>
                      <strong className="fs-5" style={{ color: '#164e63' }}>{selectedPackage?.basePrice?.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  </div>

                  <div className="rounded-3 p-3 mb-4 text-start" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <small className="text-success d-block fw-semibold mb-1">📌 Ghi chú kích hoạt thẻ:</small>
                    <small className="text-dark d-block" style={{ lineHeight: '1.5' }}>
                      Ban quản lý sẽ xác minh thanh toán online và kích hoạt thẻ tháng cho xe <strong>{submittedLicensePlate}</strong> trong thời gian sớm nhất.
                    </small>
                  </div>

                  <button className="btn fw-bold text-white rounded-pill px-5 py-2.5" style={{ backgroundColor: '#164e63' }} onClick={handleCloseSubscribeModal}>
                    Đã hiểu &amp; Hoàn tất
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}