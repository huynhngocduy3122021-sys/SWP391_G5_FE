# Báo cáo Cập nhật: Logic Đăng nhập, Giao diện Đăng ký & Điều hướng hệ thống

Tài liệu này ghi chú lại các thay đổi kỹ thuật nhằm hoàn thiện luồng đăng nhập bằng số điện thoại, cải thiện giao diện đăng ký, và chuẩn hóa luồng điều hướng của toàn bộ ứng dụng Vinparking. Dưới đây là giải thích chi tiết kèm theo các đoạn code đã được thay đổi.

---

## 1. Cập nhật Giao diện Đăng ký (`RegisterForm.jsx`)

**Mục tiêu:** Tách ô nhập liệu chung thành hai ô "Email" và "Số điện thoại" riêng biệt, hiển thị kích thước ngang đầy đủ để đồng bộ với ô "Họ và tên", đồng thời gửi dữ liệu thực tế lên Backend thay vì tạo dữ liệu ảo.

**Code đã sửa trong State & API Payload:**
```javascript
// CŨ: Dùng chung 1 biến và tự sinh dữ liệu giả
const [form, setForm] = useState({ name: '', emailOrPhone: '', password: '', confirmPassword: '' });
// ...
let email = '';
let phone = '';
if (form.emailOrPhone.includes('@')) {
  email = form.emailOrPhone;
} else {
  phone = form.emailOrPhone;
}
await authApi.register({
  userFullName: form.name, 
  userEmail: email,
  userPassword: form.password, 
  userPhone: phone, 
  userAddress: '',
});

// MỚI: Tách thành 2 biến riêng biệt và gửi trực tiếp
const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
// ...
await authApi.register({
  userFullName: form.name, 
  userEmail: form.email,
  userPassword: form.password, 
  userPhone: form.phone, 
  userAddress: 'Chưa cập nhật',
});
```

**Code đã sửa trong Giao diện (JSX):**
```jsx
{/* CŨ: Cấu trúc chia cột (col-6) và gộp chung */}
<div className="mb-3">
  <label className="form-label small fw-semibold text-dark">Email/Số điện thoại</label>
  <input type="text" className="form-control" value={form.emailOrPhone} onChange={set('emailOrPhone')} required />
</div>

{/* MỚI: Đứng độc lập, kéo dài 100% giống ô "Họ và Tên" */}
<div className="mb-3">
  <label className="form-label small fw-semibold text-dark">Email</label>
  <input type="email" className="form-control bg-light text-dark border-0"
    placeholder="Địa chỉ email" value={form.email} onChange={set('email')} required />
</div>
<div className="mb-3">
  <label className="form-label small fw-semibold text-dark">Số điện thoại</label>
  <input type="text" className="form-control bg-light text-dark border-0"
    placeholder="Số điện thoại" value={form.phone} onChange={set('phone')} required />
</div>
```

---

## 2. Hoàn thiện Logic Đăng nhập Backend (`LoginRequest.java`)

**Mục tiêu:** Cho phép người dùng nhập tự do số điện thoại hoặc email. Spring Boot sẽ không còn chặn request lại ở tầng Filter với thông báo lỗi `"Invalid email format"` nữa.

**Code đã sửa trong DTO:**
```java
// CŨ: Bị văng lỗi Invalid email format nếu nhập số điện thoại
public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String userEmail;
    
    @NotBlank(message = "Password is required")
    private String userPassword;
}

// MỚI: Đã gỡ thẻ @Email và đổi message thông báo
public class LoginRequest {
    @NotBlank(message = "Email or Phone is required")
    private String userEmail;
    
    @NotBlank(message = "Password is required")
    private String userPassword;
}
```
*(Ghi chú: Đã có thử nghiệm đổi `userEmail` thành `identifier`, nhưng vì gây lỗi bất đồng bộ với Jackson Mapper khiến biến nhận được bị Null, nên đã lùi lại dùng tên biến gốc `userEmail` để duy trì sự ổn định).*

---

## 3. Chuẩn hóa Điều hướng Trang chính (`App.jsx`)

**Mục tiêu:** Khi người dùng mới truy cập trang web, trang giới thiệu dự án (Landing Page) sẽ là ấn tượng đầu tiên thay vì trang Tìm kiếm. Trang tìm kiếm bãi đỗ xe đã được cách ly vào url `/locations`.

**Code đã sửa trong Routing:**
```javascript
// CŨ: Trang gốc trỏ về SearchPage
<Routes>
  <Route path="/" element={<PublicLayout><SearchPage /></PublicLayout>} />
  <Route path="/locations" element={<PublicLayout><SearchPage /></PublicLayout>} />
</Routes>

// MỚI: Trang gốc trỏ về LandingPage
<Routes>
  <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
  <Route path="/locations" element={<PublicLayout><SearchPage /></PublicLayout>} />
</Routes>
```

---

## 4. Fix lỗi Luồng Đăng xuất & Đăng nhập (`UserSidebar.jsx`)

**Mục tiêu:** Nút "Đăng xuất" phải thực sự hủy phiên làm việc thay vì chỉ điều hướng. Khi đăng xuất xong sẽ quay về Landing Page.

**Code đã sửa cho nút Đăng xuất:**
```jsx
// CŨ: Chỉ điều hướng, không xóa token trong trình duyệt
<button onClick={() => navigate('/auth')} className="btn text-start text-danger bg-transparent border-0 d-flex align-items-center gap-2 py-2">
  <span>🚪</span> Đăng xuất
</button>

// MỚI: Đã bổ sung localStorage.clear() và đổi hướng về trang chủ '/'
<button onClick={() => { localStorage.clear(); navigate('/'); }} className="btn text-start text-danger bg-transparent border-0 d-flex align-items-center gap-2 py-2">
  <span>🚪</span> Đăng xuất
</button>
```

Hệ quả tích cực: Với thay đổi trong `App.jsx`, giờ đây bất kể khi người dùng Đăng nhập hay Đăng xuất thành công, hệ thống đều đưa họ về trang chủ `LandingPage`. Luồng trải nghiệm này hoàn toàn khép kín và tự nhiên.
