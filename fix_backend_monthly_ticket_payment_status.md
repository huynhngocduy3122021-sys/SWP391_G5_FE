# Backend fix: Trạng thái thanh toán và duyệt yêu cầu vé tháng

## 1. Mục tiêu

Sửa lỗi yêu cầu vé tháng đã thanh toán nhưng Manager vẫn thấy **Chờ thanh toán**, hoặc yêu cầu đã bị từ chối nhưng vẫn nằm trong **Chờ duyệt**.

Backend phải tách riêng hai trạng thái:

- Trạng thái giao dịch thanh toán.
- Trạng thái xử lý yêu cầu vé tháng.

Frontend không nên tự suy đoán trạng thái yêu cầu từ `paymentStatus`.

## 2. Quy ước trạng thái đề xuất

### Payment status

```text
PENDING   = Chưa thanh toán
PAID      = Thanh toán thành công
FAILED    = Thanh toán thất bại
CANCELLED = Giao dịch bị hủy
REFUNDED  = Đã hoàn tiền
```

### Monthly ticket request status

Nên sử dụng enum thay cho số nguyên:

```text
PENDING_PAYMENT  = Chờ thanh toán
PENDING_APPROVAL = Đã thanh toán, chờ Manager duyệt
APPROVED         = Manager đã duyệt và cấp vé
REJECTED         = Manager từ chối
EXPIRED          = Yêu cầu thanh toán hết hạn
```

Nếu backend hiện bắt buộc dùng số:

```text
0  = PENDING_PAYMENT
1  = PENDING_APPROVAL
2  = APPROVED
-1 = REJECTED
-2 = EXPIRED
```

Không được dùng cùng một giá trị `2` cho cả **đã thanh toán** và **từ chối**.

## 3. Entity MonthlyTicketRequest

Khuyến nghị:

```java
public enum MonthlyTicketRequestStatus {
    PENDING_PAYMENT,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    EXPIRED
}
```

Trong entity:

```java
@Enumerated(EnumType.STRING)
@Column(name = "status", nullable = false)
private MonthlyTicketRequestStatus status;
```

Khi tạo yêu cầu mới:

```java
request.setStatus(MonthlyTicketRequestStatus.PENDING_PAYMENT);
```

Nếu vẫn dùng `Integer`:

```java
public final class MonthlyTicketRequestStatuses {
    public static final int PENDING_PAYMENT = 0;
    public static final int PENDING_APPROVAL = 1;
    public static final int APPROVED = 2;
    public static final int REJECTED = -1;
    public static final int EXPIRED = -2;

    private MonthlyTicketRequestStatuses() {}
}
```

## 4. Entity Payment

Payment phải liên kết trực tiếp với yêu cầu vé tháng:

```java
@OneToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "monthly_ticket_request_id", nullable = false)
private MonthlyTicketRequest monthlyTicketRequest;
```

Khuyến nghị thêm ràng buộc duy nhất:

```sql
ALTER TABLE payments
ADD CONSTRAINT uk_payment_monthly_ticket_request
UNIQUE (monthly_ticket_request_id);
```

Nếu hệ thống cho phép tạo lại giao dịch sau khi hết hạn thì dùng quan hệ `OneToMany`, nhưng chỉ một payment được ở trạng thái `PAID` cho mỗi request.

## 5. Tạo yêu cầu và giao dịch VNPay

Khi người dùng gửi yêu cầu:

```java
@Transactional
public MonthlyTicketRequest createRequest(CreateMonthlyTicketRequest dto) {
    MonthlyTicketRequest request = new MonthlyTicketRequest();
    request.setVehicle(vehicleRepository.getReferenceById(dto.getVehicleId()));
    request.setPricePolicy(pricePolicyRepository.getReferenceById(dto.getPolicyId()));
    request.setParkingBranch(branchRepository.getReferenceById(dto.getBranchId()));
    request.setUser(currentUserService.requireUser());
    request.setStatus(MonthlyTicketRequestStatus.PENDING_PAYMENT);
    request.setCreatedAt(LocalDateTime.now());
    return requestRepository.save(request);
}
```

Khi tạo payment URL:

```java
@Transactional
public PaymentUrlResponse createMonthlyTicketPayment(Long requestId) {
    MonthlyTicketRequest request = requestRepository.findByIdForUpdate(requestId)
        .orElseThrow(() -> new NotFoundException("Không tìm thấy yêu cầu"));

    if (request.getStatus() == MonthlyTicketRequestStatus.APPROVED) {
        throw new BadRequestException("Yêu cầu đã được duyệt");
    }

    if (request.getStatus() == MonthlyTicketRequestStatus.REJECTED) {
        throw new BadRequestException("Yêu cầu đã bị từ chối");
    }

    Payment payment = findOrCreatePendingPayment(request);
    payment.setAmount(request.getPricePolicy().getBasePrice());
    payment.setPaymentMethod(PaymentMethod.VNPAY);
    payment.setPaymentStatus(PaymentStatus.PENDING);
    payment.setTransactionRef(generateMonthlyTicketTxnRef(requestId));
    paymentRepository.save(payment);

    String returnUrl = frontendBaseUrl
        + "/payment-result?paymentType=MONTHLY_TICKET&requestId="
        + requestId;

    String paymentUrl = vnPayService.createPaymentUrl(payment, returnUrl);
    return new PaymentUrlResponse(paymentUrl, requestId, payment.getTransactionRef());
}
```

`vnp_ReturnUrl` phải được thêm trước khi tạo `vnp_SecureHash`.

## 6. Xử lý VNPay return

Endpoint ví dụ:

```text
GET /api/payments/vnpay-return
```

Controller:

```java
@GetMapping("/api/payments/vnpay-return")
public ResponseEntity<VnPayResultResponse> handleVnPayReturn(
        @RequestParam Map<String, String> params) {
    return ResponseEntity.ok(paymentService.processVnPayResult(params));
}
```

Service:

```java
@Transactional
public VnPayResultResponse processVnPayResult(Map<String, String> params) {
    if (!vnPayService.isValidSignature(params)) {
        throw new BadRequestException("Chữ ký VNPay không hợp lệ");
    }

    String txnRef = params.get("vnp_TxnRef");
    Payment payment = paymentRepository.findByTransactionRefForUpdate(txnRef)
        .orElseThrow(() -> new NotFoundException("Không tìm thấy giao dịch"));

    String responseCode = params.get("vnp_ResponseCode");
    String transactionStatus = params.get("vnp_TransactionStatus");
    boolean successful = "00".equals(responseCode)
        && (transactionStatus == null || "00".equals(transactionStatus));

    if (!successful) {
        if (payment.getPaymentStatus() != PaymentStatus.PAID) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setResponseCode(responseCode);
            paymentRepository.save(payment);
        }

        return VnPayResultResponse.failed(
            payment.getId(),
            payment.getMonthlyTicketRequest().getId(),
            "Thanh toán thất bại hoặc đã bị hủy"
        );
    }

    validatePaidAmount(payment, params.get("vnp_Amount"));

    // Idempotent: callback gọi lại không được cập nhật hoặc cộng tiền lần hai.
    if (payment.getPaymentStatus() != PaymentStatus.PAID) {
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        payment.setResponseCode(responseCode);
        payment.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        payment.setBankCode(params.get("vnp_BankCode"));
        paymentRepository.save(payment);
    }

    MonthlyTicketRequest request = payment.getMonthlyTicketRequest();

    // Chỉ chuyển yêu cầu đang chờ thanh toán sang chờ duyệt.
    // Không phục hồi yêu cầu đã bị Manager từ chối.
    if (request.getStatus() == MonthlyTicketRequestStatus.PENDING_PAYMENT) {
        request.setStatus(MonthlyTicketRequestStatus.PENDING_APPROVAL);
        requestRepository.save(request);
    }

    return VnPayResultResponse.success(
        payment.getId(),
        request.getId(),
        request.getStatus(),
        "Thanh toán thành công, yêu cầu đang chờ Manager duyệt"
    );
}
```

## 7. Kiểm tra số tiền

VNPay thường trả `vnp_Amount` theo đơn vị nhỏ hơn số tiền hiển thị. Cần dùng đúng quy ước đang cấu hình:

```java
private void validatePaidAmount(Payment payment, String vnpAmountRaw) {
    if (vnpAmountRaw == null) {
        throw new BadRequestException("Thiếu số tiền VNPay");
    }

    BigDecimal returnedAmount = new BigDecimal(vnpAmountRaw)
        .divide(BigDecimal.valueOf(100));

    if (returnedAmount.compareTo(payment.getAmount()) != 0) {
        throw new BadRequestException("Số tiền thanh toán không khớp");
    }
}
```

Không cập nhật payment thành `PAID` nếu số tiền không khớp.

## 8. VNPay IPN

Backend nên có endpoint IPN riêng để trạng thái vẫn được cập nhật nếu người dùng đóng trình duyệt trước khi quay lại frontend:

```text
GET /api/payments/vnpay-ipn
```

Return URL và IPN nên gọi chung một service idempotent:

```java
@GetMapping("/api/payments/vnpay-ipn")
public ResponseEntity<Map<String, String>> handleIpn(
        @RequestParam Map<String, String> params) {
    paymentService.processVnPayResult(params);
    return ResponseEntity.ok(Map.of(
        "RspCode", "00",
        "Message", "Confirm Success"
    ));
}
```

Cần trả mã phản hồi đúng theo tài liệu VNPay đang sử dụng.

## 9. Manager duyệt yêu cầu

Không cho phép duyệt yêu cầu chưa thanh toán:

```java
@Transactional
public MonthlyTicketRequest approve(Long requestId, ApproveRequest dto) {
    MonthlyTicketRequest request = requestRepository.findByIdForUpdate(requestId)
        .orElseThrow(() -> new NotFoundException("Không tìm thấy yêu cầu"));

    if (request.getStatus() != MonthlyTicketRequestStatus.PENDING_APPROVAL) {
        throw new BadRequestException("Yêu cầu không ở trạng thái chờ duyệt");
    }

    Payment payment = paymentRepository.findPaidByMonthlyTicketRequestId(requestId)
        .orElseThrow(() -> new BadRequestException("Yêu cầu chưa thanh toán"));

    if (payment.getPaymentStatus() != PaymentStatus.PAID) {
        throw new BadRequestException("Yêu cầu chưa thanh toán");
    }

    monthlyTicketService.createTicketFromRequest(request, dto);
    request.setStatus(MonthlyTicketRequestStatus.APPROVED);
    return requestRepository.save(request);
}
```

Việc tạo vé và cập nhật request phải nằm trong cùng một transaction.

## 10. Manager từ chối yêu cầu

Endpoint nên thể hiện hành động thay vì cho frontend truyền số trạng thái tùy ý:

```text
POST /api/monthly-ticket-requests/{id}/reject
```

DTO:

```java
public record RejectMonthlyTicketRequest(
    @NotBlank String reason
) {}
```

Service:

```java
@Transactional
public MonthlyTicketRequest reject(Long requestId, String reason) {
    MonthlyTicketRequest request = requestRepository.findByIdForUpdate(requestId)
        .orElseThrow(() -> new NotFoundException("Không tìm thấy yêu cầu"));

    // Chỉ coi yêu cầu đã cấp vé khi có vé được tạo trực tiếp từ request này.
    // Không tìm vé theo vehicleId vì xe có thể có vé cũ hoặc đang gia hạn.
    boolean ticketIssuedFromThisRequest =
        monthlyTicketRepository.existsByMonthlyTicketRequestId(requestId);

    if (request.getStatus() == MonthlyTicketRequestStatus.APPROVED
            && ticketIssuedFromThisRequest) {
        throw new BadRequestException("Không thể từ chối yêu cầu đã cấp vé");
    }

    if (request.getStatus() == MonthlyTicketRequestStatus.REJECTED) {
        return request;
    }

    request.setStatus(MonthlyTicketRequestStatus.REJECTED);
    request.setRejectedAt(LocalDateTime.now());
    request.setRejectionReason(reason);

    Payment payment = request.getPayment();
    if (payment != null && payment.getPaymentStatus() == PaymentStatus.PAID) {
        // Không đổi PAID thành FAILED. Đây vẫn là giao dịch đã thu tiền.
        // Tạo quy trình hoàn tiền hoặc đánh dấu đang chờ hoàn tiền.
        refundService.createPendingRefund(payment, reason);
    }

    return requestRepository.save(request);
}
```

### Khi nào mới không được từ chối?

Chỉ không cho từ chối khi thỏa cả hai điều kiện:

```text
request.status = APPROVED
và
có MonthlyTicket.monthlyTicketRequestId = request.id
```

Không được kết luận “đã cấp vé” chỉ bằng một trong các điều kiện sau:

```text
Xe đã từng có vé tháng
Xe đang có một vé cũ
Tìm thấy bất kỳ MonthlyTicket nào cùng vehicleId
request.status = 2 trong dữ liệu cũ chưa migration
payment.paymentStatus = PAID
```

`PAID` chỉ có nghĩa là đã thu tiền. Nó không có nghĩa là Manager đã cấp vé.

Ví dụ repository:

```java
boolean existsByMonthlyTicketRequestId(Long monthlyTicketRequestId);
```

Entity `MonthlyTicket` cần lưu yêu cầu nguồn:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "monthly_ticket_request_id")
private MonthlyTicketRequest monthlyTicketRequest;
```

Khi Manager duyệt và tạo vé:

```java
MonthlyTicket ticket = new MonthlyTicket();
ticket.setMonthlyTicketRequest(request);
ticket.setVehicle(request.getVehicle());
// Gán các dữ liệu còn lại...
monthlyTicketRepository.save(ticket);

request.setStatus(MonthlyTicketRequestStatus.APPROVED);
requestRepository.save(request);
```

### Xử lý dữ liệu cũ có `status = 2`

Response cũ đã có trường hợp:

```json
{
  "status": 2,
  "payment": {
    "paymentStatus": "PAID"
  }
}
```

Không được tự động hiểu bản ghi này là `APPROVED`. Backend phải kiểm tra vé liên kết:

```java
boolean hasLinkedTicket =
    monthlyTicketRepository.existsByMonthlyTicketRequestId(request.getId());

if (request.getStatus() == 2 && !hasLinkedTicket) {
    // Dữ liệu cũ: đã thanh toán nhưng chưa cấp vé.
    request.setStatus(MonthlyTicketRequestStatus.PENDING_APPROVAL);
}
```

Nếu bảng vé cũ chưa có `monthly_ticket_request_id`, cần migration liên kết dựa trên lịch sử duyệt/audit log. Không nên tự ghép chỉ dựa vào `vehicleId`, vì một xe có thể có nhiều lần đăng ký hoặc gia hạn.

### Nếu thực sự đã cấp vé nhưng vẫn muốn hủy

Không dùng thao tác `reject`. Cần một nghiệp vụ riêng:

```text
POST /api/monthly-ticket-requests/{id}/revoke
```

Nghiệp vụ thu hồi phải:

1. Vô hiệu hóa vé đã cấp.
2. Giải phóng hoặc cập nhật thẻ RFID.
3. Chuyển request sang trạng thái `REVOKED` hoặc `CANCELLED_AFTER_APPROVAL`.
4. Tạo quy trình hoàn tiền nếu đã thu tiền.
5. Ghi audit log Manager thực hiện thao tác.

Sau khi từ chối:

```text
request.status = REJECTED
payment.paymentStatus = PAID hoặc REFUNDED
```

Trạng thái request có ưu tiên quyết định yêu cầu nằm ở tab nào của Manager. Payment chỉ phục vụ thông tin tài chính.

## 11. Không dùng endpoint cập nhật trạng thái tùy ý

Endpoint hiện tại dạng:

```text
PUT /api/monthly-ticket-requests/{id}/status?status=...
```

có rủi ro cho phép bỏ qua quy tắc nghiệp vụ. Nên thay bằng:

```text
POST /api/monthly-ticket-requests/{id}/approve
POST /api/monthly-ticket-requests/{id}/reject
```

Mỗi endpoint tự kiểm tra payment, trạng thái hiện tại, quyền Manager và chi nhánh.

Nếu chưa thể đổi API ngay, backend phải validate transition:

```text
PENDING_PAYMENT  → PENDING_APPROVAL: chỉ payment service/IPN được thực hiện
PENDING_APPROVAL → APPROVED: chỉ Manager đúng chi nhánh
PENDING_APPROVAL → REJECTED: chỉ Manager đúng chi nhánh
PENDING_PAYMENT  → REJECTED: Manager có thể hủy yêu cầu chưa thanh toán
APPROVED         → trạng thái khác: không cho phép qua endpoint này
```

## 12. Repository locking

Callback, IPN và thao tác Manager có thể chạy đồng thời. Nên khóa bản ghi khi cập nhật:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select p from Payment p where p.transactionRef = :transactionRef")
Optional<Payment> findByTransactionRefForUpdate(String transactionRef);
```

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select r from MonthlyTicketRequest r where r.id = :id")
Optional<MonthlyTicketRequest> findByIdForUpdate(Long id);
```

## 13. Response DTO cho frontend

Không trả trực tiếp entity `User`. Response hiện tại đang làm lộ trường `userPassword` dù mật khẩu đã được hash. Đây là dữ liệu nhạy cảm và phải loại bỏ.

DTO đề xuất:

```java
public record MonthlyTicketRequestResponse(
    Long id,
    VehicleSummary vehicle,
    UserSummary user,
    PricePolicySummary pricePolicy,
    ParkingBranchSummary parkingBranch,
    MonthlyTicketRequestStatus status,
    LocalDateTime createdAt,
    PaymentSummary payment
) {}
```

```java
public record UserSummary(
    Long userId,
    String fullName,
    String email,
    String phone
) {}
```

Tuyệt đối không trả:

```text
userPassword
authorities
accountNonExpired
accountNonLocked
credentialsNonExpired
```

Response mong muốn:

```json
{
  "id": 32,
  "status": "PENDING_APPROVAL",
  "vehicle": {
    "id": 80,
    "licensePlate": "30A78888"
  },
  "user": {
    "id": 30,
    "fullName": "Gia Bảo",
    "email": "giabao123@gmail.com"
  },
  "payment": {
    "id": 144,
    "amount": 300000,
    "status": "PAID",
    "paidAt": "2026-07-17T13:58:22.479871",
    "transactionRef": "TXN_MT_1784271452276_f257acc6"
  }
}
```

## 14. Migration dữ liệu cũ

Trước khi migration cần sao lưu database.

Ví dụ logic chuẩn hóa:

```sql
-- Yêu cầu có payment PAID nhưng chưa được cấp vé:
-- chuyển sang PENDING_APPROVAL.
UPDATE monthly_ticket_requests r
JOIN payments p ON p.monthly_ticket_request_id = r.id
LEFT JOIN monthly_tickets t ON t.monthly_ticket_request_id = r.id
SET r.status = 'PENDING_APPROVAL'
WHERE p.payment_status = 'PAID'
  AND t.id IS NULL
  AND r.status <> 'REJECTED';

-- Yêu cầu đã có vé:
UPDATE monthly_ticket_requests r
JOIN monthly_tickets t ON t.monthly_ticket_request_id = r.id
SET r.status = 'APPROVED'
WHERE r.status <> 'REJECTED';
```

Tên bảng và cột cần thay theo database thực tế.

Nếu dữ liệu cũ dùng `status = 2` cho cả paid và rejected, không thể migration chính xác chỉ dựa trên cột `status`. Cần kết hợp:

- Có `paymentStatus = PAID` hay không.
- Có vé tháng đã được tạo hay chưa.
- Có `rejectedAt` hoặc `rejectionReason` hay không.
- Audit log thao tác Manager.

Quy tắc migration đề xuất:

```text
Có rejectedAt/rejectionReason → REJECTED
Có monthly ticket             → APPROVED
Có payment PAID               → PENDING_APPROVAL
Còn lại                       → PENDING_PAYMENT
```

## 15. Frontend sau khi backend sửa

Frontend chỉ nên đọc `request.status`:

```jsx
const statusConfig = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    variant: 'warning'
  },
  PENDING_APPROVAL: {
    label: 'Đã thanh toán (Chờ duyệt)',
    variant: 'info'
  },
  APPROVED: {
    label: 'Đã duyệt',
    variant: 'success'
  },
  REJECTED: {
    label: 'Từ chối',
    variant: 'danger'
  }
};
```

Không dùng `paymentStatus === PAID` để ghi đè một request đã `REJECTED`.

## 16. Test bắt buộc

### Thanh toán thành công

```text
PENDING_PAYMENT + Payment.PENDING
→ VNPay success
→ PENDING_APPROVAL + Payment.PAID
```

### Thanh toán thất bại

```text
PENDING_PAYMENT + Payment.PENDING
→ VNPay failed
→ PENDING_PAYMENT + Payment.FAILED
```

### Manager duyệt

```text
PENDING_APPROVAL + Payment.PAID
→ APPROVED + tạo MonthlyTicket
```

### Manager từ chối yêu cầu đã thanh toán

```text
PENDING_APPROVAL + Payment.PAID
→ REJECTED + Payment.PAID
→ tạo yêu cầu hoàn tiền
```

Yêu cầu không còn xuất hiện trong tab chờ duyệt.

### Callback gọi hai lần

```text
Hai callback cùng transactionRef
→ chỉ một lần cập nhật thành PAID
→ không tạo hai vé hoặc hai giao dịch
```

### Callback đến sau khi Manager đã từ chối

```text
Request.REJECTED
→ callback VNPay success
→ Payment.PAID
→ Request vẫn REJECTED
→ tạo quy trình hoàn tiền/cảnh báo nghiệp vụ
```

### Phân quyền

- Manager chỉ được duyệt/từ chối yêu cầu thuộc chi nhánh mình quản lý.
- User không được gọi endpoint approve/reject.
- Không trả password hash trong bất kỳ response nào.

## 17. Checklist hoàn thành

- [ ] Tách enum Payment và MonthlyTicketRequest.
- [ ] Không dùng chung một status cho paid và rejected.
- [ ] Callback VNPay cập nhật payment và request trong một transaction.
- [ ] Có IPN idempotent.
- [ ] Có kiểm tra chữ ký, mã phản hồi và số tiền.
- [ ] Approve chỉ chạy với request `PENDING_APPROVAL` và payment `PAID`.
- [ ] Reject chuyển request sang `REJECTED` kể cả payment vẫn `PAID`.
- [ ] Có quy trình hoàn tiền cho yêu cầu đã thu tiền nhưng bị từ chối.
- [ ] API dùng DTO và không trả `userPassword`.
- [ ] Migration dữ liệu cũ hoàn tất.
- [ ] Frontend chỉ đọc trạng thái request sau khi backend đã chuẩn hóa.
