export type NearbyPlace = {
  name: string
  minutes: string
}

export type Branch = {
  id: string
  slug: string
  name: string
  shortName: string
  address: string
  street: string
  district: string
  ward: string
  phone: string
  email: string
  highlights: string
  tagline: string
  nearby: NearbyPlace[]
  lat: number
  lng: number
}

export type AmenityHighlight = {
  id: string
  name: string
  nameEn: string
  detail: string
  detailEn: string
  hours: string
}

export const branches: Branch[] = [
  {
    "id": "pml-dong-du",
    "slug": "dong-du",
    "name": "PML Hotel Đông Du Edition",
    "shortName": "Đông Du",
    "address": "19-21 Đông Du, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    "street": "19-21 Đông Du",
    "district": "Quận 1",
    "ward": "Bến Nghé",
    "phone": "+84 28 3822 1111",
    "email": "dongdu@pmlhotel.com",
    "highlights": "Vị trí vàng sát cạnh phố đi bộ Nguyễn Huệ, Takashimaya và bến Bạch Đằng. Thiết kế Indochine kết hợp hiện đại.",
    "tagline": "Trái tim Sài Gòn, ngay trước cửa.",
    "lat": 10.7743,
    "lng": 106.7040,
    "nearby": [
      {
        "name": "Phố đi bộ Nguyễn Huệ",
        "minutes": "03"
      },
      {
        "name": "Nhà hát Thành phố (Opera House)",
        "minutes": "04"
      },
      {
        "name": "Bến Bạch Đằng & Waterbus",
        "minutes": "05"
      }
    ]
  },
  {
    "id": "pml-onsen-hai-ba-trung",
    "slug": "onsen-hai-ba-trung",
    "name": "PML Hotel & Onsen Lounge",
    "shortName": "Onsen Hai Bà Trưng",
    "address": "40 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    "street": "40 Hai Bà Trưng",
    "district": "Quận 1",
    "ward": "Bến Nghé",
    "phone": "+84 28 3822 2222",
    "email": "onsen@pmlhotel.com",
    "highlights": "Khách sạn Boutique duy nhất tại Quận 1 sở hữu tổ hợp Bể ngâm khoáng nóng Onsen chuẩn Nhật và Phòng xông hơi đá muối.",
    "tagline": "Chậm lại giữa lòng Quận 1.",
    "lat": 10.7775,
    "lng": 106.7022,
    "nearby": [
      {
        "name": "Nhà thờ Đức Bà & Bưu điện Trung tâm",
        "minutes": "06"
      },
      {
        "name": "Đường sách Nguyễn Văn Bình",
        "minutes": "350m"
      },
      {
        "name": "Chợ Bến Thành",
        "minutes": "03"
      }
    ]
  },
  {
    "id": "pml-central-park",
    "slug": "central-park",
    "name": "PML Hotel Central Park & Rooftop",
    "shortName": "Central Park",
    "address": "223 Hai Bà Trưng, Phường Tân Định, Quận 1, TP. Hồ Chí Minh",
    "street": "223 Hai Bà Trưng",
    "district": "Quận 1",
    "ward": "Tân Định",
    "phone": "+84 28 3822 3333",
    "email": "centralpark@pmlhotel.com",
    "highlights": "Sở hữu Rooftop Jacuzzi Bar view công viên Lê Văn Tám, không gian Co-working Lounge và phòng Gym hiện đại.",
    "tagline": "Sài Gòn nhìn từ trên cao.",
    "lat": 10.7897,
    "lng": 106.6919,
    "nearby": [
      {
        "name": "Công viên Lê Văn Tám",
        "minutes": "01"
      },
      {
        "name": "Chợ Tân Định & Nhà thờ Tân Định (Chợ Hồng)",
        "minutes": "05"
      },
      {
        "name": "Chùa Ngọc Hoàng (Phước Hải Tự)",
        "minutes": "03"
      }
    ]
  }
]

export const amenityHighlights: AmenityHighlight[] = [
  {
    "id": "amenity-onsen",
    "name": "Tổ hợp Onsen Khoáng Nóng Nhật Bản",
    "nameEn": "Japanese mineral onsen",
    "detail": "Bao gồm bể khoáng nóng 40°C, bể ngâm lạnh 18°C, phòng xông hơi đá muối Himalayan và khu thư giãn Lounge.",
    "detailEn": "A 40°C mineral bath, an 18°C cold plunge, and a Himalayan salt sauna. Free for guests staying at Hai Ba Trung.",
    "hours": "06:00 - 22:00 hàng ngày"
  },
  {
    "id": "amenity-rooftop-skybar",
    "name": "Rooftop Jacuzzi & Sky Bar",
    "nameEn": "Rooftop jacuzzi & sky bar",
    "detail": "Hồ bơi Jacuzzi ngắm hoàng hôn cực chill kết hợp âm nhạc Acoustic/Chillhop buổi tối.",
    "detailEn": "A sunset jacuzzi and an evening bar. Staying guests receive 20% off the cocktail menu.",
    "hours": "16:00 - 23:30 hàng ngày"
  },
  {
    "id": "amenity-coworking",
    "name": "Executive Coworking Lounge",
    "nameEn": "Executive coworking lounge",
    "detail": "Không gian yên tĩnh với bàn làm việc, ổ cắm đầy đủ, Wi-Fi tốc độ cao, máy in cơ bản, khu gọi điện riêng và cà phê pha máy miễn phí.",
    "detailEn": "A quiet room with desks, fast Wi-Fi, and coffee, free for guests at Central Park.",
    "hours": "07:00 - 22:00 hàng ngày"
  },
  {
    "id": "amenity-afternoon-tea",
    "name": "Tiệc Trà Chiều Miễn Phí (Free Afternoon Tea)",
    "nameEn": "Afternoon tea",
    "detail": "Phục vụ các loại trà thảo mộc organic, cà phê phin thủ công, bánh ngọt Pháp và trái cây tươi mùa.",
    "detailEn": "Herbal tea, Vietnamese phin coffee, and pastries, free for guests who book on the website.",
    "hours": "14:30 - 16:30 hàng ngày"
  },
  {
    "id": "amenity-gym",
    "name": "Phòng Gym",
    "nameEn": "Fitness room",
    "detail": "Máy chạy bộ, xe đạp tập, tạ tự do và thảm yoga. Miễn phí cho khách lưu trú tại Central Park.",
    "detailEn": "Treadmills, bikes, free weights and yoga mats. Free for guests staying at Central Park.",
    "hours": "05:30 - 22:00 hàng ngày"
  },
  {
    "id": "amenity-concierge",
    "name": "Concierge & bàn tour",
    "nameEn": "Concierge & tours",
    "detail": "Gợi ý lộ trình đi bộ, đặt bàn nhà hàng, tour Củ Chi / Mê Kông và hỗ trợ đưa đón sân bay.",
    "detailEn": "Walking routes, restaurant bookings, Cu Chi / Mekong tours and airport transfers.",
    "hours": "07:00 - 22:00 hàng ngày"
  }
]
