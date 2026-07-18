// Footer - Phần chân trang web chứa link liên kết và thông tin liên hệ
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-left">
        <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#164e63', color: '#fff', borderRadius: '4px', padding: '2px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="fw-bold" style={{ letterSpacing: '2px', fontSize: '1rem' }}>≡</span>
          </div>
          <span className="fw-bold m-0" style={{ color: '#164e63', fontSize: '1.25rem' }}>Vinparking</span>
        </div>
        <span className="footer-copy">© 2026 Vinparking Smart Systems. Smart Harbor Engineering.</span>
      </div>

      <div className="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">API Docs</a>
        <a href="#">Support</a>
      </div>

      <div className="footer-icons">
        <button className="footer-icon-btn" aria-label="Language">🌐</button>
        <button className="footer-icon-btn" aria-label="Share">↗</button>
      </div>
    </footer>
  );
}
