-- PML Hotel Seed Data for Neon Lakebase Postgres

INSERT INTO branches (id, name, slug, tagline, address, phone, email, description)
VALUES
  (
    'pml-dong-du',
    'PML Hotel Đông Du Edition',
    'dong-du',
    'Trái tim Sài Gòn, ngay trước cửa.',
    '19-21 Đông Du, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    '0789 780 167',
    'dongdu@pmlhotel.com',
    'Vị trí vàng sát cạnh phố đi bộ Nguyễn Huệ, Takashimaya và bến Bạch Đằng. Thiết kế Indochine kết hợp hiện đại.'
  ),
  (
    'pml-onsen-hai-ba-trung',
    'PML Hotel & Onsen Lounge',
    'onsen-hai-ba-trung',
    'Chậm lại giữa lòng Quận 1.',
    '40 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    '0789 780 167',
    'onsen@pmlhotel.com',
    'Khách sạn Boutique duy nhất tại Quận 1 sở hữu tổ hợp Bể ngâm khoáng nóng Onsen chuẩn Nhật và Phòng xông hơi đá muối.'
  ),
  (
    'pml-central-park',
    'PML Hotel Central Park & Rooftop',
    'central-park',
    'Tầm nhìn công viên, hoàng hôn trên tầng thượng.',
    '223 Hai Bà Trưng, Phường Tân Định, Quận 1, TP. Hồ Chí Minh',
    '0789 780 167',
    'centralpark@pmlhotel.com',
    'Khách sạn nhìn thẳng ra công viên Lê Văn Tám rợp bóng cây xanh mát, với hồ bơi vô cực và Sky Bar tầng thượng.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  tagline = EXCLUDED.tagline,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  description = EXCLUDED.description;

INSERT INTO room_types (id, branch_id, name, slug, size_sqm, max_guests, base_price_vnd, description, features)
VALUES
  (
    'room-onsen-suite',
    'pml-onsen-hai-ba-trung',
    'Onsen Signature Suite',
    'onsen-signature-suite',
    42,
    2,
    2200000,
    'Một nơi ẩn mình phục hồi sâu với bồn ngâm khoáng riêng và phòng xông hơi khô ngay trong phòng.',
    ARRAY['Bồn tắm ngâm khoáng Onsen riêng', 'Phòng xông hơi khô riêng', 'Miễn phí Trà chiều Signature']
  ),
  (
    'room-onsen-deluxe-queen',
    'pml-onsen-hai-ba-trung',
    'Onsen Deluxe Queen',
    'onsen-deluxe-queen',
    26,
    2,
    1350000,
    'Phòng Deluxe ấm cúng với bồn ngâm sâu bằng đá mài, vòi sen áp lực cao và trà gạo lứt chào mừng.',
    ARRAY['Bồn ngâm đá mài riêng', 'Vé trải nghiệm Onsen tầng lửng', 'Trà gạo lứt rang chào mừng']
  ),
  (
    'room-onsen-twin',
    'pml-onsen-hai-ba-trung',
    'Onsen Twin',
    'onsen-twin',
    28,
    2,
    1450000,
    'Hai giường đơn thoải mái với đệm foam cao cấp, góc uống trà phong cách Nhật.',
    ARRAY['2 Giường đơn cao cấp', 'Vé Onsen & Sauna', 'Bàn trà bệt thư giãn']
  ),
  (
    'room-onsen-family-suite',
    'pml-onsen-hai-ba-trung',
    'Onsen Family Suite',
    'onsen-family-suite',
    55,
    4,
    2700000,
    'Phòng suite rộng rãi cho gia đình 4 người với bồn ngâm lớn, 2 phòng ngủ bán biệt lập.',
    ARRAY['Bồn ngâm gia đình 4 người', '2 Giường King lớn', 'Khu sinh hoạt chung']
  ),
  (
    'room-superior-indochine',
    'pml-dong-du',
    'Superior Indochine',
    'superior-indochine',
    24,
    2,
    1150000,
    'Phòng Superior phong cách Đông Dương trang nhã với quạt trần cổ điển và sàn gỗ ấm áp.',
    ARRAY['Phong cách Indochine', 'Giường Queen êm ái', 'Cà phê phin đặc sản']
  ),
  (
    'room-deluxe-city',
    'pml-dong-du',
    'Deluxe City Balcony',
    'deluxe-city-balcony',
    30,
    2,
    1550000,
    'Ban công riêng nhìn ra phố Đông Du nhộn nhịp, bồn tắm đứng vách kính.',
    ARRAY['Ban công ngắm phố', 'Bồn tắm đứng sang trọng', 'Minibar miễn phí']
  ),
  (
    'room-executive-corner',
    'pml-dong-du',
    'Executive Corner Suite',
    'executive-corner-suite',
    48,
    2,
    2500000,
    'Suite góc hai mặt kính nhìn thẳng ra phố đi bộ Nguyễn Huệ và Nhà hát Thành phố.',
    ARRAY['View 2 mặt kính panorama', 'Bồn tắm view thành phố', 'Check-in sớm linh hoạt']
  ),
  (
    'room-family-connecting',
    'pml-dong-du',
    'Family Connecting Room',
    'family-connecting',
    52,
    4,
    2800000,
    'Hai phòng thông nhau với 2 phòng tắm riêng, lý tưởng cho gia đình có trẻ nhỏ.',
    ARRAY['2 phòng thông nhau', '2 phòng tắm riêng biệt', 'Sức chứa 4 khách lớn']
  ),
  (
    'room-rooftop-jacuzzi',
    'pml-central-park',
    'Rooftop Jacuzzi Penthouse',
    'rooftop-jacuzzi-penthouse',
    60,
    2,
    3500000,
    'Tầng thượng với bồn Jacuzzi ngoài trời nhìn trọn công viên và hoàng hôn Quận 1.',
    ARRAY['Bồn sục Jacuzzi ngoài trời', 'Đặc quyền Sky Bar', 'Rượu vang chào mừng']
  ),
  (
    'room-park-view-deluxe',
    'pml-central-park',
    'Park View Deluxe',
    'park-view-deluxe',
    32,
    2,
    1650000,
    'Cửa sổ kính lớn nhìn thẳng ra mảng xanh bạt ngàn của công viên Lê Văn Tám.',
    ARRAY['View công viên xanh mát', 'Bồn tắm nằm thư giãn', 'Bữa sáng buffet']
  ),
  (
    'room-park-twin',
    'pml-central-park',
    'Park Twin Room',
    'park-twin-room',
    32,
    2,
    1650000,
    'Hai giường đơn nhìn ra công viên, bàn làm việc rộng rãi cho chuyến công tác.',
    ARRAY['2 Giường đơn êm ái', 'Bàn làm việc doanh nhân', 'Hồ bơi vô cực']
  ),
  (
    'room-studio-longstay',
    'pml-central-park',
    'Studio Long-stay Apartment',
    'studio-long-stay',
    45,
    2,
    2100000,
    'Căn hộ studio trang bị bếp từ, lò vi sóng, tủ lạnh lớn và máy giặt riêng.',
    ARRAY['Bếp tiện nghi đầy đủ', 'Máy giặt sấy riêng', 'Dịch vụ dọn phòng hàng ngày']
  )
ON CONFLICT (id) DO UPDATE SET
  branch_id = EXCLUDED.branch_id,
  name = EXCLUDED.name,
  base_price_vnd = EXCLUDED.base_price_vnd,
  description = EXCLUDED.description,
  features = EXCLUDED.features;
