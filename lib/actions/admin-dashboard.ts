'use server'

import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import type { DashboardStats, AdminBookingItem, PaymentStatus, PaymentMethod, BookingStatus } from '@/types/admin'

export async function getAdminDashboardStats(
  branchId?: string
): Promise<{ ok: true; stats: DashboardStats } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canAccessOverview) {
      return { ok: false, error: 'Tài khoản không có quyền xem tổng quan tài chính' }
    }

    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : branchId

    const sql = getDb()
    const todayStr = new Date().toISOString().slice(0, 10)

    const branchFilter = effectiveBranchId ? `AND b.branch_id = '${effectiveBranchId.replace(/'/g, "''")}'` : ''
    const unitBranchFilter = effectiveBranchId ? `WHERE ru.branch_id = '${effectiveBranchId.replace(/'/g, "''")}'` : ''

    // 1. Check-ins today
    const checkInsRes = (await sql.query(`
      SELECT COUNT(*)::int AS count 
      FROM bookings b 
      WHERE b.check_in_date = '${todayStr}' AND b.booking_status IN ('confirmed', 'pending') ${branchFilter}
    `)) as { count: number }[]
    const todayCheckIns = checkInsRes[0]?.count ?? 0

    // 2. Check-outs today
    const checkOutsRes = (await sql.query(`
      SELECT COUNT(*)::int AS count 
      FROM bookings b 
      WHERE b.check_out_date = '${todayStr}' AND b.booking_status = 'checked_in' ${branchFilter}
    `)) as { count: number }[]
    const todayCheckOuts = checkOutsRes[0]?.count ?? 0

    // 3. Pending bookings
    const pendingRes = (await sql.query(`
      SELECT COUNT(*)::int AS count 
      FROM bookings b 
      WHERE b.booking_status = 'pending' ${branchFilter}
    `)) as { count: number }[]
    const pendingBookingsCount = pendingRes[0]?.count ?? 0

    // 4. Confirmed bookings
    const confirmedRes = (await sql.query(`
      SELECT COUNT(*)::int AS count 
      FROM bookings b 
      WHERE b.booking_status = 'confirmed' ${branchFilter}
    `)) as { count: number }[]
    const confirmedBookingsCount = confirmedRes[0]?.count ?? 0

    // 5. Total revenue this month
    const revenueRes = (await sql.query(`
      SELECT COALESCE(SUM(b.total_amount_vnd), 0)::numeric AS total 
      FROM bookings b 
      WHERE b.booking_status NOT IN ('cancelled') 
        AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        ${branchFilter}
    `)) as { total: string | number }[]
    const totalRevenueMonthVnd = Number(revenueRes[0]?.total ?? 0)

    // 6. Room unit status breakdown
    const unitBreakdownRes = (await sql.query(`
      SELECT 
        COUNT(*) FILTER (WHERE ru.status = 'AVAILABLE')::int AS available,
        COUNT(*) FILTER (WHERE ru.status = 'OCCUPIED')::int AS occupied,
        COUNT(*) FILTER (WHERE ru.status = 'DIRTY')::int AS dirty,
        COUNT(*) FILTER (WHERE ru.status = 'CLEANING')::int AS cleaning,
        COUNT(*) FILTER (WHERE ru.status = 'MAINTENANCE')::int AS maintenance,
        COUNT(*)::int AS total
      FROM room_units ru
      ${unitBranchFilter}
    `)) as { available: number; occupied: number; dirty: number; cleaning: number; maintenance: number; total: number }[]

    const br = unitBreakdownRes[0] || { available: 0, occupied: 0, dirty: 0, cleaning: 0, maintenance: 0, total: 0 }
    const totalOccupiedRooms = br.occupied
    const totalAvailableRooms = br.available
    const occupancyRatePercent = br.total > 0 ? Math.round((br.occupied / br.total) * 100) : 0

    // 7. Recent 5 bookings
    const recentRes = (await sql.query(`
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
      ${branchId ? `WHERE b.branch_id = '${branchId.replace(/'/g, "''")}'` : ''}
      ORDER BY b.created_at DESC
      LIMIT 5
    `)) as unknown as {
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
    }[]

    const recentBookings: AdminBookingItem[] = recentRes.map((r) => ({
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
      stats: {
        todayCheckIns,
        todayCheckOuts,
        totalOccupiedRooms,
        totalAvailableRooms,
        occupancyRatePercent,
        pendingBookingsCount,
        confirmedBookingsCount,
        totalRevenueMonthVnd,
        recentBookings,
        roomStatusBreakdown: {
          available: br.available,
          occupied: br.occupied,
          dirty: br.dirty,
          cleaning: br.cleaning,
          maintenance: br.maintenance,
        },
      },
    }
  } catch (error) {
    console.error('getAdminDashboardStats Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Database error' }
  }
}

