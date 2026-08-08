import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createLostCardReport } from '../api/lostCardApi';
import parkingApi from '../../search/api/parkingApi';
import './lost-card-report.css';

const initialForm = { parkingLotId: '', parkingBranchId: '', cardType: 'MONTHLY', vehicleId: 'vehicle-01', licensePlate: '51H-482.16', lostAt: '', lostStage: 'UNKNOWN', verificationMethod: 'ACCOUNT', description: '' };
const stageCopy = { BEFORE_ENTRY: 'Xe chưa vào bãi. Nhân viên sẽ đối chiếu thông tin khi xe đến.', INSIDE_PARKING: 'Xe đang trong bãi. Vui lòng không tự ý rời bãi trước khi được xác minh.', UNKNOWN: 'Nhân viên sẽ xác minh trạng thái xe từ hệ thống và thông tin tài khoản.' };
const statusCopy = { PENDING_VERIFICATION: ['Đang chờ xác minh', 'Nhân viên sẽ kiểm tra biển số và thông tin thẻ của bạn.'], SUBMITTED: ['Đã tiếp nhận', 'Yêu cầu đã được ghi nhận và đang chờ nhân viên xử lý.'] };
const normalizePlate = (value) => value.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9.-]/g, '');
const makeIdempotencyKey = () => globalThis.crypto?.randomUUID?.() || `lost-card-${Date.now()}`;
const getBranchId = (branch) => branch?.parkingBranchId || branch?.branchId || branch?.id || '';
const getBranchName = (branch) => branch?.branchName || branch?.parkingBranchName || branch?.name || `Chi nhánh ${getBranchId(branch)}`;

export default function LostCardReportPage() {
  const [form, setForm] = useState(initialForm);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const stageMessage = useMemo(() => stageCopy[form.lostStage], [form.lostStage]);

  useEffect(() => {
    let mounted = true;
    parkingApi.getAllBranches()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : (data?.content || data?.data || []);
        setBranches(list);
        const first = list[0];
        if (first) {
          const branchId = String(getBranchId(first));
          setForm((current) => ({
            ...current,
            parkingBranchId: current.parkingBranchId || branchId,
            parkingLotId: current.parkingLotId || String(first.parkingLotId || branchId),
          }));
        }
      })
      .catch(() => { if (mounted) toast.error('Không tải được danh sách chi nhánh bãi xe.'); })
      .finally(() => { if (mounted) setLoadingBranches(false); });
    return () => { mounted = false; };
  }, []);

  const handleBranchChange = (event) => {
    const parkingBranchId = event.target.value;
    const branch = branches.find((item) => String(getBranchId(item)) === parkingBranchId);
    update('parkingBranchId', parkingBranchId);
    update('parkingLotId', String(branch?.parkingLotId || parkingBranchId));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const plate = normalizePlate(form.licensePlate);
    if (!form.parkingLotId || !plate || !form.verificationMethod || !form.lostStage || (form.lostStage === 'BEFORE_ENTRY' && !form.parkingBranchId)) { toast.error('Vui lòng chọn bãi xe, chi nhánh, biển số, phương thức xác minh và thời điểm mất thẻ.'); return; }
    setSubmitting(true);
    const payload = { parkingLotId: form.parkingLotId, ...(form.parkingBranchId && { parkingBranchId: Number(form.parkingBranchId) }), cardType: form.cardType, vehicleId: form.vehicleId || undefined, licensePlate: plate, lostAt: form.lostAt || undefined, lostStage: form.lostStage, verificationMethod: form.verificationMethod, description: form.description.trim() || undefined, ...(form.lostStage === 'BEFORE_ENTRY' && { parkingSessionId: null }) };
    try {
      const response = await createLostCardReport(payload, makeIdempotencyKey());
      setSubmitted({ ...payload, ...response, id: response?.id || response?.reportId || 'LCR-2026-08421', status: response?.status || 'PENDING_VERIFICATION' });
    } catch (error) {
      if (error?.response?.data?.code === 'DUPLICATE_ACTIVE_REPORT') { const active = error.response.data.activeReport; setSubmitted({ ...payload, ...active, id: active?.id || 'LCR-2026-08421', status: active?.status || 'PENDING_VERIFICATION' }); } else toast.error('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.');
    } finally { setSubmitting(false); }
  }

  if (submitted) {
    const [title, description] = statusCopy[submitted.status] || statusCopy.PENDING_VERIFICATION;
    return <main className="lost-page"><div className="lost-shell lost-result-shell"><Link to="/user-dashboard" className="lost-back"><i className="bi bi-arrow-left" /> Quay lại tài khoản</Link><section className="lost-result-card"><div className="result-check"><i className="bi bi-check2" /></div><p className="lost-kicker">Báo mất thẻ xe</p><h1>Yêu cầu đã được ghi nhận</h1><p className="result-description">{description}</p><div className="report-number"><span>Mã yêu cầu</span><strong>{submitted.id}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(submitted.id)} aria-label="Sao chép mã yêu cầu"><i className="bi bi-copy" /></button></div><div className="result-status"><span className="status-dot" /> {title}</div>{submitted.cardType === 'MONTHLY' && submitted.lostStage === 'INSIDE_PARKING' && <div className="result-note warning"><i className="bi bi-person-vcard" /><span>Vui lòng liên hệ quầy trực. Không tự ý kết thúc phiên gửi xe hoặc rời bãi khi chưa được xác minh.</span></div>}{submitted.cardType === 'MONTHLY' && submitted.lostStage === 'BEFORE_ENTRY' && <div className="result-note"><i className="bi bi-shield-lock" /><span>Thẻ cũ sẽ được khóa theo chính sách hệ thống. Ban quản lý sẽ cấp một thẻ mới thay thế sau khi xử lý.</span></div>}{!submitted.parkingSessionId && <div className="result-note"><i className="bi bi-info-circle" /><span>Yêu cầu đã được ghi nhận; nhân viên sẽ xác minh khi xe vào bãi hoặc qua thông tin tài khoản.</span></div>}<button className="lost-primary" type="button" onClick={() => setSubmitted(null)}>Tạo báo cáo khác <i className="bi bi-arrow-right" /></button></section></div></main>;
  }

  return <main className="lost-page"><div className="lost-shell"><div className="lost-topline"><Link to="/user-dashboard" className="lost-back"><i className="bi bi-arrow-left" /> Tài khoản của tôi</Link><span className="secure-label"><i className="bi bi-lock" /> Kết nối bảo mật</span></div><div className="lost-intro"><div><p className="lost-kicker">Trung tâm hỗ trợ</p><h1>Báo mất thẻ xe</h1><p className="lost-lead">Gửi thông tin để đội ngũ Vinparking xác minh và hỗ trợ bạn an toàn.</p></div><div className="step-indicator"><span className="step-active">01</span><span className="step-line" /><span>GỬI YÊU CẦU</span></div></div><div className="lost-layout"><form className="lost-form-card" onSubmit={handleSubmit}>
    <div className="form-section"><div className="section-heading"><span>01</span><div><h2>Thông tin thẻ</h2><p>Chọn loại thẻ bạn muốn báo mất.</p></div></div><div className="type-switch" role="tablist"><button type="button" className={form.cardType === 'MONTHLY' ? 'selected' : ''} onClick={() => update('cardType', 'MONTHLY')}><i className="bi bi-calendar3" /><span><strong>Thẻ tháng</strong><small>Quyền sử dụng dài hạn</small></span><i className="bi bi-check-circle-fill selection-check" /></button><button type="button" className={form.cardType === 'DAILY' ? 'selected' : ''} onClick={() => update('cardType', 'DAILY')}><i className="bi bi-ticket-perforated" /><span><strong>Thẻ lượt</strong><small>Vé gửi xe theo lượt</small></span><i className="bi bi-check-circle-fill selection-check" /></button></div></div>
    <div className="form-section"><div className="section-heading"><span>02</span><div><h2>Phương tiện & bãi xe</h2><p>Thông tin này giúp nhân viên tìm đúng phương tiện.</p></div></div><label className="lost-field"><span>Chi nhánh bãi xe {form.lostStage === 'BEFORE_ENTRY' && <b>*</b>}</span><div className="input-with-icon"><i className="bi bi-geo-alt" /><select value={form.parkingBranchId} onChange={handleBranchChange} disabled={loadingBranches}><option value="">{loadingBranches ? 'Đang tải chi nhánh...' : 'Chọn chi nhánh bãi xe'}</option>{branches.map((branch) => <option key={getBranchId(branch)} value={getBranchId(branch)}>{getBranchName(branch)}</option>)}</select><i className="bi bi-chevron-down" /></div></label><div className="field-grid"><label className="lost-field"><span>Biển số xe <b>*</b></span><div className="input-with-icon"><i className="bi bi-car-front" /><input value={form.licensePlate} onChange={(e) => update('licensePlate', e.target.value)} placeholder="Ví dụ: 51H-482.16" /></div></label><label className="lost-field"><span>Xe trong tài khoản</span><select value={form.vehicleId} onChange={(e) => update('vehicleId', e.target.value)}><option value="vehicle-01">Toyota Camry · 51H-482.16</option><option value="vehicle-02">Honda SH · 59C1-112.08</option><option value="">Không chọn xe</option></select></label></div></div>
    <div className="form-section"><div className="section-heading"><span>03</span><div><h2>Thời điểm & xác minh</h2><p>Chọn thông tin gần đúng nhất với tình huống của bạn.</p></div></div><div className="stage-options">{[['BEFORE_ENTRY','Trước khi vào bãi','Xe chưa vào bãi'],['INSIDE_PARKING','Trong bãi','Xe đang được gửi'],['UNKNOWN','Không xác định','Cần nhân viên kiểm tra']].map(([value, label, sub]) => <button type="button" key={value} className={form.lostStage === value ? 'selected' : ''} onClick={() => update('lostStage', value)}><span className="radio-dot" /><span><strong>{label}</strong><small>{sub}</small></span></button>)}</div><div className="stage-explanation"><i className="bi bi-info-circle" /> {stageMessage}</div><label className="lost-field"><span>Phương thức xác minh <b>*</b></span><select value={form.verificationMethod} onChange={(e) => update('verificationMethod', e.target.value)}><option value="ACCOUNT">Thông tin tài khoản đã đăng ký</option><option value="IDENTITY">CCCD / giấy tờ tùy thân</option><option value="VEHICLE_DOCUMENT">Giấy đăng ký xe</option></select></label><div className="field-grid"><label className="lost-field"><span>Thời điểm mất thẻ</span><input type="datetime-local" value={form.lostAt} onChange={(e) => update('lostAt', e.target.value)} /></label><label className="lost-field"><span>Mô tả thêm <em>không bắt buộc</em></span><input value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Ví dụ: phát hiện mất sau khi rời quầy" /></label></div></div><div className="form-footer"><span><i className="bi bi-shield-check" /> Thông tin của bạn được bảo mật</span><button className="lost-primary" disabled={submitting} type="submit">{submitting ? <><span className="lost-spinner" /> Đang gửi</> : <>Gửi yêu cầu <i className="bi bi-arrow-right" /></>}</button></div>
  </form><aside className="lost-aside"><div className="aside-card aside-dark"><span className="aside-icon"><i className="bi bi-life-preserver" /></span><p className="lost-kicker">Bạn cần biết</p><h3>Yên tâm, chúng tôi sẽ xác minh cùng bạn.</h3><p>Việc báo mất thẻ không tự động kết thúc phiên gửi xe hoặc mở barrier. Mọi kết quả xử lý đều do nhân viên và hệ thống xác nhận.</p></div><div className="aside-card"><div className="aside-card-title"><i className="bi bi-list-check" /><strong>Quy trình xử lý</strong></div><ol className="process-list"><li><span>1</span><div><strong>Tiếp nhận</strong><small>Hệ thống cấp mã yêu cầu ngay sau khi gửi.</small></div></li><li><span>2</span><div><strong>Xác minh</strong><small>Nhân viên đối chiếu biển số và thông tin thẻ.</small></div></li><li><span>3</span><div><strong>Phản hồi</strong><small>Cập nhật hướng dẫn tiếp theo trong tài khoản.</small></div></li></ol></div><div className="aside-help"><i className="bi bi-headset" /><div><strong>Cần hỗ trợ ngay?</strong><small>Gọi quầy trực 1900 6868</small></div><i className="bi bi-arrow-up-right" /></div></aside></div>{form.lostStage === 'INSIDE_PARKING' && <div className="bottom-alert"><i className="bi bi-exclamation-triangle-fill" /><div><strong>Xe đang được ghi nhận trong bãi</strong><span>Vui lòng liên hệ quầy trực sau khi gửi yêu cầu. Không tự ý rời bãi hoặc kết thúc phiên.</span></div></div>}{form.cardType === 'MONTHLY' && form.lostStage === 'BEFORE_ENTRY' && <div className="bottom-alert info"><i className="bi bi-shield-lock-fill" /><div><strong>Thẻ tháng bị mất trước khi vào bãi</strong><span>Hệ thống sẽ hỗ trợ khóa thẻ cũ và hướng dẫn đăng ký thẻ thay thế nếu được phê duyệt.</span></div></div>}</div></main>;
}
