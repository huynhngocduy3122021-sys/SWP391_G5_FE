import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import heroParkingImg from '../../assets/hero_parking.png';

export default function HeroSection() {
  return (
    <section 
      className="position-relative d-flex align-items-center py-5 overflow-hidden"
      style={{
        minHeight: '600px',
        backgroundImage: `url(${heroParkingImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div 
        className="position-absolute top-0 start-0 w-100 h-100" 
        style={{ 
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.55) 60%, rgba(15, 23, 42, 0.2) 100%)',
          zIndex: 1 
        }}
      />

      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row">
          
          <div className="col-12 col-md-10 col-lg-7 text-start">
            
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2 mb-4 fs-7 tracking-wider">
              ✨ Smart City Solutions
            </span>
            
            <h1 className="display-4 fw-extrabold text-white mb-3 lh-sm">
              Giải pháp đỗ xe thông minh <br />
              <span className="text-primary-gradient text-info">cho đô thị hiện đại</span>
            </h1>
            
            <p className="lead text-white-50 mb-4 style-desc" style={{ maxWidth: '520px' }}>
              Tối ưu hóa không gian, giảm thiểu thời gian tìm kiếm và nâng cao tiện ích của bãi đỗ xe 
              với hệ thống quản lý <strong className="text-white">Vinparking</strong> dựa trên AI và kết nối thời gian thực.
            </p>
            
            <div className="d-flex flex-column flex-sm-row justify-content-start gap-3">
              <a href="#locations" className="btn btn-primary btn-lg px-4 py-2-5 rounded-3 fw-bold shadow-sm transition-all">
                Tìm bãi đỗ ngay
              </a>
            </div>
            
          </div>
          
        </div>
      </div>
    </section>
  );
}