# Báo Cáo Sửa Lỗi Nút "Đặt Trước" Trên Trang Chủ

## 1. Mô tả vấn đề
Người dùng báo cáo rằng: Khi đang ở trạng thái đã đăng nhập, bấm vào nút **"Đặt trước"** ở mục **Trạng thái bãi đỗ thực tế** trên trang chủ, hệ thống lại chuyển hướng người dùng về trang đăng nhập (`/auth`) thay vì chuyển đến trang tìm kiếm và chọn vị trí đặt chỗ.

Nguyên nhân là do hành động `onClick` của nút "Đặt trước" trước đó đang bị gắn cứng (hard-code) phương thức `navigate('/auth')` mà không kiểm tra trạng thái xác thực.

## 2. Giải pháp và thay đổi
- Thực hiện kiểm tra xem `token` có tồn tại trong `localStorage` hay không khi người dùng nhấn nút.
- Nếu **có token (đã đăng nhập)**: Chuyển hướng người dùng sang trang `/locations` để tìm kiếm và đặt bãi đỗ.
- Nếu **không có token (chưa đăng nhập)**: Chuyển hướng người dùng sang trang `/auth` như logic ban đầu.

## 3. Lịch sử thay đổi Code (`src/components/landing/StatusSection.jsx`)

### ❌ Code cũ
```jsx
<td>
  <button className="vin-btn vin-btn--primary vin-btn--sm"
    /* onClick={() => alert('Vui lòng đăng nhập để đặt chỗ trước!')} */
    onClick={() => navigate('/auth')}>
    Đặt trước
  </button>
</td>
```

### ✅ Code mới
```jsx
<td>
  <button className="vin-btn vin-btn--primary vin-btn--sm"
    onClick={() => {
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/locations'); // Chuyển đến trang đặt chỗ nếu đã đăng nhập
      } else {
        navigate('/auth'); // Quay về đăng nhập nếu chưa đăng nhập
      }
    }}>
    Đặt trước
  </button>
</td>
```
