import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  const vnp_TransactionStatus = searchParams.get('vnp_TransactionStatus');
  const paramSuccess = searchParams.get('success');
  const paramMessage = searchParams.get('message');
  const paymentType = searchParams.get('paymentType');
  const requestId = searchParams.get('requestId');

  let success = false;
  let message = paramMessage || '';
  let hasResult = false;

  if (paramSuccess !== null) {
    success = paramSuccess === 'true';
    hasResult = true;
  } else if (vnp_TransactionStatus !== null || vnp_ResponseCode !== null) {
    const responseAccepted = vnp_ResponseCode === null || vnp_ResponseCode === '00';
    const transactionCompleted = vnp_TransactionStatus === null || vnp_TransactionStatus === '00';
    success = responseAccepted && transactionCompleted;
    hasResult = true;

    // Nhận diện loại thanh toán qua vnp_TxnRef nếu paymentType không có (VNPay trả thẳng về FE)
    const vnpTxnRef = searchParams.get('vnp_TxnRef') || '';
    const detectedType = paymentType || (vnpTxnRef.startsWith('TXN_MT_') ? 'MONTHLY_TICKET' : null);

    if (!message) {
      if (success) {
        message = detectedType === 'MONTHLY_TICKET'
          ? 'Yêu cầu đăng ký thẻ tháng của bạn đã được thanh toán và đang chờ Manager duyệt.'
          : 'Thanh toán VNPay thành công! Giao dịch của bạn đã hoàn tất.';
      } else {
        message = 'Thanh toán thất bại hoặc người dùng đã huỷ giao dịch!';
      }
    }
  }

  useEffect(() => {
    if (!hasResult) return;
    if (success) {
      toast.success(message || 'Thanh toán thành công! Giao dịch của bạn đã hoàn tất.');
    } else {
      toast.error(message || 'Thanh toán thất bại hoặc đã bị huỷ!');
    }
  }, [success, message, hasResult]);

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light py-5">
      <div className="card shadow-lg border-0 rounded-4 p-5 text-center bg-white" style={{ maxWidth: '540px', width: '90%' }}>
        <div className="mb-4">
          {success ? (
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 90, height: 90, background: '#dcfce7' }}>
              <CheckCircle2 size={50} className="text-success" />
            </div>
          ) : (
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 90, height: 90, background: '#fee2e2' }}>
              <XCircle size={50} className="text-danger" />
            </div>
          )}
        </div>
        
        <h2 className="fw-bold mb-3" style={{ color: success ? '#15803d' : '#b91c1c' }}>
          {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h2>
        
        <p className="text-muted mb-5 fs-6" style={{ lineHeight: '1.6' }}>
          {message || (success 
            ? (paymentType === 'MONTHLY_TICKET' ? 'Yêu cầu đăng ký thẻ tháng của bạn đã được thanh toán và đang chờ Manager duyệt.' : 'Giao dịch của bạn đã được xử lý hoàn tất. Xin cảm ơn!') 
            : 'Đã có lỗi xảy ra hoặc giao dịch bị huỷ. Vui lòng thử lại sau.')}
        </p>
        
        <div className="d-flex flex-column gap-3 px-md-4">
          <Link to="/user-dashboard" className="btn text-white btn-lg rounded-pill fw-bold shadow-sm py-3" style={{ backgroundColor: '#164e63' }}>
            Vào trang quản lý xe & Gói cước
          </Link>
          <Link to="/" className="btn btn-light btn-lg rounded-pill fw-bold border py-3 text-secondary">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
