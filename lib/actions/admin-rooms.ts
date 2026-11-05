'use server'

import { z } from 'zod'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import type {
  RoomUnit,
  RoomUnitStatus,
  AdminRoomTypeItem,
  CreateRoomUnitInput,
  UpdateRoomUnitInput,
  CreateRoomTypeInput,
  UpdateRoomTypeInput,
  AdminBranchItem,
} from '@/types/admin'

const updateRoomUnitSchema = z.object({
  roomUnitId: z.string().min(1),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE']),
  notes: z.string().optional(),
  adminName: z.string().default('Housekeeping'),
})

const createRoomUnitSchema = z.object({
  branchId: z.string().min(1, 'Cơ sở là bắt buộc'),
  roomTypeId: z.string().min(1, 'Hạng phòng là bắt buộc'),
  roomNumber: z.string().min(1, 'Số phòng là bắt buộc').max(16),
  floor: z.number().int().min(1, 'Tầng phải từ 1 trở lên').default(1),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE']).default('AVAILABLE'),
  notes: z.string().optional().nullable(),
  adminName: z.string().default('Admin Staff'),
})

const updateFullRoomUnitSchema = z.object({
  roomUnitId: z.string().min(1),
  roomNumber: z.string().min(1).max(16).optional(),
  floor: z.number().int().min(1).optional(),
  roomTypeId: z.string().min(1).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE']).optional(),
  notes: z.string().optional().nullable(),
  adminName: z.string().default('Admin Staff'),
})

const updateRoomTypePriceSchema = z.object({
  roomTypeId: z.string().min(1),
  basePriceVnd: z.number().positive(),
  totalInventory: z.number().int().min(1).optional(),
  adminName: z.string().default('Admin Staff'),
})

const createRoomTypeSchema = z.object({
  id: z.string().optional(),
  branchId: z.string().min(1, 'Cơ sở là bắt buộc'),
  name: z.string().min(2, 'Tên hạng phòng là bắt buộc'),
  slug: z.string().optional(),
  sizeSqm: z.number().int().positive().default(30),
  maxGuests: z.number().int().positive().default(2),
  totalInventory: z.number().int().positive().default(5),
  basePriceVnd: z.number().positive('Giá cơ bản phải lớn hơn 0'),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).default([]),
  adminName: z.string().default('Admin Staff'),
})

const updateRoomTypeSchema = z.object({
  roomTypeId: z.string().min(1),
  name: z.string().min(2).optional(),
  sizeSqm: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  totalInventory: z.number().int().positive().optional(),
  basePriceVnd: z.number().positive().optional(),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).optional(),
  adminName: z.string().default('Admin Staff'),
})

export async function getAdminRoomUnits(
  branchId?: string,
  status?: RoomUnitStatus
): Promise<{ ok: true; units: RoomUnit[] } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    const sql = getDb()

    const conditions: string[] = ['1=1']
    const params: unknown[] = []

    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : branchId

    if (effectiveBranchId) {
      params.push(effectiveBranchId)
      conditions.push(`ru.branch_id = $${params.length}`)
    }

    if (status) {
      params.push(status)
      conditions.push(`ru.status = $${params.length}`)
    }

    const whereClause = conditions.join(' AND ')

    const query = `
      SELECT 
        ru.id,
        ru.branch_id,
        br.name AS branch_name,
        ru.room_type_id,
        rt.name AS room_type_name,
        COALESCE(rt.base_price_vnd, 0)::numeric AS base_price_vnd,
        ru.room_number,
        ru.floor,
        ru.status,
        ru.notes,
        b.booking_id AS current_booking_id,
        b.customer_id AS current_customer_id,
        b.customer_phone AS current_customer_phone,
        b.booking_code AS current_booking_code,
        b.guest_name AS current_guest_name,
        b.check_out_date AS current_check_out,
        b.total_amount_vnd AS current_total_amount_vnd,
        b.deposit_amount_vnd AS current_deposit_amount_vnd,
        b.payment_status AS current_payment_status,
        ru.updated_at
      FROM room_units ru
      JOIN branches br ON ru.branch_id = br.id
      JOIN room_types rt ON ru.room_type_id = rt.id
      LEFT JOIN LATERAL (
        SELECT 
          bk.id AS booking_id,
          c.id AS customer_id,
          c.phone AS customer_phone,
          bk.booking_code,
          c.full_name AS guest_name,
          TO_CHAR(bk.check_out_date, 'YYYY-MM-DD') AS check_out_date,
          bk.booking_status,
          COALESCE(bk.total_amount_vnd, 0)::numeric AS total_amount_vnd,
          COALESCE(bk.deposit_amount_vnd, 0)::numeric AS deposit_amount_vnd,
          COALESCE(bk.payment_status, 'pending') AS payment_status
        FROM bookings bk
        JOIN customers c ON bk.customer_id = c.id
        WHERE bk.assigned_room_unit_id = ru.id
          AND ru.status = 'OCCUPIED'
          AND bk.booking_status = 'checked_in'
          AND bk.check_out_date >= CURRENT_DATE
        ORDER BY bk.check_in_date ASC
        LIMIT 1
      ) b ON true
      WHERE ${whereClause}
      ORDER BY ru.branch_id, ru.floor, ru.room_number;
    `

    interface RawUnitRow {
      id: string
      branch_id: string
      branch_name: string
      room_type_id: string
      room_type_name: string
      base_price_vnd: string | number
      room_number: string
      floor: number
      status: RoomUnitStatus
      notes: string | null
      current_booking_id: string | null
      current_customer_id: string | null
      current_customer_phone: string | null
      current_booking_code: string | null
      current_guest_name: string | null
      current_check_out: string | null
      current_total_amount_vnd: string | number | null
      current_deposit_amount_vnd: string | number | null
      current_payment_status: any
      updated_at: Date | string
    }

    const rows = (await sql.query(query, params)) as unknown as RawUnitRow[]

    const units: RoomUnit[] = rows.map((r) => ({
      id: r.id,
      branchId: r.branch_id,
      branchName: r.branch_name,
      roomTypeId: r.room_type_id,
      roomTypeName: r.room_type_name,
      basePriceVnd: Number(r.base_price_vnd || 0),
      roomNumber: r.room_number,
      floor: r.floor,
      status: r.status,
      notes: r.notes,
      currentBookingId: r.current_booking_id,
      currentCustomerId: r.current_customer_id,
      currentCustomerPhone: r.current_customer_phone,
      currentBookingCode: r.current_booking_code,
      currentGuestName: r.current_guest_name,
      currentCheckOut: r.current_check_out,
      currentTotalAmountVnd: Number(r.current_total_amount_vnd || 0),
      currentDepositAmountVnd: Number(r.current_deposit_amount_vnd || 0),
      currentPaymentStatus: r.current_payment_status || 'pending',
      updatedAt: new Date(r.updated_at).toISOString(),
    }))

    return { ok: true, units }
  } catch (error) {
    console.error('getAdminRoomUnits Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Database error' }
  }
}

export async function updateRoomUnitStatus(
  input: z.infer<typeof updateRoomUnitSchema>
): Promise<{ ok: true; unitId: string } | { ok: false; error: string }> {
  try {
    const data = updateRoomUnitSchema.parse(input)
    const sql = getDb()

    await sql`
      UPDATE room_units 
      SET 
        status = ${data.status},
        notes = COALESCE(${data.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${data.roomUnitId}
    `

    // When status changes away from OCCUPIED, check-out or unlink existing active bookings
    if (data.status === 'AVAILABLE') {
      await sql`
        UPDATE bookings 
        SET 
          booking_status = 'checked_out', 
          actual_check_out_at = COALESCE(actual_check_out_at, NOW()),
          updated_at = NOW() 
        WHERE assigned_room_unit_id = ${data.roomUnitId} 
          AND booking_status = 'checked_in';
      `
      await sql`
        UPDATE bookings 
        SET assigned_room_unit_id = NULL, updated_at = NOW() 
        WHERE assigned_room_unit_id = ${data.roomUnitId} 
          AND booking_status = 'confirmed';
      `
    } else if (data.status === 'DIRTY' || data.status === 'MAINTENANCE' || data.status === 'CLEANING') {
      await sql`
        UPDATE bookings 
        SET 
          booking_status = 'checked_out', 
          actual_check_out_at = COALESCE(actual_check_out_at, NOW()),
          updated_at = NOW() 
        WHERE assigned_room_unit_id = ${data.roomUnitId} 
          AND booking_status = 'checked_in';
      `
    }

    await sql`
      INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
      VALUES (
        ${data.adminName}, 
        'UPDATE_ROOM_STATUS', 
        'ROOM_UNIT', 
        ${data.roomUnitId}, 
        ${JSON.stringify({ newStatus: data.status, notes: data.notes })}
      )
    `

    return { ok: true, unitId: data.roomUnitId }
  } catch (error) {
    console.error('updateRoomUnitStatus Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update room unit' }
  }
}

export async function updateRoomTypePricing(
  input: z.infer<typeof updateRoomTypePriceSchema>
): Promise<{ ok: true; roomTypeId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canUpdateRoomPricing) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền điều chỉnh giá phòng' }
    }

    const data = updateRoomTypePriceSchema.parse(input)
    const sql = getDb()

    if (data.totalInventory !== undefined) {
      await sql`
        UPDATE room_types 
        SET 
          base_price_vnd = ${data.basePriceVnd},
          total_inventory = ${data.totalInventory}
        WHERE id = ${data.roomTypeId}
      `
    } else {
      await sql`
        UPDATE room_types 
        SET base_price_vnd = ${data.basePriceVnd}
        WHERE id = ${data.roomTypeId}
      `
    }

    await sql`
      INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
      VALUES (
        ${data.adminName}, 
        'UPDATE_ROOM_TYPE_PRICING', 
        'ROOM_TYPE', 
        ${data.roomTypeId}, 
        ${JSON.stringify({ price: data.basePriceVnd, inventory: data.totalInventory })}
      )
    `

    return { ok: true, roomTypeId: data.roomTypeId }
  } catch (error) {
    console.error('updateRoomTypePricing Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update pricing' }
  }
}

/**
 * 4. Thêm phòng vật lý mới (Create Room Unit)
 */
export async function createRoomUnit(
  rawInput: CreateRoomUnitInput
): Promise<{ ok: true; unitId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageRooms) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền thêm phòng mới' }
    }
    if (auth.ok && auth.user.permissions.isBranchScoped && rawInput.branchId !== auth.user.branchId) {
      return { ok: false, error: 'Bạn chỉ có quyền tạo phòng cho cơ sở được phân công' }
    }

    const data = createRoomUnitSchema.parse(rawInput)
    const sql = getDb()

    // Check if room number already exists in branch
    const existing = await sql`
      SELECT id FROM room_units 
      WHERE branch_id = ${data.branchId} AND room_number = ${data.roomNumber}
      LIMIT 1;
    `
    if (existing && existing.length > 0) {
      return { ok: false, error: `Phòng số ${data.roomNumber} đã tồn tại tại cơ sở này` }
    }

    // Generate readable id: e.g. pml-dd-203 or pml-branch-num
    const shortBranch = data.branchId.replace('pml-', '').slice(0, 3)
    const unitId = `pml-${shortBranch}-${data.roomNumber.toLowerCase().replace(/\s+/g, '-')}`

    await sql`
      INSERT INTO room_units (id, branch_id, room_type_id, room_number, floor, status, notes)
      VALUES (
        ${unitId},
        ${data.branchId},
        ${data.roomTypeId},
        ${data.roomNumber},
        ${data.floor},
        ${data.status},
        ${data.notes || null}
      );
    `

    // Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${data.adminName},
          'CREATE_ROOM_UNIT',
          'ROOM_UNIT',
          ${unitId},
          ${JSON.stringify({ branchId: data.branchId, roomNumber: data.roomNumber, roomTypeId: data.roomTypeId })}
        );
      `
    } catch {}

    return { ok: true, unitId }
  } catch (error) {
    console.error('createRoomUnit error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể tạo phòng mới' }
  }
}

/**
 * 5. Cập nhật đầy đủ phòng vật lý (Update Room Unit: Số phòng, Tầng, Loại phòng, Trạng thái, Ghi chú)
 */
export async function updateRoomUnit(
  rawInput: UpdateRoomUnitInput
): Promise<{ ok: true; unitId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageRooms) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền cập nhật cấu trúc phòng' }
    }

    const data = updateFullRoomUnitSchema.parse(rawInput)
    const sql = getDb()

    // Fetch existing unit
    const [current] = await sql`
      SELECT id, branch_id, room_number FROM room_units WHERE id = ${data.roomUnitId} LIMIT 1;
    `
    if (!current) {
      return { ok: false, error: 'Không tìm thấy phòng' }
    }

    if (auth.ok && auth.user.permissions.isBranchScoped && current.branch_id !== auth.user.branchId) {
      return { ok: false, error: 'Bạn chỉ có quyền chỉnh sửa phòng thuộc cơ sở được phân công' }
    }

    // Check duplicate room number if changed
    if (data.roomNumber && data.roomNumber !== current.room_number) {
      const duplicate = await sql`
        SELECT id FROM room_units 
        WHERE branch_id = ${current.branch_id} AND room_number = ${data.roomNumber} AND id != ${data.roomUnitId}
        LIMIT 1;
      `
      if (duplicate && duplicate.length > 0) {
        return { ok: false, error: `Số phòng ${data.roomNumber} đã tồn tại tại cơ sở này` }
      }
    }

    const setClauses: string[] = ['updated_at = NOW()']
    const params: unknown[] = [data.roomUnitId]

    if (data.roomNumber !== undefined) {
      params.push(data.roomNumber)
      setClauses.push(`room_number = $${params.length}`)
    }
    if (data.floor !== undefined) {
      params.push(data.floor)
      setClauses.push(`floor = $${params.length}`)
    }
    if (data.roomTypeId !== undefined) {
      params.push(data.roomTypeId)
      setClauses.push(`room_type_id = $${params.length}`)
    }
    if (data.status !== undefined) {
      params.push(data.status)
      setClauses.push(`status = $${params.length}`)
    }
    if (data.notes !== undefined) {
      params.push(data.notes || null)
      setClauses.push(`notes = $${params.length}`)
    }

    const query = `
      UPDATE room_units
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id;
    `
    await sql.query(query, params)

    // When status changes away from OCCUPIED, check-out or unlink existing active bookings
    if (data.status === 'AVAILABLE') {
      await sql`
        UPDATE bookings 
        SET 
          booking_status = 'checked_out', 
          actual_check_out_at = COALESCE(actual_check_out_at, NOW()),
          updated_at = NOW() 
        WHERE assigned_room_unit_id = ${data.roomUnitId} 
          AND booking_status = 'checked_in';
      `
      await sql`
        UPDATE bookings 
        SET assigned_room_unit_id = NULL, updated_at = NOW() 
        WHERE assigned_room_unit_id = ${data.roomUnitId} 
          AND booking_status = 'confirmed';
      `
    } else if (data.status === 'DIRTY' || data.status === 'MAINTENANCE' || data.status === 'CLEANING') {
      await sql`
        UPDATE bookings 
        SET 
          booking_status = 'checked_out', 
          actual_check_out_at = COALESCE(actual_check_out_at, NOW()),
          updated_at = NOW() 
        WHERE assigned_room_unit_id = ${data.roomUnitId} 
          AND booking_status = 'checked_in';
      `
    }

    // Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${data.adminName},
          'UPDATE_ROOM_UNIT',
          'ROOM_UNIT',
          ${data.roomUnitId},
          ${JSON.stringify({ updatedFields: Object.keys(data) })}
        );
      `
    } catch {}

    return { ok: true, unitId: data.roomUnitId }
  } catch (error) {
    console.error('updateRoomUnit error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể cập nhật phòng' }
  }
}

/**
 * 6. Xoá phòng vật lý (Delete Room Unit)
 * - Kiểm tra nếu có đơn đặt phòng đang active (checked_in hoặc confirmed) thì chặn xoá
 */
export async function deleteRoomUnit(
  roomUnitId: string
): Promise<{ ok: true; deletedId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageRooms) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền xoá phòng' }
    }

    const sql = getDb()

    // 1. Fetch room
    const [unit] = await sql`SELECT id, branch_id, room_number FROM room_units WHERE id = ${roomUnitId} LIMIT 1;`
    if (!unit) {
      return { ok: false, error: 'Không tìm thấy phòng' }
    }

    if (auth.ok && auth.user.permissions.isBranchScoped && unit.branch_id !== auth.user.branchId) {
      return { ok: false, error: 'Bạn chỉ có quyền xoá phòng thuộc cơ sở được phân công' }
    }

    // 2. Check active bookings assigned to this room
    const activeBookings = await sql`
      SELECT id, booking_code, booking_status 
      FROM bookings 
      WHERE assigned_room_unit_id = ${roomUnitId}
        AND booking_status IN ('checked_in', 'confirmed')
        AND check_out_date >= CURRENT_DATE
      LIMIT 1;
    `
    if (activeBookings && activeBookings.length > 0) {
      return {
        ok: false,
        error: `Không thể xoá phòng ${unit.room_number} vì đang có đơn đặt phòng hoạt động (${activeBookings[0].booking_code}).`,
      }
    }

    // 3. Clear assigned_room_unit_id on past/cancelled bookings before deleting
    await sql`
      UPDATE bookings 
      SET assigned_room_unit_id = NULL 
      WHERE assigned_room_unit_id = ${roomUnitId};
    `

    // 4. Delete room unit
    await sql`DELETE FROM room_units WHERE id = ${roomUnitId};`

    // Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${auth.ok ? auth.user.fullName : 'Admin Staff'},
          'DELETE_ROOM_UNIT',
          'ROOM_UNIT',
          ${roomUnitId},
          ${JSON.stringify({ roomNumber: unit.room_number, branchId: unit.branch_id })}
        );
      `
    } catch {}

    return { ok: true, deletedId: roomUnitId }
  } catch (error) {
    console.error('deleteRoomUnit error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể xoá phòng' }
  }
}

/**
 * 7. Lấy danh sách toàn bộ Hạng phòng (Room Types) kèm số lượng phòng vật lý thực tế
 */
export async function getAdminRoomTypes(
  branchId?: string
): Promise<{ ok: true; roomTypes: AdminRoomTypeItem[] } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    const sql = getDb()

    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : branchId

    const conditions: string[] = ['1=1']
    const params: unknown[] = []

    if (effectiveBranchId) {
      params.push(effectiveBranchId)
      conditions.push(`rt.branch_id = $${params.length}`)
    }

    const whereClause = conditions.join(' AND ')

    const query = `
      SELECT 
        rt.id,
        rt.branch_id,
        br.name AS branch_name,
        rt.name,
        rt.slug,
        rt.size_sqm,
        rt.max_guests,
        rt.total_inventory,
        COALESCE(rt.base_price_vnd, 0)::numeric AS base_price_vnd,
        rt.description,
        rt.features,
        COUNT(ru.id)::int AS physical_rooms_count
      FROM room_types rt
      JOIN branches br ON rt.branch_id = br.id
      LEFT JOIN room_units ru ON ru.room_type_id = rt.id
      WHERE ${whereClause}
      GROUP BY rt.id, br.name
      ORDER BY rt.branch_id, rt.base_price_vnd ASC;
    `

    interface RawRoomTypeRow {
      id: string
      branch_id: string
      branch_name: string
      name: string
      slug: string
      size_sqm: number
      max_guests: number
      total_inventory: number
      base_price_vnd: string | number
      description: string | null
      features: string[] | null
      physical_rooms_count: number
    }

    const rows = (await sql.query(query, params)) as unknown as RawRoomTypeRow[]

    const roomTypes: AdminRoomTypeItem[] = rows.map((r) => ({
      id: r.id,
      branchId: r.branch_id,
      branchName: r.branch_name,
      name: r.name,
      slug: r.slug,
      sizeSqm: r.size_sqm,
      maxGuests: r.max_guests,
      totalInventory: r.total_inventory,
      basePriceVnd: Number(r.base_price_vnd || 0),
      description: r.description,
      features: r.features || [],
      physicalRoomsCount: r.physical_rooms_count || 0,
    }))

    return { ok: true, roomTypes }
  } catch (error) {
    console.error('getAdminRoomTypes error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Database error' }
  }
}

/**
 * 8. Thêm hạng phòng mới (Create Room Type)
 */
export async function createRoomType(
  rawInput: CreateRoomTypeInput
): Promise<{ ok: true; roomTypeId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageRooms) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền tạo hạng phòng mới' }
    }
    if (auth.ok && auth.user.permissions.isBranchScoped && rawInput.branchId !== auth.user.branchId) {
      return { ok: false, error: 'Bạn chỉ có quyền tạo hạng phòng cho cơ sở được phân công' }
    }

    const data = createRoomTypeSchema.parse(rawInput)
    const sql = getDb()

    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const id = data.id || `room-${slug}`

    await sql`
      INSERT INTO room_types (
        id, branch_id, name, slug, size_sqm, max_guests, total_inventory, base_price_vnd, description, features
      ) VALUES (
        ${id},
        ${data.branchId},
        ${data.name},
        ${slug},
        ${data.sizeSqm},
        ${data.maxGuests},
        ${data.totalInventory},
        ${data.basePriceVnd},
        ${data.description || null},
        ${data.features || []}
      );
    `

    // Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${data.adminName},
          'CREATE_ROOM_TYPE',
          'ROOM_TYPE',
          ${id},
          ${JSON.stringify({ name: data.name, branchId: data.branchId, price: data.basePriceVnd })}
        );
      `
    } catch {}

    return { ok: true, roomTypeId: id }
  } catch (error) {
    console.error('createRoomType error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể tạo hạng phòng mới' }
  }
}

/**
 * 9. Cập nhật hạng phòng (Update Room Type: Tên, Diện tích, Sức chứa, Kho phòng, Giá, Tiện nghi)
 */
export async function updateRoomType(
  rawInput: UpdateRoomTypeInput
): Promise<{ ok: true; roomTypeId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageRooms) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền cập nhật hạng phòng' }
    }

    const data = updateRoomTypeSchema.parse(rawInput)
    const sql = getDb()

    const [current] = await sql`SELECT id, branch_id FROM room_types WHERE id = ${data.roomTypeId} LIMIT 1;`
    if (!current) {
      return { ok: false, error: 'Không tìm thấy hạng phòng' }
    }

    if (auth.ok && auth.user.permissions.isBranchScoped && current.branch_id !== auth.user.branchId) {
      return { ok: false, error: 'Bạn chỉ có quyền sửa hạng phòng thuộc cơ sở được phân công' }
    }

    const setClauses: string[] = []
    const params: unknown[] = [data.roomTypeId]

    if (data.name !== undefined) {
      params.push(data.name)
      setClauses.push(`name = $${params.length}`)
    }
    if (data.sizeSqm !== undefined) {
      params.push(data.sizeSqm)
      setClauses.push(`size_sqm = $${params.length}`)
    }
    if (data.maxGuests !== undefined) {
      params.push(data.maxGuests)
      setClauses.push(`max_guests = $${params.length}`)
    }
    if (data.totalInventory !== undefined) {
      params.push(data.totalInventory)
      setClauses.push(`total_inventory = $${params.length}`)
    }
    if (data.basePriceVnd !== undefined) {
      params.push(data.basePriceVnd)
      setClauses.push(`base_price_vnd = $${params.length}`)
    }
    if (data.description !== undefined) {
      params.push(data.description || null)
      setClauses.push(`description = $${params.length}`)
    }
    if (data.features !== undefined) {
      params.push(data.features)
      setClauses.push(`features = $${params.length}`)
    }

    if (setClauses.length > 0) {
      const query = `
        UPDATE room_types
        SET ${setClauses.join(', ')}
        WHERE id = $1
        RETURNING id;
      `
      await sql.query(query, params)
    }

    // Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${data.adminName},
          'UPDATE_ROOM_TYPE',
          'ROOM_TYPE',
          ${data.roomTypeId},
          ${JSON.stringify({ updatedFields: Object.keys(data) })}
        );
      `
    } catch {}

    return { ok: true, roomTypeId: data.roomTypeId }
  } catch (error) {
    console.error('updateRoomType error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể cập nhật hạng phòng' }
  }
}

/**
 * 10. Xoá hạng phòng (Delete Room Type)
 */
export async function deleteRoomType(
  roomTypeId: string
): Promise<{ ok: true; deletedId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageRooms) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền xoá hạng phòng' }
    }

    const sql = getDb()

    // 1. Fetch room type
    const [rt] = await sql`SELECT id, branch_id, name FROM room_types WHERE id = ${roomTypeId} LIMIT 1;`
    if (!rt) {
      return { ok: false, error: 'Không tìm thấy hạng phòng' }
    }

    if (auth.ok && auth.user.permissions.isBranchScoped && rt.branch_id !== auth.user.branchId) {
      return { ok: false, error: 'Bạn chỉ có quyền xoá hạng phòng thuộc cơ sở được phân công' }
    }

    // 2. Check physical rooms linked
    const linkedUnits = await sql`SELECT count(*)::int AS count FROM room_units WHERE room_type_id = ${roomTypeId};`
    if (linkedUnits[0]?.count > 0) {
      return {
        ok: false,
        error: `Không thể xoá hạng phòng "${rt.name}" vì đang có ${linkedUnits[0].count} phòng vật lý liên kết. Vui lòng chuyển hoặc xoá các phòng trước.`,
      }
    }

    // 3. Check active bookings linked
    const linkedBookings = await sql`
      SELECT count(*)::int AS count FROM bookings 
      WHERE room_type_id = ${roomTypeId} AND booking_status IN ('confirmed', 'checked_in');
    `
    if (linkedBookings[0]?.count > 0) {
      return {
        ok: false,
        error: `Không thể xoá hạng phòng "${rt.name}" vì đang có ${linkedBookings[0].count} đơn đặt phòng hoạt động.`,
      }
    }

    // 4. Delete
    await sql`DELETE FROM room_types WHERE id = ${roomTypeId};`

    // Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${auth.ok ? auth.user.fullName : 'Admin Staff'},
          'DELETE_ROOM_TYPE',
          'ROOM_TYPE',
          ${roomTypeId},
          ${JSON.stringify({ name: rt.name, branchId: rt.branch_id })}
        );
      `
    } catch {}

    return { ok: true, deletedId: roomTypeId }
  } catch (error) {
    console.error('deleteRoomType error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể xoá hạng phòng' }
  }
}

/**
 * 11. Lấy danh sách các chi nhánh PML Hotel
 */
export async function getAdminBranches(): Promise<{ ok: true; branches: AdminBranchItem[] } | { ok: false; error: string }> {
  try {
    const sql = getDb()
    interface RawBranchRow {
      id: string
      name: string
      slug: string
      address: string
    }
    const rows = (await sql`
      SELECT id, name, slug, address
      FROM branches
      ORDER BY name ASC;
    `) as unknown as RawBranchRow[]

    const branches: AdminBranchItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      address: r.address,
    }))

    return { ok: true, branches }
  } catch (error) {
    console.error('getAdminBranches error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể lấy danh sách chi nhánh' }
  }
}

const updateRoomGuestSchema = z.object({
  roomUnitId: z.string().min(1),
  bookingId: z.string().uuid().optional().nullable(),
  guestName: z.string().min(2, 'Tên khách hàng tối thiểu 2 ký tự'),
  guestPhone: z.string().optional().nullable(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD').optional().nullable(),
  depositAmountVnd: z.number().min(0).optional().nullable(),
  adminName: z.string().default('Admin Staff'),
})

const checkInRoomGuestSchema = z.object({
  roomUnitId: z.string().min(1),
  guestName: z.string().min(2, 'Tên khách hàng tối thiểu 2 ký tự'),
  guestPhone: z.string().min(8, 'Số điện thoại không hợp lệ').default('0900000000'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD'),
  depositAmountVnd: z.number().min(0).default(0),
  adminName: z.string().default('Admin Staff'),
})

const checkOutRoomGuestSchema = z.object({
  roomUnitId: z.string().min(1),
  bookingId: z.string().uuid().optional().nullable(),
  adminName: z.string().default('Admin Staff'),
})

/**
 * 12. Cập nhật thông tin khách đang ở (Tên khách, SĐT, Ngày Checkout)
 */
export async function updateRoomGuest(
  input: z.infer<typeof updateRoomGuestSchema>
): Promise<{ ok: true; bookingCode: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    const data = updateRoomGuestSchema.parse(input)
    const sql = getDb()

    // 1. Fetch active booking
    interface BookingCandidate {
      id: string
      booking_code: string
      customer_id: string
      assigned_room_unit_id: string
    }

    let activeBookings: BookingCandidate[] = []

    if (data.bookingId) {
      activeBookings = (await sql`
        SELECT id, booking_code, customer_id, assigned_room_unit_id
        FROM bookings
        WHERE id = ${data.bookingId}::uuid
        LIMIT 1;
      `) as unknown as BookingCandidate[]
    } else {
      activeBookings = (await sql`
        SELECT id, booking_code, customer_id, assigned_room_unit_id
        FROM bookings
        WHERE assigned_room_unit_id = ${data.roomUnitId}
          AND booking_status IN ('checked_in', 'confirmed')
          AND check_out_date >= CURRENT_DATE
        ORDER BY CASE WHEN booking_status = 'checked_in' THEN 0 ELSE 1 END, check_in_date ASC
        LIMIT 1;
      `) as unknown as BookingCandidate[]
    }

    if (!activeBookings.length) {
      return {
        ok: false,
        error: 'Phòng này hiện chưa có đơn đặt phòng nào đang hoạt động để cập nhật tên khách. Vui lòng bấm "Nhận phòng" để gán khách mới.',
      }
    }

    const currentBooking = activeBookings[0]

    // 2. Update customer full name (and phone if provided)
    if (data.guestPhone && data.guestPhone.trim()) {
      await sql`
        UPDATE customers
        SET 
          full_name = ${data.guestName.trim()},
          phone = ${data.guestPhone.trim()}
        WHERE id = ${currentBooking.customer_id};
      `
    } else {
      await sql`
        UPDATE customers
        SET full_name = ${data.guestName.trim()}
        WHERE id = ${currentBooking.customer_id};
      `
    }

    // 3. Update checkout date & deposit if modified
    if (data.checkOutDate) {
      await sql`
        UPDATE bookings
        SET 
          check_out_date = ${data.checkOutDate}::date,
          updated_at = NOW()
        WHERE id = ${currentBooking.id}::uuid;
      `
    }

    if (data.depositAmountVnd !== undefined && data.depositAmountVnd !== null) {
      await sql`
        UPDATE bookings
        SET 
          deposit_amount_vnd = ${data.depositAmountVnd},
          payment_status = CASE 
            WHEN ${data.depositAmountVnd} >= total_amount_vnd AND total_amount_vnd > 0 THEN 'paid'
            WHEN ${data.depositAmountVnd} > 0 THEN 'partial'
            ELSE 'pending'
          END,
          updated_at = NOW()
        WHERE id = ${currentBooking.id}::uuid;
      `
    }

    // 4. Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${data.adminName || (auth.ok ? auth.user.fullName : 'Admin Staff')},
          'UPDATE_ROOM_GUEST_NAME',
          'BOOKING',
          ${currentBooking.id},
          ${JSON.stringify({
            roomUnitId: data.roomUnitId,
            newGuestName: data.guestName,
            bookingCode: currentBooking.booking_code,
          })}
        );
      `
    } catch {}

    return { ok: true, bookingCode: currentBooking.booking_code }
  } catch (error) {
    console.error('updateRoomGuest error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể cập nhật tên khách' }
  }
}

/**
 * 13. Nhận phòng nhanh trực tiếp từ bảng Phòng (Quick Walk-in Check-in)
 */
export async function checkInRoomGuest(
  input: z.infer<typeof checkInRoomGuestSchema>
): Promise<{ ok: true; bookingCode: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    const data = checkInRoomGuestSchema.parse(input)
    const sql = getDb()

    // 1. Fetch room unit & verify existence
    interface UnitInfo {
      id: string
      branch_id: string
      room_number: string
      room_type_id: string
      base_price_vnd: string | number
      status: RoomUnitStatus
    }

    const units = (await sql`
      SELECT 
        ru.id, ru.branch_id, ru.room_number, ru.room_type_id, ru.status,
        COALESCE(rt.base_price_vnd, 0)::numeric AS base_price_vnd
      FROM room_units ru
      JOIN room_types rt ON ru.room_type_id = rt.id
      WHERE ru.id = ${data.roomUnitId}
      LIMIT 1;
    `) as unknown as UnitInfo[]

    if (!units.length) {
      return { ok: false, error: 'Không tìm thấy phòng vật lý' }
    }

    const unit = units[0]

    // 2. Check if room is already occupied with an active booking
    const active = await sql`
      SELECT id, booking_code FROM bookings
      WHERE assigned_room_unit_id = ${data.roomUnitId}
        AND booking_status = 'checked_in'
        AND check_out_date >= CURRENT_DATE
      LIMIT 1;
    `
    if (active.length > 0) {
      return {
        ok: false,
        error: `Phòng ${unit.room_number} đang có khách ở (${active[0].booking_code}). Vui lòng trả phòng trước khi nhận khách mới.`,
      }
    }

    // 3. Find or create customer
    const existingCust = await sql`
      SELECT id FROM customers WHERE phone = ${data.guestPhone.trim()} LIMIT 1;
    `
    let customerId: string

    if (existingCust.length > 0) {
      customerId = existingCust[0].id
      await sql`
        UPDATE customers 
        SET full_name = ${data.guestName.trim()}
        WHERE id = ${customerId};
      `
    } else {
      const newCust = await sql`
        INSERT INTO customers (full_name, phone)
        VALUES (${data.guestName.trim()}, ${data.guestPhone.trim()})
        RETURNING id;
      `
      customerId = newCust[0].id
    }

    // 4. Calculate total amount
    const checkInDate = new Date()
    checkInDate.setHours(0, 0, 0, 0)
    const checkOutDate = new Date(data.checkOutDate)
    checkOutDate.setHours(0, 0, 0, 0)
    const diffDays = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = diffDays * Number(unit.base_price_vnd || 0)
    const bookingCode = `PML-${Date.now().toString().slice(-4)}`

    // 5. Create booking with status = checked_in
    await sql`
      INSERT INTO bookings (
        booking_code, customer_id, branch_id, room_type_id, assigned_room_unit_id,
        check_in_date, check_out_date, num_guests, num_rooms,
        total_amount_vnd, deposit_amount_vnd, payment_status, payment_method, booking_status,
        actual_check_in_at
      ) VALUES (
        ${bookingCode},
        ${customerId},
        ${unit.branch_id},
        ${unit.room_type_id},
        ${data.roomUnitId},
        CURRENT_DATE,
        ${data.checkOutDate}::date,
        2,
        1,
        ${totalAmount},
        ${data.depositAmountVnd},
        ${data.depositAmountVnd >= totalAmount && totalAmount > 0 ? 'paid' : data.depositAmountVnd > 0 ? 'partial' : 'pending'},
        'CASH',
        'checked_in',
        NOW()
      );
    `

    // 6. Update room unit status to OCCUPIED
    await sql`
      UPDATE room_units
      SET status = 'OCCUPIED', updated_at = NOW()
      WHERE id = ${data.roomUnitId};
    `

    // 7. Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${data.adminName || (auth.ok ? auth.user.fullName : 'Admin Staff')},
          'QUICK_CHECK_IN_ROOM',
          'ROOM_UNIT',
          ${data.roomUnitId},
          ${JSON.stringify({
            roomNumber: unit.room_number,
            bookingCode,
            guestName: data.guestName,
            nights: diffDays,
          })}
        );
      `
    } catch {}

    return { ok: true, bookingCode }
  } catch (error) {
    console.error('checkInRoomGuest error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể thực hiện nhận phòng' }
  }
}

/**
 * 14. Trả phòng nhanh trực tiếp từ bảng Phòng (Quick Check-out)
 */
export async function checkOutRoomGuest(
  input: z.infer<typeof checkOutRoomGuestSchema>
): Promise<{ ok: true; unitId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    const data = checkOutRoomGuestSchema.parse(input)
    const sql = getDb()

    // 1. Find active checked-in booking
    const active = await sql`
      SELECT id, booking_code FROM bookings
      WHERE assigned_room_unit_id = ${data.roomUnitId}
        AND booking_status = 'checked_in'
      LIMIT 1;
    `

    if (active.length > 0) {
      await sql`
        UPDATE bookings
        SET 
          booking_status = 'checked_out',
          actual_check_out_at = NOW(),
          updated_at = NOW()
        WHERE id = ${active[0].id};
      `
    }

    // 2. Mark room unit as DIRTY for housekeeping
    await sql`
      UPDATE room_units
      SET status = 'DIRTY', updated_at = NOW()
      WHERE id = ${data.roomUnitId};
    `

    // 3. Log activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${data.adminName || (auth.ok ? auth.user.fullName : 'Admin Staff')},
          'QUICK_CHECK_OUT_ROOM',
          'ROOM_UNIT',
          ${data.roomUnitId},
          ${JSON.stringify({
            bookingCode: active[0]?.booking_code ?? null,
            newStatus: 'DIRTY',
          })}
        );
      `
    } catch {}

    return { ok: true, unitId: data.roomUnitId }
  } catch (error) {
    console.error('checkOutRoomGuest error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Không thể thực hiện trả phòng' }
  }
}




