export type Review = {
  id: string
  guest: string
  origin: string
  rating: number
  title: string
  titleEn: string
  text: string
  textEn: string
  branchId: string
  roomId: string
}

export type Story = {
  id: string
  slug: string
  category: string
  title: string
  excerpt: string
  readMinutes: number
}

export const reviews: Review[] = [
  {
    "id": "rev-001",
    "guest": "Minh Anh",
    "origin": "Hà Nội",
    "rating": 5,
    "title": "Cuối tuần chậm giữa Sài Gòn",
    "titleEn": "A slow weekend in Saigon",
    "text": "Bồn ngâm riêng và phòng xông hơi trong phòng quá tuyệt. Nhân viên nhớ tên chúng tôi từ lần nhận phòng. Trà chiều ngon, không gian yên tĩnh bất ngờ giữa Quận 1.",
    "textEn": "The private soaking tub and in-room sauna were wonderful. Staff remembered our names from check-in. Afternoon tea was excellent, and the rooms were surprisingly quiet in District 1.",
    "branchId": "pml-onsen-hai-ba-trung",
    "roomId": "room-onsen-suite"
  },
  {
    "id": "rev-002",
    "guest": "Sarah L.",
    "origin": "Melbourne, Úc",
    "rating": 5,
    "title": "Perfect base for first-time visitors",
    "titleEn": "Perfect base for first-time visitors",
    "text": "Walkable to everything: Nguyen Hue, the Opera House, the river. The balcony room was quiet and breakfast had great phở. Staff gave me a hand-drawn walking map.",
    "textEn": "Walkable to everything: Nguyen Hue, the Opera House, the river. The balcony room was quiet and breakfast had great phở. Staff gave me a hand-drawn walking map.",
    "branchId": "pml-dong-du",
    "roomId": "room-deluxe-city"
  },
  {
    "id": "rev-003",
    "guest": "Hoàng Nam",
    "origin": "TP.HCM",
    "rating": 5,
    "title": "Cầu hôn trên sân thượng",
    "titleEn": "A proposal on the roof",
    "text": "Đội ngũ giúp mình setup gần như hoàn hảo, kể cả phương án dự phòng khi trời chuyển mưa. Hoàng hôn trên Jacuzzi là khoảnh khắc không quên.",
    "textEn": "The team set almost everything up, including a backup plan when the rain arrived. Sunset in the jacuzzi is a moment we will not forget.",
    "branchId": "pml-central-park",
    "roomId": "room-rooftop-jacuzzi"
  },
  {
    "id": "rev-004",
    "guest": "Tanaka Yuki",
    "origin": "Osaka, Nhật Bản",
    "rating": 4,
    "title": "Onsen xứng đáng cho một ngày dài",
    "titleEn": "An onsen worth the long day",
    "text": "Khu onsen sạch, yên tĩnh, tinh thần Nhật rất rõ. Phòng gọn và êm. Mong có thêm khung giờ riêng buổi tối.",
    "textEn": "The onsen was clean, quiet, and distinctly Japanese in spirit. The room was compact and calm. I would have liked a private evening slot.",
    "branchId": "pml-onsen-hai-ba-trung",
    "roomId": "room-onsen-deluxe-queen"
  },
  {
    "id": "rev-005",
    "guest": "Lan Phương",
    "origin": "Đà Nẵng",
    "rating": 5,
    "title": "Làm việc dễ chịu, nghỉ ngơi cũng dễ",
    "titleEn": "Easy to work, easy to rest",
    "text": "Co-working lounge yên tĩnh, Wi-Fi nhanh, cuối ngày lên Sky Bar thư giãn. View công viên buổi sáng rất dễ chịu.",
    "textEn": "The coworking lounge was quiet, the Wi-Fi was fast, and the sky bar was an easy way to end the day. The park view in the morning was lovely.",
    "branchId": "pml-central-park",
    "roomId": "room-park-view-deluxe"
  },
  {
    "id": "rev-006",
    "guest": "Family Trần",
    "origin": "Cần Thơ",
    "rating": 5,
    "title": "Phòng liên thông tiện cho cả nhà",
    "titleEn": "Connecting rooms that worked for the whole family",
    "text": "Hai phòng liên thông rất tiện cho gia đình 5 người. Khách sạn chuẩn bị sẵn cũi và ghế ăn dặm cho bé, nhân viên chu đáo.",
    "textEn": "Two connecting rooms were practical for a family of five. The hotel had a cot and a high chair ready, and the staff were attentive.",
    "branchId": "pml-dong-du",
    "roomId": "room-family-connecting"
  },
  {
    "id": "rev-007",
    "guest": "Jonas K.",
    "origin": "Berlin, Đức",
    "rating": 4,
    "title": "Ở 3 tuần như ở nhà",
    "titleEn": "Three weeks that felt like home",
    "text": "Bếp nhỏ và bàn làm việc rộng là điểm cộng lớn. Giặt tuần tiện. Chỉ mong hạng mục dọn phòng có thể chọn giờ linh hoạt hơn.",
    "textEn": "The small kitchen and the wide desk were the real advantages. Weekly laundry was convenient. More flexible housekeeping times would help.",
    "branchId": "pml-central-park",
    "roomId": "room-studio-longstay"
  },
  {
    "id": "rev-008",
    "guest": "Thu Hà",
    "origin": "TP.HCM",
    "rating": 4,
    "title": "Gọn, đẹp, đúng vị trí",
    "titleEn": "Compact, handsome, and well placed",
    "text": "Phòng Superior nhỏ nhưng thiết kế Indochine rất dễ thương và rất yên tĩnh. Vị trí đi bộ ra phố cực tiện.",
    "textEn": "The Superior room is small, but the Indochine design is charming and very quiet. Walking out to the street is easy.",
    "branchId": "pml-dong-du",
    "roomId": "room-superior-indochine"
  }
]

export const stories: Story[] = [
  {
    "id": "post-001",
    "slug": "mot-ngay-di-bo-sai-gon-trung-tam",
    "category": "Khám phá",
    "title": "Một ngày đi bộ Sài Gòn trung tâm",
    "excerpt": "Từ bánh mì sáng đến hoàng hôn bên sông: lộ trình đi bộ do concierge PML gợi ý.",
    "readMinutes": 6
  },
  {
    "id": "post-002",
    "slug": "nghi-thuc-onsen-cho-nguoi-moi",
    "category": "Wellness",
    "title": "Nghi thức Onsen cho người mới",
    "excerpt": "Ngâm nóng, ngâm lạnh, xông hơi: thứ tự và cách giữ nhịp để cơ thể thật sự thư giãn.",
    "readMinutes": 5
  },
  {
    "id": "post-003",
    "slug": "5-quan-an-tan-dinh-nen-thu",
    "category": "Ẩm thực",
    "title": "5 quán ăn Tân Định nên thử",
    "excerpt": "Những quán ăn quen của người địa phương trong bán kính đi bộ từ PML Central Park.",
    "readMinutes": 5
  },
  {
    "id": "post-004",
    "slug": "bleisure-lam-viec-va-nghi-ngoi",
    "category": "Công tác",
    "title": "Bleisure: làm việc và nghỉ ngơi trong cùng một chuyến đi",
    "excerpt": "Cách sắp xếp lịch để chuyến công tác vẫn có thời gian khám phá thành phố.",
    "readMinutes": 4
  },
  {
    "id": "post-005",
    "slug": "cau-hon-tren-san-thuong-sai-gon",
    "category": "Khoảnh khắc",
    "title": "Cầu hôn trên sân thượng: những điều cần chuẩn bị",
    "excerpt": "Checklist chọn thời điểm, phương án dự phòng thời tiết, chụp ảnh và hoa.",
    "readMinutes": 5
  },
  {
    "id": "post-006",
    "slug": "di-cu-chi-hay-me-kong",
    "category": "Khám phá",
    "title": "Củ Chi hay Mê Kông: nên đi tour nào?",
    "excerpt": "So sánh thời gian, độ mệt, chi phí và gợi ý cho từng kiểu khách.",
    "readMinutes": 7
  },
  {
    "id": "post-007",
    "slug": "mua-mua-sai-gon-lam-gi",
    "category": "Mẹo du lịch",
    "title": "Mùa mưa Sài Gòn: làm gì khi trời đổ mưa chiều",
    "excerpt": "Những điểm tham quan trong nhà, quán cà phê và cách tận dụng tiếng mưa để nghỉ ngơi.",
    "readMinutes": 4
  },
  {
    "id": "post-008",
    "slug": "tet-o-sai-gon",
    "category": "Mẹo du lịch",
    "title": "Tết ở Sài Gòn: đi đâu, ăn gì, quán nào mở cửa",
    "excerpt": "Gợi ý cho khách ở lại thành phố dịp Tết và lưu ý đặt phòng sớm.",
    "readMinutes": 5
  }
]

export const sampleContentNote = {
  vi: 'Nội dung mẫu',
  en: 'Sample content',
} as const
