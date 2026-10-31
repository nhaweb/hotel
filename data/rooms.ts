export type Room = {
  id: string
  branchId: string
  name: string
  nameEn: string
  category: string
  sizeSqm: number
  bedType: string
  capacity: string
  maxAdults: number
  view: string
  viewEn: string
  priceVnd: number
  breakfastIncluded: boolean
  description: string
  descriptionEn: string
  features: string[]
  featuresEn: string[]
}

export const rooms: Room[] = [
  {
    "id": "room-onsen-suite",
    "branchId": "pml-onsen-hai-ba-trung",
    "name": "Onsen Signature Suite",
    "nameEn": "Onsen Signature Suite",
    "category": "Suite",
    "sizeSqm": 42,
    "bedType": "1 Giường King Size (1m8 x 2m)",
    "capacity": "2 Người lớn + 1 Trẻ em dưới 6 tuổi",
    "maxAdults": 2,
    "view": "Cửa sổ kính kịch trần view phố",
    "viewEn": "Floor-to-ceiling street view",
    "priceVnd": 2200000,
    "breakfastIncluded": true,
    "description": "Một nơi ẩn mình phục hồi sâu với bồn ngâm khoáng riêng và phòng xông hơi khô ngay trong phòng. Gỗ tuyết tùng, đá tự nhiên và ánh sáng ấm tạo cảm giác như một ryokan thu nhỏ giữa Quận 1.",
    "descriptionEn": "A private mineral soaking tub and dry sauna in the room, with a floor-to-ceiling window looking onto the street.",
    "features": [
      "Bồn tắm ngâm khoáng Onsen riêng tại phòng",
      "Phòng xông hơi khô (Sauna) riêng",
      "Miễn phí 02 suất Trà chiều Signature"
    ],
    "featuresEn": [
      "Private mineral tub",
      "In-room dry sauna",
      "Floor-to-ceiling street view"
    ]
  },
  {
    "id": "room-onsen-deluxe-queen",
    "branchId": "pml-onsen-hai-ba-trung",
    "name": "Onsen Deluxe Queen",
    "nameEn": "Onsen Deluxe Queen",
    "category": "Deluxe",
    "sizeSqm": 26,
    "bedType": "1 Giường Queen (1m6 x 2m)",
    "capacity": "2 Người lớn",
    "maxAdults": 2,
    "view": "View phố hoặc view nội khu",
    "viewEn": "View phố hoặc view nội khu",
    "priceVnd": 1350000,
    "breakfastIncluded": true,
    "description": "Phòng gọn gàng, ấm áp, phù hợp khách muốn tận hưởng Onsen chung của khách sạn với mức giá dễ tiếp cận. Gỗ sáng màu, nệm êm và ánh sáng dịu.",
    "descriptionEn": "Phòng gọn gàng, ấm áp, phù hợp khách muốn tận hưởng Onsen chung của khách sạn với mức giá dễ tiếp cận. Gỗ sáng màu, nệm êm và ánh sáng dịu.",
    "features": [
      "Miễn phí vào tổ hợp Onsen khoáng nóng chung (06:00 - 22:00)",
      "Giường Queen nệm cao cấp",
      "Bàn làm việc nhỏ"
    ],
    "featuresEn": [
      "Miễn phí vào tổ hợp Onsen khoáng nóng chung (06:00 - 22:00)",
      "Giường Queen nệm cao cấp",
      "Bàn làm việc nhỏ"
    ]
  },
  {
    "id": "room-onsen-twin",
    "branchId": "pml-onsen-hai-ba-trung",
    "name": "Onsen Twin",
    "nameEn": "Onsen Twin",
    "category": "Deluxe",
    "sizeSqm": 28,
    "bedType": "2 Giường Đơn (1m2 x 2m)",
    "capacity": "2 Người lớn hoặc 1 người lớn + 1 trẻ em",
    "maxAdults": 2,
    "view": "View phố",
    "viewEn": "View phố",
    "priceVnd": 1450000,
    "breakfastIncluded": true,
    "description": "Hai giường đơn tiện cho bạn bè, đồng nghiệp hoặc cha mẹ đi cùng con nhỏ, vẫn được sử dụng đầy đủ khu Onsen của khách sạn.",
    "descriptionEn": "Hai giường đơn tiện cho bạn bè, đồng nghiệp hoặc cha mẹ đi cùng con nhỏ, vẫn được sử dụng đầy đủ khu Onsen của khách sạn.",
    "features": [
      "Miễn phí vào tổ hợp Onsen khoáng nóng chung",
      "Hai giường đơn có thể ghép thành giường đôi theo yêu cầu",
      "Bàn làm việc"
    ],
    "featuresEn": [
      "Miễn phí vào tổ hợp Onsen khoáng nóng chung",
      "Hai giường đơn có thể ghép thành giường đôi theo yêu cầu",
      "Bàn làm việc"
    ]
  },
  {
    "id": "room-onsen-family-suite",
    "branchId": "pml-onsen-hai-ba-trung",
    "name": "Onsen Family Suite",
    "nameEn": "Onsen Family Suite",
    "category": "Suite",
    "sizeSqm": 52,
    "bedType": "1 Giường King + 1 Sofa bed",
    "capacity": "2 Người lớn + 2 Trẻ em",
    "maxAdults": 2,
    "view": "View phố",
    "viewEn": "View phố",
    "priceVnd": 2700000,
    "breakfastIncluded": true,
    "description": "Căn suite rộng rãi cho gia đình nhỏ: phòng ngủ riêng, khu sinh hoạt chung có sofa bed và bồn tắm lớn. Vẫn giữ nhịp thư giãn của Onsen cho cả nhà.",
    "descriptionEn": "Căn suite rộng rãi cho gia đình nhỏ: phòng ngủ riêng, khu sinh hoạt chung có sofa bed và bồn tắm lớn. Vẫn giữ nhịp thư giãn của Onsen cho cả nhà.",
    "features": [
      "Phòng ngủ và khu sinh hoạt tách biệt",
      "Sofa bed cho trẻ em",
      "Bồn tắm nằm lớn"
    ],
    "featuresEn": [
      "Phòng ngủ và khu sinh hoạt tách biệt",
      "Sofa bed cho trẻ em",
      "Bồn tắm nằm lớn"
    ]
  },
  {
    "id": "room-superior-indochine",
    "branchId": "pml-dong-du",
    "name": "Superior Indochine",
    "nameEn": "Superior Indochine",
    "category": "Superior",
    "sizeSqm": 22,
    "bedType": "1 Giường Queen (1m6 x 2m)",
    "capacity": "2 Người lớn",
    "maxAdults": 2,
    "view": "View nội khu / hẻm yên tĩnh",
    "viewEn": "View nội khu / hẻm yên tĩnh",
    "priceVnd": 1150000,
    "breakfastIncluded": false,
    "description": "Phòng gọn gàng mang phong cách Indochine, gạch hoa, gỗ tối màu và đèn vàng ấm; lựa chọn tiết kiệm nhưng vẫn đủ tinh tế ở vị trí trung tâm.",
    "descriptionEn": "Phòng gọn gàng mang phong cách Indochine, gạch hoa, gỗ tối màu và đèn vàng ấm; lựa chọn tiết kiệm nhưng vẫn đủ tinh tế ở vị trí trung tâm.",
    "features": [
      "Gạch hoa Indochine và nội thất gỗ",
      "Bàn làm việc nhỏ",
      "Cách âm tốt"
    ],
    "featuresEn": [
      "Gạch hoa Indochine và nội thất gỗ",
      "Bàn làm việc nhỏ",
      "Cách âm tốt"
    ]
  },
  {
    "id": "room-deluxe-city",
    "branchId": "pml-dong-du",
    "name": "Deluxe City Balcony",
    "nameEn": "Deluxe City Balcony",
    "category": "Deluxe",
    "sizeSqm": 28,
    "bedType": "1 Giường Queen (1m6 x 2m) hoặc 2 Giường Đơn",
    "capacity": "2 Người lớn",
    "maxAdults": 2,
    "view": "Ban công hướng phố Đông Du",
    "viewEn": "Balcony over Dong Du street",
    "priceVnd": 1450000,
    "breakfastIncluded": true,
    "description": "Phòng có ban công thoáng, nhìn xuống nhịp sống phố Đông Du. Bàn làm việc yên tĩnh phù hợp khách công tác và bồn tắm nằm cao cấp để thư giãn cuối ngày.",
    "descriptionEn": "A balcony room looking onto Dong Du street, with a quiet desk for work and a soaking tub for the end of the day.",
    "features": [
      "Ban công thoáng mát hướng phố Đông Du",
      "Bồn tắm nằm cao cấp",
      "Bàn làm việc yên tĩnh chuẩn Bleisure"
    ],
    "featuresEn": [
      "Street-facing balcony",
      "Soaking tub",
      "Quiet work desk"
    ]
  },
  {
    "id": "room-executive-corner",
    "branchId": "pml-dong-du",
    "name": "Executive Corner Suite",
    "nameEn": "Executive Corner Suite",
    "category": "Suite",
    "sizeSqm": 38,
    "bedType": "1 Giường King Size (1m8 x 2m)",
    "capacity": "2 Người lớn + 1 Trẻ em dưới 6 tuổi",
    "maxAdults": 2,
    "view": "Góc phố, hai mặt cửa kính",
    "viewEn": "Góc phố, hai mặt cửa kính",
    "priceVnd": 2050000,
    "breakfastIncluded": true,
    "description": "Căn góc hai mặt kính đón ánh sáng tự nhiên, có khu tiếp khách riêng và bàn làm việc rộng, lý tưởng cho khách công tác dài ngày hoặc cặp đôi thích không gian rộng.",
    "descriptionEn": "Căn góc hai mặt kính đón ánh sáng tự nhiên, có khu tiếp khách riêng và bàn làm việc rộng, lý tưởng cho khách công tác dài ngày hoặc cặp đôi thích không gian rộng.",
    "features": [
      "Hai mặt cửa kính, view góc phố",
      "Khu tiếp khách riêng và bàn làm việc rộng",
      "Đặc quyền Executive: trả phòng muộn đến 14:00 (tùy tình trạng phòng)"
    ],
    "featuresEn": [
      "Hai mặt cửa kính, view góc phố",
      "Khu tiếp khách riêng và bàn làm việc rộng",
      "Đặc quyền Executive: trả phòng muộn đến 14:00 (tùy tình trạng phòng)"
    ]
  },
  {
    "id": "room-family-connecting",
    "branchId": "pml-dong-du",
    "name": "Family Connecting Room",
    "nameEn": "Family Connecting Room",
    "category": "Family",
    "sizeSqm": 48,
    "bedType": "2 Phòng liên thông: 1 Queen + 1 Twin (hoặc 2 Queen)",
    "capacity": "4 Người lớn hoặc 2 người lớn + 3 trẻ em",
    "maxAdults": 4,
    "view": "Ban công hướng phố",
    "viewEn": "Ban công hướng phố",
    "priceVnd": 2600000,
    "breakfastIncluded": true,
    "description": "Hai phòng liên thông bằng cửa riêng, vừa gần gũi vừa riêng tư cho gia đình hoặc nhóm bạn.",
    "descriptionEn": "Hai phòng liên thông bằng cửa riêng, vừa gần gũi vừa riêng tư cho gia đình hoặc nhóm bạn.",
    "features": [
      "Hai phòng ngủ liên thông, mỗi phòng có phòng tắm riêng",
      "Ban công hướng phố",
      "Miễn phí ăn sáng cho 4 người"
    ],
    "featuresEn": [
      "Hai phòng ngủ liên thông, mỗi phòng có phòng tắm riêng",
      "Ban công hướng phố",
      "Miễn phí ăn sáng cho 4 người"
    ]
  },
  {
    "id": "room-rooftop-jacuzzi",
    "branchId": "pml-central-park",
    "name": "Rooftop Jacuzzi Penthouse",
    "nameEn": "Rooftop Jacuzzi Penthouse",
    "category": "Penthouse",
    "sizeSqm": 55,
    "bedType": "1 Giường Super King (2m x 2m)",
    "capacity": "2 - 3 Người lớn",
    "maxAdults": 3,
    "view": "Toàn cảnh 360 độ Sài Gòn và công viên",
    "viewEn": "360° view of Saigon and the park",
    "priceVnd": 3100000,
    "breakfastIncluded": true,
    "description": "Căn penthouse trên tầng thượng với bồn Jacuzzi ngoài trời riêng, tầm nhìn 360 độ. Dành cho những dịp muốn nhớ lâu: kỷ niệm, cầu hôn hay một đêm xa xỉ riêng tư.",
    "descriptionEn": "A top-floor penthouse with a private outdoor jacuzzi and a 360° view, for celebrations and quiet nights in.",
    "features": [
      "Bồn Jacuzzi ngoài trời riêng biệt trên sân thượng",
      "Tầm nhìn 360 độ ngắm toàn cảnh Sài Gòn & Công viên",
      "Không gian Bếp nhỏ (Kitchenette) & Tủ rượu"
    ],
    "featuresEn": [
      "Private rooftop jacuzzi",
      "360° city and park view",
      "In-room check-in"
    ]
  },
  {
    "id": "room-park-view-deluxe",
    "branchId": "pml-central-park",
    "name": "Park View Deluxe",
    "nameEn": "Park View Deluxe",
    "category": "Deluxe",
    "sizeSqm": 30,
    "bedType": "1 Giường King Size (1m8 x 2m)",
    "capacity": "2 Người lớn + 1 Trẻ em dưới 6 tuổi",
    "maxAdults": 2,
    "view": "Công viên Lê Văn Tám",
    "viewEn": "Công viên Lê Văn Tám",
    "priceVnd": 1600000,
    "breakfastIncluded": true,
    "description": "Cửa sổ lớn nhìn ra màu xanh của công viên Lê Văn Tám, buổi sáng nghe tiếng chim, buổi tối thấy đèn thành phố.",
    "descriptionEn": "Cửa sổ lớn nhìn ra màu xanh của công viên Lê Văn Tám, buổi sáng nghe tiếng chim, buổi tối thấy đèn thành phố.",
    "features": [
      "View công viên Lê Văn Tám",
      "Cửa sổ lớn, nhiều ánh sáng tự nhiên",
      "Bàn làm việc & ghế công thái học"
    ],
    "featuresEn": [
      "View công viên Lê Văn Tám",
      "Cửa sổ lớn, nhiều ánh sáng tự nhiên",
      "Bàn làm việc & ghế công thái học"
    ]
  },
  {
    "id": "room-park-twin",
    "branchId": "pml-central-park",
    "name": "Park Twin",
    "nameEn": "Park Twin",
    "category": "Deluxe",
    "sizeSqm": 30,
    "bedType": "2 Giường Đơn (1m2 x 2m)",
    "capacity": "2 Người lớn hoặc 1 người lớn + 1 trẻ em",
    "maxAdults": 2,
    "view": "Công viên Lê Văn Tám",
    "viewEn": "Công viên Lê Văn Tám",
    "priceVnd": 1600000,
    "breakfastIncluded": true,
    "description": "Phòng hai giường đơn view công viên, tiện cho đồng nghiệp hoặc bạn bè đi cùng.",
    "descriptionEn": "Phòng hai giường đơn view công viên, tiện cho đồng nghiệp hoặc bạn bè đi cùng.",
    "features": [
      "Hai giường đơn",
      "View công viên",
      "Miễn phí ăn sáng, vào phòng Gym và Co-working Lounge"
    ],
    "featuresEn": [
      "Hai giường đơn",
      "View công viên",
      "Miễn phí ăn sáng, vào phòng Gym và Co-working Lounge"
    ]
  },
  {
    "id": "room-studio-longstay",
    "branchId": "pml-central-park",
    "name": "Studio Long-stay",
    "nameEn": "Long-stay Studio",
    "category": "Studio",
    "sizeSqm": 35,
    "bedType": "1 Giường Queen + khu bếp & bàn làm việc",
    "capacity": "2 Người lớn",
    "maxAdults": 2,
    "view": "Nội khu / công viên một phần",
    "viewEn": "Nội khu / công viên một phần",
    "priceVnd": 1900000,
    "breakfastIncluded": false,
    "description": "Căn studio có bếp nhỏ, máy giặt chung và bàn làm việc rộng, thiết kế cho khách ở từ một tuần trở lên với giá ưu đãi theo số đêm.",
    "descriptionEn": "Căn studio có bếp nhỏ, máy giặt chung và bàn làm việc rộng, thiết kế cho khách ở từ một tuần trở lên với giá ưu đãi theo số đêm.",
    "features": [
      "Kitchenette: bếp từ, tủ lạnh, lò vi sóng, bộ dụng cụ nấu ăn",
      "Bàn làm việc lớn và ghế công thái học",
      "Giá ưu đãi cho lưu trú 7 đêm và 30 đêm"
    ],
    "featuresEn": [
      "Kitchenette: bếp từ, tủ lạnh, lò vi sóng, bộ dụng cụ nấu ăn",
      "Bàn làm việc lớn và ghế công thái học",
      "Giá ưu đãi cho lưu trú 7 đêm và 30 đêm"
    ]
  }
]

export const featuredRoomIds = ['room-onsen-suite', 'room-deluxe-city', 'room-rooftop-jacuzzi'] as const
