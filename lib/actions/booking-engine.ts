'use server'

import { z } from 'zod'
import { getDb } from '@/lib/db'
import { generateVietQrDetails } from '@/lib/vietqr'
import { sendZaloNotification } from '@/lib/zalo-notify'
import type {
  AvailableRoomType,
  CheckAvailabilityInput,
  CreateOnlineBookingInput,
  CreateRoomHoldInput,
  OnlineBookingResult,
  PaymentTransactionRecord,
  RoomHoldResult,
} from '@/types/booking-engine'

const checkAvailabilitySchema = z.object({
  branchId: z.string().min(1, 'Vui lòng chọn cơ sở PML'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận phòng không hợp lệ'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phòng không hợp lệ'),
  guests: z.number().int().min(1).default(2),
  rooms: z.number().int().min(1).default(1),
})

const createRoomHoldSchema = z.object({
  roomTypeId: z.string().min(1),
  branchId: z.string().min(1),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numRooms: z.number().int().min(1).default(1),
  sessionId: z.string().min(1),
})

const createOnlineBookingSchema = z.object({
  branchId: z.string().min(1, 'Vui lòng chọn cơ sở PML'),
  roomTypeId: z.string().min(1, 'Vui lòng chọn hạng phòng'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận phòng không hợp lệ'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phòng không hợp lệ'),
  numGuests: z.number().int().min(1).default(2),
  numRooms: z.number().int().min(1).default(1),
  customerName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  customerPhone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  customerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  specialRequests: z.string().optional().nullable(),
  paymentOption: z.enum(['DEPOSIT_30', 'DEPOSIT_50', 'FULL_PAYMENT', 'PAY_AT_HOTEL']).default('DEPOSIT_30'),
  paymentMethod: z.enum(['VIETQR', 'VNPAY', 'STRIPE', 'CASH', 'BANK_TRANSFER']).default('VIETQR'),
  sessionId: z.string().optional(),
})

function generateOnlineBookingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let random = ''
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `PML-${random}`
}

/**
 * 1. Kiểm tra phòng trống thời gian thực theo Cơ sở & Ngày lưu trú (Chống Overbooking)
 */
export async function checkRoomAvailability(
  rawInput: CheckAvailabilityInput
): Promise<{ ok: true; rooms: AvailableRoomType[]; nights: number } | { ok: false; error: string }> {
  try {
    const data = checkAvailabilitySchema.parse(rawInput)
    const sql = getDb()

    const checkIn = new Date(data.checkInDate)
    checkIn.setHours(0, 0, 0, 0)
    const checkOut = new Date(data.checkOutDate)
    checkOut.setHours(0, 0, 0, 0)

    if (checkOut.getTime() <= checkIn.getTime()) {
      return { ok: false, error: 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm' }
    }

    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))

    // Query room types and compute available rooms dynamically
    interface RawAvailRow {
      id: string
      branch_id: string
      branch_name: string
      name: string
      slug: string
      size_sqm: number
      max_guests: number
      total_inventory: number
      effective_inventory: number
      base_price_vnd: string | number
      description: string | null
      features: string[] | null
      image_url: string | null
      booked_count: number
      held_count: number
    }

    const rows = (await sql`
      SELECT 
        rt.id,
        rt.branch_id,
        br.name AS branch_name,
        rt.name,
        rt.slug,
        rt.size_sqm,
        rt.max_guests,
        rt.total_inventory,
        -- Physical inventory from room_units (excluding maintenance)
        COALESCE((
          SELECT COUNT(*) 
          FROM room_units ru 
          WHERE ru.room_type_id = rt.id 
            AND ru.status != 'MAINTENANCE'
        ), rt.total_inventory)::int AS effective_inventory,
        COALESCE(rt.base_price_vnd, 0)::numeric AS base_price_vnd,
        rt.description,
        rt.features,
        rt.image_url,
        -- Active bookings in this date window (confirmed, checked_in, and pending)
        COALESCE((
          SELECT SUM(b.num_rooms) 
          FROM bookings b 
          WHERE b.room_type_id = rt.id 
            AND b.booking_status IN ('confirmed', 'checked_in', 'pending')
            AND b.check_in_date < ${data.checkOutDate}::date 
            AND b.check_out_date > ${data.checkInDate}::date
        ), 0)::int AS booked_count,
        -- Active unexpired room holds (15-min TTL)
        COALESCE((
          SELECT SUM(rh.num_rooms) 
          FROM room_holds rh 
          WHERE rh.room_type_id = rt.id 
            AND rh.is_released = FALSE 
            AND rh.expires_at > NOW()
            AND rh.check_in_date < ${data.checkOutDate}::date 
            AND rh.check_out_date > ${data.checkInDate}::date
        ), 0)::int AS held_count
      FROM room_types rt
      JOIN branches br ON rt.branch_id = br.id
      WHERE rt.branch_id = ${data.branchId}
      ORDER BY rt.base_price_vnd ASC;
    `) as unknown as RawAvailRow[]

    const rooms: AvailableRoomType[] = rows.map((r) => {
      const basePrice = Number(r.base_price_vnd || 0)
      const totalPrice = basePrice * nights * data.rooms
      const deposit30 = Math.round(totalPrice * 0.3)
      const deposit50 = Math.round(totalPrice * 0.5)
      const effectiveInv = Number(r.effective_inventory ?? r.total_inventory ?? 0)
      const availableCount = Math.max(0, effectiveInv - (r.booked_count + r.held_count))

      return {
        id: r.id,
        branchId: r.branch_id,
        branchName: r.branch_name,
        name: r.name,
        slug: r.slug,
        sizeSqm: r.size_sqm,
        maxGuests: r.max_guests,
        totalInventory: effectiveInv,
        availableRooms: availableCount,
        basePriceVnd: basePrice,
        totalPriceVnd: totalPrice,
        deposit30Vnd: deposit30,
        deposit50Vnd: deposit50,
        features: r.features || [],
        description: r.description,
        imageUrl: r.image_url,
        nights,
      }
    })

    return { ok: true, rooms, nights }
  } catch (error) {
    console.error('checkRoomAvailability error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Lỗi khi kiểm tra phòng trống' }
  }
}

/**
 * 2. Tạo khóa phòng tạm thời 15 phút (Hold Lock) trong lúc khách đang quét QR thanh toán
 */
export async function createRoomHold(
  rawInput: CreateRoomHoldInput
): Promise<{ ok: true; result: RoomHoldResult } | { ok: false; error: string }> {
  try {
    const data = createRoomHoldSchema.parse(rawInput)
    const sql = getDb()

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const [inserted] = (await sql`
      INSERT INTO room_holds (
        room_type_id, branch_id, session_id, num_rooms,
        check_in_date, check_out_date, expires_at
      ) VALUES (
        ${data.roomTypeId},
        ${data.branchId},
        ${data.sessionId},
        ${data.numRooms},
        ${data.checkInDate}::date,
        ${data.checkOutDate}::date,
        ${expiresAt}::timestamptz
      )
      RETURNING id, expires_at, num_rooms;
    `) as { id: string; expires_at: Date; num_rooms: number }[]

    return {
      ok: true,
      result: {
        holdId: inserted.id,
        expiresAt: new Date(inserted.expires_at).toISOString(),
        numRooms: inserted.num_rooms,
      },
    }
  } catch (error) {
    console.error('createRoomHold error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể giữ phòng tạm thời' }
  }
}

/**
 * 3. Tạo Đơn đặt phòng trực tuyến & Khởi tạo mã thanh toán VietQR / Cổng thanh toán
 */
export async function createOnlineBooking(
  rawInput: CreateOnlineBookingInput
): Promise<{ ok: true; result: OnlineBookingResult } | { ok: false; error: string }> {
  try {
    const data = createOnlineBookingSchema.parse(rawInput)
    const sql = getDb()

    // 1. Calculate nights & total
    const checkIn = new Date(data.checkInDate)
    const checkOut = new Date(data.checkOutDate)
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))

    // 2. Fetch room type & branch info
    interface TypeCheck {
      id: string
      name: string
      branch_id: string
      branch_name: string
      base_price_vnd: string | number
      total_inventory: number
    }

    const typeRows = (await sql`
      SELECT 
        rt.id, rt.name, rt.branch_id, br.name AS branch_name,
        COALESCE(rt.base_price_vnd, 0)::numeric AS base_price_vnd,
        rt.total_inventory
      FROM room_types rt
      JOIN branches br ON rt.branch_id = br.id
      WHERE rt.id = ${data.roomTypeId}
      LIMIT 1;
    `) as unknown as TypeCheck[]

    if (!typeRows.length) {
      return { ok: false, error: 'Hạng phòng không tồn tại' }
    }

    const rt = typeRows[0]
    const basePrice = Number(rt.base_price_vnd || 0)
    let totalAmount = basePrice * nights * (data.numRooms || 1)

    // Discount 5% for full prepayment
    if (data.paymentOption === 'FULL_PAYMENT') {
      totalAmount = Math.round(totalAmount * 0.95)
    }

    let depositRequired = 0
    if (data.paymentOption === 'DEPOSIT_30') {
      depositRequired = Math.round(totalAmount * 0.3)
    } else if (data.paymentOption === 'DEPOSIT_50') {
      depositRequired = Math.round(totalAmount * 0.5)
    } else if (data.paymentOption === 'FULL_PAYMENT') {
      depositRequired = totalAmount
    } else {
      // PAY_AT_HOTEL
      depositRequired = 0
    }

    // 2.5. Strict real-time anti-overbooking check
    const [availCheck] = (await sql`
      SELECT 
        COALESCE((
          SELECT COUNT(*) 
          FROM room_units ru 
          WHERE ru.room_type_id = ${rt.id} 
            AND ru.status != 'MAINTENANCE'
        ), ${rt.total_inventory})::int AS total_inv,
        COALESCE((
          SELECT SUM(b.num_rooms) 
          FROM bookings b 
          WHERE b.room_type_id = ${rt.id} 
            AND b.booking_status IN ('confirmed', 'checked_in', 'pending')
            AND b.check_in_date < ${data.checkOutDate}::date 
            AND b.check_out_date > ${data.checkInDate}::date
        ), 0)::int AS booked_count,
        COALESCE((
          SELECT SUM(rh.num_rooms) 
          FROM room_holds rh 
          WHERE rh.room_type_id = ${rt.id} 
            AND rh.is_released = FALSE 
            AND rh.expires_at > NOW()
            AND rh.check_in_date < ${data.checkOutDate}::date 
            AND rh.check_out_date > ${data.checkInDate}::date
            ${data.sessionId ? sql`AND rh.session_id != ${data.sessionId}` : sql``}
        ), 0)::int AS held_count;
    `) as { total_inv: number; booked_count: number; held_count: number }[]

    const remainingRooms = Math.max(0, availCheck.total_inv - (availCheck.booked_count + availCheck.held_count))
    if (remainingRooms < (data.numRooms || 1)) {
      return {
        ok: false,
        error: `Rất tiếc! Hạng phòng "${rt.name}" hiện đã hết phòng cho khoảng thời gian từ ${data.checkInDate} đến ${data.checkOutDate}. Vui lòng chọn ngày lưu trú khác hoặc hạng phòng khác.`,
      }
    }

    // 3. Upsert customer
    const existing = await sql`
      SELECT id FROM customers WHERE phone = ${data.customerPhone.trim()} LIMIT 1;
    `
    let customerId: string
    if (existing.length > 0) {
      customerId = existing[0].id
      await sql`
        UPDATE customers 
        SET 
          full_name = ${data.customerName.trim()},
          email = COALESCE(${data.customerEmail?.trim() || null}, email)
        WHERE id = ${customerId};
      `
    } else {
      const createdCust = await sql`
        INSERT INTO customers (full_name, phone, email)
        VALUES (${data.customerName.trim()}, ${data.customerPhone.trim()}, ${data.customerEmail?.trim() || null})
        RETURNING id;
      `
      customerId = createdCust[0].id
    }

    // 3.5. Idempotency Guard: Check if an identical booking was created by this customer within the last 3 minutes
    const recentDuplicate = (await sql`
      SELECT 
        id, booking_code, total_amount_vnd, check_in_date, check_out_date, created_at
      FROM bookings
      WHERE customer_id = ${customerId}
        AND room_type_id = ${rt.id}
        AND check_in_date = ${data.checkInDate}::date
        AND check_out_date = ${data.checkOutDate}::date
        AND booking_status != 'cancelled'
        AND created_at >= NOW() - INTERVAL '3 minutes'
      ORDER BY created_at DESC
      LIMIT 1;
    `) as { id: string; booking_code: string; total_amount_vnd: string; created_at: Date }[]

    if (recentDuplicate.length > 0) {
      const existingBooking = recentDuplicate[0]
      console.log(
        `[Idempotency] Returning existing recent booking ${existingBooking.booking_code} instead of duplicate.`
      )

      let qrPayment = null
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      if (depositRequired > 0 && (data.paymentMethod === 'VIETQR' || data.paymentMethod === 'BANK_TRANSFER')) {
        qrPayment = generateVietQrDetails({
          bookingCode: existingBooking.booking_code,
          amountVnd: depositRequired,
          expiresInMinutes: 15,
        })
      }

      return {
        ok: true,
        result: {
          bookingId: existingBooking.id,
          bookingCode: existingBooking.booking_code,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          branchName: rt.branch_name,
          roomTypeName: rt.name,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          nights,
          numGuests: data.numGuests || 2,
          numRooms: data.numRooms || 1,
          totalAmountVnd: Number(existingBooking.total_amount_vnd || totalAmount),
          depositRequiredVnd: depositRequired,
          paymentOption: data.paymentOption,
          paymentMethod: data.paymentMethod,
          bookingStatus: data.paymentOption === 'PAY_AT_HOTEL' ? 'pending' : 'confirmed',
          paymentStatus: 'pending',
          qrPayment,
          expiresAt,
        },
      }
    }

    // 4. Generate unique Booking Code
    const bookingCode = generateOnlineBookingCode()
    const bookingStatus = data.paymentOption === 'PAY_AT_HOTEL' ? 'pending' : 'confirmed'
    const paymentStatus = 'pending'

    // 5. Insert booking
    const [booking] = (await sql`
      INSERT INTO bookings (
        booking_code,
        customer_id,
        branch_id,
        room_type_id,
        check_in_date,
        check_out_date,
        num_guests,
        num_rooms,
        total_amount_vnd,
        deposit_amount_vnd,
        payment_status,
        payment_method,
        booking_status,
        special_requests
      ) VALUES (
        ${bookingCode},
        ${customerId},
        ${rt.branch_id},
        ${rt.id},
        ${data.checkInDate}::date,
        ${data.checkOutDate}::date,
        ${data.numGuests || 2},
        ${data.numRooms || 1},
        ${totalAmount},
        0, -- actual deposit received starts at 0 until paid
        ${paymentStatus},
        ${data.paymentMethod},
        ${bookingStatus},
        ${data.specialRequests || null}
      )
      RETURNING id;
    `) as { id: string }[]

    // 6. Generate VietQR payment details if applicable
    let qrPayment = null
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    if (depositRequired > 0 && (data.paymentMethod === 'VIETQR' || data.paymentMethod === 'BANK_TRANSFER')) {
      const txCode = `TX-${bookingCode}-${Date.now().toString().slice(-4)}`

      // Record transaction
      await sql`
        INSERT INTO payments (
          booking_id,
          transaction_code,
          payment_method,
          payment_type,
          amount_vnd,
          status
        ) VALUES (
          ${booking.id}::uuid,
          ${txCode},
          ${data.paymentMethod},
          ${data.paymentOption === 'FULL_PAYMENT' ? 'FULL' : 'DEPOSIT'},
          ${depositRequired},
          'PENDING'
        );
      `

      qrPayment = generateVietQrDetails({
        bookingCode,
        amountVnd: depositRequired,
        expiresInMinutes: 15,
      })
    }

    // 7. Release hold if session provided
    if (data.sessionId) {
      try {
        await sql`
          UPDATE room_holds 
          SET is_released = TRUE 
          WHERE session_id = ${data.sessionId} AND room_type_id = ${rt.id};
        `
      } catch {}
    }

    // 8. Auto-sync to Mini-CRM Leads as WON_BOOKED
    try {
      await sql`
        INSERT INTO leads (
          full_name, phone, email, source, stage, priority,
          branch_id, room_type_id, estimated_check_in, estimated_check_out,
          num_guests, budget_vnd, interest_notes, converted_booking_id
        ) VALUES (
          ${data.customerName.trim()},
          ${data.customerPhone.trim()},
          ${data.customerEmail?.trim() || null},
          'WEBSITE',
          'WON_BOOKED',
          'VIP',
          ${rt.branch_id},
          ${rt.id},
          ${data.checkInDate}::date,
          ${data.checkOutDate}::date,
          ${data.numGuests || 2},
          ${totalAmount},
          ${`Đặt phòng trực tuyến: ${rt.name} (${nights} đêm). Tùy chọn: ${data.paymentOption}`},
          ${booking.id}::uuid
        );
      `
    } catch (crmErr) {
      console.warn('Mini-CRM auto-sync warning:', crmErr)
    }

    // 🎯 BẮN NOTIFICATION TỚI ZALO LỄ TÂN KHI CÓ ĐƠN ĐẶT PHÒNG MỚI
    await sendZaloNotification({
      type: 'new_booking',
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      branchName: rt.branch_name,
      roomTypeName: rt.name,
      bookingCode,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      nights,
      numGuests: data.numGuests || 2,
      totalAmountVnd: totalAmount,
      depositAmountVnd: depositRequired,
      notes: data.specialRequests || null,
    }).catch((err) => console.warn('[createOnlineBooking] Zalo notification error:', err))

    return {
      ok: true,
      result: {
        bookingId: booking.id,
        bookingCode,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        branchName: rt.branch_name,
        roomTypeName: rt.name,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        nights,
        numGuests: data.numGuests || 2,
        numRooms: data.numRooms || 1,
        totalAmountVnd: totalAmount,
        depositRequiredVnd: depositRequired,
        paymentOption: data.paymentOption,
        paymentMethod: data.paymentMethod,
        bookingStatus,
        paymentStatus,
        qrPayment,
        expiresAt,
      },
    }
  } catch (error) {
    console.error('createOnlineBooking error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể hoàn tất đặt phòng' }
  }
}

/**
 * 4. Kiểm tra trạng thái thanh toán thời gian thực theo mã Booking
 */
export async function checkBookingPaymentStatus(
  bookingCode: string
): Promise<{
  ok: true
  isPaid: boolean
  paymentStatus: string
  bookingStatus: string
  depositAmountVnd: number
  totalAmountVnd: number
} | { ok: false; error: string }> {
  try {
    const sql = getDb()

    interface BookingPayRow {
      booking_status: string
      payment_status: string
      deposit_amount_vnd: string | number
      total_amount_vnd: string | number
    }

    const rows = (await sql`
      SELECT 
        booking_status, payment_status,
        COALESCE(deposit_amount_vnd, 0)::numeric AS deposit_amount_vnd,
        COALESCE(total_amount_vnd, 0)::numeric AS total_amount_vnd
      FROM bookings
      WHERE UPPER(booking_code) = ${bookingCode.trim().toUpperCase()}
      LIMIT 1;
    `) as unknown as BookingPayRow[]

    if (!rows.length) {
      return { ok: false, error: 'Không tìm thấy đơn đặt phòng' }
    }

    const b = rows[0]
    const isPaid = b.payment_status === 'paid' || b.payment_status === 'partial' || Number(b.deposit_amount_vnd) > 0

    return {
      ok: true,
      isPaid,
      paymentStatus: b.payment_status,
      bookingStatus: b.booking_status,
      depositAmountVnd: Number(b.deposit_amount_vnd || 0),
      totalAmountVnd: Number(b.total_amount_vnd || 0),
    }
  } catch (error) {
    console.error('checkBookingPaymentStatus error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Lỗi khi kiểm tra thanh toán' }
  }
}

/**
 * 5. Xác nhận thanh toán thành công (Xử lý khi Webhook ngân hàng bắn về hoặc mô phỏng Sandbox)
 */
export async function confirmBookingPayment(input: {
  bookingCode: string
  amountVnd: number
  providerRef?: string
  adminOrSystemName?: string
}): Promise<{ ok: true; bookingCode: string } | { ok: false; error: string }> {
  try {
    const sql = getDb()

    // 1. Fetch booking
    interface BookingItem {
      id: string
      booking_code: string
      total_amount_vnd: string | number
      deposit_amount_vnd: string | number
      check_in_date: string
      check_out_date: string
      customer_name: string
      customer_phone: string
      branch_name: string
      room_name: string
    }

    const bookings = (await sql`
      SELECT 
        b.id, b.booking_code, b.total_amount_vnd, b.deposit_amount_vnd,
        b.check_in_date, b.check_out_date,
        c.full_name AS customer_name, c.phone AS customer_phone,
        br.name AS branch_name, rt.name AS room_name
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN branches br ON b.branch_id = br.id
      JOIN room_types rt ON b.room_type_id = rt.id
      WHERE UPPER(b.booking_code) = ${input.bookingCode.trim().toUpperCase()}
      LIMIT 1;
    `) as unknown as BookingItem[]

    if (!bookings.length) {
      return { ok: false, error: 'Không tìm thấy mã đặt phòng' }
    }

    const b = bookings[0]
    const totalAmount = Number(b.total_amount_vnd || 0)
    const newDeposit = Number(b.deposit_amount_vnd || 0) + input.amountVnd
    const paymentStatus = newDeposit >= totalAmount && totalAmount > 0 ? 'paid' : 'partial'

    // 2. Update booking
    await sql`
      UPDATE bookings
      SET 
        deposit_amount_vnd = ${newDeposit},
        payment_status = ${paymentStatus},
        booking_status = 'confirmed',
        updated_at = NOW()
      WHERE id = ${b.id}::uuid;
    `

    // 3. Update payment records
    await sql`
      UPDATE payments
      SET 
        status = 'SUCCESS',
        provider_ref = COALESCE(${input.providerRef || null}, provider_ref),
        updated_at = NOW()
      WHERE booking_id = ${b.id}::uuid AND status = 'PENDING';
    `

    // 4. Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${input.adminOrSystemName || 'PAYMENT_WEBHOOK'},
          'PAYMENT_CONFIRMED',
          'BOOKING',
          ${b.id},
          ${JSON.stringify({
            bookingCode: b.booking_code,
            amount: input.amountVnd,
            totalDeposit: newDeposit,
            paymentStatus,
            providerRef: input.providerRef,
          })}
        );
      `
    } catch {}

    // 🎯 BẮN ZALO NOTIFICATION TỚI LỄ TÂN KHI TIỀN CỌC ĐÃ VÀO TÀI KHOẢN
    await sendZaloNotification({
      type: 'payment_received',
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      branchName: b.branch_name,
      roomTypeName: b.room_name,
      bookingCode: b.booking_code,
      checkInDate: b.check_in_date,
      checkOutDate: b.check_out_date,
      totalAmountVnd: totalAmount,
      depositAmountVnd: input.amountVnd,
    }).catch((err) => console.warn('[confirmBookingPayment] Zalo notification error:', err))

    return { ok: true, bookingCode: b.booking_code }
  } catch (error) {
    console.error('confirmBookingPayment error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể xác nhận thanh toán' }
  }
}

