import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

function getConnectionString(): string {
  let raw = process.env.DATABASE_URL || ''
  if (!raw) {
    try {
      const envPath = path.join(process.cwd(), '.env.local')
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        const match = envContent.match(/DATABASE_URL=(.+)/)
        if (match && match[1]) {
          raw = match[1]
        }
      }
    } catch {}
  }
  return raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/^postgresql:\/\//, 'postgres://')
    .replace(/([?&])channel_binding=[^&]+(&|$)/, '$1')
    .replace(/[?&]$/, '')
}

let sqlInstance: NeonQueryFunction<false, false> | null = null

export function getDb(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    const connStr = getConnectionString()
    if (!connStr) {
      throw new Error('DATABASE_URL is not configured.')
    }
    sqlInstance = neon(connStr)
  }
  return sqlInstance
}

export default getDb
