// ContactPage - Trang thông tin liên hệ và hỗ trợ khách hàng
import { useState } from 'react';
import { toast } from 'react-toastify';

const faqData = [
  { id: 1, question: "Đăng ký tài khoản doanh nghiệp thế nào?", answer: "Vui lòng chọn chủ đề 'Hợp tác kinh doanh' để được hỗ trợ." },
  { id: 2, question: "Có hỗ trợ ví điện tử không?", answer: "Vinparking hỗ trợ MoMo, VNPAY QR, và Visa/Mastercard." },
  { id: 3, question: "Thời gian phản hồi là bao lâu?", answer: "Chúng tôi sẽ phản hồi trong vòng 15 đến 30 phút." }
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', topic: 'Hỗ trợ kỹ thuật', message: ''
  });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(`Cảm ơn ${formData.fullName}! Lời nhắn đã được gửi thành công.`);
    setFormData({ fullName: '', email: '', phone: '', topic: 'Hỗ trợ kỹ thuật', message: '' });
  };

  return (
    // Dùng class vin-bg-main thay cho mã màu hex cứng
    <div className="vin-bg-main min-vh-100 pb-5">
      <div className="text-center py-5">
        <h2 className="fw-bold vin-text-primary">Liên hệ với Vinparking</h2>
        <p className="text-muted mx-auto mt-2 w-75">Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ bạn tối ưu hóa giải pháp đỗ xe thông minh.</p>
      </div>

      <div className="container px-4 px-lg-5">
        <div className="row g-4 justify-content-center">
          
          {/* Cột trái */}
          <div className="col-12 col-md-5">
            <div className="bg-white p-4 h-100 shadow-sm border border-light rounded-4 d-flex flex-column justify-content-between">
              <div>
                <h5 className="fw-bold mb-4 vin-text-primary">Thông tin liên hệ</h5>
                
                <div className="d-flex gap-3 mb-4">
                  <div className="fs-4 text-primary">📍</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1 small">TRỤ SỞ CHÍNH</h6>
                    <p className="text-muted mb-0 small">Landmark 81, Vinhomes Central Park, Quận Bình Thạnh, TP.HCM</p>
                  </div>
                </div>

                <div className="d-flex gap-3 mb-4">
                  <div className="fs-4 text-primary">📞</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1 small">HOTLINE HỖ TRỢ</h6>
                    <p className="text-muted mb-0 small">1900 123 456</p>
                  </div>
                </div>

                <div className="d-flex gap-3 mb-4">
                  <div className="fs-4 text-primary">✉️</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1 small">EMAIL</h6>
                    <p className="text-muted mb-0 small">support@vinparking.com</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-center">
                  <button 
                    type="button" 
                    onClick={() => setShowMap(!showMap)} 
                    className="btn btn-outline-secondary w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
                  >
                    <span>🗺️</span> {showMap ? 'Ẩn bản đồ vị trí' : 'Xem bản đồ vị trí'}
                  </button>
                </div>

                {showMap && (
                  <div className="mt-3 overflow-hidden rounded-3 border shadow-sm">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1959.6057181729755!2d106.71971419839477!3d10.795111900000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527c2f8f30911%3A0x36ac5073f8c91acd!2sLandmark%2081!5e0!3m2!1svi!2s!4v1785410684926!5m2!1svi!2s"
                      width="100%"
                      height="260"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title="Landmark 81 Google Map"
                    ></iframe>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Form */}
          <div className="col-12 col-md-6">
            <div className="bg-white p-4 h-100 shadow-sm border border-light rounded-4">
              <h5 className="fw-bold mb-4 vin-text-primary">Gửi lời nhắn</h5>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label text-muted fw-medium small mb-1">Họ tên</label>
                  <input type="text" name="fullName" required className="form-control bg-light border-0 py-2" value={formData.fullName} onChange={handleInputChange} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted fw-medium small mb-1">Email</label>
                  <input type="email" name="email" required className="form-control bg-light border-0 py-2" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted fw-medium small mb-1">Số điện thoại</label>
                  <input type="tel" name="phone" required className="form-control bg-light border-0 py-2" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted fw-medium small mb-1">Chủ đề</label>
                  <select name="topic" className="form-select bg-light border-0 py-2" value={formData.topic} onChange={handleInputChange}>
                    <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                    <option value="Hợp tác kinh doanh">Hợp tác kinh doanh</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted fw-medium small mb-1">Nội dung tin nhắn</label>
                  <textarea name="message" required rows="3" className="form-control bg-light border-0 py-2" value={formData.message} onChange={handleInputChange}></textarea>
                </div>
                <div className="col-12 mt-4">
                  {/* Sử dụng class vin-btn-teal đã khai báo */}
                  <button type="submit" className="btn vin-btn-teal w-100 py-2 rounded-3 fw-medium">
                    Gửi tin nhắn ➔
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

        {/* Khu vực FAQ */}
        <div className="mt-5 mx-auto" style={{ maxWidth: '800px' }}>
          <h5 className="fw-bold text-center mb-4 vin-text-primary">Câu hỏi thường gặp</h5>
          <div className="d-flex flex-column gap-3">
            {faqData.map((faq) => (
              <div key={faq.id} className="bg-white border rounded-3 shadow-sm overflow-hidden">
                <div className="d-flex align-items-center justify-content-between p-3 cursor-pointer" 
                     onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                  <span className="fw-semibold text-dark small">{faq.question}</span>
                  <span className={`text-muted small transition-all ${openFaq === faq.id ? 'transform-rotate-180' : ''}`}>▼</span>
                </div>
                {openFaq === faq.id && (
                  <div className="p-3 border-top bg-light text-secondary small lh-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}