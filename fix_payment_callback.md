# Sửa trạng thái mua gói: đã thanh toán nhưng Manager vẫn thấy “Chờ thanh toán”

## 1. Hiện tượng

Sau khi người dùng thanh toán VNPay thành công:

- Trang kết quả báo thanh toán thành công.
- Phía Manager, trong **Quản lý Thành viên → Yêu cầu đăng ký**, yêu cầu vẫn hiển thị **Chờ thanh toán**.
- Manager không thấy yêu cầu nằm trong nhóm **Chờ duyệt**.

## 2. Kết quả kiểm tra frontend

Phần hiển thị của Manager hiện đang dùng quy ước:

```text
status = 0: Chờ thanh toán
status = 1: Đã thanh toán, chờ Manager duyệt
status = 2 hoặc -1: Từ chối/Hủy
```

Trong `src/components/manager/MemberPanel.jsx`, cách hiển thị này là đúng:

```jsx
{r.status === 0
  ? 'Chờ thanh toán'
  : r.status === 1
    ? (isProcessed ? 'Đã duyệt' : 'Đã thanh toán (Chờ duyệt)')
    : 'Từ chối'}
```

Badge chờ duyệt cũng đã đếm các yêu cầu có `status === 1` và chưa được cấp vé:

```jsx
const pendingRequests = processedRequestsData.filter(
  r => r.status === 1 && !r.isProcessed
);
```

Vì vậy, không nên sửa Manager để biến `status = 0` thành “Đã thanh toán”. Manager đang hiển thị đúng dữ liệu nhận được từ API.

## 3. Nguyên nhân chính

`src/pages/PaymentResultPage.jsx` đang đọc trực tiếp:

```text
vnp_ResponseCode
vnp_TransactionStatus
success
```

sau đó tự hiển thị giao dịch thành công.

Tuy nhiên trang này chưa gọi:

```js
parkingApi.getVnpayReturnInfo(params)
```

API đã được khai báo tại:

```text
GET /api/payments/vnpay-return
```

Do đó có thể xảy ra tình trạng:

1. VNPay chuyển trình duyệt về frontend.
2. Frontend thấy `vnp_ResponseCode=00` và báo thành công.
3. Backend chưa xác thực chữ ký hoặc chưa cập nhật yêu cầu từ `status = 0` sang `status = 1`.
4. Manager tải lại danh sách và vẫn nhận `status = 0`.

Frontend không nên coi query trên URL là kết quả cuối cùng trước khi backend xác thực.

## 4. Sửa PaymentResultPage.jsx

Mở:

```text
src/pages/PaymentResultPage.jsx
```

### 4.1. Thêm import API

```jsx
import parkingApi from '../api/parkingApi';
```

### 4.2. Không tính kết quả cuối cùng chỉ bằng biến thông thường

Nên dùng state để chờ backend xác thực:

```jsx
const [verifying, setVerifying] = useState(true);
const [paymentResult, setPaymentResult] = useState({
  success: false,
  message: '',
});
```

### 4.3. Gọi API xác thực khi trang được mở

Ví dụ:

```jsx
useEffect(() => {
  let cancelled = false;

  const verifyPayment = async () => {
    const hasVnpayParams =
      searchParams.has('vnp_ResponseCode') ||
      searchParams.has('vnp_TransactionStatus');

    if (!hasVnpayParams) {
      const success = searchParams.get('success') === 'true';

      if (!cancelled) {
        setPaymentResult({
          success,
          message:
            searchParams.get('message') ||
            (success
              ? 'Thanh toán thành công.'
              : 'Thanh toán thất bại hoặc đã bị huỷ.'),
        });
        setVerifying(false);
      }
      return;
    }

    try {
      const params = Object.fromEntries(searchParams.entries());
      const result = await parkingApi.getVnpayReturnInfo(params);

      if (cancelled) return;

      const verifiedSuccess =
        result?.success === true ||
        result?.status === 'SUCCESS' ||
        result?.paymentStatus === 'PAID';

      setPaymentResult({
        success: verifiedSuccess,
        message: verifiedSuccess
          ? 'Yêu cầu đăng ký thẻ tháng của bạn đã được thanh toán và đang chờ Manager duyệt.'
          : result?.message || 'Thanh toán không hợp lệ hoặc chưa được xác nhận.',
      });
    } catch (error) {
      if (cancelled) return;

      setPaymentResult({
        success: false,
        message:
          error.response?.data?.message ||
          'Không thể xác thực kết quả thanh toán. Vui lòng kiểm tra lại sau.',
      });
    } finally {
      if (!cancelled) setVerifying(false);
      localStorage.removeItem('lastPaymentType');
    }
  };

  verifyPayment();

  return () => {
    cancelled = true;
  };
}, [searchParams]);
```

Sau đó sử dụng:

```jsx
const { success, message } = paymentResult;
```

để render giao diện và toast.

### 4.4. Chỉ hiện toast sau khi xác thực xong

```jsx
useEffect(() => {
  if (verifying) return;

  if (paymentResult.success) {
    toast.success(paymentResult.message);
  } else {
    toast.error(paymentResult.message);
  }
}, [verifying, paymentResult]);
```

Trong lúc `verifying === true`, nên hiển thị:

```jsx
<div className="text-center py-5">
  <div className="spinner-border text-primary" />
  <p className="mt-3">Đang xác thực kết quả thanh toán...</p>
</div>
```

Không nên hiện “Thanh toán thành công” trước khi API xác thực trả về thành công.

## 5. Yêu cầu bắt buộc ở backend

API:

```text
GET /api/payments/vnpay-return
```

phải thực hiện đầy đủ các bước sau:

1. Xác thực `vnp_SecureHash`.
2. Kiểm tra `vnp_ResponseCode === "00"`.
3. Kiểm tra `vnp_TransactionStatus === "00"` nếu VNPay gửi trường này.
4. Tìm đúng yêu cầu mua gói bằng `vnp_TxnRef`, `requestId` hoặc bản ghi payment đã lưu.
5. Đảm bảo số tiền trả về khớp với số tiền của gói.
6. Cập nhật payment thành `PAID`.
7. Cập nhật `MonthlyTicketRequest.status` từ `0` sang `1`.
8. Trả về kết quả xác thực cho frontend.

Ví dụ logic backend:

```java
if (validSignature
        && "00".equals(vnpResponseCode)
        && "00".equals(vnpTransactionStatus)) {

    payment.setStatus(PaymentStatus.PAID);

    MonthlyTicketRequest request = payment.getMonthlyTicketRequest();
    request.setStatus(1); // Đã thanh toán, chờ Manager duyệt

    paymentRepository.save(payment);
    monthlyTicketRequestRepository.save(request);

    return new PaymentResultResponse(
        true,
        "Thanh toán thành công"
    );
}
```

Tên entity, enum và repository phải được thay theo backend thực tế.

## 6. Nên có VNPay IPN

Không nên chỉ dựa vào việc người dùng quay lại trang kết quả, vì người dùng có thể:

- Thanh toán thành công nhưng đóng tab VNPay.
- Mất mạng trước khi trình duyệt quay lại frontend.
- Không mở lại `PaymentResultPage.jsx`.

Backend nên có endpoint IPN do VNPay gọi trực tiếp. IPN cũng phải cập nhật:

```text
payment.status = PAID
monthlyTicketRequest.status = 1
```

API return và IPN phải xử lý idempotent: nếu giao dịch đã được cập nhật thành công thì không cập nhật hoặc cộng tiền lần thứ hai.

## 7. Callback phải đi đúng PaymentResultPage

Khi backend tạo URL VNPay cho mua gói, `vnp_ReturnUrl` phải trỏ tới:

```text
http://localhost:<frontend-port>/payment-result?paymentType=MONTHLY_TICKET&requestId=<requestId>
```

Phải đặt `vnp_ReturnUrl` trước khi tạo `vnp_SecureHash`.

Không sửa trực tiếp URL VNPay đã ký ở frontend.

## 8. Giữ lớp bảo vệ tại GateOutPanel.jsx

`src/components/staff/GateOutPanel.jsx` cần giữ điều kiện nhận diện giao dịch mua gói:

```jsx
const isMonthlyTicketPayment =
  searchParams.get('paymentType') === 'MONTHLY_TICKET' ||
  txnRef.startsWith('TXN_MT_') ||
  localStorage.getItem('lastPaymentType') === 'MONTHLY_TICKET';

if (isMonthlyTicketPayment) {
  navigate(`/payment-result?${searchParams.toString()}`, {
    replace: true,
  });
  return;
}
```

Mục đích là ngăn thanh toán mua gói hiển thị thông báo:

> Phiên gửi xe đã kết thúc.

## 9. PricingPage.jsx và VehicleSection.jsx

Trước khi chuyển sang VNPay, cả hai luồng mua gói cần lưu:

```jsx
localStorage.setItem('lastPaymentType', 'MONTHLY_TICKET');
```

Giá trị này chỉ là phương án hỗ trợ điều hướng frontend. Nó không thay thế việc xác thực và cập nhật trạng thái tại backend.

## 10. Không sửa sai ở Manager

Không thực hiện các cách sau:

- Không đổi nhãn `status = 0` thành “Đã thanh toán”.
- Không tự chuyển yêu cầu sang `status = 1` chỉ vì Manager mở trang.
- Không cho phép duyệt yêu cầu chưa được backend xác nhận thanh toán.
- Không cập nhật trạng thái thanh toán chỉ bằng dữ liệu query chưa xác thực.

Manager nên tiếp tục hiển thị:

```text
0 → Chờ thanh toán
1 và chưa có vé → Đã thanh toán (Chờ duyệt)
1 và đã có vé → Đã duyệt
2 hoặc -1 → Từ chối/Hủy
```

## 11. Thứ tự sửa đề xuất

1. Sửa backend `/api/payments/vnpay-return` để cập nhật yêu cầu sang `status = 1` sau khi xác thực thành công.
2. Bổ sung hoặc kiểm tra VNPay IPN để trạng thái vẫn được cập nhật khi người dùng không quay lại frontend.
3. Sửa `PaymentResultPage.jsx` để gọi `parkingApi.getVnpayReturnInfo()` và chờ kết quả xác thực.
4. Đảm bảo `vnp_ReturnUrl` của mua gói trỏ về `/payment-result`.
5. Giữ lớp bảo vệ trong `GateOutPanel.jsx`.
6. Kiểm tra lại danh sách Manager sau khi thanh toán.

## 12. Kịch bản kiểm thử

### Trường hợp thành công

1. Tạo một yêu cầu mua gói mới.
2. Kiểm tra yêu cầu ban đầu có `status = 0`.
3. Thanh toán VNPay thành công.
4. `PaymentResultPage.jsx` hiển thị “Đang xác thực”.
5. Backend xác thực chữ ký và cập nhật yêu cầu sang `status = 1`.
6. Trang kết quả hiển thị “Đã thanh toán và đang chờ Manager duyệt”.
7. Manager bấm **Làm mới**.
8. Yêu cầu phải nằm trong nhóm **Chờ duyệt** và hiển thị **Đã thanh toán (Chờ duyệt)**.

### Trường hợp thất bại hoặc hủy

1. Tạo yêu cầu có `status = 0`.
2. Hủy hoặc thanh toán thất bại.
3. Backend không cập nhật yêu cầu sang `status = 1`.
4. `PaymentResultPage.jsx` hiển thị thất bại.
5. Manager vẫn thấy **Chờ thanh toán**.

### Trường hợp callback bị gửi nhầm tới Staff

1. Thanh toán một yêu cầu mua gói.
2. Nếu callback vào `/staff/exit`, `GateOutPanel.jsx` phải chuyển sang `/payment-result` và `return` ngay.
3. Không được hiện thông báo kết thúc phiên gửi xe.

