# Sửa đăng ký/gia hạn sai loại phương tiện và gói dịch vụ

## 1. Hai lỗi cần xử lý

### Lỗi 1: Gia hạn sai gói

Vé hiện tại của xe là gói **Ô tô**, nhưng khi bấm gia hạn frontend có thể chọn hoặc tự gán sang gói **Xe máy**.

### Lỗi 2: Đăng ký gói không đúng loại xe

Xe đã đăng ký là **Ô tô**, nhưng người dùng vẫn có thể chọn gói **Xe máy** hoặc **Xe máy điện** và gửi yêu cầu thành công.

Hai lỗi này phải được sửa ở cả frontend và backend:

- Frontend lọc lựa chọn và cảnh báo sớm.
- Backend bắt buộc xác thực lại, vì request API có thể được gọi trực tiếp mà không qua giao diện.

## 2. Nguyên nhân trong frontend hiện tại

### VehicleSection.jsx không lọc xe theo gói

Hiện tại có đoạn:

```jsx
const matchingVehicles = vehicles;
```

Điều này làm tất cả xe xuất hiện trong mọi gói.

Trong `handleSubscribeClick` cũng có:

```jsx
const matching = vehicles;
```

Frontend tự chọn xe đầu tiên mà không kiểm tra loại xe của gói.

### Không kiểm tra trước khi gửi request

`handleConfirmSubscribe` gửi thẳng:

```jsx
await parkingApi.submitMonthlyTicketRequest({
  vehicleId,
  policyId: selectedPackage.pricePolicyId || selectedPackage.id,
  branchId: Number(selectedBranchId),
});
```

Không có điều kiện so sánh:

```text
vehicle.vehicleTypeId == pricePolicy.vehicleTypeId
```

### Gia hạn có fallback sai

`handleRenewClick` đang có logic:

```jsx
const pkg = packages.find(...)
  || (packages.length > 0 ? packages[0] : null);
```

Nếu không tìm thấy policy cũ, frontend lấy `packages[0]`. Gói đầu tiên có thể là xe máy trong khi vé hiện tại thuộc ô tô.

### PricingPage.jsx dùng suy đoán bằng tên

Trang Pricing đang suy đoán loại xe bằng:

```jsx
const isMotor = v.vehicleTypeName?.toLowerCase().includes('máy')
  || v.vehicleTypeName?.toLowerCase().includes('moto');
```

Cách này dễ sai với:

- Xe máy điện.
- Ô tô điện.
- Tên tiếng Anh hoặc tên do Admin thay đổi.
- Response chỉ có `vehicleType.vehicleTypeId` mà không có `vehicleTypeName`.

### PricingPage.jsx dùng ID hard-code

Hiện có các đoạn chọn policy/vehicle type bằng ID cố định:

```jsx
currentSelectedVehicle.type === 'Car' ? 1 : 2
```

và:

```jsx
activeSubPlan.type === 'Economic'
  ? (currentSelectedVehicle.type === 'Car' ? 1 : 2)
  : (currentSelectedVehicle.type === 'Car' ? 3 : 4)
```

ID database không phải quy tắc nghiệp vụ. Khi dữ liệu thay đổi, frontend sẽ gửi nhầm gói.

## 3. Quy tắc nghiệp vụ thống nhất

Mặc định nên kiểm tra chính xác theo ID:

```text
vehicle.vehicleType.vehicleTypeId
==
pricePolicy.vehicleType.vehicleTypeId
```

Nếu một gói được áp dụng cho nhiều loại xe thì không dùng so sánh tên. Backend nên có bảng liên kết:

```text
price_policy_allowed_vehicle_types
```

Ví dụ:

```text
Gói xe máy phổ thông → MOTORCYCLE, ELECTRIC_MOTORCYCLE
Gói ô tô             → CAR
Gói ô tô điện        → ELECTRIC_CAR
```

Khi đó quy tắc là:

```text
policy.allowedVehicleTypeIds.contains(vehicle.vehicleTypeId)
```

Tài liệu bên dưới dùng kiểm tra một `vehicleTypeId` cho mỗi policy. Nếu hệ thống hỗ trợ nhiều loại xe, thay bằng danh sách `allowedVehicleTypeIds`.

## 4. Frontend: tạo helper lấy ID ổn định

Tạo file:

```text
src/utils/vehiclePackageValidation.js
```

Nội dung đề xuất:

```js
export const getVehicleTypeId = (vehicle) => {
  return vehicle?.vehicleType?.vehicleTypeId
    ?? vehicle?.vehicleType?.id
    ?? vehicle?.vehicleTypeId
    ?? null;
};

export const getPolicyVehicleTypeId = (policy) => {
  return policy?.vehicleType?.vehicleTypeId
    ?? policy?.vehicleType?.id
    ?? policy?.vehicleTypeId
    ?? null;
};

export const isVehicleCompatibleWithPolicy = (vehicle, policy) => {
  const vehicleTypeId = getVehicleTypeId(vehicle);
  const policyVehicleTypeId = getPolicyVehicleTypeId(policy);

  if (vehicleTypeId == null || policyVehicleTypeId == null) {
    return false;
  }

  return String(vehicleTypeId) === String(policyVehicleTypeId);
};
```

Nếu API trả `allowedVehicleTypeIds`:

```js
export const isVehicleCompatibleWithPolicy = (vehicle, policy) => {
  const vehicleTypeId = getVehicleTypeId(vehicle);
  const allowedIds = policy?.allowedVehicleTypeIds
    ?? [getPolicyVehicleTypeId(policy)].filter(Boolean);

  return allowedIds.some(id => String(id) === String(vehicleTypeId));
};
```

Không dùng `policyName.includes('Ô tô')` hoặc `vehicleTypeName.includes('máy')` để xác thực.

## 5. Frontend: sửa VehicleSection.jsx khi đăng ký mới

Import helper:

```jsx
import {
  isVehicleCompatibleWithPolicy,
  getPolicyVehicleTypeId,
} from '../../utils/vehiclePackageValidation';
```

Thay:

```jsx
const matchingVehicles = vehicles;
```

bằng:

```jsx
const matchingVehicles = selectedPackage
  ? vehicles.filter(vehicle =>
      isVehicleCompatibleWithPolicy(vehicle, selectedPackage)
    )
  : [];
```

Sửa `handleSubscribeClick`:

```jsx
const handleSubscribeClick = (pkg) => {
  const compatibleVehicles = vehicles.filter(vehicle =>
    isVehicleCompatibleWithPolicy(vehicle, pkg)
  );

  setSubscribeMode('new');
  setRenewTicket(null);
  setSelectedPackage(pkg);
  setSubscribeVehicleId(
    compatibleVehicles.length > 0
      ? String(compatibleVehicles[0].vehicleId
          || compatibleVehicles[0].vehiclesId
          || compatibleVehicles[0].id)
      : 'new'
  );

  setNewVehicleData({
    licensePlate: '',
    vehicleBrand: '',
    vehicleColor: '',
  });

  setModalStep(1);
  setPaymentUrl('');
  setPaymentQrData('');
  setPaymentError('');
  setShowSubscribeModal(true);
};
```

Khi hiển thị phương tiện, chỉ render `matchingVehicles`.

Nếu không có xe tương thích:

```jsx
<div className="alert alert-warning">
  Bạn chưa có phương tiện phù hợp với gói này.
</div>
```

## 6. Frontend: kiểm tra lần cuối trước khi submit

Trong `handleConfirmSubscribe`, trước `setSubmitting(true)`, thêm:

```jsx
if (subscribeVehicleId !== 'new') {
  const selectedVehicle = vehicles.find(vehicle =>
    String(vehicle.vehicleId || vehicle.vehiclesId || vehicle.id)
      === String(subscribeVehicleId)
  );

  if (!selectedVehicle) {
    return toast.error('Không tìm thấy phương tiện đã chọn.');
  }

  if (!isVehicleCompatibleWithPolicy(selectedVehicle, selectedPackage)) {
    return toast.error(
      'Loại phương tiện không phù hợp với gói dịch vụ đã chọn.'
    );
  }
}
```

Khi thêm xe mới, loại xe phải lấy từ policy:

```jsx
const policyVehicleTypeId = getPolicyVehicleTypeId(selectedPackage);

if (!policyVehicleTypeId) {
  return toast.error('Gói dịch vụ chưa được cấu hình loại phương tiện.');
}

const created = await parkingApi.createVehicle({
  licensePlate: normalizedPlate,
  vehicleColor: newVehicleData.vehicleColor.trim(),
  vehicleBrand: newVehicleData.vehicleBrand.trim(),
  vehicleTypeId: Number(policyVehicleTypeId),
  userId: Number(userId),
});
```

Không cho người dùng tự chọn loại xe mới khác với loại của gói trong cùng form đăng ký. Nếu muốn chọn loại xe khác, người dùng phải quay lại chọn đúng gói.

## 7. Frontend: sửa gia hạn trong VehicleSection.jsx

Gia hạn đúng nghĩa phải giữ nguyên:

- Phương tiện của vé hiện tại.
- Loại phương tiện.
- Policy hiện tại, hoặc một policy mới nhưng bắt buộc tương thích.

Không dùng fallback `packages[0]`.

Sửa:

```jsx
const handleRenewClick = (ticket) => {
  const policyId = ticket.pricePolicy?.pricePolicyId
    ?? ticket.pricePolicyId
    ?? ticket.policy?.pricePolicyId
    ?? ticket.policyId;

  const pkg = packages.find(policy =>
    String(policy.pricePolicyId || policy.id) === String(policyId)
  );

  if (!pkg) {
    toast.error(
      'Không tìm thấy gói hiện tại. Vui lòng liên hệ quản lý để kiểm tra.'
    );
    return;
  }

  const vehicleId = ticket.vehicle?.vehicleId
    ?? ticket.vehicle?.vehiclesId
    ?? ticket.vehicleId
    ?? ticket.vehiclesId;

  const vehicle = vehicles.find(item =>
    String(item.vehicleId || item.vehiclesId || item.id)
      === String(vehicleId)
  ) ?? ticket.vehicle;

  if (!vehicle || !isVehicleCompatibleWithPolicy(vehicle, pkg)) {
    toast.error(
      'Gói hiện tại không phù hợp với loại phương tiện. Không thể gia hạn.'
    );
    return;
  }

  setSubscribeMode('renew');
  setRenewTicket(ticket);
  setSelectedPackage(pkg);
  setSubscribeVehicleId(String(vehicleId));
  // Thiết lập chi nhánh và các state còn lại...
  setShowSubscribeModal(true);
};
```

Trong chế độ `renew`:

- Khóa lựa chọn phương tiện.
- Khóa lựa chọn policy nếu nghiệp vụ chỉ cho phép gia hạn cùng gói.
- Không hiển thị “Thêm xe mới”.

```jsx
const isRenewMode = subscribeMode === 'renew';
```

```jsx
<select disabled={isRenewMode}>...</select>
```

Nếu cho phép đổi gói khi gia hạn, danh sách chỉ được chứa:

```jsx
const compatiblePackages = packages.filter(policy =>
  isVehicleCompatibleWithPolicy(renewVehicle, policy)
);
```

Nên đặt tên thao tác này là **Đổi gói** thay vì **Gia hạn**, vì giá và quyền lợi có thể thay đổi.

## 8. Frontend: sửa PricingPage.jsx

### Không hiển thị mọi xe cho mọi gói

Tạo danh sách:

```jsx
const compatibleVehicles = activeSubPlan
  ? userVehicles.filter(vehicle =>
      isVehicleCompatibleWithPolicy(vehicle, activeSubPlan)
    )
  : [];
```

Thay:

```jsx
userVehicles.map(...)
```

bằng:

```jsx
compatibleVehicles.map(...)
```

### Validate trước khi gọi API

```jsx
if (selectedSubVehicleId !== 'new') {
  const selectedVehicle = userVehicles.find(vehicle =>
    String(vehicle.vehicleId || vehicle.vehiclesId || vehicle.id)
      === String(selectedSubVehicleId)
  );

  if (!isVehicleCompatibleWithPolicy(selectedVehicle, activeSubPlan)) {
    return toast.error(
      'Phương tiện không phù hợp với loại xe của gói dịch vụ.'
    );
  }
}
```

### Xóa ID hard-code

Không sử dụng:

```jsx
currentSelectedVehicle.type === 'Car' ? 1 : 2
```

Thay bằng ID từ API:

```jsx
const policyVehicleTypeId = getPolicyVehicleTypeId(activeSubPlan);
```

Khi tạo xe mới:

```jsx
vehicleTypeId: Number(policyVehicleTypeId)
```

Không cho người dùng chọn `Car` hoặc `Motorcycle` tự do sau khi đã chọn plan. Loại xe mới phải được khóa theo policy đang đăng ký.

### Không fallback policy ID 1–4

Nếu `activeSubPlan.policyId` không tồn tại:

```jsx
if (!activeSubPlan.policyId) {
  return toast.error('Gói dịch vụ không hợp lệ hoặc đã ngừng hoạt động.');
}
```

Không tự gán policy bằng ID cố định.

## 9. Backend: validate khi tạo MonthlyTicketRequest

Backend là lớp bắt buộc phải chặn dữ liệu sai.

Ví dụ service:

```java
@Transactional
public MonthlyTicketRequestResponse createRequest(
        CreateMonthlyTicketRequest dto,
        Long currentUserId) {

    Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
        .orElseThrow(() -> new NotFoundException("Không tìm thấy phương tiện"));

    PricePolicy policy = pricePolicyRepository.findById(dto.getPolicyId())
        .orElseThrow(() -> new NotFoundException("Không tìm thấy gói dịch vụ"));

    ParkingBranch branch = branchRepository.findById(dto.getBranchId())
        .orElseThrow(() -> new NotFoundException("Không tìm thấy chi nhánh"));

    if (!vehicle.getUser().getId().equals(currentUserId)) {
        throw new ForbiddenException("Phương tiện không thuộc tài khoản hiện tại");
    }

    if (vehicle.isDeleted()) {
        throw new BadRequestException("Phương tiện đã bị xóa");
    }

    if (!policy.isActive()) {
        throw new BadRequestException("Gói dịch vụ đã ngừng hoạt động");
    }

    if (!isMonthlyPackage(policy)) {
        throw new BadRequestException("Chính sách giá không phải gói đăng ký");
    }

    Long vehicleTypeId = vehicle.getVehicleType().getId();
    Long policyVehicleTypeId = policy.getVehicleType().getId();

    if (!vehicleTypeId.equals(policyVehicleTypeId)) {
        throw new BadRequestException(
            "Loại phương tiện không phù hợp với gói dịch vụ"
        );
    }

    validatePolicyAvailableAtBranch(policy, branch);
    validateNoDuplicatePendingRequest(vehicle, policy, branch);

    MonthlyTicketRequest request = new MonthlyTicketRequest();
    request.setVehicle(vehicle);
    request.setPricePolicy(policy);
    request.setParkingBranch(branch);
    request.setUser(vehicle.getUser());
    request.setStatus(PENDING_PAYMENT);

    return mapper.toResponse(requestRepository.save(request));
}
```

Không nhận `userId` từ frontend để quyết định chủ sở hữu. Lấy user từ token đăng nhập và kiểm tra xe thuộc user đó.

## 10. Backend: hỗ trợ policy áp dụng nhiều loại xe

Nếu gói xe máy dùng chung cho xe máy xăng và xe máy điện:

```java
@ManyToMany
@JoinTable(
    name = "price_policy_allowed_vehicle_types",
    joinColumns = @JoinColumn(name = "price_policy_id"),
    inverseJoinColumns = @JoinColumn(name = "vehicle_type_id")
)
private Set<VehicleType> allowedVehicleTypes;
```

Validation:

```java
boolean compatible = policy.getAllowedVehicleTypes().stream()
    .anyMatch(type -> type.getId().equals(vehicle.getVehicleType().getId()));

if (!compatible) {
    throw new BadRequestException(
        "Loại phương tiện không được áp dụng cho gói này"
    );
}
```

API policy nên trả:

```json
{
  "pricePolicyId": 7,
  "policyName": "[Gói Tháng] Xe máy",
  "allowedVehicleTypeIds": [1, 2]
}
```

## 11. Backend: tạo endpoint gia hạn riêng

Không nên dùng endpoint đăng ký mới để suy đoán gia hạn từ việc xe đã có vé.

Endpoint đề xuất:

```text
POST /api/monthly-tickets/{ticketId}/renewal-requests
```

Request:

```json
{
  "policyId": 7,
  "branchId": 1
}
```

Không nhận `vehicleId` từ frontend. Backend lấy xe trực tiếp từ vé hiện tại.

Service:

```java
@Transactional
public MonthlyTicketRequest createRenewalRequest(
        Long ticketId,
        CreateRenewalRequest dto,
        Long currentUserId) {

    MonthlyTicket ticket = ticketRepository.findById(ticketId)
        .orElseThrow(() -> new NotFoundException("Không tìm thấy vé tháng"));

    if (!ticket.getVehicle().getUser().getId().equals(currentUserId)) {
        throw new ForbiddenException("Bạn không sở hữu vé tháng này");
    }

    PricePolicy policy = pricePolicyRepository.findById(dto.getPolicyId())
        .orElseThrow(() -> new NotFoundException("Không tìm thấy gói dịch vụ"));

    Vehicle vehicle = ticket.getVehicle();

    if (!vehicle.getVehicleType().getId()
            .equals(policy.getVehicleType().getId())) {
        throw new BadRequestException(
            "Không thể gia hạn bằng gói của loại phương tiện khác"
        );
    }

    // Nếu gia hạn bắt buộc cùng gói:
    if (!ticket.getPricePolicy().getId().equals(policy.getId())) {
        throw new BadRequestException(
            "Gia hạn phải sử dụng đúng gói hiện tại"
        );
    }

    return createPendingRenewalRequest(ticket, policy, dto.getBranchId());
}
```

Nếu `MonthlyTicket` hiện chưa lưu `pricePolicy`, cần bổ sung liên kết:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "price_policy_id", nullable = false)
private PricePolicy pricePolicy;
```

## 12. Backend: kiểm tra lại khi Manager duyệt

Dù request đã được tạo, Manager approve vẫn phải validate lần cuối:

```java
Vehicle vehicle = request.getVehicle();
PricePolicy policy = request.getPricePolicy();

if (!vehicle.getVehicleType().getId()
        .equals(policy.getVehicleType().getId())) {
    throw new BadRequestException(
        "Dữ liệu yêu cầu không hợp lệ: loại xe không khớp gói"
    );
}
```

Không tạo hoặc gia hạn vé sai loại xe, kể cả dữ liệu cũ đã lọt vào database.

## 13. Backend: xử lý duyệt gia hạn

Hiện frontend Manager tìm `existingTicket` chỉ bằng cùng `vehicleId`. Backend không nên làm như vậy.

Yêu cầu gia hạn cần lưu:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "renewal_of_ticket_id")
private MonthlyTicket renewalOfTicket;
```

Khi duyệt:

```java
MonthlyTicket oldTicket = request.getRenewalOfTicket();

if (oldTicket == null) {
    throw new BadRequestException("Yêu cầu không phải yêu cầu gia hạn");
}

if (!oldTicket.getVehicle().getId()
        .equals(request.getVehicle().getId())) {
    throw new BadRequestException("Xe gia hạn không khớp vé hiện tại");
}

if (!request.getPricePolicy().getVehicleType().getId()
        .equals(oldTicket.getVehicle().getVehicleType().getId())) {
    throw new BadRequestException("Gói gia hạn không đúng loại xe");
}
```

Thời hạn mới phải lấy từ policy của request đã thanh toán:

```java
long durationMinutes = request.getPricePolicy().getBaseDurationMinutes();
```

Không để frontend tự quyết định thời hạn hoặc loại gói khi Manager duyệt.

## 14. Response DTO cần thống nhất

Vehicle response nên luôn có cấu trúc:

```json
{
  "vehicleId": 80,
  "licensePlate": "30A78888",
  "vehicleType": {
    "vehicleTypeId": 3,
    "typeCode": "CAR",
    "typeName": "Ô tô"
  }
}
```

Price policy response:

```json
{
  "pricePolicyId": 7,
  "policyName": "[Gói Tháng] Ô tô",
  "vehicleType": {
    "vehicleTypeId": 3,
    "typeCode": "CAR",
    "typeName": "Ô tô"
  }
}
```

Không trả lúc thì `vehicleId`, lúc thì `vehiclesId`. Nếu chưa thể sửa ngay, frontend helper có thể hỗ trợ cả hai, nhưng backend nên chuẩn hóa về `vehicleId`.

## 15. Thông báo lỗi API đề xuất

HTTP `400 Bad Request`:

```json
{
  "code": "VEHICLE_TYPE_POLICY_MISMATCH",
  "message": "Xe Ô tô không thể đăng ký gói Xe máy"
}
```

Gia hạn:

```json
{
  "code": "INVALID_RENEWAL_POLICY",
  "message": "Không thể gia hạn vé Ô tô bằng gói Xe máy"
}
```

Frontend hiển thị `message` từ backend:

```jsx
const message = error.response?.data?.message
  || 'Loại phương tiện không phù hợp với gói dịch vụ.';

toast.error(message);
```

## 16. Migration và dữ liệu sai đã tồn tại

Tìm các request có loại xe không khớp policy:

```sql
SELECT
    r.id AS request_id,
    v.id AS vehicle_id,
    v.vehicle_type_id AS vehicle_type_id,
    p.id AS policy_id,
    p.vehicle_type_id AS policy_vehicle_type_id,
    r.status
FROM monthly_ticket_requests r
JOIN vehicles v ON v.id = r.vehicle_id
JOIN price_policies p ON p.id = r.price_policy_id
WHERE v.vehicle_type_id <> p.vehicle_type_id;
```

Không tự động đổi loại xe hoặc policy vì có thể làm sai số tiền đã thanh toán.

Xử lý đề xuất:

```text
Chưa thanh toán → hủy request sai và yêu cầu đăng ký lại.
Đã thanh toán   → chuyển kiểm tra thủ công, hoàn tiền hoặc đổi đúng policy có cùng giá.
Đã cấp vé       → audit thủ công trước khi chỉnh.
```

## 17. Test bắt buộc

### Đăng ký đúng loại

```text
Ô tô + gói Ô tô → thành công
Xe máy + gói Xe máy → thành công
Xe máy điện + gói Xe máy điện → thành công
```

### Đăng ký sai loại

```text
Ô tô + gói Xe máy → frontend chặn, backend trả 400 nếu gọi trực tiếp
Ô tô + gói Xe máy điện → frontend chặn, backend trả 400
Xe máy + gói Ô tô → frontend chặn, backend trả 400
```

### Gia hạn

```text
Vé Ô tô + đúng gói Ô tô → thành công
Vé Ô tô + gói Xe máy → bị chặn
Vé Ô tô + gói Xe máy điện → bị chặn
Không tìm thấy policy cũ → báo lỗi, không fallback packages[0]
```

### Quyền sở hữu

```text
User A gửi vehicleId của User B → backend trả 403
User A gia hạn ticket của User B → backend trả 403
```

### Policy

```text
Policy inactive → backend từ chối
Policy không phải gói tháng → backend từ chối
Policy không áp dụng tại chi nhánh → backend từ chối
```

### Manager approve

```text
Request dữ liệu cũ có vehicleType khác policy → không được tạo vé
Renewal không liên kết vé gốc → không được duyệt như gia hạn
```

## 18. Thứ tự triển khai

1. Chuẩn hóa response `vehicleTypeId` cho Vehicle và PricePolicy.
2. Thêm validation loại xe–policy trong backend tạo request.
3. Thêm endpoint renewal riêng và không nhận `vehicleId` từ frontend.
4. Thêm validation lần cuối khi Manager approve.
5. Tạo helper frontend dùng ID, không dùng tên.
6. Lọc vehicle theo policy trong `VehicleSection.jsx` và `PricingPage.jsx`.
7. Xóa fallback `packages[0]` khi gia hạn.
8. Xóa toàn bộ policy ID và vehicle type ID hard-code.
9. Khóa vehicle/policy trong modal gia hạn hoặc chỉ cho chọn policy tương thích.
10. Kiểm tra và xử lý dữ liệu sai đã tồn tại.

## 19. Checklist hoàn thành

- [ ] Ô tô không thể đăng ký gói Xe máy hoặc Xe máy điện.
- [ ] Xe máy không thể đăng ký gói Ô tô.
- [ ] Gia hạn không tự fallback sang gói đầu tiên.
- [ ] Gia hạn giữ nguyên xe của vé hiện tại.
- [ ] Frontend lọc xe theo `vehicleTypeId`.
- [ ] Backend luôn kiểm tra loại xe–policy.
- [ ] Không xác thực bằng tên tiếng Việt/tiếng Anh.
- [ ] Không còn ID policy/vehicle type hard-code.
- [ ] Backend có endpoint renewal riêng.
- [ ] Manager không thể duyệt request sai loại xe.
- [ ] Dữ liệu sai cũ đã được audit.

