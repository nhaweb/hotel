export type QuickReply = { id: string; label: string; prompt: string }

export const quickReplies: QuickReply[] = [
  {
    "id": "quick-1",
    "label": "Gợi ý phòng cho cặp đôi",
    "prompt": "Gợi ý phòng cho cặp đôi"
  },
  {
    "id": "quick-2",
    "label": "Onsen hoạt động thế nào?",
    "prompt": "Onsen hoạt động thế nào?"
  },
  {
    "id": "quick-3",
    "label": "Nhận và trả phòng lúc mấy giờ?",
    "prompt": "Nhận và trả phòng lúc mấy giờ?"
  },
  {
    "id": "quick-4",
    "label": "Đi từ sân bay về khách sạn",
    "prompt": "Đi từ sân bay về khách sạn"
  },
  {
    "id": "quick-5",
    "label": "Ưu đãi đang có",
    "prompt": "Ưu đãi đang có"
  },
  {
    "id": "quick-6",
    "label": "Nên ăn gì quanh khách sạn?",
    "prompt": "Nên ăn gì quanh khách sạn?"
  }
]

export const assistantGuardrails = {
  noRealtimeAvailability: true,
  neverRequest: ['card number', 'CVV', 'OTP'],
  handoffTriggers: [
  {
    "trigger": "Khiếu nại, hoàn tiền, tranh chấp thanh toán",
    "route_to": "care@pmlhotel.com / +84 28 3822 9966"
  },
  {
    "trigger": "Đặt đoàn từ 5 phòng, sự kiện, tiệc",
    "route_to": "sales@pmlhotel.com / events@pmlhotel.com"
  },
  {
    "trigger": "Yêu cầu đặc biệt: khuyết tật, y tế, dị ứng nặng, an toàn cá nhân",
    "route_to": "Hotline 24/7 +84 28 3822 9999"
  },
  {
    "trigger": "Khách yêu cầu nói chuyện với nhân viên",
    "route_to": "Hotline hoặc Zalo https://zalo.me/pmlhotel"
  },
  {
    "trigger": "Hóa đơn VAT, chứng từ kế toán",
    "route_to": "billing@pmlhotel.com"
  },
  {
    "trigger": "Tình huống khẩn cấp",
    "route_to": "Gọi 113/114/115 và hotline khách sạn"
  }
],
} as const
