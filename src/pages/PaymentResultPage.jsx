import React, { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const success = searchParams.get('success') === 'true';
  const message = searchParams.get('message') || '';

  useEffect(() => {
    const paymentSuccess = searchParams.get('success') === 'true';
    const paymentFailed = searchParams.get('success') === 'false';

    if (paymentSuccess) {
      const targetUrl = `/user-dashboard?success=true&message=${encodeURIComponent(message || '🎉 Thanh toán thành công! Gói cước của bạn đang được xử lý.')}`;
      navigate(targetUrl, { replace: true });
    } else if (paymentFailed) {
      const targetUrl = `/user-dashboard?success=false&message=${encodeURIComponent(message || 'Thanh toán thất bại hoặc đã bị huỷ!')}`;
      navigate(targetUrl, { replace: true });
    }
  }, [message, navigate, searchParams]);

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
          {message || (success ? 'Giao dịch của bạn đã được xử lý hoàn tất. Xin cảm ơn!' : 'Đã có lỗi xảy ra hoặc giao dịch bị huỷ. Vui lòng thử lại sau.')}
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
