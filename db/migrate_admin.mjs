import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

// Read faqs directly from JSON
const faqsRaw = fs.readFileSync(path.join(process.cwd(), 'files', '06_faq.json'), 'utf8')
const faqs = JSON.parse(faqsRaw).faq || []

// Load .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
const match = envFile.match(/DATABASE_URL=(.+)/)
if (!match || !match[1]) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}
let databaseUrl = match[1].trim().replace(/^["']+|["']+$/g, '')
databaseUrl = databaseUrl
  .replace(/^postgresql:\/\//, 'postgres://')
  .replace(/([?&])channel_binding=[^&]+(&|$)/, '$1')
  .replace(/[?&]$/, '')

const sql = neon(databaseUrl)

function splitStatements(sqlText) {
  const withoutComments = sqlText.replace(/--.*$/gm, '')
  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function run() {
  console.log('--- RUNNING ADMIN SCHEMA & SEED MIGRATION ---')

  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8')
  console.log('1. Executing updated schema.sql...')
  for (const stmt of splitStatements(schemaSql)) {
    try {
      await sql.query(stmt)
    } catch (err) {
      console.warn('Notice on statement:', stmt.slice(0, 45), err.message)
    }
  }
  console.log('✓ Schema applied successfully!')

  // 2. Insert Room Units
  console.log('2. Inserting physical room units...')
  const roomUnits = [
    // PML Đông Du
    { id: 'pml-dd-201', branchId: 'pml-dong-du', roomTypeId: 'room-superior-indochine', num: '201', floor: 2, status: 'AVAILABLE' },
    { id: 'pml-dd-202', branchId: 'pml-dong-du', roomTypeId: 'room-superior-indochine', num: '202', floor: 2, status: 'AVAILABLE' },
    { id: 'pml-dd-301', branchId: 'pml-dong-du', roomTypeId: 'room-deluxe-city', num: '301', floor: 3, status: 'AVAILABLE' },
    { id: 'pml-dd-302', branchId: 'pml-dong-du', roomTypeId: 'room-deluxe-city', num: '302', floor: 3, status: 'CLEANING' },
    { id: 'pml-dd-401', branchId: 'pml-dong-du', roomTypeId: 'room-executive-corner', num: '401', floor: 4, status: 'AVAILABLE' },
    { id: 'pml-dd-501', branchId: 'pml-dong-du', roomTypeId: 'room-family-connecting', num: '501', floor: 5, status: 'AVAILABLE' },

    // PML Onsen Hai Bà Trưng
    { id: 'pml-hbt-201', branchId: 'pml-onsen-hai-ba-trung', roomTypeId: 'room-onsen-deluxe-queen', num: '201', floor: 2, status: 'AVAILABLE' },
    { id: 'pml-hbt-202', branchId: 'pml-onsen-hai-ba-trung', roomTypeId: 'room-onsen-deluxe-queen', num: '202', floor: 2, status: 'AVAILABLE' },
    { id: 'pml-hbt-301', branchId: 'pml-onsen-hai-ba-trung', roomTypeId: 'room-onsen-twin', num: '301', floor: 3, status: 'AVAILABLE' },
    { id: 'pml-hbt-401', branchId: 'pml-onsen-hai-ba-trung', roomTypeId: 'room-onsen-suite', num: '401', floor: 4, status: 'OCCUPIED' },
    { id: 'pml-hbt-501', branchId: 'pml-onsen-hai-ba-trung', roomTypeId: 'room-onsen-family-suite', num: '501', floor: 5, status: 'AVAILABLE' },

    // PML Central Park
    { id: 'pml-cp-201', branchId: 'pml-central-park', roomTypeId: 'room-park-twin', num: '201', floor: 2, status: 'AVAILABLE' },
    { id: 'pml-cp-301', branchId: 'pml-central-park', roomTypeId: 'room-park-view-deluxe', num: '301', floor: 3, status: 'AVAILABLE' },
    { id: 'pml-cp-401', branchId: 'pml-central-park', roomTypeId: 'room-studio-longstay', num: '401', floor: 4, status: 'DIRTY' },
    { id: 'pml-cp-501', branchId: 'pml-central-park', roomTypeId: 'room-rooftop-jacuzzi', num: 'PH-01', floor: 5, status: 'AVAILABLE' },
  ]

  for (const ru of roomUnits) {
    await sql`
      INSERT INTO room_units (id, branch_id, room_type_id, room_number, floor, status)
      VALUES (${ru.id}, ${ru.branchId}, ${ru.roomTypeId}, ${ru.num}, ${ru.floor}, ${ru.status})
      ON CONFLICT (id) DO UPDATE 
      SET status = EXCLUDED.status, room_type_id = EXCLUDED.room_type_id;
    `
  }
  console.log(`✓ Inserted/Updated ${roomUnits.length} physical room units.`)

  // 3. Migrate FAQs into Neon Database
  console.log('3. Migrating FAQs into Neon database...')
  let faqCount = 0
  for (const faq of faqs) {
    await sql`
      INSERT INTO faqs (id, category, question, answer, keywords, is_active, display_order)
      VALUES (${faq.id}, ${faq.category}, ${faq.question}, ${faq.answer}, ${faq.keywords || []}, true, ${faqCount})
      ON CONFLICT (id) DO UPDATE 
      SET category = EXCLUDED.category, question = EXCLUDED.question, answer = EXCLUDED.answer, keywords = EXCLUDED.keywords;
    `
    faqCount++
  }
  console.log(`✓ Migrated ${faqCount} FAQs into Neon Postgres.`)

  // 4. Insert Services
  console.log('4. Inserting luxury services...')
  const services = [
    { id: 'svc-onsen-pass', name: 'Vé ngâm khoáng Onsen Signature', category: 'ONSEN', price: 450000, desc: '90 phút ngâm khoáng nóng chuẩn Nhật Bản' },
    { id: 'svc-massage-60', name: 'Trị liệu toàn thân đá nóng 60 phút', category: 'SPA', price: 750000, desc: 'Massage trị liệu thư giãn sâu với tinh dầu tuyết tùng' },
    { id: 'svc-afternoon-tea', name: 'Set Trà chiều PML High Tea', category: 'DINING', price: 380000, desc: 'Bánh ngọt thủ công và trà hoa cúc thượng hạng cho 2 người' },
    { id: 'svc-airport-sedan', name: 'Đưa đón sân bay Tân Sơn Nhất (Sedan)', category: 'TRANSPORT', price: 450000, desc: 'Xe riêng đón tiễn sân bay Tân Sơn Nhất 24/7' },
    { id: 'svc-romantic-setup', name: 'Gói Setup kỷ niệm / trăng mật tại phòng', category: 'EXPERIENCE', price: 1200000, desc: 'Rải hoa hồng, nến thơm, rượu vang nổ và bánh kem chúc mừng' },
  ]
  for (const s of services) {
    await sql`
      INSERT INTO services (id, name, category, price_vnd, description, is_active)
      VALUES (${s.id}, ${s.name}, ${s.category}, ${s.price}, ${s.desc}, true)
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name, price_vnd = EXCLUDED.price_vnd;
    `
  }
  console.log(`✓ Inserted ${services.length} services.`)

  // Verify tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `
  console.log('Active Database Tables in Neon:')
  tables.forEach((t) => console.log(' •', t.table_name))
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
