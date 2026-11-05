'use server'

import { z } from 'zod'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import type {
  AdminBookingItem,
  AdminBookingFilter,
  PaginatedResult,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
} from '@/types/admin'

const bookingFilterSchema = z.object({
  branchId: z.string().optional(),
  bookingStatus: z.enum(['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']).optional(),
  paymentStatus: z.enum(['all', 'pending', 'unpaid', 'partial', 'paid', 'refunded']).optional(),
  searchQuery: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

const updateStatusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']),
  assignedRoomUnitId: z.string().nullable().optional(),
  internalNotes: z.string().optional(),
  adminName: z.string().default('Admin Staff'),
})

const updatePaymentSchema = z.object({
  bookingId: z.string().uuid(),
  paymentStatus: z.enum(['pending', 'unpaid', 'partial', 'paid', 'refunded']),
  paymentMethod: z.enum(['UNPAID', 'CASH', 'BANK_TRANSFER', 'VNPAY', 'CREDIT_CARD']),
  depositAmountVnd: z.number().min(0).default(0),
  adminName: z.string().default('Admin Staff'),
})

export async function getAdminBookings(
  rawFilter: AdminBookingFilter = {}
): Promise<{ ok: true; result: PaginatedResult<AdminBookingItem> } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canAccessBookings) {
      return { ok: false, error: 'Tài khoản không có quyền xem đơn đặt phòng' }
    }

    const filter = bookingFilterSchema.parse(rawFilter)
    const sql = getDb()

    const conditions: string[] = ['1=1']
    const params: unknown[] = []

    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : filter.branchId

    if (effectiveBranchId) {
      params.push(effectiveBranchId)
      conditions.push(`b.branch_id = $${params.length}`)
    }

    if (filter.bookingStatus && filter.bookingStatus !== 'all') {
      params.push(filter.bookingStatus)
      conditions.push(`b.booking_status = $${params.length}`)
    }

    if (filter.paymentStatus && filter.paymentStatus !== 'all') {
      params.push(filter.paymentStatus)
      conditions.push(`b.payment_status = $${params.length}`)
    }

    if (filter.searchQuery && filter.searchQuery.trim()) {
      params.push(`%${filter.searchQuery.trim()}%`)
      conditions.push(`(
        b.booking_code ILIKE $${params.length} OR 
        c.full_name ILIKE $${params.length} OR 
        c.phone ILIKE $${params.length}
      )`)
    }

    if (filter.startDate) {
      params.push(filter.startDate)
      conditions.push(`b.check_in_date >= $${params.length}`)
    }

    if (filter.endDate) {
      params.push(filter.endDate)
      conditions.push(`b.check_out_date <= $${params.length}`)
    }

    const whereClause = conditions.join(' AND ')

    // 1. Get total count
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      WHERE ${whereClause}
    `
    const countRes = (await sql.query(countQuery, params)) as { total: number }[]
    const total = countRes[0]?.total ?? 0

    // 2. Fetch paginated data
    const offset = (filter.page - 1) * filter.pageSize
    params.push(filter.pageSize)
    const limitPlaceholder = `$${params.length}`
    params.push(offset)
    const offsetPlaceholder = `$${params.length}`

    const dataQuery = `
      SELECT 
        b.id,
        b.booking_code,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        b.branch_id,
        br.name AS branch_name,
        b.room_type_id,
        rt.name AS room_type_name,
        b.assigned_room_unit_id,
        ru.room_number,
        TO_CHAR(b.check_in_date, 'YYYY-MM-DD') AS check_in_date,
        TO_CHAR(b.check_out_date, 'YYYY-MM-DD') AS check_out_date,
        b.num_guests,
        b.num_rooms,
        COALESCE(b.total_amount_vnd, 0)::numeric AS total_amount_vnd,
        COALESCE(b.deposit_amount_vnd, 0)::numeric AS deposit_amount_vnd,
        b.payment_status,
        COALESCE(b.payment_method, 'UNPAID') AS payment_method,
        b.booking_status,
        b.special_requests,
        b.internal_notes,
        b.created_at,
        b.updated_at
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN branches br ON b.branch_id = br.id
      JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN room_units ru ON b.assigned_room_unit_id = ru.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `

    interface RawBookingRow {
      id: string
      booking_code: string
      customer_name: string
      customer_phone: string
      customer_email: string | null
      branch_id: string
      branch_name: string
      room_type_id: string
      room_type_name: string
      assigned_room_unit_id: string | null
      room_number: string | null
      check_in_date: string
      check_out_date: string
      num_guests: number
      num_rooms: number
      total_amount_vnd: string | number
      deposit_amount_vnd: string | number
      payment_status: PaymentStatus
      payment_method: PaymentMethod
      booking_status: BookingStatus
      special_requests: string | null
      internal_notes: string | null
      created_at: Date | string
      updated_at: Date | string
    }

    const rows = (await sql.query(dataQuery, params)) as unknown as RawBookingRow[]

    const data: AdminBookingItem[] = rows.map((r) => ({
      id: r.id,
      bookingCode: r.booking_code,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email,
      branchId: r.branch_id,
      branchName: r.branch_name,
      roomTypeId: r.room_type_id,
      roomTypeName: r.room_type_name,
      assignedRoomUnitId: r.assigned_room_unit_id,
      roomNumber: r.room_number,
      checkInDate: r.check_in_date,
      checkOutDate: r.check_out_date,
      numGuests: r.num_guests,
      numRooms: r.num_rooms,
      totalAmountVnd: Number(r.total_amount_vnd),
      depositAmountVnd: Number(r.deposit_amount_vnd),
      paymentStatus: r.payment_status,
      paymentMethod: r.payment_method,
      bookingStatus: r.booking_status,
      specialRequests: r.special_requests,
      internalNotes: r.internal_notes,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))

    return {
      ok: true,
      result: {
        data,
        total,
        page: filter.page,
        pageSize: filter.pageSize,
        totalPages: Math.ceil(total / filter.pageSize) || 1,
      },
    }
  } catch (error) {
    console.error('getAdminBookings Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown database error' }
  }
}

export async function updateBookingStatus(
  input: z.infer<typeof updateStatusSchema>
): Promise<{ ok: true; bookingId: string } | { ok: false; error: string }> {
  try {
    const data = updateStatusSchema.parse(input)
    const sql = getDb()

    // 1. Fetch current booking
    const current = (await sql`
      SELECT id, booking_code, assigned_room_unit_id, booking_status 
      FROM bookings 
      WHERE id = ${data.bookingId}::uuid
    `) as { id: string; booking_code: string; assigned_room_unit_id: string | null; booking_status: string }[]

    if (!current.length) {
      return { ok: false, error: 'Booking not found.' }
    }

    const previousUnitId = current[0].assigned_room_unit_id
    const targetUnitId = data.assignedRoomUnitId !== undefined ? data.assignedRoomUnitId : previousUnitId

    // 2. Perform status-specific room unit transitions
    let actualCheckIn: Date | null = null
    let actualCheckOut: Date | null = null

    if (data.status === 'checked_in') {
      actualCheckIn = new Date()
      if (targetUnitId) {
        await sql`UPDATE room_units SET status = 'OCCUPIED', updated_at = NOW() WHERE id = ${targetUnitId}`
      }
    } else if (data.status === 'checked_out') {
      actualCheckOut = new Date()
      if (targetUnitId) {
        // Mark room as dirty so housekeeping can clean
        await sql`UPDATE room_units SET status = 'DIRTY', updated_at = NOW() WHERE id = ${targetUnitId}`
      }
    } else if (data.status === 'cancelled') {
      if (targetUnitId) {
        await sql`UPDATE room_units SET status = 'AVAILABLE', updated_at = NOW() WHERE id = ${targetUnitId}`
      }
    }

    // 3. Update the booking row
    await sql`
      UPDATE bookings 
      SET 
        booking_status = ${data.status},
        assigned_room_unit_id = ${targetUnitId},
        internal_notes = COALESCE(${data.internalNotes ?? null}, internal_notes),
        actual_check_in_at = COALESCE(${actualCheckIn}, actual_check_in_at),
        actual_check_out_at = COALESCE(${actualCheckOut}, actual_check_out_at),
        updated_at = NOW()
      WHERE id = ${data.bookingId}::uuid
    `

    // 4. Audit logging
    await sql`
      INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
      VALUES (
        ${data.adminName}, 
        ${'UPDATE_STATUS_' + data.status.toUpperCase()}, 
        'BOOKING', 
        ${data.bookingId}, 
        ${JSON.stringify({ 
          fromStatus: current[0].booking_status, 
          toStatus: data.status, 
          roomUnit: targetUnitId,
          bookingCode: current[0].booking_code 
        })}
      )
    `

    return { ok: true, bookingId: data.bookingId }
  } catch (error) {
    console.error('updateBookingStatus Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update status' }
  }
}

export async function updateBookingPayment(
  input: z.infer<typeof updatePaymentSchema>
): Promise<{ ok: true; bookingId: string } | { ok: false; error: string }> {
  try {
    const data = updatePaymentSchema.parse(input)
    const sql = getDb()

    await sql`
      UPDATE bookings 
      SET 
        payment_status = ${data.paymentStatus},
        payment_method = ${data.paymentMethod},
        deposit_amount_vnd = ${data.depositAmountVnd},
        updated_at = NOW()
      WHERE id = ${data.bookingId}::uuid
    `

    await sql`
      INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
      VALUES (
        ${data.adminName}, 
        'UPDATE_PAYMENT', 
        'BOOKING', 
        ${data.bookingId}, 
        ${JSON.stringify({ 
          paymentStatus: data.paymentStatus, 
          paymentMethod: data.paymentMethod,
          deposit: data.depositAmountVnd 
        })}
      )
    `

    return { ok: true, bookingId: data.bookingId }
  } catch (error) {
    console.error('updateBookingPayment Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update payment' }
  }
}

