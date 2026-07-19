// AppSection - Phần giới thiệu ứng dụng mobile trên trang chủ
import appMockup from '../../../shared/assets/image/app_mockup.png';

export default function AppSection() {
  return (
    <section className="app-section">
      <div className="app-card">
        <div className="app-layout">
          <div className="app-content">
            <h2>Trải nghiệm mượt mà, không cần tải App</h2>
            <p>
              Quét mã QR bên cạnh để truy cập ngay phiên bản Mobile Web của Vinparking.
              Tìm kiếm, đặt chỗ và thanh toán trực tuyến chỉ với vài thao tác trên trình duyệt của bạn.
            </p>

            <div className="app-qr-block">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://vinparking-web.example.com"
                alt="Quick Web QR Code"
              />
              <div className="app-qr-label">
                <small>Quét mã QR</small>
                <strong>Truy cập nhanh<br />Mobile Web</strong>
              </div>
            </div>

            <div className="app-browser-list">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Hỗ trợ tất cả trình duyệt:</span>
              <span>🧭 Safari</span>
              <span>🔴 Chrome</span>
              <span>🔷 Edge</span>
            </div>
          </div>

          <div className="app-image-wrap">
            <div className="app-glow" />
            <img src={appMockup} alt="Vinparking Mobile Web Interface" className="app-mockup" />
          </div>
        </div>
      </div>
    </section>
  );
}
