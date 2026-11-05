import { NextResponse } from 'next/server'
import { confirmBookingPayment } from '@/lib/actions/booking-engine'

export const dynamic = 'force-dynamic'

/**
 * Webhook nhận thông báo thanh toán tự động từ Ngân hàng / PayOS / VietQR
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Resolve booking code and amount from multiple common webhook formats (PayOS, SePay, Cashtracking, VietQR)
    let bookingCode: string | null = null
    let amount = 0
    let providerRef = ''

    // Format A: PayOS
    if (body.data?.description || body.data?.orderCode) {
      const desc = String(body.data.description || '')
      const match = desc.match(/PML-[A-Z0-9]+/i)
      bookingCode = match ? match[0].toUpperCase() : null
      amount = Number(body.data.amount || 0)
      providerRef = String(body.data.reference || body.data.transactionDateTime || '')
    }

    // Format B: SePay / Generic Bank Webhook
    if (!bookingCode && (body.content || body.description)) {
      const desc = String(body.content || body.description || '')
      const match = desc.match(/PML-[A-Z0-9]+/i)
      bookingCode = match ? match[0].toUpperCase() : null
      amount = Number(body.transferAmount || body.amount || 0)
      providerRef = String(body.referenceCode || body.transactionId || '')
    }

    // Format C: Direct Sandbox / Simulation API call
    if (!bookingCode && body.bookingCode) {
      bookingCode = String(body.bookingCode).trim().toUpperCase()
      amount = Number(body.amount || body.amountVnd || 0)
      providerRef = String(body.providerRef || 'SANDBOX_TEST')
    }

    if (!bookingCode) {
      return NextResponse.json(
        { ok: false, error: 'Không tìm thấy mã đặt phòng hợp lệ (định dạng PML-XXXX) trong nội dung chuyển khoản' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Số tiền thanh toán phải lớn hơn 0' },
        { status: 400 }
      )
    }

    // 2. Process confirmation
    const result = await confirmBookingPayment({
      bookingCode,
      amountVnd: amount,
      providerRef,
      adminOrSystemName: 'BANK_WEBHOOK',
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      success: true,
      bookingCode: result.bookingCode,
      message: `Đã xác nhận thanh toán thành công cho đơn đặt phòng ${result.bookingCode}`,
    })
  } catch (error) {
    console.error('Payment Webhook Error:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Lỗi xử lý Webhook' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'PML Hotel Payment Webhook Gateway',
    timestamp: new Date().toISOString(),
  })
}

