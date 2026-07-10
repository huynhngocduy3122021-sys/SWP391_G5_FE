import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import parkingApi from '../../api/parkingApi';
import { PARKING_LOTS, mapBranchToParkingLot } from '../../data/parkingData';

export default function FeaturedSection() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({ car: 30000, motor: 5000 });

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const [branchesData, policiesData] = await Promise.all([
          parkingApi.getAllBranches(),
          parkingApi.getAllPricePolicies().catch(() => [])
        ]);
        
        const branches = Array.isArray(branchesData) ? branchesData : (branchesData?.content || branchesData?.data || []);
        if (branches.length > 0) {
          setLots(branches.map(mapBranchToParkingLot));
        } else {
          setLots(PARKING_LOTS);
        }

        const policies = Array.isArray(policiesData) ? policiesData : (policiesData?.content || policiesData?.data || []);
        const activeHourly = policies.filter(p => p.active && !p.policyName?.includes('[Gói'));
        
        let carPrice = 30000;
        let motorPrice = 5000;

        activeHourly.forEach(p => {
          const name = p.policyName?.toLowerCase() || '';
          const type = p.vehicleType?.typeName?.toLowerCase() || '';
          const isCar = name.includes('ô tô') || type.includes('car');
          const isMotor = name.includes('xe máy') || type.includes('motor');
          const isStandard = name.includes('tiêu chuẩn') || (!name.includes('qua đêm') && !name.includes('tháng'));

          if (isCar && isStandard) carPrice = p.basePrice || carPrice;
          if (isMotor && isStandard) motorPrice = p.basePrice || motorPrice;
        });

        setPrices({ car: carPrice, motor: motorPrice });

      } catch (error) {
        console.error('Error fetching data:', error);
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
                <div className="d-flex flex-column mt-2 gap-1">
                  <span className="place-card__price" style={{ fontSize: '0.85rem' }}>🚗 Ô tô: {prices.car.toLocaleString('vi-VN')}đ/Block</span>
                  <span className="place-card__price" style={{ fontSize: '0.85rem', color: '#10b981' }}>🏍️ Xe máy: {prices.motor.toLocaleString('vi-VN')}đ/Block</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}