import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      serviceType = 'onsen',
      branchId = 'pml-thao-dien',
      name,
      phone,
      date,
      timeSlot = '15:00 - 17:00',
      guests = 2,
      notes,
    } = body

    if (!name || !phone || !date) {
      return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và ngày' }, { status: 400 })
    }

    const sql = getDb()

    const result = await sql`
      INSERT INTO amenity_reservations (
        customer_name,
        customer_phone,
        branch_id,
        service_type,
        reservation_date,
        time_slot,
        party_size,
        notes
      )
      VALUES (
        ${name.trim()},
        ${phone.trim()},
        ${branchId},
        ${serviceType},
        ${date},
        ${timeSlot},
        ${Number(guests)},
        ${notes || null}
      )
      RETURNING *;
    `

    return NextResponse.json({
      ok: true,
      reservation: result[0],
      message: 'Đặt chỗ dịch vụ thành công! Đội ngũ PML sẽ liên hệ trong 15 phút.',
    })
  } catch (error) {
    console.error('Amenity reservation error:', error)
    return NextResponse.json({ error: 'Lỗi khi lưu thông tin đặt dịch vụ' }, { status: 500 })
  }
}

