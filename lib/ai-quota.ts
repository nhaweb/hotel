import { getDb } from '@/lib/db'

const DEFAULT_MONTHLY_LIMIT = 10000

/**
 * Lấy giới hạn số lượng tin nhắn AI mỗi tháng từ cấu hình (mặc định: 10.000 tin/tháng)
 */
export function getMonthlyLimit(): number {
  const envVal = process.env.MONTHLY_AI_MESSAGE_LIMIT
  if (envVal) {
    const parsed = parseInt(envVal, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return DEFAULT_MONTHLY_LIMIT
}

/**
 * Lấy khóa tháng hiện tại theo định dạng YYYY-MM (theo múi giờ Việt Nam GMT+7)
 */
export function getCurrentMonthKey(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
  })
  return formatter.format(now).slice(0, 7) // 'YYYY-MM'
}

let cachedMonthKey = ''
let cachedCount = 0
let lastCacheUpdate = 0
const CACHE_TTL_MS = 15000 // Cache 15s để tối ưu tốc độ đọc

/**
 * Kiểm tra xem số lượng câu hỏi trong tháng hiện tại đã chạm mốc 10.000 tin chưa
 */
export async function checkMonthlyQuota(): Promise<{
  allowed: boolean
  used: number
  limit: number
  monthKey: string
}> {
  const limit = getMonthlyLimit()
  const monthKey = getCurrentMonthKey()
  const now = Date.now()

  // Sử dụng bộ đệm in-memory nếu còn hiệu lực
  if (cachedMonthKey === monthKey && now - lastCacheUpdate < CACHE_TTL_MS) {
    if (cachedCount >= limit) {
      return { allowed: false, used: cachedCount, limit, monthKey }
    }
  }

  try {
    const sql = getDb()
    // Đảm bảo bảng tồn tại trên Neon
    await sql`
      CREATE TABLE IF NOT EXISTS ai_monthly_usage (
        month_key VARCHAR(7) PRIMARY KEY,
        request_count INT NOT NULL DEFAULT 0,
        last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    const rows = (await sql`
      SELECT request_count 
      FROM ai_monthly_usage 
      WHERE month_key = ${monthKey} 
      LIMIT 1;
    `) as { request_count: number }[]

    const used = rows && rows.length > 0 ? Number(rows[0].request_count) || 0 : 0

    cachedMonthKey = monthKey
    cachedCount = used
    lastCacheUpdate = now

    return {
      allowed: used < limit,
      used,
      limit,
      monthKey,
    }
  } catch (err) {
    console.warn('[AI Quota] Lỗi khi đọc hạn mức tháng từ DB, sử dụng cache bộ nhớ:', err)
    return {
      allowed: cachedCount < limit,
      used: cachedCount,
      limit,
      monthKey,
    }
  }
}

/**
 * Tăng số lượng tin nhắn đã phục vụ trong tháng sau khi Gemini phản hồi thành công
 */
export async function incrementMonthlyQuota(): Promise<number> {
  const monthKey = getCurrentMonthKey()
  try {
    const sql = getDb()
    const result = (await sql`
      INSERT INTO ai_monthly_usage (month_key, request_count, last_request_at)
      VALUES (${monthKey}, 1, NOW())
      ON CONFLICT (month_key)
      DO UPDATE SET 
        request_count = ai_monthly_usage.request_count + 1,
        last_request_at = NOW()
      RETURNING request_count;
    `) as { request_count: number }[]

    const count = result && result.length > 0 ? Number(result[0].request_count) || 0 : cachedCount + 1
    cachedMonthKey = monthKey
    cachedCount = count
    lastCacheUpdate = Date.now()
    return count
  } catch (err) {
    console.warn('[AI Quota] Lỗi khi cập nhật bộ đếm tháng trong DB:', err)
    cachedCount += 1
    return cachedCount
  }
}

/**
 * Lấy thông tin thống kê hạn mức phục vụ AI tháng hiện tại cho Admin Dashboard
 */
export async function getMonthlyQuotaStatus(): Promise<{
  monthKey: string
  used: number
  limit: number
  remaining: number
  percentage: number
  isExceeded: boolean
}> {
  const status = await checkMonthlyQuota()
  const remaining = Math.max(0, status.limit - status.used)
  const percentage = Math.min(100, Math.round((status.used / status.limit) * 100))

  return {
    monthKey: status.monthKey,
    used: status.used,
    limit: status.limit,
    remaining,
    percentage,
    isExceeded: !status.allowed,
  }
}

