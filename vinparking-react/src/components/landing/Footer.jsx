import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
export default function Footer() {
  return (
    <footer className="d-flex align-items-center justify-content-between px-5 py-4"
      style={{ backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="d-flex align-items-center gap-4">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <span className="fw-bold text-white">Vinparking</span>
        </div>
        <span className="text-white-50 small">© 2026 Vinparking Smart Systems. Smart Harbor Engineering.</span>
      </div>
      <div className="d-flex gap-3">
        <a href="#" className="text-white-50 text-decoration-none small">Privacy Policy</a>
        <a href="#" className="text-white-50 text-decoration-none small">Terms of Service</a>
        <a href="#" className="text-white-50 text-decoration-none small">API Docs</a>
        <a href="#" className="text-white-50 text-decoration-none small">Support</a>

      </div>
      <div className="col-12 col-md-3 text-center text-md-end">
          <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-3 text-white-50">
            
            {/* Nút Ngôn ngữ (Quả địa cầu) */}
            <button className="btn btn-link text-white-50 p-1 opacity-75 opacity-100-hover transition-all">
              <i className="bi bi-globe fs-5"></i>
            </button>
            
            {/* Nút Kết nối / Chia sẻ mạng xã hội */}
            <button className="btn btn-link text-white-50 p-1 opacity-75 opacity-100-hover transition-all">
              <i className="bi bi-share fs-5"></i>
            </button>
            
          </div>
          </div>
    </footer>
  );
}
