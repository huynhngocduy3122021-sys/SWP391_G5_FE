import API from './config';

/**
 * Booking API — tương ứng với BookingController trên BE
 * Endpoints: POST /api/bookings, GET /api/bookings/my-bookings,
 *            GET /api/bookings, POST /api/bookings/{id}/cancel,
 *            GET /api/bookings/code/{bookingCode}
 */
const bookingApi = {
  /**
   * Tạo booking mới
   * @param {{ parkingBranchId, vehicleTypeId, licensePlate, expectedArrivalTime, vehicleColor?, vehicleBrand? }} data
   */
  createBooking: async (data) =>
    (await API.post('/api/bookings', data)).data,

  /**
   * Lấy danh sách booking của user hiện tại (dùng token)
   */
  getMyBookings: async () =>
    (await API.get('/api/bookings/my-bookings')).data,

  /**
   * Lấy toàn bộ bookings — dành cho Manager/Admin
   */
  getAllBookings: async () =>
    (await API.get('/api/bookings')).data,

  /**
   * Hủy booking theo ID
   * @param {number} id
   */
  cancelBooking: async (id) =>
    (await API.post(`/api/bookings/${id}/cancel`)).data,

  /**
   * Tìm booking bằng mã code (Staff quét QR hoặc nhập tay)
   * @param {string} bookingCode
   */
  getBookingByCode: async (bookingCode) =>
    (await API.get(`/api/bookings/code/${bookingCode}`)).data,
};

export default bookingApi;
