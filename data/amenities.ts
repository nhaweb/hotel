export type AmenityHighlight = {
  id: string
  name: string
  nameEn: string
  detail: string
  detailEn: string
  hours: string
}

export type AmenityImage = {
  id: string
  src: string
  alt: string
  altEn: string
  category: string
}

export type AmenityCategory = {
  id: string
  name: string
  nameEn: string
  items: AmenityHighlight[]
}

export const amenityCategories: AmenityCategory[] = [
  {
    id: 'wellness',
    name: 'Wellness & Spa',
    nameEn: 'Wellness & Spa',
    items: [
      { id: 'onsen', name: 'Onsen Khoáng Nóng Nhật Bản', nameEn: 'Japanese Mineral Onsen', detail: 'Bể ngâm khoáng 40°C + phòng xông hơi đá muối Himalayan', detailEn: '40°C mineral bath + Himalayan salt sauna', hours: '06:00 - 22:00' },
      { id: 'sauna', name: 'Phòng Xông Hơi Khô (Sauna)', nameEn: 'Dry Sauna', detail: 'Đá muối Himalayan, không khí thoáng mát', detailEn: 'Himalayan salt stones, fresh air', hours: '06:00 - 22:00' },
      { id: 'jacuzzi', name: 'Jacuzzi Rooftop', nameEn: 'Rooftop Jacuzzi', detail: 'Ngắm hoàng hôn 360°', detailEn: 'Sunset view 360°', hours: '16:00 - 23:30' },
      { id: 'co-working', name: 'Executive Coworking', nameEn: 'Executive Coworking', detail: 'Wi-Fi tốc độ cao, bàn làm việc, máy in', detailEn: 'High-speed Wi-Fi, desks, printer', hours: '07:00 - 22:00' },
    ],
  },
  {
    id: 'food',
    name: 'Ẩm Thực & Trà Chiều',
    nameEn: 'Food & Afternoon Tea',
    items: [
      { id: 'signature-tea', name: 'Trà Chiều Signature', nameEn: 'Signature Afternoon Tea', detail: '02 suất trà thơm mùi hoa, kèm bánh quy, trái cây', detailEn: '2 tea servings, cookie, fruit', hours: '14:30 - 18:00' },
      { id: 'japanese-restaurant', name: 'Nhà Hàng Nhật Bản', nameEn: 'Japanese Restaurant', detail: 'Gói sushi, ramen, udon, karaage', detailEn: 'Sushi set, ramen, udon, karaage', hours: '11:00 - 22:00' },
      { id: 'coffee-house', name: 'Cà Phê House', nameEn: 'Coffee House', detail: 'Cà phê phin, espresso, đá vàng, sáng trà viên', detailEn: 'Phin coffee, espresso, iced matcha', hours: '06:00 - 23:00' },
      { id: 'bar', name: 'Bar Rooftop', nameEn: 'Rooftop Bar', detail: 'Trà có cồn, cocktail, nhìn 360° Sài Gòn', detailEn: 'Cocktails, sunset view, live music', hours: '18:00 - 01:00' },
    ],
  },
  {
    id: 'relaxation',
    name: 'Giải Trí & Thư Giãn',
    nameEn: 'Relaxation & Leisure',
    items: [
      { id: 'vip-lounge', name: 'VIP Lounge', nameEn: 'VIP Lounge', detail: 'Thưởng thức trà uống kết hợp bài hát piano', detailEn: 'Tea, music, piano lounge', hours: '10:00 - 23:00' },
      { id: 'pool', name: 'Hồ Bơi Outdoor', nameEn: 'Outdoor Pool', detail: 'Hồ bơi cao 2,8m, bể nhiệt, view công viên', detailEn: '2.8m waterfall pool, jacuzzi, park view', hours: '08:00 - 20:00' },
      { id: 'gym', name: 'Phòng Gym', nameEn: 'Gym Studio', detail: 'Tạ, jogging, máy xô, coach miễn phí', detailEn: 'Weight training, cardio, coach', hours: '05:00 - 23:00' },
      { id: 'maid-service', name: 'Dịch Vụ Dọn Nhà', nameEn: 'Maid Service', detail: 'Dọn nhà hàng ngày, thay khăn thải, giặt ủi', detailEn: 'Daily cleaning, fresh towels, laundry', hours: '08:00 - 20:00' },
    ],
  },
]

export const amenities: GalleryImage[] = [
  { id: 'img-001', src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=82', alt: 'Onsen lòng bánh sòng', altEn: 'Japanese onsen with wooden tub', category: 'wellness' },
  { id: 'img-002', src: 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=900&q=82', alt: 'Bể bơi nước ngọt ngoài trời', altEn: 'Glass-walled outdoor pool', category: 'relaxation' },
  { id: 'img-003', src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=82', alt: 'Phòng ngủ ấm cúng trời', altEn: 'Luxury bedroom with window view', category: 'wellness' },
  { id: 'img-004', src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=82', alt: 'Rooftop bar chiếu sáng', altEn: 'Rooftop bar with sunset view', category: 'food' },
  { id: 'img-005', src: 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1200&q=82', alt: 'Bể ngâm nước nóng', altEn: 'Mineral bath spa', category: 'wellness' },
  { id: 'img-006', src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=82', alt: 'Bàn làm việc và trà uống', altEn: 'Coworking lounge with tea', category: 'food' },
  { id: 'img-007', src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=82', alt: 'Bếp sáng ảo hiện đại', altEn: 'Modern lobby fireplace', category: 'relaxation' },
  { id: 'img-008', src: 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=900&q=82', alt: 'Sao rộn trên bầu trời Sài Gòn', altEn: 'Night skyline of District 1', category: 'food' },
  { id: 'img-009', src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=82', alt: 'Bàn trà chiều signature', altEn: 'Signature afternoon tea table', category: 'food' },
  { id: 'img-009', src: 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=900&q=82', alt: 'Hồ bơi lúc bình minh', altEn: 'Morning pool with mist', category: 'relaxation' },
  { id: 'img-010', src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=82', alt: 'Phòng xông hơi đá muối', altEn: 'Himalayan salt sauna room', category: 'wellness' },
  { id: 'img-011', src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=82', alt: 'Tủ lạnh và bếp nhỏ', altEn: 'Kitchenette with fridge', category: 'food' },
]