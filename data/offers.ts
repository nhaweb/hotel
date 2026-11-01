export type Offer = {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  priceFromVnd: number | null
  conditions: string
  valid: string
}

export const offers: Offer[] = [
  {
    "id": "offer-direct-booking",
    "name": "Đặt trực tiếp - Nhận quà tặng",
    "nameEn": "Direct Booking - Receive Gift",
    "description": "Đặt phòng qua website chính thức để nhận 2 suất Trà chiều Signature và ưu tiên nâng hạng phòng khi còn trống.",
    "descriptionEn": "Book via official website to receive 2 Signature afternoon teas and priority room upgrade when available.",
    "priceFromVnd": null,
    "conditions": "Chỉ áp dụng khi đặt qua website chính thức. Không cộng dồn với ưu đãi khác.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-onsen-weekend",
    "name": "Onsen Weekend Retreat",
    "nameEn": "Onsen Weekend Retreat",
    "description": "2 đêm Onsen Signature Suite, ăn sáng, trà chiều, 1 buổi massage 60 phút và đồ uống chào đón.",
    "descriptionEn": "2-night Onsen Signature Suite, breakfast, afternoon tea, 1-hour massage and welcome drinks.",
    "priceFromVnd": 5200000,
    "conditions": "Đặt trước 5 ngày. Áp dụng thứ 6 - Chủ nhật.",
    "valid": "Quanh năm, trừ kỳ lễ"
  },
  {
    "id": "offer-honeymoon",
    "name": "Honeymoon & Kỷ niệm ngày cưới",
    "nameEn": "Honeymoon & Wedding Anniversary",
    "description": "Trang trí lãng mạn, bánh kem, vang chào đón, ăn sáng tại phòng, trả phòng muộn đến 15:00.",
    "descriptionEn": "Romantic decoration, wedding cake, welcome champagne, breakfast in room, late checkout until 15:00.",
    "priceFromVnd": 4400000,
    "conditions": "Xuất trình giấy chứng nhận kết hôn trong vòng 12 tháng (không bắt buộc cho gói kỷ niệm).",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-proposal",
    "name": "Gói cầu hôn trên mái",
    "nameEn": "Proposal Package on the Rooftop",
    "description": "Setup bàn riêng ngắm hoàng hôn tại tầng thượng, hoa tươi, chụp ảnh kỷ niệm 60 phút và 1 đêm Penthouse.",
    "descriptionEn": "Private rooftop table with sunset view, fresh flowers, 60-minute photography session and 1 night in the Penthouse.",
    "priceFromVnd": 8500000,
    "conditions": "Đặt trước tối thiểu 5 ngày. Phụ thuộc thời tiết, có phương án dự phòng trong nhà.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-staycation-midweek",
    "name": "Staycation giữa tuần",
    "nameEn": "Midweek Staycation",
    "description": "Giảm 15% giá phòng, trả phòng muộn đến 14:00 khi lưu trú từ Chủ nhật đến Thứ 5.",
    "descriptionEn": "15% off room rates, late checkout until 14:00 when staying from Sunday to Friday.",
    "priceFromVnd": null,
    "conditions": "Không áp dụng dịp lễ, Tết.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-longstay",
    "name": "Ở dài ngày",
    "nameEn": "Extended Stay",
    "description": "Giảm 12% cho 7 đêm, 25% cho 30 đêm, kèm giặt ủi hàng tuần và dọn phòng 3 lần/tuần.",
    "descriptionEn": "12% off for 7 nights, 25% off for 30 nights, including weekly laundry and 3 room cleans per week.",
    "priceFromVnd": null,
    "conditions": "Thanh toán theo tuần hoặc tháng.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-business",
    "name": "Bleisure Package",
    "nameEn": "Business & Leisure Package",
    "description": "Giá ưu đãi cho khách doanh nghiệp: phòng Deluxe, ăn sáng, giặt ủi 3 món/ngày, truy cập Co-working Lounge và đưa đón sân bay một chiều.",
    "descriptionEn": "Business guest package: Deluxe room, breakfast, 3-item laundry daily, Co-working Lounge access and one-way airport transfer.",
    "priceFromVnd": null,
    "conditions": "Cần ký thỏa thuận giá doanh nghiệp, tối thiểu 10 đêm/tháng.",
    "valid": "Theo hợp đồng"
  },
  {
    "id": "offer-early-bird",
    "name": "Đặt sớm 14 ngày",
    "nameEn": "Early Bird 14 Days",
    "description": "Giảm 10% giá phòng khi đặt trước tối thiểu 14 ngày.",
    "descriptionEn": "10% off room rates when booking at least 14 days in advance.",
    "priceFromVnd": null,
    "conditions": "Hủy miễn phí trước 7 ngày.",
    "valid": "Quanh năm"
  },
  {
    "id": "offer-birthday",
    "name": "Sinh nhật tại PML",
    "nameEn": "Birthday at PML",
    "description": "Tặng bánh kem 6 inch và một bữa Trà chiều cho khách đặt phòng trong tuần sinh nhật.",
    "descriptionEn": "6-inch birthday cake and an afternoon tea meal for guests booking during their birthday week.",
    "priceFromVnd": null,
    "conditions": "Xuất trình giấy tờ tùy thân khi nhận phòng.",
    "valid": "Quanh năm"
  }
]
