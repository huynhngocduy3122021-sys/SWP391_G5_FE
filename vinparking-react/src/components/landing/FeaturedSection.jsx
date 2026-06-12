import landmark    from '../../image/parking_landmark.png';
import vincom      from '../../image/parking_vincom.png';
import grandpark   from '../../image/parking_grandpark.png';
import metropolis  from '../../image/parking_metropolis.png';

const PLACES = [
  { img: landmark,   name: 'Landmark 81 Premium',        location: 'Bình Thạnh, TP.HCM', price: '30.000đ/Block', rating: 4.8 },
  { img: vincom,     name: 'Vincom Center Đồng Khởi',    location: 'Quận 1, TP.HCM',     price: '30.000đ/Block', rating: 4.9 },
  { img: grandpark,  name: 'Grand Park Smart Garage',     location: 'Quận 9, TP.HCM',     price: '20.000đ/Block', rating: 4.5 },
  { img: metropolis, name: 'Metropolis Underground',      location: 'Ba Đình, Hà Nội',    price: '30.000đ/Block', rating: 5.0 },
];

export default function FeaturedSection() {
  return (
    <section className="featured-section">
      <div className="section-header">
        <h2>Những bãi đỗ nổi bật được đề xuất</h2>
        <a href="#">Xem thêm →</a>
      </div>
      <div className="place-grid">
        {PLACES.map((p, i) => (
          <div key={i} className="place-card">
            <div className="place-card__img-wrap">
              <img src={p.img} alt={p.name} className="place-card__img" />
              <span className="place-card__rating">⭐ {p.rating}</span>
            </div>
            <div className="place-card__body">
              <h6 className="place-card__name">{p.name}</h6>
              <small className="place-card__loc">📍 {p.location}</small>
              <span className="place-card__price">VND {p.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
