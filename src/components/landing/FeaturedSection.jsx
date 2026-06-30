import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import parkingApi from '../../api/parkingApi';
import { PARKING_LOTS, mapBranchToParkingLot } from '../../data/parkingData';

export default function FeaturedSection() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const branches = await parkingApi.getAllBranches();
        if (branches && branches.length > 0) {
          setLots(branches.map(mapBranchToParkingLot));
        } else {
          setLots(PARKING_LOTS);
        }
      } catch (error) {
        console.error('Error fetching parking branches:', error);
        setLots(PARKING_LOTS);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  return (
    <section className="featured-section">
      <div className="section-header">
        <h2>Những bãi đỗ nổi bật được đề xuất</h2>
        <Link to="/locations">Xem thêm →</Link>
      </div>
      <div className="place-grid">
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.7)', padding: '20px' }}>Đang tải danh sách bãi đỗ...</div>
        ) : (
          lots.map((p) => (
            <div 
              key={p.id} 
              className="place-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/pricing', { state: { selectedLotId: p.id } })}
            >
              <div className="place-card__img-wrap">
                <img src={p.img} alt={p.name} className="place-card__img" />
                <span className="place-card__rating">⭐ {p.rating}.0</span>
              </div>
              <div className="place-card__body">
                <h6 className="place-card__name">{p.name}</h6>
                <small className="place-card__loc">📍 {p.area}</small>
                <span className="place-card__price">VND {p.priceBlock}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}