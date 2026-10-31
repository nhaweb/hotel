export type Offer = {
  id: string
  name: string
  description: string
  priceFromVnd: number | null
  conditions: string
  valid: string
}

export const offers: Offer[] = [
  {
    "id": "offer-direct-booking",
    "name": "Đặt trực tiếp - Nhận quà tặng",
    "description": "Đặt phòng qua website chính thức để nhận 2 suất Trà chiều Signature và ưu tiên nâng hạng phòng khi còn trống.",
    "priceFromVnd": null,
    "conditions": "Chỉ áp dụng khi đặt qua website chính thức. Không cộng dồn với ưu đãi khác.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-onsen-weekend",
    "name": "Onsen Weekend Retreat",
    "description": "2 đêm Onsen Signature Suite, ăn sáng, trà chiều, 1 buổi massage 60 phút và đồ uống chào đón.",
    "priceFromVnd": 5200000,
    "conditions": "Đặt trước 5 ngày. Áp dụng thứ 6 - Chủ nhật.",
    "valid": "Quanh năm, trừ kỳ lễ"
  },
  {
    "id": "offer-honeymoon",
    "name": "Honeymoon & Kỷ niệm ngày cưới",
    "description": "Trang trí lãng mạn, bánh kem, vang chào đón, ăn sáng tại phòng, trả phòng muộn đến 15:00.",
    "priceFromVnd": 4400000,
    "conditions": "Xuất trình giấy chứng nhận kết hôn trong vòng 12 tháng (không bắt buộc cho gói kỷ niệm).",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-proposal",
    "name": "Gói cầu hôn trên mái",
    "description": "Setup bàn riêng ngắm hoàng hôn tại tầng thượng, hoa tươi, chụp ảnh kỷ niệm 60 phút và 1 đêm Penthouse.",
    "priceFromVnd": 8500000,
    "conditions": "Đặt trước tối thiểu 5 ngày. Phụ thuộc thời tiết, có phương án dự phòng trong nhà.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-staycation-midweek",
    "name": "Staycation giữa tuần",
    "description": "Giảm 15% giá phòng, trả phòng muộn đến 14:00 khi lưu trú từ Chủ nhật đến Thứ 5.",
    "priceFromVnd": null,
    "conditions": "Không áp dụng dịp lễ, Tết.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-longstay",
    "name": "Ở dài ngày",
    "description": "Giảm 12% cho 7 đêm, 25% cho 30 đêm, kèm giặt ủi hàng tuần và dọn phòng 3 lần/tuần.",
    "priceFromVnd": null,
    "conditions": "Thanh toán theo tuần hoặc tháng.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-business",
    "name": "Bleisure Package",
    "description": "Giá ưu đãi cho khách doanh nghiệp: phòng Deluxe, ăn sáng, giặt ủi 3 món/ngày, truy cập Co-working Lounge và đưa đón sân bay một chiều.",
    "priceFromVnd": null,
    "conditions": "Cần ký thỏa thuận giá doanh nghiệp, tối thiểu 10 đêm/tháng.",
    "valid": "Theo hợp đồng"
  },
  {
    "id": "offer-early-bird",
    "name": "Đặt sớm 14 ngày",
    "description": "Giảm 10% giá phòng khi đặt trước tối thiểu 14 ngày.",
    "priceFromVnd": null,
    "conditions": "Hủy miễn phí trước 7 ngày.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-birthday",
    "name": "Sinh nhật tại PML",
    "description": "Tặng bánh kem 6 inch và một bữa Trà chiều cho khách đặt phòng trong tuần sinh nhật.",
    "priceFromVnd": null,
    "conditions": "Xuất trình giấy tờ tùy thân khi nhận phòng.",
    "valid": "Quanh năm"
  }
]
