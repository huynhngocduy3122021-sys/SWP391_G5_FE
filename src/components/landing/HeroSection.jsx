import { Link } from 'react-router-dom';
import heroParkingImg from '../../image/hero_parking.png';

export default function HeroSection() {
  return (
    <section className="hero-section"
      style={{ backgroundImage: `url(${heroParkingImg})` }}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">
          Giải pháp đỗ xe thông minh <br />
          <span style={{ color: '#38bdf8' }}>cho đô thị hiện đại</span>
        </h1>
        <p className="hero-desc">
          Tối ưu hóa không gian, giảm thiểu thời gian tìm kiếm và nâng cao tiện ích của bãi đỗ xe
          với hệ thống quản lý <strong style={{ color: '#fff' }}>Vinparking</strong> dựa trên AI và kết nối thời gian thực.
        </p>
        <Link to="/locations" className="vin-btn vin-btn--primary" style={{ fontSize: '1rem', padding: '0.65rem 1.5rem' }}>
          Tìm bãi đỗ ngay
        </Link>
      </div>
    </section>
  );
}
