// UserHeader - Header chuyên biệt cho khu vực user dashboard
export default function UserHeader() {
  const fullName = localStorage.getItem('fullName') || 'User';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=164e63&color=fff`;

  return (
    <div className="d-flex align-items-center justify-content-between px-4 py-3">
      {/* Search Bar */}
      <div className="input-group" style={{ maxWidth: '400px' }}>
        <span className="input-group-text bg-light border-0 text-muted">🔍</span>
        <input 
          type="text" 
          className="form-control bg-light border-0 shadow-none" 
          placeholder="Tìm kiếm dịch vụ, bãi đỗ..." 
        />
      </div>

      {/* Right Actions */}
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
          <span className="text-muted">🎧</span>
        </button>
        <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center position-relative" style={{ width: '40px', height: '40px' }}>
          <span className="text-muted">🔔</span>
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
            <span className="visually-hidden">New alerts</span>
          </span>
        </button>
        <div className="rounded-circle bg-secondary overflow-hidden ms-2 cursor-pointer" style={{ width: '40px', height: '40px' }}>
          <img src={avatarUrl} alt="Avatar" className="w-100 h-100 object-fit-cover" />
        </div>
      </div>
    </div>
  );
}
