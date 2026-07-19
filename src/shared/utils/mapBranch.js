// file này như 1 file bù đắp giúp ta nếu cập nhận 1 branch thiếu các fields thì nó sẽ tự động 
// thay thế những dữ liệu thừa đó thành dữ liệu dưới
export const mapBranchToParkingLot = (branch) => {
  const genericImages = [
    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&q=80',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80'
  ];
  const imgIdx = Math.max(0, (branch.parkingBranchId - 1) % genericImages.length);
  const img = genericImages[imgIdx];

  return {
    id: branch.parkingBranchId,
    name: branch.branchName,
    title: branch.branchName + (branch.description ? ` - ${branch.description}` : ' - Hệ thống đỗ xe thông minh'),
    area: branch.address || 'Hồ Chí Minh',
    address: branch.address || 'Hồ Chí Minh',
    distance: `${(0.5 + (branch.parkingBranchId * 0.4)).toFixed(1)} km từ vị trí hiện tại`,
    free: branch.availableCapacity !== undefined && branch.availableCapacity !== null ? branch.availableCapacity : (10 + (Number(branch.parkingBranchId) * 15) % 80),
    total: branch.totalCapacity !== undefined && branch.totalCapacity !== null ? branch.totalCapacity : (100 + (Number(branch.parkingBranchId) * 50) % 200),
    status: branch.active ? 'Bình thường' : 'Tạm đóng',
    badgeCls: branch.active ? 'vin-badge--success' : 'vin-badge--danger',
    price: '30.000đ',
    priceBlock: '30.000đ/Block',
    originalPrice: '40.000đ',
    discount: '-25%',
    monthlyPrice: '2.000.000đ',
    rating: 5,
    score: 9.0,
    scoreLabel: 'Tuyệt vời',
    reviews: '120 bài đánh giá',
    amenities: ['An ninh 24/7', 'Có mái che', 'Sạc EV'],
    badge: branch.active ? 'Đang hoạt động' : 'Ngừng hoạt động',
    badgeDesc: branch.phoneNumber ? `Liên hệ: ${branch.phoneNumber}` : '',
    tag: 'Chính thức',
    tagColor: 'bg-primary',
    img: img,
    image: img,
  };
};
