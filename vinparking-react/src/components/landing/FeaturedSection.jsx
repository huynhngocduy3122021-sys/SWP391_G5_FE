import landmark from '../../assets/parking_landmark.png';
import vincom from '../../assets/parking_vincom.png';
import grandpark from '../../assets/parking_grandpark.png';
import metropolis from '../../assets/parking_metropolis.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const places = [
  { img: landmark, name: 'Landmark 81 Premium', location: 'Bình Thạnh, TP.HCM', price: '30.000đ/Block', rating: 4.8 },
  { img: vincom, name: 'Vincom Center Đồng Khởi', location: 'Quận 1, TP.HCM', price: '30.000đ/Block', rating: 4.9 },
  { img: grandpark, name: 'Grand Park Smart Garage', location: 'Quận 9, TP.HCM', price: '20.000đ/Block', rating: 4.5 },
  { img: metropolis, name: 'Metropolis Underground', location: 'Ba Đình, Hà Nội', price: '30.000đ/Block', rating: 5.0 },
];

export default function FeaturedSection() {
  return (
    <section className="px-5 py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold mb-0">Những bãi đỗ nổi bật được đề xuất</h2>
        <a href="#" className="text-primary text-decoration-none">Xem thêm →</a>
      </div>
      <div className="row g-4">
        {places.map((p, i) => (
          <div key={i} className="col-md-3">
            <div className="rounded-4 overflow-hidden h-100"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className="position-relative">
                <img src={p.img} alt={p.name} className="w-100" style={{ height: 160, objectFit: 'cover' }} />
                <span className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75">⭐ {p.rating}</span>
              </div>
              <div className="p-3">
                <h6 className="text-white fw-bold mb-1">{p.name}</h6>
                <small className="text-white-50 d-block mb-2">📍 {p.location}</small>
                <span className="text-primary fw-semibold small">VND {p.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
