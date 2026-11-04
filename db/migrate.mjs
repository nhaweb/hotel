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
  console.log('Connecting to Neon Lakebase Postgres...')
  
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8')
  console.log('Executing schema.sql...')
  for (const stmt of splitStatements(schemaSql)) {
    console.log('Running:', stmt.slice(0, 50).replace(/\n/g, ' '))
    await sql.query(stmt)
  }
  console.log('Schema created successfully!')

  const seedSql = fs.readFileSync(path.join(process.cwd(), 'db', 'seed.sql'), 'utf8')
  console.log('Executing seed.sql...')
  for (const stmt of splitStatements(seedSql)) {
    await sql.query(stmt)
  }
  console.log('Seed data inserted successfully!')

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `
  console.log('Tables created in public schema:', tables.map(t => t.table_name))

  const branchCount = await sql`SELECT count(*) FROM branches`
  const roomCount = await sql`SELECT count(*) FROM room_types`
  console.log(`Verified data: ${branchCount[0].count} branches, ${roomCount[0].count} room types.`)
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
