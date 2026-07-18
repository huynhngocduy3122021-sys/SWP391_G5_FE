// BookingsSection - Component hiển thị lịch sử hoặc danh sách đặt chỗ của người dùng
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import parkingApi from '../../search/api/parkingApi';

export default function BookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await parkingApi.getMyBookings();
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      toast.error('Không tải được danh sách đặt chỗ!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lượt đặt giữ chỗ này?')) return;
    try {
      await parkingApi.cancelBooking(bookingId);
      toast.success('Đã hủy đặt chỗ thành công!');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const errMsg = error.response?.data?.message || 'Lỗi khi hủy đặt chỗ!';
      toast.error(errMsg);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PENDING':
        return 'bg-success bg-opacity-10 text-success border border-success border-opacity-25';
      case 'CANCELLED':
        return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
      case 'COMPLETED':
        return 'bg-info bg-opacity-10 text-info border border-info border-opacity-25';
      default:
        return 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'EXPIRED':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Lịch đặt chỗ của tôi</h4>
          <p className="text-muted small m-0">Quản lý và sử dụng các lượt đặt đỗ xe trước của bạn</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 m-0">Đang tải danh sách đặt giữ chỗ...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <span style={{ fontSize: '2.5rem' }}>📅</span>
            <p className="mt-2 mb-0">Bạn chưa có lượt đặt đỗ xe nào.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light text-muted small">
                <tr>
                  <th className="fw-semibold">Mã đặt chỗ</th>
                  <th className="fw-semibold">Chi nhánh bãi xe</th>
                  <th className="fw-semibold">Biển số</th>
                  <th className="fw-semibold">Thời gian đến dự kiến</th>
                  <th className="fw-semibold">Hạn giữ chỗ</th>
                  <th className="fw-semibold">Trạng thái</th>
                  <th className="fw-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td className="fw-bold text-primary">{b.bookingCode}</td>
                    <td className="fw-medium">{b.parkingBranchName}</td>
                    <td><span className="badge bg-light text-dark border">{b.licensePlate}</span></td>
                    <td>{new Date(b.expectedArrivalTime).toLocaleString('vi-VN')}</td>
                    <td>{b.holdUntil ? new Date(b.holdUntil).toLocaleString('vi-VN') : 'N/A'}</td>
                    <td>
                      <span className={`badge rounded-pill ${getStatusBadgeClass(b.status)}`}>
                        {translateStatus(b.status)}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary fw-bold"
                              onClick={() => setShowQrModal(b)}
                            >
                              📱 Xem QR
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger fw-bold"
                              onClick={() => handleCancelBooking(b.bookingId)}
                            >
                              ✕ Hủy
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '360px' }}>
            <div className="modal-content border-0 rounded-4 shadow bg-white">
              <div className="modal-header border-0 pb-0 bg-transparent">
                <button type="button" className="btn-close ms-auto shadow-none" onClick={() => setShowQrModal(null)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <h5 className="fw-bold text-dark mb-1">Mã Vé Đặt Chỗ</h5>
                <p className="text-muted small mb-4">Hãy đưa mã này trước camera cổng vào để check-in</p>
                <div className="bg-light p-4 rounded-4 d-inline-block border">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${showQrModal.bookingCode}`}
                    alt="Booking QR Code"
                    className="img-fluid"
                    style={{ width: '180px', height: '180px' }}
                  />
                  <h5 className="fw-bold text-dark mt-3 mb-0" style={{ letterSpacing: '1.5px' }}>
                    {showQrModal.bookingCode}
                  </h5>
                </div>
                <div className="mt-4 text-start small border-top pt-3">
                  <div className="mb-1 text-muted">📍 Bãi đỗ: <strong className="text-dark">{showQrModal.parkingBranchName}</strong></div>
                  <div className="mb-1 text-muted">🚗 Biển số: <strong className="text-dark">{showQrModal.licensePlate}</strong></div>
                  <div className="text-muted">⏰ Dự kiến: <strong className="text-dark">{new Date(showQrModal.expectedArrivalTime).toLocaleString('vi-VN')}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
