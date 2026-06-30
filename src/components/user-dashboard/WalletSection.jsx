import { useState } from 'react';

export default function WalletSection() {
  const fullName = localStorage.getItem('fullName') || 'Khách hàng';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=164e63&color=fff`;

  const [walletBalance] = useState(() => {
    const bal = localStorage.getItem('walletBalance');
    return bal !== null ? Number(bal) : 0;
  });

  const transactions = [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Ví và thanh toán</h4>
          <p className="text-muted small m-0">Dữ liệu ví được lấy từ hệ thống thật.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#ffffff' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle bg-secondary overflow-hidden" style={{ width: '48px', height: '48px' }}>
                  <img src={avatarUrl} alt="Avatar" className="w-100 h-100 object-fit-cover" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">{fullName}</h6>
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.7rem' }}>
                    Vinparking Wallet
                  </span>
                </div>
              </div>
              <div className="text-end">
                <p className="text-muted small mb-1">Số dư khả dụng</p>
                <h3 className="fw-bold m-0" style={{ color: '#164e63' }}>
                  {walletBalance.toLocaleString('vi-VN')}
                  <span style={{ fontSize: '1.2rem' }}>đ</span>
                </h3>
              </div>
            </div>

            <div className="d-flex gap-3">
              <button className="btn fw-bold flex-grow-1" style={{ backgroundColor: '#164e63', color: '#fff' }}>
                Nạp tiền
              </button>
              <button className="btn btn-outline-secondary fw-bold flex-grow-1">
                Rút tiền
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 d-flex flex-row justify-content-between align-items-center" style={{ background: '#ffffff' }}>
            <div>
              <h6 className="fw-bold text-dark mb-1">Tự động thanh toán</h6>
              <p className="text-muted small m-0">Hệ thống sẽ tự trừ tiền khi xe ra khỏi bãi.</p>
            </div>
            <div className="form-check form-switch fs-4 m-0">
              <input className="form-check-input cursor-pointer" type="checkbox" />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold text-dark m-0">Biến động số dư</h6>
            </div>

            <div className="d-flex flex-column gap-3">
              {transactions.length === 0 ? (
                <div className="text-muted text-center py-4">
                  Chưa có biến động số dư từ backend.
                </div>
              ) : transactions.map((tx) => (
                <div key={tx.id} className="d-flex justify-content-between align-items-center pb-3 border-bottom">
                  <div>
                    <h6 className="mb-1 text-dark fw-bold">{tx.service}</h6>
                    <p className="text-muted small mb-0">{tx.date}</p>
                  </div>
                  <h6 className="fw-bold m-0">{tx.amount.toLocaleString('vi-VN')}đ</h6>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
