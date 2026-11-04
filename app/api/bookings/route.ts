import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

function generateBookingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let random = ''
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const year = new Date().getFullYear().toString().slice(-2)
  return `PML-${year}${random}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      branchId,
      roomTypeId,
      checkIn,
      checkOut,
      guests = 2,
      rooms = 1,
      name,
      phone,
      email,
      note,
    } = body

    if (!branchId || !checkIn || !checkOut || !name || !phone) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc' }, { status: 400 })
    }

    const sql = getDb()

    // 1. Resolve and validate branch
    const branchCheck = await sql`
      SELECT id FROM branches WHERE id = ${branchId} LIMIT 1;
    `
    const validBranchId = branchCheck[0]?.id || (await sql`SELECT id FROM branches LIMIT 1`)[0]?.id

    // 2. Resolve room_type
    let resolvedRoomTypeId = roomTypeId
    if (resolvedRoomTypeId) {
      const roomCheck = await sql`
        SELECT id, base_price_vnd FROM room_types WHERE id = ${resolvedRoomTypeId} LIMIT 1;
      `
      if (!roomCheck || roomCheck.length === 0) {
        resolvedRoomTypeId = undefined
      }
    }

    if (!resolvedRoomTypeId) {
      const defaultRoom = await sql`
        SELECT id, base_price_vnd FROM room_types 
        WHERE branch_id = ${validBranchId} 
        ORDER BY base_price_vnd ASC 
        LIMIT 1;
      `
      resolvedRoomTypeId = defaultRoom[0]?.id || (await sql`SELECT id FROM room_types LIMIT 1`)[0]?.id
    }

    // 3. Calculate estimated total based on nights
    const roomInfo = await sql`
      SELECT base_price_vnd FROM room_types WHERE id = ${resolvedRoomTypeId};
    `
    const basePrice = Number(roomInfo[0]?.base_price_vnd || 1800000)
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffDays = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = isNaN(basePrice * diffDays * Number(rooms || 1)) ? basePrice : basePrice * diffDays * Number(rooms || 1)

    // 4. Upsert customer
    const existingCustomer = await sql`
      SELECT id FROM customers WHERE phone = ${phone.trim()} LIMIT 1;
    `
    let customerId: string
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id
      await sql`
        UPDATE customers 
        SET full_name = ${name.trim()}, email = ${email?.trim() || null}
        WHERE id = ${customerId};
      `
    } else {
      const newCustomer = await sql`
        INSERT INTO customers (full_name, phone, email)
        VALUES (${name.trim()}, ${phone.trim()}, ${email?.trim() || null})
        RETURNING id;
      `
      customerId = newCustomer[0].id
    }

    // 5. Create booking
    const bookingCode = generateBookingCode()
    const newBooking = await sql`
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
        payment_status,
        booking_status,
        special_requests
      )
      VALUES (
        ${bookingCode},
        ${customerId},
        ${validBranchId},
        ${resolvedRoomTypeId},
        ${checkIn},
        ${checkOut},
        ${Number(guests)},
        ${Number(rooms)},
        ${totalAmount},
        'pending',
        'confirmed',
        ${note || null}
      )
      RETURNING *;
    `

    return NextResponse.json({
      ok: true,
      reference: bookingCode,
      bookingCode,
      booking: newBooking[0],
      message: 'Đặt phòng thành công! Đội ngũ PML sẽ liên hệ trong ít phút.',
    })
  } catch (error) {
    console.error('Booking creation error:', error)
    const errMessage = error instanceof Error ? error.message : 'Lỗi khi lưu đơn đặt phòng vào cơ sở dữ liệu'
    return NextResponse.json({ error: errMessage }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim()
    const phone = searchParams.get('phone')?.trim()

    if (!code && !phone) {
      return NextResponse.json({ error: 'Vui lòng cung cấp mã đặt phòng hoặc số điện thoại' }, { status: 400 })
    }

    const sql = getDb()

    let results
    if (code) {
      results = await sql`
        SELECT 
          b.booking_code,
          b.check_in_date,
          b.check_out_date,
          b.num_guests,
          b.num_rooms,
          b.total_amount_vnd,
          b.booking_status,
          b.payment_status,
          b.special_requests,
          c.full_name,
          c.phone,
          c.email,
          br.name AS branch_name,
          br.address AS branch_address,
          rt.name AS room_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN branches br ON b.branch_id = br.id
        JOIN room_types rt ON b.room_type_id = rt.id
        WHERE UPPER(b.booking_code) = ${code.toUpperCase()}
        LIMIT 1;
      `
    } else {
      results = await sql`
        SELECT 
          b.booking_code,
          b.check_in_date,
          b.check_out_date,
          b.num_guests,
          b.num_rooms,
          b.total_amount_vnd,
          b.booking_status,
          b.payment_status,
          b.special_requests,
          c.full_name,
          c.phone,
          c.email,
          br.name AS branch_name,
          br.address AS branch_address,
          rt.name AS room_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN branches br ON b.branch_id = br.id
        JOIN room_types rt ON b.room_type_id = rt.id
        WHERE c.phone = ${phone}
        ORDER BY b.created_at DESC
        LIMIT 5;
      `
    }

    return NextResponse.json({
      ok: true,
      found: results.length > 0,
      bookings: results,
    })
  } catch (error) {
    console.error('Booking lookup error:', error)
    return NextResponse.json({ error: 'Lỗi khi tra cứu cơ sở dữ liệu' }, { status: 500 })
  }
}

