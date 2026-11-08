import { NextResponse } from 'next/server'
import { sendZaloNotification } from '@/lib/zalo-notify'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await sendZaloNotification({
    type: 'ai_chatbot_lead',
    customerName: 'Nguyễn Văn Minh (Khách Thử Nghiệm Vercel)',
    customerPhone: '0988123456',
    customerEmail: 'minh.nguyen@example.com',
    branchName: 'PML Onsen Hai Bà Trưng',
    roomTypeName: 'Onsen Signature Suite',
    intentSummary: 'Khách thử nghiệm webhook trên môi trường Vercel production.',
    checkInDate: '2026-11-20',
    checkOutDate: '2026-11-22',
    numGuests: 2,
  })

  return NextResponse.json({
    message:
      result.channel === 'zalo_webhook'
        ? '✅ Đã bắn thông báo thành công tới Webhook!'
        : '⚠️ Chưa bắn được tới Webhook (Kiểm tra lại biến ZALO_WEBHOOK_URL trên Vercel)',
    result,
    envCheck: {
      hasZaloWebhookUrl: Boolean(process.env.ZALO_WEBHOOK_URL),
      zaloWebhookUrlPreview: process.env.ZALO_WEBHOOK_URL
        ? `${process.env.ZALO_WEBHOOK_URL.slice(0, 25)}...`
        : 'NOT_CONFIGURED_OR_NEED_REDEPLOY',
    },
  })
}
