import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

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

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return { hash, salt }
}

async function run() {
  console.log('--- RUNNING ADMIN AUTH & SESSIONS MIGRATION ON NEON ---')

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(64) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      salt VARCHAR(64) NOT NULL,
      full_name VARCHAR(128) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'RECEPTIONIST',
      branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role)`,
    `CREATE TABLE IF NOT EXISTS admin_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      session_token VARCHAR(128) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      ip_address VARCHAR(64),
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)`
  ]

  console.log('1. Executing DDL for admin_users and admin_sessions...')
  for (const stmt of ddlStatements) {
    try {
      await sql.query(stmt)
    } catch (err) {
      console.warn('Notice on statement:', stmt.slice(0, 40), err.message)
    }
  }
  console.log('✓ Tables created successfully!')

  // 2. Check if admin users already exist
  const existingUsers = await sql`SELECT count(*)::int as count FROM admin_users`
  if (existingUsers[0].count > 0) {
    console.log(`admin_users already has ${existingUsers[0].count} users. Skipping seed.`)
    return
  }

  console.log('2. Seeding default Admin accounts...')

  const defaultAccounts = [
    {
      username: 'admin',
      email: 'admin@pmlhotel.com',
      password: 'PmlAdmin@2026',
      fullName: 'Trần Văn Hoàng (Super Admin)',
      role: 'SUPER_ADMIN',
      branchId: null
    },
    {
      username: 'manager_dongdu',
      email: 'manager.dongdu@pmlhotel.com',
      password: 'PmlDongDu@2026',
      fullName: 'Nguyễn Thu Thảo (General Manager)',
      role: 'MANAGER',
      branchId: 'pml-dong-du'
    },
    {
      username: 'reception_onsen',
      email: 'reception.onsen@pmlhotel.com',
      password: 'PmlOnsen@2026',
      fullName: 'Phạm Minh Trang (Front Desk Supervisor)',
      role: 'RECEPTIONIST',
      branchId: 'pml-onsen-hai-ba-trung'
    },
    {
      username: 'housekeeping_cp',
      email: 'hk.centralpark@pmlhotel.com',
      password: 'PmlHousekeeping@2026',
      fullName: 'Lê Tuấn Kiệt (Housekeeping Lead)',
      role: 'HOUSEKEEPING',
      branchId: 'pml-central-park'
    }
  ]

  for (const acc of defaultAccounts) {
    const { hash, salt } = hashPassword(acc.password)
    await sql`
      INSERT INTO admin_users (
        username, email, password_hash, salt, full_name, role, branch_id
      ) VALUES (
        ${acc.username}, ${acc.email}, ${hash}, ${salt}, ${acc.fullName}, ${acc.role}, ${acc.branchId}
      );
    `
    console.log(`  ✓ Created [${acc.role}]: ${acc.username} (${acc.email})`)
  }

  console.log('✓ All default admin accounts seeded successfully!')
}

run()
  .then(() => {
    console.log('--- ADMIN AUTH MIGRATION COMPLETED ---')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })

