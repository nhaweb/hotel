/**
 * PML Hotel AI Chatbot Anti-Spam & Rate Limiting Engine
 * Bảo vệ AI Concierge khỏi spam, DoS, prompt injection và rác dữ liệu CRM
 */

export interface RateLimitResult {
  allowed: boolean
  reason?: 'burst' | 'rate_limit' | 'session_limit'
  retryAfterSeconds?: number
  message?: string
}

interface ClientTrack {
  timestamps: number[]
  totalRequests: number
  lastRequestTime: number
}

// In-memory sliding window rate limiter
const clientTracker = new Map<string, ClientTrack>()

// Tự động dọn dẹp các session không hoạt động sau 15 phút
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, track] of clientTracker.entries()) {
      if (now - track.lastRequestTime > 15 * 60 * 1000) {
        clientTracker.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

/**
 * Kiểm soát tần suất gửi tin nhắn (Rate Limiting)
 * - Chống burst (tối thiểu 1000ms giữa 2 tin liên tiếp)
 * - Giới hạn tần suất: tối đa 12 tin/phút
 * - Giới hạn phiên: tối đa 50 tin/phiên (tránh bot chạy vô tận)
 */
export function checkRateLimit(clientId: string): RateLimitResult {
  const now = Date.now()
  const track = clientTracker.get(clientId) || {
    timestamps: [],
    totalRequests: 0,
    lastRequestTime: 0,
  }

  // 1. Chống gửi quá dồn dập (Burst protection: < 1000ms)
  if (track.lastRequestTime > 0 && now - track.lastRequestTime < 1000) {
    return {
      allowed: false,
      reason: 'burst',
      retryAfterSeconds: 1,
      message: 'Tin nhắn gửi quá nhanh. Quý khách vui lòng chờ một chút trước khi gửi câu hỏi tiếp theo.',
    }
  }

  // Lọc các mốc thời gian trong vòng 60 giây gần nhất
  track.timestamps = track.timestamps.filter((t) => now - t < 60 * 1000)

  // 2. Giới hạn tần suất: tối đa 12 request/phút
  if (track.timestamps.length >= 12) {
    return {
      allowed: false,
      reason: 'rate_limit',
      retryAfterSeconds: 15,
      message: 'Quý khách đã gửi tin nhắn vượt tần suất cho phép (tối đa 12 tin/phút). Vui lòng thử lại sau giây lát hoặc liên hệ hotline 0789 780 167 để được hỗ trợ ngay.',
    }
  }

  // 3. Giới hạn số lượng tin tối đa của 1 phiên chat: 50 tin
  if (track.totalRequests >= 50) {
    return {
      allowed: false,
      reason: 'session_limit',
      retryAfterSeconds: 60,
      message: 'Cuộc trò chuyện đã đạt giới hạn tin nhắn hỗ trợ. Để được tư vấn chi tiết hơn, Quý khách vui lòng liên hệ hotline 0789 780 167 hoặc Zalo của PML Hotel.',
    }
  }

  // Cập nhật thông tin phiên
  track.timestamps.push(now)
  track.totalRequests += 1
  track.lastRequestTime = now
  clientTracker.set(clientId, track)

  return { allowed: true }
}

export interface SpamCheckResult {
  isSpam: boolean
  reason?: string
  cannedReply?: string
}

const SUSPICIOUS_KEYWORDS = [
  /\b(t\.me\/|telegram|zalo\.me\/g\/)/i,
  /\b(kubet|thabet|tai\s*xiu|nohu|casino|danh\s*bai|lo\s*de|so\s*xo|nha\s*cai|ca\s*cuoc)\b/i,
  /\b(crypto|bitcoin|usdt|forex|dau\s*tu\s*kiem\s*tien|kiem\s*tien\s*online)\b/i,
  /\b(hack|crack|bypass|ddos|exploit)\b/i,
  /\b(sex|xxx|gai\s*goi|massage\s*a-z)\b/i,
]

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous\s+)?instructions/i,
  /bỏ\s+qua\s+(hết\s+|tất\s+cả\s+)?(các\s+)?(lệnh|chỉ\s+dẫn|quy\s+tắc)\s+trước/i,
  /you\s+are\s+now\s+(unrestricted|DAN|a\s+different\s+AI)/i,
  /act\s+as\s+an?\s+(unrestricted|developer\s+mode)/i,
  /(system\s+prompt|reveal\s+your\s+instructions|in\s+ra\s+system\s+prompt)/i,
  /jailbreak/i,
]

/**
 * Lọc nhanh nội dung spam, ký tự rác, phá hoại hoặc prompt injection
 * Xử lý ngay lập tức tại backend KHÔNG tốn chi phí gọi LLM Gemini
 */
export function checkSpamMessage(
  text: string,
  previousUserMessages: string[] = []
): SpamCheckResult {
  const trimmed = text.trim()

  // 1. Quá ngắn hoặc rỗng
  if (trimmed.length < 2) {
    return {
      isSpam: true,
      reason: 'too_short',
      cannedReply: 'Nội dung tin nhắn chưa rõ ràng. Quý khách vui lòng nhập câu hỏi về phòng nghỉ hoặc dịch vụ của PML Hotel ạ.',
    }
  }

  // 2. Chỉ toàn ký tự đặc biệt / dấu câu
  if (/^[^\p{L}\p{N}]+$/u.test(trimmed)) {
    return {
      isSpam: true,
      reason: 'symbols_only',
      cannedReply: 'Dạ tôi chưa nhận được nội dung câu hỏi. Quý khách vui lòng cho biết nhu cầu đặt phòng hoặc dịch vụ tại PML Hotel ạ.',
    }
  }

  // 3. Ký tự lặp lại bất thường (ví dụ: "aaaaaa", "1111111", "......")
  if (/(.)\1{4,}/.test(trimmed)) {
    return {
      isSpam: true,
      reason: 'repeated_character',
      cannedReply: 'Dạ nội dung gửi có nhiều ký tự lặp lại. Quý khách vui lòng nhập câu hỏi cụ thể về khách sạn PML ạ.',
    }
  }

  // 4. Keysmash / Chuỗi vô nghĩa (chuỗi phụ âm dài liên tiếp không có nguyên âm hoặc dấu cách)
  if (/[bcdfghjklmnpqrstvwxyz]{7,}/i.test(trimmed.toLowerCase())) {
    return {
      isSpam: true,
      reason: 'keysmash',
      cannedReply: 'Dạ nội dung chưa rõ nghĩa. Quý khách vui lòng nhập lại câu hỏi về dịch vụ hoặc phòng nghỉ tại PML Hotel ạ.',
    }
  }

  // 5. Chặn đường link ngoài / Quảng cáo / Phishing
  const hasExternalUrl = /https?:\/\/(?!pmlhotel\.com|localhost)[^\s]+/i.test(trimmed)
  if (hasExternalUrl) {
    return {
      isSpam: true,
      reason: 'external_link',
      cannedReply: 'PML Hotel không tiếp nhận liên kết ngoài hoặc nội dung quảng cáo qua kênh tư vấn. Quý khách vui lòng chỉ gửi các yêu cầu liên quan đến lưu trú tại khách sạn.',
    }
  }

  // 6. Chặn các từ khóa độc hại, cờ bạc, lừa đảo
  for (const pattern of SUSPICIOUS_KEYWORDS) {
    if (pattern.test(trimmed)) {
      return {
        isSpam: true,
        reason: 'blacklisted_keyword',
        cannedReply: 'Nội dung này không thuộc phạm vi phục vụ của PML Hotel. Tôi chỉ hỗ trợ các thông tin về phòng nghỉ và tiện ích của khách sạn.',
      }
    }
  }

  // 7. Chống Prompt Injection & Jailbreak
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSpam: true,
        reason: 'prompt_injection',
        cannedReply: 'Tôi là trợ lý ảo chính thức của PML Boutique & Lifestyle Hotel và chỉ hỗ trợ thông tin lưu trú của khách sạn. Quý khách cần tìm hiểu hạng phòng hay dịch vụ nào tại PML Hotel ạ?',
      }
    }
  }

  // 8. Chống spam gửi lặp lại nguyên văn câu trước
  if (previousUserMessages.length > 0) {
    const lastMsg = previousUserMessages[previousUserMessages.length - 1]?.trim().toLowerCase()
    if (lastMsg && lastMsg === trimmed.toLowerCase()) {
      return {
        isSpam: true,
        reason: 'duplicate_consecutive',
        cannedReply: 'Dạ câu hỏi này vừa được gửi trước đó. Quý khách có thắc mắc thêm về hạng phòng, giá hoặc cơ sở nào khác của PML Hotel không ạ?',
      }
    }
  }

  return { isSpam: false }
}

/**
 * Kiểm tra số điện thoại di động hợp lệ tại Việt Nam
 * Ngăn chặn tạo rác (junk lead) vào cơ sở dữ liệu CRM của khách sạn
 */
export function isValidVietnamPhone(rawPhone: string): boolean {
  if (!rawPhone) return false
  const clean = rawPhone.replace(/[\s.-]/g, '')

  // Phải gồm đúng 10 chữ số với đầu số di động hợp lệ (03, 05, 07, 08, 09)
  if (!/^0(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/.test(clean)) {
    return false
  }

  // Chặn số toàn ký tự lặp như 0000000000, 0999999999, 0911111111
  if (/(.)\1{6,}/.test(clean)) {
    return false
  }

  // Chặn số giả tạo hiển nhiên
  if (clean === '0000000000' || clean === '0123456789') {
    return false
  }

  return true
}

