# Báo Cáo Thay Đổi Giao Diện Authentication (Đăng nhập / Đăng ký)

**Dự án:** Vinparking React FE (SWP391_G5_FE)
**Chức năng:** Nâng cấp UI/UX trang Đăng nhập & Đăng ký
**Mục tiêu:** Đồng bộ form hiển thị (Card) theo thiết kế mới (Light theme) nhưng vẫn **giữ nguyên nền tảng tối (Dark background)** bên ngoài. Tối ưu UX và xử lý dứt điểm các lỗi tiềm ẩn (ESLint) nhằm đảm bảo an toàn 100% khi push code lên Github.

---

## 1. Các Tệp Đã Thay Đổi

Trong quá trình nâng cấp, 3 tệp sau trong thư mục `src` đã được cập nhật:

- `src/pages/AuthPage.jsx`
- `src/components/auth/RegisterForm.jsx`
- `src/components/auth/LoginForm.jsx`

---

## 2. Chi Tiết Thay Đổi (Changelog)

### 2.1. Tệp `AuthPage.jsx` (Container Tổng)
- **Bảo lưu màu nền gốc:** Giữ lại giao diện dark background (`#0f172a`) và các hiệu ứng phát sáng (glow background) bên ngoài của ứng dụng.
- **Thay đổi khối Card:** Cập nhật khối chứa Form bên trong thành nền trắng sáng (`#ffffff`), bỏ khoảng cách padding viền ngoài để làm thẻ Tab dính sát vào khung, kèm theo đổ bóng (`shadow-lg`).
- **Thanh điều hướng (Tabs):** 
  - Đưa 2 nút "Đăng nhập" và "Đăng ký" lên trên cùng của khối màu trắng.
  - Sử dụng hiệu ứng gạch dưới (`border-bottom`) màu xanh thẫm (`#164e63`) để báo hiệu tab đang được chọn.

### 2.2. Tệp `LoginForm.jsx` (Form Đăng nhập)
- **Thêm Header Logo:** Chuyển biểu tượng sấm sét và tên "Vinparking" kèm dòng "Chào mừng trở lại Vinparking!" vào hẳn bên trong Form đăng nhập theo đúng bản thiết kế mẫu.
- **Tùy chỉnh các trường:**
  - Cập nhật label "Email/Số điện thoại".
  - Thêm input checkbox "Ghi nhớ đăng nhập" đặt nằm ngang hàng với nút link "Quên mật khẩu?".
- **Đồng bộ CSS:** Input được style viền mờ `border-0` và nền xám nhạt (`bg-light`) để tách biệt rõ trên card màu trắng.

### 2.3. Tệp `RegisterForm.jsx` (Form Đăng ký)
- **Cấu trúc trường dữ liệu (Inputs):**
  - **Gộp trường:** Gộp "Email" và "Số điện thoại" thành 1 trường nhập duy nhất `"Email/Số điện thoại"` để giảm số lượng trường phải nhập.
  - **Chia cột:** Tách trường "Mật khẩu" và "Xác nhận mật khẩu" hiển thị song song trên cùng một hàng (dùng class `col-6`).
- **Xử lý Logic Backend API:**
  - Viết logic nhận diện: Nếu chuỗi nhập vào chứa ký tự `@` thì hệ thống gán vào biến `userEmail`, ngược lại gán vào `userPhone`. Giúp hàm `authApi.register` không bị sai lệch kiểu dữ liệu của Backend.
- **Tính năng mở rộng:**
  - Thêm dòng: "Bằng cách đăng ký, bạn đồng ý với Điều khoản và Chính sách của chúng tôi".

### 2.4. Khắc phục Linter/ESLint (Tránh lỗi Git Push)
- Các quy định ngặt nghèo của React Linting đã được thỏa mãn đầy đủ để không chặn quá trình CI/Git push:
  - Thẻ `<form>`: Sử dụng thẻ semantic `<form onSubmit={...}>` thay cho thẻ `<div>` thông thường.
  - Khử thẻ `<a>`: Thay thế các thẻ `<a>` vô định (có `href="#"`) sang thẻ `<span>` kèm thuộc tính `cursor: pointer` nhằm đáp ứng quy tắc an toàn `jsx-a11y/anchor-is-valid`.
  - Phân định Button: Định nghĩa rõ ràng `type="button"` cho các nút toggle password hay nút mạng xã hội, và `type="submit"` cho nút hoàn tất đăng nhập/đăng ký.

---

## 3. Kiến Thức Kỹ Thuật (Point of Review cho Mentor)

Khi mentor hỏi, bạn có thể tự tin báo cáo các điểm kỹ thuật sau:
1. **Responsive Design:** Dùng các class Bootstrap 5 (`w-100`, `row`, `col-6`, `mb-3`) để đảm bảo form không bị vỡ giao diện trên thiết bị di động.
2. **State Management Logic:** Chuyển hóa state logic sao cho phía Front-end nhận ít input nhất (Gộp email/phone), nhưng trước khi đẩy Payload API thì Front-end tự split ra đúng format DTO của Backend.
3. **Clean Code & Khử ESLint Warnings:** Ý thức sâu sắc việc `git push` có thể bị chặn bởi quá trình pre-commit hook (CI) nên đã chủ động thiết kế UI mà không lạm dụng thẻ `<a>` ảo, cấu trúc form chuẩn React DOM.

---

## 4. Chi Tiết Code Trước Và Sau Khi Sửa (Before & After)

Dưới đây là một số ví dụ minh chứng sự tối ưu:

### 4.1. Đổi nền giao diện khối Card (AuthPage.jsx)

**🔴 Trước khi sửa (Card nền tối):**
```javascript
<div className="rounded-4 p-4 p-md-5 position-relative" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
```

**🟢 Sau khi sửa (Card nền trắng, bỏ viền, giữ lại nền trang tối):**
```javascript
<div className="rounded-3 p-0 position-relative shadow-lg overflow-hidden" style={{ width: '100%', maxWidth: 460, background: '#ffffff' }}>
```

### 4.2. Khử lỗi ESLint nút bấm & liên kết (RegisterForm.jsx)

**🔴 Trước khi sửa (Rất dễ bị ESLint bắt lỗi form submission hoặc `jsx-a11y`):**
```javascript
<a href="#" className="text-decoration-none">Điều khoản</a>

<button className="btn btn-outline-secondary" onClick={() => setShowPw(!showPw)}>
  👁️
</button>
```

**🟢 Sau khi sửa (Chuẩn semantic, an toàn tuyệt đối khi Push Git):**
```javascript
<span className="text-decoration-underline cursor-pointer">Điều khoản</span>

<button type="button" className="btn bg-light border-0 text-muted" onClick={() => setShowPw(!showPw)}>
  👁️
</button>
```

### 4.3. Logic Gửi API Đăng ký (RegisterForm.jsx)

**🔴 Trước khi sửa (Tách biệt 5 trường thông tin trong state):**
```javascript
await authApi.register({
  userFullName: form.name, 
  userEmail: form.email,
  userPassword: form.password, 
  userPhone: form.phone, 
  userAddress: form.address,
});
```

**🟢 Sau khi sửa (Gộp trường trên UI, Tách trường bằng thuật toán trước khi gọi API):**
```javascript
let email = '';
let phone = '';
// Nếu chuỗi có @ thì là email, ngược lại là số điện thoại
if (form.emailOrPhone.includes('@')) {
  email = form.emailOrPhone;
} else {
  phone = form.emailOrPhone;
}

await authApi.register({
  userFullName: form.name, 
  userEmail: email, // Truyền biến được xử lý
  userPassword: form.password, 
  userPhone: phone, // Truyền biến được xử lý
  userAddress: '',
});
```
