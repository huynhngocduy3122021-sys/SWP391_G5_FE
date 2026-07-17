# AI checklist: Kiểm tra dữ liệu gia hạn không tìm thấy gói hiện tại

## Mục tiêu

Phân tích lỗi frontend hiển thị:

> Không tìm thấy gói hiện tại. Vui lòng liên hệ quản lý để kiểm tra.

AI phải kiểm tra toàn bộ dữ liệu từ backend tới frontend, không sửa bằng cách chọn ngẫu nhiên gói đầu tiên.

## Quy tắc bắt buộc

1. Không dùng `packages[0]` làm fallback.
2. Không xác định gói bằng cách tìm chữ “Ô tô”, “Xe máy” trong tên.
3. Ưu tiên đối chiếu bằng `pricePolicyId`.
4. `vehicleTypeId` của xe phải tương thích với `vehicleTypeId` của policy.
5. Yêu cầu gia hạn phải chứa `renewalOfTicketId` hoặc `renewalOfTicket`.
6. Không gửi password, token, cookie hoặc dữ liệu đăng nhập vào file kiểm tra.

---

# PHẦN A — Dữ liệu cần cung cấp cho AI

Hãy dán response thật của các API bên dưới vào đúng vị trí. Xóa password/token trước khi dán.

## A1. Danh sách vé tháng của người dùng

Endpoint:

```text
GET /api/monthly-tickets/my-tickets
```

Response thực tế:

```json
PASTE_MONTHLY_TICKETS_RESPONSE_HERE
```

AI cần kiểm tra mỗi vé có các trường:

```json
{
  "ticketId": 15,
  "vehicleId": 80,
  "licensePlate": "30A78888",
  "vehicleTypeId": 3,
  "pricePolicyId": 7,
  "pricePolicy": {
    "pricePolicyId": 7,
    "policyName": "[Gói Tháng] Ô tô",
    "vehicleTypeId": 3
  },
  "monthlyTicketRequestId": 32,
  "status": 1,
  "createdAt": "2026-07-17T14:30:00"
}
```

Các tên ID frontend hiện có thể hỗ trợ:

```text
ticketId | monthlyTicketId | id
vehicleId | vehiclesId | vehicle.vehicleId | vehicle.vehiclesId
pricePolicyId | policyId | pricePolicy.pricePolicyId | policy.pricePolicyId
```

Kết luận lỗi nếu vé không có cả `pricePolicyId` lẫn `pricePolicy.pricePolicyId`.

## A2. Danh sách policy/gói dịch vụ

Endpoint:

```text
GET /api/price-policies
```

Response thực tế:

```json
PASTE_PRICE_POLICIES_RESPONSE_HERE
```

AI cần kiểm tra:

```text
policy.active = true
policy.pricePolicyId tồn tại
policy.policyName tồn tại
policy.vehicleType.vehicleTypeId tồn tại
policy.basePrice tồn tại
policy.baseDurationMinutes > 0
```

Mẫu đúng:

```json
{
  "pricePolicyId": 7,
  "policyName": "[Gói Tháng] Ô tô",
  "active": true,
  "basePrice": 300000,
  "baseDurationMinutes": 43200,
  "vehicleType": {
    "vehicleTypeId": 3,
    "typeName": "CAR"
  }
}
```

## A3. Danh sách phương tiện của người dùng

Endpoint:

```text
GET /api/vehicles
```

Response thực tế:

```json
PASTE_VEHICLES_RESPONSE_HERE
```

AI cần kiểm tra:

```text
vehicle.vehicleId hoặc vehicle.vehiclesId tồn tại
vehicle.vehicleType.vehicleTypeId tồn tại
vehicle.deleted = false
vehicle thuộc user hiện tại
```

Mẫu đúng:

```json
{
  "vehicleId": 80,
  "licensePlate": "30A78888",
  "vehicleType": {
    "vehicleTypeId": 3,
    "typeName": "CAR"
  },
  "deleted": false
}
```

## A4. Request frontend gửi khi gia hạn

Mở DevTools → Network → chọn request tạo yêu cầu gia hạn → sao chép Request Payload.

Endpoint hiện tại có thể là:

```text
POST /api/monthly-ticket-requests
```

Payload thực tế:

```json
PASTE_RENEWAL_REQUEST_PAYLOAD_HERE
```

Payload tối thiểu phải có:

```json
{
  "vehicleId": 80,
  "policyId": 7,
  "branchId": 1,
  "renewalOfTicketId": 15
}
```

Nếu `renewalOfTicketId` không tồn tại, backend sẽ coi đây là đăng ký mới.

Endpoint tốt hơn:

```text
POST /api/monthly-tickets/15/renewal-requests
```

Payload:

```json
{
  "policyId": 7,
  "branchId": 1
}
```

Với endpoint riêng, backend phải lấy `vehicleId` từ ticket `15`, không tin `vehicleId` do frontend gửi.

## A5. Response backend sau khi tạo yêu cầu gia hạn

Response thực tế:

```json
PASTE_CREATED_RENEWAL_REQUEST_RESPONSE_HERE
```

Response đúng phải có:

```json
{
  "id": 40,
  "vehicle": {
    "vehiclesId": 80,
    "vehicleType": {
      "vehicleTypeId": 3
    }
  },
  "pricePolicy": {
    "pricePolicyId": 7,
    "vehicleType": {
      "vehicleTypeId": 3
    }
  },
  "renewalOfTicket": {
    "ticketId": 15
  },
  "status": 0
}
```

Hoặc tối thiểu:

```json
{
  "renewalOfTicketId": 15
}
```

Nếu backend trả:

```json
"renewalOfTicket": null
```

thì yêu cầu đang bị lưu thành đăng ký mới, không phải gia hạn.

---

# PHẦN B — Thuật toán AI phải dùng để kiểm tra

## B1. Chuẩn hóa ID vé

```js
const ticketId =
  ticket.ticketId ??
  ticket.monthlyTicketId ??
  ticket.id ??
  null;
```

Nếu `ticketId == null`, kết luận:

```text
Backend response vé tháng thiếu ticket ID.
Frontend không thể tạo yêu cầu gia hạn an toàn.
```

## B2. Chuẩn hóa ID xe

```js
const vehicleId =
  ticket.vehicle?.vehicleId ??
  ticket.vehicle?.vehiclesId ??
  ticket.vehicleId ??
  ticket.vehiclesId ??
  null;
```

## B3. Chuẩn hóa policy ID

```js
const policyId =
  ticket.pricePolicy?.pricePolicyId ??
  ticket.pricePolicyId ??
  ticket.policy?.pricePolicyId ??
  ticket.policyId ??
  null;
```

Nếu `policyId` tồn tại, tìm policy bằng ID:

```js
const currentPolicy = policies.find(policy =>
  String(policy.pricePolicyId ?? policy.id) === String(policyId)
);
```

Nếu không tìm thấy, kiểm tra:

```text
Policy đã inactive?
Policy bị xóa?
Frontend chỉ lọc policy có tên bắt đầu bằng “[Gói”?
Kiểu dữ liệu ID string/number có được chuẩn hóa?
Backend trả sai tên trường?
```

## B4. Fallback dữ liệu cũ bằng tên chính xác

Chỉ dùng khi ticket không có policy ID:

```js
const policyName =
  ticket.pricePolicy?.policyName ??
  ticket.policy?.policyName ??
  ticket.policyName ??
  null;

const candidates = policies.filter(policy =>
  policy.policyName === policyName
);
```

Kết luận:

```text
candidates.length = 0 → backend thiếu dữ liệu hoặc policy không còn tồn tại
candidates.length = 1 → có thể dùng tạm, sau khi kiểm tra vehicleTypeId
candidates.length > 1 → dữ liệu policy bị trùng tên, không tự chọn
```

Không sử dụng `includes()` và không dùng `packages[0]`.

## B5. Kiểm tra loại xe

```js
const vehicleTypeId =
  vehicle.vehicleType?.vehicleTypeId ??
  vehicle.vehicleTypeId ??
  null;

const policyVehicleTypeId =
  policy.vehicleType?.vehicleTypeId ??
  policy.vehicleTypeId ??
  null;
```

Điều kiện đúng:

```js
String(vehicleTypeId) === String(policyVehicleTypeId)
```

Nếu policy hỗ trợ nhiều loại xe:

```js
policy.allowedVehicleTypeIds.some(
  id => String(id) === String(vehicleTypeId)
)
```

## B6. Kiểm tra liên kết gia hạn

Frontend phải gửi:

```text
renewalOfTicketId = ticketId
```

Backend phải trả lại cùng ID:

```text
response.renewalOfTicket.ticketId = ticketId
hoặc
response.renewalOfTicketId = ticketId
```

Nếu frontend gửi đúng nhưng backend trả `null`, kiểm tra DTO/service mapping backend.

---

# PHẦN C — Frontend cần kiểm tra

## C1. File VehicleSection.jsx

AI kiểm tra `handleRenewClick(ticket)` có:

```text
Đọc ticketId
Đọc vehicleId/vehiclesId
Đọc pricePolicyId
Fallback policyName chính xác cho dữ liệu cũ
Kiểm tra vehicleTypeId
Không fallback packages[0]
```

Mẫu logic:

```jsx
const handleRenewClick = (ticket) => {
  const ticketId = ticket.ticketId
    ?? ticket.monthlyTicketId
    ?? ticket.id;

  const vehicleId = ticket.vehicle?.vehicleId
    ?? ticket.vehicle?.vehiclesId
    ?? ticket.vehicleId
    ?? ticket.vehiclesId;

  const policyId = ticket.pricePolicy?.pricePolicyId
    ?? ticket.pricePolicyId
    ?? ticket.policy?.pricePolicyId
    ?? ticket.policyId;

  if (!ticketId) {
    toast.error('Không tìm thấy mã vé hiện tại để gia hạn.');
    return;
  }

  const vehicle = vehicles.find(item =>
    String(item.vehicleId ?? item.vehiclesId ?? item.id)
      === String(vehicleId)
  ) ?? ticket.vehicle;

  const policyName = ticket.pricePolicy?.policyName
    ?? ticket.policy?.policyName
    ?? ticket.policyName;

  const policy = packages.find(item =>
    policyId != null &&
    String(item.pricePolicyId ?? item.id) === String(policyId)
  ) ?? packages.find(item =>
    policyName &&
    item.policyName === policyName &&
    isVehicleCompatibleWithPolicy(vehicle, item)
  );

  if (!policy) {
    toast.error('Không tìm thấy gói hiện tại.');
    return;
  }

  if (!isVehicleCompatibleWithPolicy(vehicle, policy)) {
    toast.error('Gói hiện tại không phù hợp với loại phương tiện.');
    return;
  }

  setRenewTicket({ ...ticket, ticketId });
  setSelectedPackage(policy);
  setSubscribeVehicleId(String(vehicleId));
  setSubscribeMode('renew');
};
```

## C2. Payload khi submit

AI kiểm tra `renewTicket` có thực sự được dùng trong `handleConfirmSubscribe`.

```jsx
const renewalTicketId = renewTicket?.ticketId
  ?? renewTicket?.monthlyTicketId
  ?? renewTicket?.id;

if (subscribeMode === 'renew' && !renewalTicketId) {
  return toast.error('Không tìm thấy mã vé cần gia hạn.');
}

const payload = {
  vehicleId,
  policyId: selectedPackage.pricePolicyId ?? selectedPackage.id,
  branchId: Number(selectedBranchId),
  ...(subscribeMode === 'renew' && {
    renewalOfTicketId: renewalTicketId,
  }),
};
```

Nếu payload không có `renewalOfTicketId`, đánh dấu đây là lỗi frontend.

## C3. Kiểm tra filter packages

Frontend hiện có thể lọc:

```js
p.active && (p.policyName || '').startsWith('[Gói')
```

AI phải kiểm tra policy hiện tại có bị loại khỏi `packages` vì:

- `active = false`.
- `policyName` không bắt đầu bằng `[Gói`.
- Backend thay đổi quy ước tên.

Nên dùng trường backend rõ ràng:

```json
{
  "policyType": "MONTHLY_PACKAGE"
}
```

thay vì nhận diện bằng tên.

---

# PHẦN D — Backend cần kiểm tra

## D1. MonthlyTicketResponse

DTO phải có:

```java
private Long ticketId;
private Long vehicleId;
private Long vehicleTypeId;
private Long pricePolicyId;
private PricePolicySummary pricePolicy;
private Long monthlyTicketRequestId;
private LocalDateTime createdAt;
```

PricePolicy summary:

```java
public static class PricePolicySummary {
    private Long pricePolicyId;
    private String policyName;
    private Long vehicleTypeId;
    private String vehicleTypeName;
}
```

## D2. Mapper

AI phải kiểm tra mapper thực sự gán dữ liệu:

```java
.ticketId(ticket.getId())
.vehicleId(ticket.getVehicle().getId())
.vehicleTypeId(ticket.getVehicle().getVehicleType().getId())
.pricePolicyId(ticket.getPricePolicy().getId())
.pricePolicy(
    PricePolicySummary.builder()
        .pricePolicyId(ticket.getPricePolicy().getId())
        .policyName(ticket.getPricePolicy().getPolicyName())
        .vehicleTypeId(ticket.getPricePolicy().getVehicleType().getId())
        .vehicleTypeName(ticket.getPricePolicy().getVehicleType().getTypeName())
        .build()
)
.monthlyTicketRequestId(
    ticket.getMonthlyTicketRequest() != null
        ? ticket.getMonthlyTicketRequest().getId()
        : null
)
.createdAt(ticket.getCreatedAt())
```

Chỉ thêm field vào DTO mà không map dữ liệu vẫn trả `null`.

## D3. Entity MonthlyTicket

Phải lưu policy đã mua:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "price_policy_id", nullable = false)
private PricePolicy pricePolicy;
```

Phải lưu request nguồn:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "monthly_ticket_request_id")
private MonthlyTicketRequest monthlyTicketRequest;
```

Khi Manager cấp vé:

```java
ticket.setPricePolicy(request.getPricePolicy());
ticket.setMonthlyTicketRequest(request);
```

## D4. DTO tạo yêu cầu

Nếu dùng chung endpoint:

```java
public class CreateMonthlyTicketRequest {
    private Long vehicleId;
    private Long policyId;
    private Long branchId;
    private Long renewalOfTicketId;
}
```

## D5. Service tạo yêu cầu gia hạn

```java
if (dto.getRenewalOfTicketId() != null) {
    MonthlyTicket oldTicket = ticketRepository
        .findById(dto.getRenewalOfTicketId())
        .orElseThrow(() ->
            new BadRequestException("Không tìm thấy vé cần gia hạn")
        );

    if (!oldTicket.getVehicle().getId().equals(vehicle.getId())) {
        throw new BadRequestException(
            "Vé gia hạn không thuộc phương tiện đã chọn"
        );
    }

    if (!oldTicket.getVehicle().getVehicleType().getId()
            .equals(policy.getVehicleType().getId())) {
        throw new BadRequestException(
            "Gói gia hạn không phù hợp với loại phương tiện"
        );
    }

    request.setRenewalOfTicket(oldTicket);
}
```

Nếu frontend gửi `renewalOfTicketId` nhưng response vẫn có:

```json
"renewalOfTicket": null
```

thì kiểm tra:

```text
Tên field DTO có đúng không?
Jackson có bind được field không?
Service có gọi request.setRenewalOfTicket(oldTicket) không?
Entity có @JoinColumn đúng không?
Transaction có save request sau khi gán không?
Response mapper có map renewalOfTicket không?
```

---

# PHẦN E — Bảng kết luận nhanh

| Hiện tượng | Nguyên nhân có khả năng cao | Nơi sửa |
|---|---|---|
| Ticket không có `pricePolicyId` | DTO/mapper thiếu policy | Backend |
| Ticket có policy ID nhưng frontend không tìm thấy | Policy inactive, bị filter hoặc sai kiểu ID | Cả hai |
| Chỉ có `policyName` | Dữ liệu vé cũ chưa lưu policy | Backend + fallback FE |
| `renewalOfTicket: null` | Payload thiếu `renewalOfTicketId` hoặc service không gán | Cả hai |
| Ô tô tìm thấy gói xe máy | Fallback sai hoặc không validate vehicle type | Cả hai |
| Bấm gia hạn báo không tìm thấy xe | API dùng `vehiclesId`, frontend chỉ đọc `vehicleId` | Frontend/chuẩn hóa BE |
| Manager coi gia hạn đã xử lý | Vé cũ cùng xe bị ghép nhầm với request mới | Backend link requestId |
| Payment `PENDING` | Chưa hoàn tất callback VNPay | Bình thường trước thanh toán |

---

# PHẦN F — Prompt đưa cho AI

Sao chép nội dung dưới đây và đính kèm code/response thật:

```text
Bạn hãy kiểm tra lỗi gia hạn “Không tìm thấy gói hiện tại”.

Yêu cầu:
1. Đối chiếu ticketId, vehicleId, pricePolicyId và vehicleTypeId giữa tất cả response.
2. Kiểm tra frontend có đọc được cả vehicleId/vehiclesId và ticketId/monthlyTicketId/id không.
3. Kiểm tra handleRenewClick có fallback packages[0] hoặc tìm bằng tên không chính xác không.
4. Kiểm tra handleConfirmSubscribe có gửi renewalOfTicketId không.
5. Kiểm tra backend DTO đã khai báo và mapper đã gán pricePolicyId chưa.
6. Kiểm tra backend service có setRenewalOfTicket(oldTicket) không.
7. Kiểm tra vehicleTypeId của xe và policy có khớp không.
8. Không đề xuất chọn package đầu tiên hoặc hard-code ID.
9. Chỉ ra lỗi bằng tên file, method và dòng code liên quan.
10. Đưa ra patch riêng cho frontend và backend.

Dữ liệu API:
- Monthly tickets: [DÁN RESPONSE]
- Price policies: [DÁN RESPONSE]
- Vehicles: [DÁN RESPONSE]
- Renewal request payload: [DÁN PAYLOAD]
- Renewal response: [DÁN RESPONSE]

Code:
- VehicleSection.jsx: [DÁN METHOD handleRenewClick và handleConfirmSubscribe]
- MonthlyTicketResponse.java: [DÁN CODE]
- CreateMonthlyTicketRequest DTO: [DÁN CODE]
- MonthlyTicket mapper: [DÁN CODE]
- MonthlyTicketRequest service: [DÁN CODE]
```

---

# PHẦN G — Kết quả đạt yêu cầu

Luồng đúng:

```text
User bấm Gia hạn ticket 15
→ Frontend tìm đúng policy 7
→ Xe 80 có vehicleTypeId 3
→ Policy 7 có vehicleTypeId 3
→ Frontend gửi renewalOfTicketId 15
→ Backend kiểm tra quyền sở hữu và loại xe
→ Backend lưu request.renewalOfTicket = ticket 15
→ Response trả renewalOfTicketId 15
→ Thanh toán
→ Manager nhận đúng yêu cầu gia hạn
```

Response không đạt:

```json
{
  "renewalOfTicket": null
}
```

Response đạt:

```json
{
  "renewalOfTicket": {
    "ticketId": 15
  }
}
```

