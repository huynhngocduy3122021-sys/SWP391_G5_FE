import { useState } from 'react';

export default function WalletSection() {
  const fullName = localStorage.getItem('fullName') || 'Khách hàng';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=164e63&color=fff`;
  
  const [walletBalance] = useState(() => {
    const bal = localStorage.getItem('walletBalance');
    if (bal !== null) {
      return Number(bal);
    } else {
      localStorage.setItem('walletBalance', '1250000');
      return 1250000;
    }
  });

  const [customTx] = useState(() => {
    const txStr = localStorage.getItem('customTransactions');
    return txStr ? JSON.parse(txStr) : [];
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Ví và thanh toán</h4>
          <p className="text-muted small m-0">Quản lý số dư, lịch sử giao dịch và phương thức thanh toán</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Cột trái: Số dư & Phương thức */}
        <div className="col-lg-7">
          {/* Card Số dư */}
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
                + Nạp tiền
              </button>
              <button className="btn btn-outline-secondary fw-bold flex-grow-1">
                Rút tiền
              </button>
            </div>
          </div>

          {/* Tự động thanh toán */}
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 d-flex flex-row justify-content-between align-items-center" style={{ background: '#ffffff' }}>
            <div>
              <h6 className="fw-bold text-dark mb-1">⚡ Tự động thanh toán</h6>
              <p className="text-muted small m-0">Hệ thống sẽ tự trừ tiền khi xe ra khỏi bãi</p>
            </div>
            <div className="form-check form-switch fs-4 m-0">
              <input className="form-check-input cursor-pointer" type="checkbox" defaultChecked />
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="card border-0 shadow-sm p-4 rounded-4" style={{ background: '#ffffff' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold text-dark m-0">Phương thức thanh toán</h6>
              <button className="btn btn-link text-decoration-none small p-0" style={{ color: '#164e63' }}>
                + Thêm phương thức mới
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="border rounded-3 p-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded p-2" style={{ width: '40px', height: '40px' }}>
                    <img src="https://vincheck.vn/wp-content/uploads/2021/05/logo-vnpay.png" className="w-100 h-100 object-fit-contain" alt="VNPay" />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">VNPAY-QR</h6>
                    <small className="text-muted">Thanh toán nhanh qua App Ngân hàng</small>
                  </div>
                </div>
                <input type="radio" name="paymentMethod" className="form-check-input fs-5 cursor-pointer" defaultChecked />
              </div>

              <div className="border rounded-3 p-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded p-2" style={{ width: '40px', height: '40px' }}>
                    <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" className="w-100 h-100 object-fit-contain" alt="Momo" />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Ví MoMo</h6>
                    <small className="text-muted">0901***567</small>
                  </div>
                </div>
                <input type="radio" name="paymentMethod" className="form-check-input fs-5 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Biến động số dư */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold text-dark m-0">Biến động số dư</h6>
              <button className="btn btn-link text-muted text-decoration-none small p-0">
                Lọc
              </button>
            </div>
            
            <div className="d-flex flex-column gap-3">
              {/* Dynamic transactions first */}
              {customTx.map((tx) => (
                <div key={tx.id} className="d-flex justify-content-between align-items-center pb-3 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      ↑
                    </div>
                    <div>
                      <h6 className="mb-1 text-dark fw-bold">{tx.service}</h6>
                      <p className="text-muted small mb-0">{tx.date}</p>
                    </div>
                  </div>
                  <h6 className="text-danger fw-bold m-0">-{tx.amount.toLocaleString('vi-VN')}đ</h6>
                </div>
              ))}

              <div className="d-flex justify-content-between align-items-center pb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    ↑
                  </div>
                  <div>
                    <h6 className="mb-1 text-dark fw-bold">Thanh toán phí đỗ xe</h6>
                    <p className="text-muted small mb-0">18:45 - 13/12/2023</p>
                  </div>
                </div>
                <h6 className="text-danger fw-bold m-0">-25,000đ</h6>
              </div>
              
              <div className="d-flex justify-content-between align-items-center pb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    ↓
                  </div>
                  <div>
                    <h6 className="mb-1 text-dark fw-bold">Nạp tiền vào ví</h6>
                    <p className="text-muted small mb-0">09:00 - 10/12/2023</p>
                  </div>
                </div>
                <h6 className="text-success fw-bold m-0">+500,000đ</h6>
              </div>

              <div className="d-flex justify-content-between align-items-center pb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    ↑
                  </div>
                  <div>
                    <h6 className="mb-1 text-dark fw-bold">Thanh toán phí đỗ xe</h6>
                    <p className="text-muted small mb-0">14:20 - 05/12/2023</p>
                  </div>
                </div>
                <h6 className="text-danger fw-bold m-0">-15,000đ</h6>
              </div>
            </div>

            <button className="btn btn-link text-decoration-none w-100 mt-auto pt-3" style={{ color: '#164e63' }}>
              Xem tất cả →
            </button>
            
            {/* Banner Quảng cáo nhỏ */}
            <div className="mt-4 rounded-3 p-3 text-white text-center" style={{ background: 'linear-gradient(to right, #164e63, #0891b2)' }}>
              <h6 className="fw-bold mb-1">Hoàn tiền 5% khi nạp qua VNPAY</h6>
              <p className="small mb-2 opacity-75">Áp dụng đến hết 31/12/2023</p>
              <button className="btn btn-sm btn-light fw-bold px-4 text-dark">Nạp ngay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
