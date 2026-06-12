
import appMockup from '../../assets/app_mockup.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function AppSection() {
  return (
    <section id="app-download" className="py-5">
      {/* 1. Đổi 'container' thành 'container-fluid' kết hợp 'px-md-5' để đẩy khung card rộng sát ra 2 bên lề màn hình */}
      <div className="container-fluid px-3 px-md-5">
        
        {/* Giữ nguyên màu nền và padding gốc của bạn */}
        <div 
          className="rounded-4 p-4 p-md-5 overflow-hidden shadow-lg border border-secondary border-opacity-10"
          style={{ background: '#161933' }}
        >
          {/* Thêm gx-md-5 để khoảng cách giữa khối chữ và khối ảnh rộng rãi, không bị dính vào nhau */}
          <div className="row align-items-center gy-5 gx-md-5">
            
            {/* 2. CHỈNH LỀ TRÁI: Tăng từ col-lg-7 lên col-lg-8 để phần chữ có không gian trải rộng sang hai bên */}
            <div className="col-12 col-lg-8 text-center text-md-start pe-xl-5">
              
              {/* Tiêu đề lớn mới */}
              <h2 className="text-white fw-bold mb-3 display-6 lh-sm">
                Trải nghiệm mượt mà, không cần tải App
              </h2>
              
              {/* Nới rộng maxWidth từ 540px lên 680px để các dòng chữ dài ra, dàn lề đẹp hơn */}
              <p className="text-white-50 mb-4-5 lead fs-6" style={{ maxWidth: '680px', lineHeight: '1.6' }}>
                Quét mã QR bên cạnh để truy cập ngay phiên bản Mobile Web của Vinparking. 
                Tìm kiếm, đặt chỗ và thanh toán trực tuyến chỉ với vài thao tác trên trình duyệt của bạn.
              </p>
              
              {/* Khu vực tương tác: QR Code và Nhãn hỗ trợ trình duyệt */}
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-md-start gap-4 pt-2">
                
                {/* Khối QR Code truy cập nhanh */}
                <div className="d-flex align-items-center gap-3 bg-dark bg-opacity-35 p-3 rounded-3 border border-secondary border-opacity-25 shadow-sm">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://vinparking-web.example.com"
                    alt="Quick Web QR Code" 
                    className="rounded-2 bg-white p-1" 
                    style={{ width: '90px', height: '90px' }} // Tăng nhẹ kích thước ảnh QR cho cân xứng với lề mới
                  />
                  <div className="text-start lh-sm">
                    <span className="text-info small d-block fw-semibold text-uppercase tracking-wider mb-1 ">Quét mã QR</span>
                    <strong className="text-white fs-6 text-center">Truy cập nhanh<br />Mobile Web</strong>
                  </div>
                </div>
                
                {/* Nhãn hỗ trợ các trình duyệt */}
                <div className="text-center text-sm-start border-start border-secondary border-opacity-25 ps-0 ps-sm-4 py-1">
                  <span className="text-white-50 small d-block mb-2">Hỗ trợ tất cả trình duyệt</span>
                  
                  {/* Cụm các Icon trình duyệt */}
                  <div className="d-flex align-items-center justify-content-center justify-content-sm-start gap-2 text-white-50 fs-5">
                    
                      <i className="bi bi-compass text-info"></i> <span style={{ fontSize: '0.8rem' }}>Safari</span>
                      <i className="bi bi-google text-danger"></i> <span style={{ fontSize: '0.8rem' }}>Chrome</span>
                      <i className="bi bi-browser-edge text-primary"></i> <span style={{ fontSize: '0.8rem' }}>Edge</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. CHỈNH LỀ PHẢI: Hạ xuống col-lg-4 để ép sát không gian, giúp ảnh đẩy sát về bên phải */}
            <div className="col-12 col-lg-4 text-center position-relative d-flex justify-content-center align-items-center">
              {/* Hiệu ứng ánh sáng phát quang phía sau điện thoại */}
              <div 
                className="position-absolute top-50 start-50 translate-middle bg-info rounded-circle opacity-10"
                style={{ width: '80%', height: '80%', filter: 'blur(50px)' }}
              />
              
              <img 
                src={appMockup} 
                alt="Vinparking Mobile Web Interface" 
                className="img-fluid position-relative img-mockup-lift" 
                style={{ 
                  maxHeight: '350px', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 25px 45px rgba(0,0,0,0.6))' // Đổ bóng sâu hơn một chút để tạo độ nổi bật
                }} 
              />
            </div>

          </div>
        </div>
        
      </div>
    </section>
  );
}