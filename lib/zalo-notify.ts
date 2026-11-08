import { getDb } from '@/lib/db'
import fs from 'fs'
import path from 'path'

function getZaloWebhookUrl(): string {
  let raw = process.env.ZALO_WEBHOOK_URL || ''
  if (!raw) {
    try {
      const envPath = path.join(process.cwd(), '.env.local')
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        const match = envContent.match(/ZALO_WEBHOOK_URL=(.+)/)
        if (match && match[1]) {
          raw = match[1]
        }
      }
    } catch {}
  }
  return raw.trim().replace(/^["']+|["']+$/g, '')
}

export type ZaloNotificationType =
  | 'ai_chatbot_lead'
  | 'new_booking'
  | 'payment_received'
  | 'consultation_lead'

export interface ZaloNotificationPayload {
  type: ZaloNotificationType
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  branchName?: string | null
  roomTypeName?: string | null
  bookingCode?: string | null
  checkInDate?: string | null
  checkOutDate?: string | null
  nights?: number | null
  numGuests?: number | null
  totalAmountVnd?: number | null
  depositAmountVnd?: number | null
  intentSummary?: string | null
  notes?: string | null
}

function formatVnd(amount?: number | null): string {
  if (amount == null || isNaN(amount)) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

function formatCurrentTime(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
}

/**
 * Định dạng nội dung tin nhắn gửi vào Zalo của Lễ tân
 */
export function buildZaloMessage(data: ZaloNotificationPayload): {
  title: string
  text: string
} {
  const timeStr = formatCurrentTime()
  const cleanPhone = data.customerPhone.replace(/[\s.-]/g, '')
  const phoneTelLink = `tel:${cleanPhone}`

  switch (data.type) {
    case 'ai_chatbot_lead': {
      const title = '🤖 [PML HOTEL] KHÁCH HÀNG ĐỂ LẠI SĐT QUA AI CHATBOT'
      const text = [
        `🛎️ **${title}**`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 **Khách hàng**: ${data.customerName || 'Khách hỏi qua Chatbot'}`,
        `📞 **Số điện thoại**: ${cleanPhone} (Bấm gọi: ${phoneTelLink})`,
        data.customerEmail ? `✉️ **Email**: ${data.customerEmail}` : null,
        data.branchName ? `🏢 **Cơ sở quan tâm**: ${data.branchName}` : null,
        data.roomTypeName ? `🛏️ **Hạng phòng**: ${data.roomTypeName}` : null,
        data.checkInDate
          ? `📅 **Dự kiến lưu trú**: ${data.checkInDate}${data.checkOutDate ? ` → ${data.checkOutDate}` : ''}${data.numGuests ? ` (${data.numGuests} khách)` : ''}`
          : null,
        data.intentSummary ? `💬 **Nhu cầu khách**: ${data.intentSummary}` : null,
        `⏰ **Thời gian ghi nhận**: ${timeStr}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👉 **Lễ tân lưu ý**: Vui lòng bấm số gọi tư vấn khách ngay trong vòng 5 phút!`,
      ]
        .filter(Boolean)
        .join('\n')

      return { title, text }
    }

    case 'new_booking': {
      const title = `🎉 [PML HOTEL] ĐƠN ĐẶT PHÒNG MỚI: ${data.bookingCode || ''}`
      const text = [
        `🛎️ **${title}**`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🔖 **Mã đặt phòng**: ${data.bookingCode}`,
        `👤 **Khách hàng**: ${data.customerName}`,
        `📞 **Số điện thoại**: ${cleanPhone} (Bấm gọi: ${phoneTelLink})`,
        data.customerEmail ? `✉️ **Email**: ${data.customerEmail}` : null,
        `🏢 **Cơ sở**: ${data.branchName || 'PML Boutique Hotel'}`,
        `🛏️ **Hạng phòng**: ${data.roomTypeName || 'Phòng tiêu chuẩn'}`,
        `📅 **Lưu trú**: ${data.checkInDate} → ${data.checkOutDate}${data.nights ? ` (${data.nights} đêm)` : ''}`,
        `👥 **Số khách**: ${data.numGuests || 2} người`,
        `💰 **Tổng tiền phòng**: ${formatVnd(data.totalAmountVnd)}`,
        data.depositAmountVnd && data.depositAmountVnd > 0
          ? `💵 **Tiền cọc cần thanh toán (VietQR)**: ${formatVnd(data.depositAmountVnd)} (Đang chờ)`
          : `💵 **Thanh toán**: Tại khách sạn khi nhận phòng`,
        data.notes ? `📝 **Ghi chú đặc biệt**: ${data.notes}` : null,
        `⏰ **Thời gian đặt**: ${timeStr}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👉 **Xem chi tiết PMS**: /admin/bookings?search=${data.bookingCode}`,
      ]
        .filter(Boolean)
        .join('\n')

      return { title, text }
    }

    case 'payment_received': {
      const title = `💰 [PML HOTEL] XÁC NHẬN THANH TOÁN THÀNH CÔNG: ${data.bookingCode || ''}`
      const text = [
        `✅ **${title}**`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🔖 **Mã đặt phòng**: ${data.bookingCode}`,
        `👤 **Khách hàng**: ${data.customerName}`,
        `📞 **Số điện thoại**: ${cleanPhone}`,
        `💵 **Số tiền đã nhận**: ${formatVnd(data.depositAmountVnd || data.totalAmountVnd)}`,
        `💳 **Trạng thái**: ĐÃ NHẬN TIỀN CỌC (Hệ thống tự động khóa phòng giữ chỗ)`,
        `🏢 **Cơ sở**: ${data.branchName || 'PML Boutique Hotel'}`,
        `🛏️ **Hạng phòng**: ${data.roomTypeName || ''}`,
        `📅 **Ngày nhận phòng**: ${data.checkInDate || ''}`,
        `⏰ **Thời gian nhận tiền**: ${timeStr}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👉 **Lễ tân**: Đã xác nhận phòng, sẵn sàng đón tiếp khách chu đáo!`,
      ]
        .filter(Boolean)
        .join('\n')

      return { title, text }
    }

    case 'consultation_lead':
    default: {
      const title = '📋 [PML HOTEL] YÊU CẦU TƯ VẤN MỚI TỪ WEBSITE'
      const text = [
        `🛎️ **${title}**`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 **Khách hàng**: ${data.customerName}`,
        `📞 **Số điện thoại**: ${cleanPhone} (Bấm gọi: ${phoneTelLink})`,
        data.customerEmail ? `✉️ **Email**: ${data.customerEmail}` : null,
        data.branchName ? `🏢 **Cơ sở quan tâm**: ${data.branchName}` : null,
        data.roomTypeName ? `🛏️ **Hạng phòng quan tâm**: ${data.roomTypeName}` : null,
        data.intentSummary ? `💬 **Nội dung yêu cầu**: ${data.intentSummary}` : null,
        `⏰ **Thời gian**: ${timeStr}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👉 **Lễ tân**: Vui lòng liên hệ hỗ trợ khách hàng sớm nhất.`,
      ]
        .filter(Boolean)
        .join('\n')

      return { title, text }
    }
  }
}

/**
 * Bắn Notification tới Zalo của Lễ tân & Ghi nhận Audit Log
 */
export async function sendZaloNotification(data: ZaloNotificationPayload): Promise<{
  ok: boolean
  channel?: 'zalo_webhook' | 'zalo_oa' | 'console_logged'
  webhookConfigured?: boolean
  error?: string
}> {
  const { title, text } = buildZaloMessage(data)
  const webhookUrl = getZaloWebhookUrl()
  const oaAccessToken = process.env.ZALO_OA_ACCESS_TOKEN?.trim()
  const receptionZaloId = process.env.RECEPTION_ZALO_USER_ID?.trim()

  let sentChannel: 'zalo_webhook' | 'zalo_oa' | 'console_logged' = 'console_logged'

  try {
    // 1. Kênh 1: Bắn Webhook vào Nhóm Zalo nội bộ của Lễ tân (Phổ biến & tiện dụng nhất)
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            title,
            data,
            timestamp: Date.now(),
          }),
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          sentChannel = 'zalo_webhook'
        } else {
          console.warn(`[Zalo Notify] Webhook returned status ${res.status}`)
        }
      } catch (err) {
        console.error('[Zalo Notify] Webhook dispatch error:', err)
      }
    }

    // 2. Kênh 2: Gửi tin nhắn qua Zalo Official Account (OA) / ZNS
    if (oaAccessToken && receptionZaloId && sentChannel === 'console_logged') {
      try {
        const res = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            access_token: oaAccessToken,
          },
          body: JSON.stringify({
            recipient: { user_id: receptionZaloId },
            message: { text },
          }),
        })
        const result = await res.json()
        if (result.error === 0) {
          sentChannel = 'zalo_oa'
        } else {
          console.warn('[Zalo Notify] Zalo OA error:', result)
        }
      } catch (err) {
        console.error('[Zalo Notify] Zalo OA dispatch error:', err)
      }
    }

    // 3. Log console trực quan cho môi trường dev / thử nghiệm
    console.log(`\n========================================`)
    console.log(`[ZALO NOTIFICATION DISPATCHED] -> Channel: ${sentChannel}`)
    console.log(text)
    console.log(`========================================\n`)

    // 4. Lưu vết sự kiện vào bảng admin_activity_logs trên Neon Postgres
    try {
      const sql = getDb()
      await sql`
        INSERT INTO admin_activity_logs (
          admin_name,
          action,
          entity_type,
          entity_id,
          details
        ) VALUES (
          'ZALO_NOTIFICATION_SYSTEM',
          ${'ZALO_NOTIFY_' + data.type.toUpperCase()},
          'NOTIFICATION',
          ${data.bookingCode || data.customerPhone},
          ${JSON.stringify({
            channel: sentChannel,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            branchName: data.branchName,
            roomTypeName: data.roomTypeName,
            type: data.type,
          })}
        );
      `
    } catch (dbErr) {
      console.warn('[Zalo Notify] Error logging to admin_activity_logs:', dbErr)
    }

    return { ok: true, channel: sentChannel, webhookConfigured: Boolean(webhookUrl) }
  } catch (err) {
    console.error('[Zalo Notify] Unexpected notification error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error', webhookConfigured: Boolean(webhookUrl) }
  }
}

