import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import parkingApi from '../../api/parkingApi';
import { mapBranchToParkingLot } from '../../utils/mapBranch';

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
          setLots([]);
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
        setLots([]);
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
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="place-card" style={{ pointerEvents: 'none' }}>
              <div className="place-card__img-wrap">
                <div style={{ width: '100%', height: '160px', background: 'rgba(0,0,0,0.05)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
              </div>
              <div className="place-card__body">
                <div style={{ width: '70%', height: '18px', background: 'rgba(0,0,0,0.05)', marginBottom: '8px', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                <div style={{ width: '40%', height: '14px', background: 'rgba(0,0,0,0.05)', marginBottom: '12px', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                <div className="d-flex flex-column gap-2">
                  <div style={{ width: '90%', height: '14px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                  <div style={{ width: '85%', height: '14px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                </div>
              </div>
            </div>
          ))
        ) : lots.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1', color: '#64748b' }}>
            Không tìm thấy bãi đỗ nổi bật nào.
          </div>
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
                  <span className="place-card__price" style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>🚗 Ô tô: {prices.car.toLocaleString('vi-VN')}đ/Block</span>
                  <span className="place-card__price" style={{ fontSize: '0.85rem', color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>🏍️ Xe máy: {prices.motor.toLocaleString('vi-VN')}đ/Block</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}