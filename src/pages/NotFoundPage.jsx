import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center" style={{ background: 'var(--vin-bg-deep)', color: '#fff' }}>
      <h1 className="display-1 fw-bold text-info">404</h1>
      <h2 className="mb-4">Trang không tồn tại</h2>
      <p className="text-muted mb-4">Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.</p>
      <Link to="/" className="vin-btn vin-btn--primary">
        Về Trang Chủ
      </Link>
    </div>
  );
}
