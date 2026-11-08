import { NextResponse } from 'next/server'
import { sendZaloNotification } from '@/lib/zalo-notify'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await sendZaloNotification({
    type: 'ai_chatbot_lead',
    customerName: 'Nguyễn Văn Minh (Khách Thử Nghiệm)',
    customerPhone: '0988123456',
    customerEmail: 'minh.nguyen@example.com',
    branchName: 'PML Onsen Hai Bà Trưng',
    roomTypeName: 'Onsen Signature Suite',
    intentSummary: 'Khách hỏi dịch vụ tắm Onsen và đặt phòng 2 đêm cho gia đình.',
    checkInDate: '2026-11-20',
    checkOutDate: '2026-11-22',
    numGuests: 2,
  })

  return NextResponse.json({
    message: 'Đã bắn thông báo thử nghiệm tới Zalo Webhook!',
    result,
  })
}

