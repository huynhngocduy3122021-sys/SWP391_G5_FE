# Thay đổi hiển thị sức chứa cho Staff

## Mục tiêu

Hiển thị số xe và tổng sức chứa thực tế của đúng chi nhánh Staff đang làm việc, không sử dụng dữ liệu mock và không tự cộng sức chứa từ danh sách khu vực.

## API được tích hợp

- Method: `GET`
- Endpoint: `/api/parking-branches/my-capacity`
- Phân quyền: `STAFF`, `MANAGER`
- Xác thực: JWT được Axios interceptor gửi qua header `Authorization: Bearer <token>`.
- Frontend không gửi `branchId`; backend tự xác định chi nhánh từ tài khoản đăng nhập.

Response mẫu:

```json
{
  "parkingBranchId": 12,
  "branchName": "Chi nhánh Trung tâm",
  "totalCapacity": 100,
  "occupiedCapacity": 65,
  "reservedCapacity": 10,
  "availableCapacity": 25
}
```

## Các file đã thay đổi

### `src/modules/manager/api/manager.js`

Thêm hàm gọi API sức chứa của chi nhánh hiện tại:

```js
getMyBranchCapacity: async () =>
  (await API.get('/api/parking-branches/my-capacity')).data,
```

### `src/modules/staff/components/StaffTopbar.jsx`

- Gọi `managerApi.getMyBranchCapacity()` cùng với API phiên gửi xe và đặt chỗ.
- Bỏ lời gọi `managerApi.getAllZones()` dùng để tự cộng sức chứa.
- Bỏ giá trị sức chứa mock `2000` và `MOCK_STATS`.
- Khởi tạo các giá trị thống kê sức chứa bằng `0`.
- Ánh xạ dữ liệu API như sau:

| Giao diện/trạng thái | Trường API |
| --- | --- |
| Số xe hiện tại (`totalVehicles`) | `occupiedCapacity` |
| Tổng sức chứa (`maxVehicles`) | `totalCapacity` |
| Đặt trước (`bookings`) | `reservedCapacity` |
| Chỗ còn trống (`slotsLeft`) | `availableCapacity` |

## Cách hiển thị

Chỉ số **TỔNG XE** luôn hiển thị theo định dạng:

```text
occupiedCapacity / totalCapacity
```

Ví dụ:

```text
65 / 100
```

Nếu API chưa trả dữ liệu hoặc xảy ra lỗi ở lần tải đầu tiên, giá trị khởi tạo được hiển thị là `0 / 0`; không thay thế bằng dữ liệu giả.

## Cập nhật dữ liệu

Dashboard gọi API ngay khi `StaffTopbar` được mở và tải lại thống kê sau mỗi 10 giây để số xe, đặt trước và sức chứa được cập nhật.

## Doanh thu hôm nay

StaffTopbar gọi thêm API:

- Method: `GET`
- Endpoint: `/api/payments/all`

Doanh thu hôm nay được tính từ các payment thỏa tất cả điều kiện:

- `paymentStatus` là `PAID`, `SUCCESS`, `COMPLETED`, `true` hoặc `1`.
- Có thời gian thanh toán thực tế `paidAt` hợp lệ.
- `paidAt` nằm trong khoảng từ 00:00 hôm nay đến trước 00:00 ngày mai theo múi giờ của trình duyệt.
- `branchId` hoặc tên chi nhánh của payment trùng với chi nhánh Staff đang đăng nhập.

Giá trị hiển thị là tổng trường `amount` của các payment hợp lệ. Vì khoảng ngày được tạo lại trong mỗi lần tải thống kê (10 giây/lần), sau khi qua 00:00 chỉ các payment của ngày mới được tính và doanh thu ngày cũ không còn hiển thị.

## Kiểm tra

Đã chạy `git diff --check` thành công, không phát hiện lỗi whitespace trong các thay đổi.
