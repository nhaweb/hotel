import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

// Load .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
const match = envFile.match(/DATABASE_URL=(.+)/)
let databaseUrl = match[1].trim().replace(/^["']+|["']+$/g, '').replace(/^postgresql:\/\//, 'postgres://').replace(/([?&])channel_binding=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
const sql = neon(databaseUrl)

async function seed() {
  console.log('--- SEEDING REALISTIC CHECKED-IN GUESTS ---')

  // 1. Dong Du - Room 201
  const existingCust1 = await sql`SELECT id FROM customers WHERE phone = '0918765432'`
  let cust1Id = existingCust1[0]?.id
  if (!cust1Id) {
    const [c] = await sql`INSERT INTO customers (full_name, phone, email) VALUES ('Đặng Thị Thùy Dung', '0918765432', 'thuydung.dang@gmail.com') RETURNING id;`
    cust1Id = c.id
  }
  await sql`
    INSERT INTO bookings (
      booking_code, customer_id, branch_id, room_type_id, assigned_room_unit_id,
      check_in_date, check_out_date, num_guests, num_rooms, total_amount_vnd,
      payment_status, payment_method, booking_status, special_requests, actual_check_in_at
    ) VALUES (
      'PML-DD-201', ${cust1Id}, 'pml-dong-du', 'room-superior-indochine', 'pml-dd-201',
      CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 2, 1, 3450000,
      'paid', 'CREDIT_CARD', 'checked_in', 'Yêu cầu phòng yên tĩnh tầng 2', NOW()
    ) ON CONFLICT (booking_code) DO UPDATE 
    SET assigned_room_unit_id = 'pml-dd-201', booking_status = 'checked_in', check_out_date = CURRENT_DATE + INTERVAL '3 days';
  `
  await sql`UPDATE room_units SET status = 'OCCUPIED' WHERE id = 'pml-dd-201';`
  console.log('✓ Dong Du Room 201 assigned & checked-in')

  // 2. Onsen - Room 201
  const existingCust2 = await sql`SELECT id FROM customers WHERE phone = '0912345678'`
  let cust2Id = existingCust2[0]?.id
  if (!cust2Id) {
    const [c] = await sql`INSERT INTO customers (full_name, phone, email) VALUES ('Vũ Minh Hoàng', '0912345678', 'hoang.vu@investcorp.vn') RETURNING id;`
    cust2Id = c.id
  }
  await sql`
    INSERT INTO bookings (
      booking_code, customer_id, branch_id, room_type_id, assigned_room_unit_id,
      check_in_date, check_out_date, num_guests, num_rooms, total_amount_vnd,
      payment_status, payment_method, booking_status, special_requests, actual_check_in_at
    ) VALUES (
      'PML-HBT-201', ${cust2Id}, 'pml-onsen-hai-ba-trung', 'room-onsen-deluxe-queen', 'pml-hbt-201',
      CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 2, 1, 2700000,
      'paid', 'BANK_TRANSFER', 'checked_in', 'Gói Onsen Private kèm hoa tươi', NOW()
    ) ON CONFLICT (booking_code) DO UPDATE 
    SET assigned_room_unit_id = 'pml-hbt-201', booking_status = 'checked_in', check_out_date = CURRENT_DATE + INTERVAL '2 days';
  `
  await sql`UPDATE room_units SET status = 'OCCUPIED' WHERE id = 'pml-hbt-201';`
  console.log('✓ Onsen Room 201 assigned & checked-in')

  // 3. Central Park - Room 301
  const existingCust3 = await sql`SELECT id FROM customers WHERE phone = '0987654321'`
  let cust3Id = existingCust3[0]?.id
  if (!cust3Id) {
    const [c] = await sql`INSERT INTO customers (full_name, phone, email) VALUES ('Trần Thị Mai Phương', '0987654321', 'phuong.tran@gmail.com') RETURNING id;`
    cust3Id = c.id
  }
  await sql`
    INSERT INTO bookings (
      booking_code, customer_id, branch_id, room_type_id, assigned_room_unit_id,
      check_in_date, check_out_date, num_guests, num_rooms, total_amount_vnd,
      payment_status, payment_method, booking_status, special_requests, actual_check_in_at
    ) VALUES (
      'PML-CP-301', ${cust3Id}, 'pml-central-park', 'room-studio-longstay', 'pml-cp-301',
      CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 1, 1, 10000000,
      'paid', 'BANK_TRANSFER', 'checked_in', 'Thuê dài hạn 10 ngày, yêu cầu dụng cụ bếp', NOW()
    ) ON CONFLICT (booking_code) DO UPDATE 
    SET assigned_room_unit_id = 'pml-cp-301', booking_status = 'checked_in', check_out_date = CURRENT_DATE + INTERVAL '10 days';
  `
  await sql`UPDATE room_units SET status = 'OCCUPIED' WHERE id = 'pml-cp-301';`
  console.log('✓ Central Park Room 301 assigned & checked-in')
}

seed().then(() => {
  console.log('--- SEED FINISHED ---')
  process.exit(0)
}).catch(console.error)
