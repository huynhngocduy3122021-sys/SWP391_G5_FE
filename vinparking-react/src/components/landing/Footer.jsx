export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-left">
        <div className="footer-logo">
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <span>Vinparking</span>
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
