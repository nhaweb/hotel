import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

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
  console.log('--- RUNNING MINI-CRM LEADS MIGRATION ON NEON ---')

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      email VARCHAR(255),
      source VARCHAR(64) NOT NULL DEFAULT 'WEBSITE',
      stage VARCHAR(32) NOT NULL DEFAULT 'NEW',
      priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
      branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
      room_type_id VARCHAR(64) REFERENCES room_types(id) ON DELETE SET NULL,
      estimated_check_in DATE,
      estimated_check_out DATE,
      num_guests INT DEFAULT 2,
      budget_vnd NUMERIC(12, 0),
      interest_notes TEXT,
      internal_notes TEXT,
      assigned_staff VARCHAR(128),
      tags TEXT[] DEFAULT '{}',
      converted_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_branch ON leads(branch_id)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS lead_interactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      staff_name VARCHAR(128) NOT NULL DEFAULT 'Sales Staff',
      type VARCHAR(32) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id)`,
    `CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at DESC)`
  ]

  console.log('1. Creating CRM tables & indexes...')
  for (const stmt of ddlStatements) {
    try {
      await sql.query(stmt)
    } catch (err) {
      console.warn('Notice executing statement:', stmt.slice(0, 40), err.message)
    }
  }
  console.log('✓ CRM Tables created successfully!')

  // Check if leads exist
  const existingLeads = await sql`SELECT count(*)::int as count FROM leads`
  if (existingLeads[0].count > 0) {
    console.log(`Leads table already contains ${existingLeads[0].count} leads. Skipping seed.`)
    return
  }

  console.log('2. Seeding initial CRM sample leads & interactions...')

  // Sample Lead 1: Hotline - VIP - Onsen Hai Ba Trung
  const [lead1] = await sql`
    INSERT INTO leads (
      full_name, phone, email, source, stage, priority,
      branch_id, room_type_id, estimated_check_in, estimated_check_out,
      num_guests, budget_vnd, interest_notes, internal_notes, assigned_staff, tags
    ) VALUES (
      'Vũ Minh Hoàng', '0912345678', 'hoang.vu@investcorp.vn', 'HOTLINE', 'CONSULTING', 'VIP',
      'pml-onsen-hai-ba-trung', 'room-onsen-suite', '2026-11-20', '2026-11-23',
      2, 18000000, 'Kỷ niệm 10 năm ngày cưới, yêu cầu phòng Onsen Suite riêng tư tầng cao và set setup hoa hồng bồn tắm.',
      'Khách VIP tiềm năng, đã tư vấn set hoa và rượu vang tặng kèm. Đang đợi anh Hoàng chốt ngày giờ check-in.',
      'Nguyễn Thu Thảo (Sales)', ARRAY['VIP', 'Anniversary', 'Onsen Suite']
    ) RETURNING id;
  `
  await sql`
    INSERT INTO lead_interactions (lead_id, staff_name, type, content, created_at)
    VALUES 
    (${lead1.id}, 'Tổng Đài Hotline', 'CALL', 'Khách gọi vào hotline 0789 780 167 hỏi về gói Onsen Suite 3 đêm cho dịp kỷ niệm ngày cưới.', NOW() - INTERVAL '2 days'),
    (${lead1.id}, 'Nguyễn Thu Thảo (Sales)', 'ZALO', 'Đã kết bạn Zalo và gửi menu trải nghiệm Onsen Private kèm album hình phòng thực tế.', NOW() - INTERVAL '1 day'),
    (${lead1.id}, 'Nguyễn Thu Thảo (Sales)', 'STAGE_CHANGE', 'Chuyển trạng thái từ CONTACTED sang CONSULTING: Khách rất ưng ý gói trải nghiệm, phản hồi tích cực.', NOW() - INTERVAL '12 hours');
  `

  // Sample Lead 2: AI Chatbot - PML Central Park
  const [lead2] = await sql`
    INSERT INTO leads (
      full_name, phone, email, source, stage, priority,
      branch_id, room_type_id, estimated_check_in, estimated_check_out,
      num_guests, budget_vnd, interest_notes, internal_notes, assigned_staff, tags
    ) VALUES (
      'Trần Thị Mai Phương', '0987654321', 'phuong.tran@gmail.com', 'AI_CHATBOT', 'NEW', 'MEDIUM',
      'pml-central-park', 'room-studio-longstay', '2026-12-01', '2026-12-15',
      1, 28000000, 'Khách công tác dài ngày (2 tuần), hỏi AI Concierge về tiện nghi bếp nấu Studio Longstay và chính sách dọn phòng.',
      'Lead tự động thu thập từ AI Chatbot lúc 22:30 tối qua. Cần Sales liên hệ chào giá ưu đãi dài hạn.',
      'Lê Tuấn Anh (Sales)', ARRAY['Longstay', 'Corporate', 'AI Lead']
    ) RETURNING id;
  `
  await sql`
    INSERT INTO lead_interactions (lead_id, staff_name, type, content, created_at)
    VALUES 
    (${lead2.id}, 'PML AI Concierge', 'NOTE', 'Khách tương tác trên Web Chatbot, hỏi về phòng Studio Longstay view Landmark 81 và để lại số điện thoại nhận báo giá dài hạn.', NOW() - INTERVAL '6 hours');
  `

  // Sample Lead 3: Website Form - PML Đông Du
  const [lead3] = await sql`
    INSERT INTO leads (
      full_name, phone, email, source, stage, priority,
      branch_id, room_type_id, estimated_check_in, estimated_check_out,
      num_guests, budget_vnd, interest_notes, internal_notes, assigned_staff, tags
    ) VALUES (
      'David Anderson', '+14155552671', 'david.anderson@california-tech.io', 'WEBSITE', 'PROPOSAL_SENT', 'HIGH',
      'pml-dong-du', 'room-executive-corner', '2026-11-25', '2026-11-30',
      2, 22000000, 'Khách du lịch quốc tế, muốn phòng Executive Corner nhìn ra phố Đông Du và Opera House, cần xe đón sân bay Tân Sơn Nhất.',
      'Đã gửi proposal qua Email gồm giá phòng 5 đêm + dịch vụ đưa đón xe Mercedes riêng.',
      'Nguyễn Thu Thảo (Sales)', ARRAY['International', 'Airport Pickup', 'Executive']
    ) RETURNING id;
  `
  await sql`
    INSERT INTO lead_interactions (lead_id, staff_name, type, content, created_at)
    VALUES 
    (${lead3.id}, 'Website Lead Capture', 'NOTE', 'Khách điền form đăng ký tư vấn trải nghiệm đặc quyền trên Landing Page PML Đông Du.', NOW() - INTERVAL '3 days'),
    (${lead3.id}, 'Nguyễn Thu Thảo (Sales)', 'EMAIL', 'Gửi email tiếng Anh báo giá chi tiết Executive Corner Room kèm ưu đãi miễn phí đưa đón sân bay 1 chiều.', NOW() - INTERVAL '2 days'),
    (${lead3.id}, 'Nguyễn Thu Thảo (Sales)', 'STAGE_CHANGE', 'Chuyển trạng thái sang PROPOSAL_SENT: Đã gửi brochure và báo giá thanh toán quốc tế qua thẻ Stripe/VNPay.', NOW() - INTERVAL '1 day');
  `

  console.log('✓ Successfully seeded sample leads and interactions!')
}

run()
  .then(() => {
    console.log('--- MINI-CRM LEADS MIGRATION COMPLETE ---')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })

