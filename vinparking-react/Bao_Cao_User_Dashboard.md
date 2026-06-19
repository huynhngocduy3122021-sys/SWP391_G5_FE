# Báo Cáo Tính Năng Mới: User Dashboard (Bảng Điều Khiển Khách Hàng)

**Dự án:** Vinparking React FE (SWP391_G5_FE)
**Chức năng:** Xây dựng giao diện User Dashboard hoàn toàn mới theo thiết kế Light Theme (Màu trắng sáng kết hợp Xanh Teal).
**Mục tiêu:** Tạo ra một cổng thông tin tập trung giúp khách hàng quản lý xe, gói cước, số dư ví, hồ sơ cá nhân và xem lịch sử giao dịch một cách trực quan, hiện đại.

---

## 1. Các Tệp Mới Được Thêm Vào Hệ Thống

Để đảm bảo source code không bị lộn xộn, toàn bộ các thành phần của Bảng điều khiển Khách hàng được gom nhóm vào thư mục `src/components/user-dashboard/`.

### Danh sách các file mới tạo:
1. `src/pages/UserDashboardPage.jsx`: Trang cha chứa Layout chính.
2. `src/components/user-dashboard/UserSidebar.jsx`: Thanh Menu điều hướng bên trái.
3. `src/components/user-dashboard/UserHeader.jsx`: Thanh công cụ phía trên (Tìm kiếm, Thông báo, Avatar).
4. `src/components/user-dashboard/VehicleSection.jsx`: Component tab "Phương tiện & Gói cước".
5. `src/components/user-dashboard/WalletSection.jsx`: Component tab "Ví và thanh toán".
6. `src/components/user-dashboard/ProfileSection.jsx`: Component tab "Hồ sơ cá nhân chi tiết".
7. `src/components/user-dashboard/HistorySection.jsx`: Component tab "Lịch sử giao dịch".

---

## 2. Các Hàm và Logic Quan Trọng Vừa Thêm Mới

### 2.1. Cập nhật Router chuyển hướng (`src/App.jsx`)
Đã định nghĩa thêm một Route mới bảo mật (`PrivateRoute`) để chỉ những user đã đăng nhập mới vào được:
```javascript
// Thêm import trang mới
import UserDashboardPage from './pages/UserDashboardPage';

// Khai báo Route
<Route path="/user-dashboard" element={
  <PrivateRoute>
    <UserDashboardPage />
  </PrivateRoute>
} />
```

### 2.2. Logic Điều hướng sau Đăng nhập (`src/pages/AuthPage.jsx`)
Thay đổi hàm `handleLoginSuccess` để khi người dùng đăng nhập thành công, hệ thống tự động đẩy thẳng vào trang User Dashboard mới:
```javascript
// Đã chuyển từ '/dashboard' sang '/user-dashboard'
const handleLoginSuccess = () => navigate('/user-dashboard');
```

### 2.3. Logic Quản lý Tab Động (Dynamic Rendering) trong `UserDashboardPage.jsx`
Thay vì tạo 4 trang URL rời rạc làm web bị load lại chậm chạp, chúng tôi sử dụng Hook `useState` và cơ chế Switch-Case để Render nội dung tức thì (Single Page Application - SPA).

```javascript
// Khởi tạo state mặc định là tab Phương tiện
const [activeTab, setActiveTab] = useState('vehicles'); 

// Hàm switch component thông minh
const renderContent = () => {
  switch (activeTab) {
    case 'profile': return <ProfileSection />;
    case 'vehicles': return <VehicleSection />;
    case 'wallet': return <WalletSection />;
    case 'history': return <HistorySection />;
    default: return <VehicleSection />;
  }
};
```

### 2.4. Logic Chọn Menu ở Sidebar (`UserSidebar.jsx`)
Sidebar nhận `activeTab` từ trang cha để highlight màu xanh mục đang được chọn. Khi người dùng bấm vào một menu, nó gọi hàm `onTabChange` để cập nhật State của trang cha.
```javascript
<button
  key={item.id}
  onClick={() => onTabChange(item.id)} // Truyền ID của Tab cần mở lên cha
  className={`btn text-start d-flex align-items-center gap-3 py-2 px-3 rounded-3 border-0 fw-medium transition-all ${
    activeTab === item.id ? 'bg-light text-dark' : 'bg-transparent text-muted hover-bg-light'
  }`}
  style={{ 
    color: activeTab === item.id ? '#164e63' : '',
    borderLeft: activeTab === item.id ? '4px solid #164e63' : '4px solid transparent'
  }}
>
  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
  {item.label}
</button>
```

---

## 3. Review Giao Diện (UI/UX)

- **Layout Grid & Flexbox:** Toàn bộ Dashboard sử dụng `d-flex` (Flexbox) để chia đôi Layout: Một bên cố định (`Sidebar` rộng `280px`), một bên cuộn linh hoạt (`flex-grow-1`).
- **Cards & Shadows:** Các khối thông tin trong 4 tab được thiết kế dưới dạng thẻ Card nền trắng (`#ffffff`), bo góc mạnh (`rounded-4`), và viền đổ bóng siêu mịn (`shadow-sm`) để làm nổi bật thông tin trên nền xám nhạt (`#f8fafc`).
- **Màu sắc thương hiệu:** Tuân thủ triệt để tone màu nhận diện của Vinparking: màu Xanh Lục đậm (`#164e63`) cho các nút bấm chính, viền active, và các chỉ số tài chính quan trọng.

---

> 📝 **Lưu ý cho Dev:** Giao diện hiện tại đã được dựng chuẩn HTML/CSS/React. Bước tiếp theo là call API từ Backend để thay thế các dữ liệu giả (Dummy Data) trong các file `...Section.jsx` bằng dữ liệu thật của User.
