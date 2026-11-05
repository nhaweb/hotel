'use server'

import { z } from 'zod'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import type {
  AdminLeadItem,
  AdminLeadDetail,
  AdminLeadFilter,
  AdminLeadStats,
  CreateLeadInput,
  UpdateLeadInput,
  ConvertLeadToBookingInput,
  LeadInteraction,
  PaginatedResult,
} from '@/types/admin'

const leadSourceEnum = z.enum([
  'WEBSITE',
  'AI_CHATBOT',
  'HOTLINE',
  'ZALO',
  'FACEBOOK',
  'WALK_IN',
  'REFERRAL',
  'EVENT',
])

const leadStageEnum = z.enum([
  'NEW',
  'CONTACTED',
  'CONSULTING',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'WON_BOOKED',
  'LOST',
])

const leadPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'VIP'])

const leadInteractionTypeEnum = z.enum([
  'CALL',
  'ZALO',
  'EMAIL',
  'NOTE',
  'MEETING',
  'STAGE_CHANGE',
])

const leadFilterSchema = z.object({
  stage: leadStageEnum.or(z.literal('all')).optional(),
  source: leadSourceEnum.or(z.literal('all')).optional(),
  priority: leadPriorityEnum.or(z.literal('all')).optional(),
  branchId: z.string().optional(),
  searchQuery: z.string().optional(),
  assignedStaff: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

const createLeadSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không đúng định dạng').optional().nullable().or(z.literal('')),
  source: leadSourceEnum.default('WEBSITE'),
  priority: leadPriorityEnum.default('MEDIUM'),
  branchId: z.string().optional().nullable(),
  roomTypeId: z.string().optional().nullable(),
  estimatedCheckIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('')),
  estimatedCheckOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('')),
  numGuests: z.number().int().min(1).default(2),
  budgetVnd: z.number().min(0).optional().nullable(),
  interestNotes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  assignedStaff: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
})

const updateLeadSchema = z.object({
  leadId: z.string().uuid('ID Lead không hợp lệ'),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').optional(),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ').optional(),
  email: z.string().email('Email không đúng định dạng').optional().nullable().or(z.literal('')),
  priority: leadPriorityEnum.optional(),
  branchId: z.string().optional().nullable(),
  roomTypeId: z.string().optional().nullable(),
  estimatedCheckIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('')),
  estimatedCheckOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('')),
  numGuests: z.number().int().min(1).optional(),
  budgetVnd: z.number().min(0).optional().nullable(),
  interestNotes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  assignedStaff: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  adminName: z.string().default('Admin Staff'),
})

const updateStageSchema = z.object({
  leadId: z.string().uuid('ID Lead không hợp lệ'),
  stage: leadStageEnum,
  note: z.string().optional(),
  staffName: z.string().default('Sales Staff'),
})

const addInteractionSchema = z.object({
  leadId: z.string().uuid('ID Lead không hợp lệ'),
  type: leadInteractionTypeEnum,
  content: z.string().min(1, 'Nội dung tương tác không được để trống'),
  staffName: z.string().default('Sales Staff'),
})

const convertToBookingSchema = z.object({
  leadId: z.string().uuid('ID Lead không hợp lệ'),
  branchId: z.string().min(1, 'Chi nhánh là bắt buộc'),
  roomTypeId: z.string().min(1, 'Hạng phòng là bắt buộc'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận phòng không hợp lệ'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phòng không hợp lệ'),
  numGuests: z.number().int().min(1).default(2),
  numRooms: z.number().int().min(1).default(1),
  totalAmountVnd: z.number().min(0, 'Tổng tiền không hợp lệ'),
  depositAmountVnd: z.number().min(0).default(0),
  paymentMethod: z.enum(['UNPAID', 'CASH', 'BANK_TRANSFER', 'VNPAY', 'CREDIT_CARD']).default('UNPAID'),
  assignedRoomUnitId: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  adminName: z.string().default('Admin Staff'),
})

interface RawLeadRow {
  id: string
  full_name: string
  phone: string
  email: string | null
  source: string
  stage: string
  priority: string
  branch_id: string | null
  branch_name: string | null
  room_type_id: string | null
  room_type_name: string | null
  estimated_check_in: string | Date | null
  estimated_check_out: string | Date | null
  num_guests: number
  budget_vnd: string | number | null
  interest_notes: string | null
  internal_notes: string | null
  assigned_staff: string | null
  tags: string[] | null
  converted_booking_id: string | null
  converted_booking_code: string | null
  latest_interaction: string | null
  latest_interaction_at: string | Date | null
  created_at: string | Date
  updated_at: string | Date
}

function formatDate(val: string | Date | null | undefined): string | null {
  if (!val) return null
  if (typeof val === 'string') return val.split('T')[0]
  return val.toISOString().split('T')[0]
}

function formatIso(val: string | Date | null | undefined): string {
  if (!val) return new Date().toISOString()
  if (typeof val === 'string') return val
  return val.toISOString()
}

/**
 * 1. Lấy danh sách Leads có phân trang, lọc nâng cao theo CRM pipeline
 */
export async function getAdminLeads(
  rawFilter: AdminLeadFilter = {}
): Promise<{ ok: true; result: PaginatedResult<AdminLeadItem> } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canAccessLeads) {
      return { ok: false, error: 'Tài khoản không có quyền truy cập Leads' }
    }

    const filter = leadFilterSchema.parse(rawFilter)
    const sql = getDb()

    const conditions: string[] = ['1=1']
    const params: unknown[] = []

    // Enforce branch-scoping for non-SuperAdmin staff
    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : filter.branchId

    if (effectiveBranchId) {
      params.push(effectiveBranchId)
      conditions.push(`l.branch_id = $${params.length}`)
    }

    if (filter.stage && filter.stage !== 'all') {
      params.push(filter.stage)
      conditions.push(`l.stage = $${params.length}`)
    }

    if (filter.source && filter.source !== 'all') {
      params.push(filter.source)
      conditions.push(`l.source = $${params.length}`)
    }

    if (filter.priority && filter.priority !== 'all') {
      params.push(filter.priority)
      conditions.push(`l.priority = $${params.length}`)
    }

    if (filter.assignedStaff && filter.assignedStaff.trim()) {
      params.push(`%${filter.assignedStaff.trim()}%`)
      conditions.push(`l.assigned_staff ILIKE $${params.length}`)
    }

    if (filter.searchQuery && filter.searchQuery.trim()) {
      params.push(`%${filter.searchQuery.trim()}%`)
      conditions.push(`(
        l.full_name ILIKE $${params.length} OR 
        l.phone ILIKE $${params.length} OR 
        l.email ILIKE $${params.length} OR
        $${params.length} = ANY(l.tags)
      )`)
    }

    if (filter.startDate) {
      params.push(filter.startDate)
      conditions.push(`l.created_at::date >= $${params.length}::date`)
    }

    if (filter.endDate) {
      params.push(filter.endDate)
      conditions.push(`l.created_at::date <= $${params.length}::date`)
    }

    const whereClause = conditions.join(' AND ')

    // 1. Get total count
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM leads l
      WHERE ${whereClause}
    `
    const countRes = (await sql.query(countQuery, params)) as { total: number }[]
    const total = countRes[0]?.total ?? 0

    // 2. Fetch paginated data with latest interaction
    const offset = (filter.page - 1) * filter.pageSize
    params.push(filter.pageSize)
    const limitPlaceholder = `$${params.length}`
    params.push(offset)
    const offsetPlaceholder = `$${params.length}`

    const dataQuery = `
      SELECT 
        l.id,
        l.full_name,
        l.phone,
        l.email,
        l.source,
        l.stage,
        l.priority,
        l.branch_id,
        b.name AS branch_name,
        l.room_type_id,
        rt.name AS room_type_name,
        l.estimated_check_in,
        l.estimated_check_out,
        l.num_guests,
        l.budget_vnd,
        l.interest_notes,
        l.internal_notes,
        l.assigned_staff,
        l.tags,
        l.converted_booking_id,
        bk.booking_code AS converted_booking_code,
        li.content AS latest_interaction,
        li.created_at AS latest_interaction_at,
        l.created_at,
        l.updated_at
      FROM leads l
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN room_types rt ON l.room_type_id = rt.id
      LEFT JOIN bookings bk ON l.converted_booking_id = bk.id
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM lead_interactions
        WHERE lead_id = l.id
        ORDER BY created_at DESC
        LIMIT 1
      ) li ON true
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `

    const rows = (await sql.query(dataQuery, params)) as RawLeadRow[]

    const data: AdminLeadItem[] = rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      phone: r.phone,
      email: r.email,
      source: r.source as AdminLeadItem['source'],
      stage: r.stage as AdminLeadItem['stage'],
      priority: r.priority as AdminLeadItem['priority'],
      branchId: r.branch_id,
      branchName: r.branch_name,
      roomTypeId: r.room_type_id,
      roomTypeName: r.room_type_name,
      estimatedCheckIn: formatDate(r.estimated_check_in),
      estimatedCheckOut: formatDate(r.estimated_check_out),
      numGuests: r.num_guests,
      budgetVnd: r.budget_vnd ? Number(r.budget_vnd) : null,
      interestNotes: r.interest_notes,
      internalNotes: r.internal_notes,
      assignedStaff: r.assigned_staff,
      tags: r.tags || [],
      convertedBookingId: r.converted_booking_id,
      convertedBookingCode: r.converted_booking_code,
      latestInteraction: r.latest_interaction,
      latestInteractionAt: r.latest_interaction_at ? formatIso(r.latest_interaction_at) : null,
      createdAt: formatIso(r.created_at),
      updatedAt: formatIso(r.updated_at),
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi không xác định khi tải danh sách leads'
    console.error('getAdminLeads error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 2. Lấy thông tin chi tiết một Lead bao gồm toàn bộ lịch sử tương tác chăm sóc (CRM Timeline)
 */
export async function getAdminLeadDetails(
  leadId: string
): Promise<{ ok: true; lead: AdminLeadDetail } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canAccessLeads) {
      return { ok: false, error: 'Tài khoản không có quyền truy cập Leads' }
    }

    const validatedId = z.string().uuid().parse(leadId)
    const sql = getDb()

    const leadRows = (await sql`
      SELECT 
        l.id,
        l.full_name,
        l.phone,
        l.email,
        l.source,
        l.stage,
        l.priority,
        l.branch_id,
        b.name AS branch_name,
        l.room_type_id,
        rt.name AS room_type_name,
        l.estimated_check_in,
        l.estimated_check_out,
        l.num_guests,
        l.budget_vnd,
        l.interest_notes,
        l.internal_notes,
        l.assigned_staff,
        l.tags,
        l.converted_booking_id,
        bk.booking_code AS converted_booking_code,
        l.created_at,
        l.updated_at
      FROM leads l
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN room_types rt ON l.room_type_id = rt.id
      LEFT JOIN bookings bk ON l.converted_booking_id = bk.id
      WHERE l.id = ${validatedId}
      LIMIT 1
    `) as unknown as RawLeadRow[]

    if (!leadRows || leadRows.length === 0) {
      return { ok: false, error: 'Không tìm thấy thông tin Lead' }
    }

    const r = leadRows[0]

    // Fetch all interactions
    interface RawInteractionRow {
      id: string
      lead_id: string
      staff_name: string
      type: string
      content: string
      created_at: string | Date
    }

    const interactionRows = (await sql`
      SELECT id, lead_id, staff_name, type, content, created_at
      FROM lead_interactions
      WHERE lead_id = ${validatedId}
      ORDER BY created_at DESC
    `) as unknown as RawInteractionRow[]

    const interactions: LeadInteraction[] = interactionRows.map((i) => ({
      id: i.id,
      leadId: i.lead_id,
      staffName: i.staff_name,
      type: i.type as LeadInteraction['type'],
      content: i.content,
      createdAt: formatIso(i.created_at),
    }))

    const leadDetail: AdminLeadDetail = {
      id: r.id,
      fullName: r.full_name,
      phone: r.phone,
      email: r.email,
      source: r.source as AdminLeadItem['source'],
      stage: r.stage as AdminLeadItem['stage'],
      priority: r.priority as AdminLeadItem['priority'],
      branchId: r.branch_id,
      branchName: r.branch_name,
      roomTypeId: r.room_type_id,
      roomTypeName: r.room_type_name,
      estimatedCheckIn: formatDate(r.estimated_check_in),
      estimatedCheckOut: formatDate(r.estimated_check_out),
      numGuests: r.num_guests,
      budgetVnd: r.budget_vnd ? Number(r.budget_vnd) : null,
      interestNotes: r.interest_notes,
      internalNotes: r.internal_notes,
      assignedStaff: r.assigned_staff,
      tags: r.tags || [],
      convertedBookingId: r.converted_booking_id,
      convertedBookingCode: r.converted_booking_code,
      latestInteraction: interactions[0]?.content || null,
      latestInteractionAt: interactions[0]?.createdAt || null,
      createdAt: formatIso(r.created_at),
      updatedAt: formatIso(r.updated_at),
      interactions,
    }

    return { ok: true, lead: leadDetail }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi tải chi tiết lead'
    console.error('getAdminLeadDetails error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 3. Tạo mới một Lead (từ Admin hoặc AI Concierge / Form Landing Page)
 */
export async function createLead(
  rawInput: CreateLeadInput
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok) {
      if (!auth.user.permissions.canCreateLead) {
        return { ok: false, error: 'Tài khoản không có quyền tạo Lead' }
      }
      if (auth.user.permissions.isBranchScoped && !rawInput.branchId) {
        rawInput.branchId = auth.user.branchId
      }
      if (!rawInput.assignedStaff) {
        rawInput.assignedStaff = auth.user.fullName
      }
    }

    const input = createLeadSchema.parse(rawInput)
    const sql = getDb()

    const [lead] = (await sql`
      INSERT INTO leads (
        full_name,
        phone,
        email,
        source,
        priority,
        branch_id,
        room_type_id,
        estimated_check_in,
        estimated_check_out,
        num_guests,
        budget_vnd,
        interest_notes,
        internal_notes,
        assigned_staff,
        tags
      ) VALUES (
        ${input.fullName},
        ${input.phone},
        ${input.email || null},
        ${input.source},
        ${input.priority},
        ${input.branchId || null},
        ${input.roomTypeId || null},
        ${input.estimatedCheckIn || null},
        ${input.estimatedCheckOut || null},
        ${input.numGuests},
        ${input.budgetVnd || null},
        ${input.interestNotes || null},
        ${input.internalNotes || null},
        ${input.assignedStaff || null},
        ${input.tags || []}
      )
      RETURNING id;
    `) as { id: string }[]

    if (!lead || !lead.id) {
      return { ok: false, error: 'Không thể tạo hồ sơ Lead' }
    }

    // Auto-record initial interaction
    const initialContent =
      input.source === 'AI_CHATBOT'
        ? 'Khách hàng để lại liên hệ qua trợ lý ảo PML AI Concierge trên website.'
        : `Khách hàng tiềm năng được tiếp nhận từ kênh ${input.source}.`

    await sql`
      INSERT INTO lead_interactions (lead_id, staff_name, type, content)
      VALUES (
        ${lead.id},
        ${input.assignedStaff || 'Hệ thống PML CRM'},
        'NOTE',
        ${initialContent}
      );
    `

    // Log admin activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${input.assignedStaff || 'System'},
          'CREATE_LEAD',
          'LEAD',
          ${lead.id},
          ${JSON.stringify({ fullName: input.fullName, phone: input.phone, source: input.source })}
        );
      `
    } catch {}

    return { ok: true, leadId: lead.id }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi tạo lead mới'
    console.error('createLead error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 4. Cập nhật thông tin Lead (nhu cầu, ngân sách, nhân viên phụ trách, nhãn tags)
 */
export async function updateLead(
  rawInput: UpdateLeadInput
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canUpdateLead) {
      return { ok: false, error: 'Tài khoản không có quyền cập nhật Lead' }
    }

    const input = updateLeadSchema.parse(rawInput)
    const sql = getDb()

    const setClauses: string[] = ['updated_at = NOW()']
    const params: unknown[] = [input.leadId]

    if (input.fullName !== undefined) {
      params.push(input.fullName)
      setClauses.push(`full_name = $${params.length}`)
    }
    if (input.phone !== undefined) {
      params.push(input.phone)
      setClauses.push(`phone = $${params.length}`)
    }
    if (input.email !== undefined) {
      params.push(input.email || null)
      setClauses.push(`email = $${params.length}`)
    }
    if (input.priority !== undefined) {
      params.push(input.priority)
      setClauses.push(`priority = $${params.length}`)
    }
    if (input.branchId !== undefined) {
      params.push(input.branchId || null)
      setClauses.push(`branch_id = $${params.length}`)
    }
    if (input.roomTypeId !== undefined) {
      params.push(input.roomTypeId || null)
      setClauses.push(`room_type_id = $${params.length}`)
    }
    if (input.estimatedCheckIn !== undefined) {
      params.push(input.estimatedCheckIn || null)
      setClauses.push(`estimated_check_in = $${params.length}`)
    }
    if (input.estimatedCheckOut !== undefined) {
      params.push(input.estimatedCheckOut || null)
      setClauses.push(`estimated_check_out = $${params.length}`)
    }
    if (input.numGuests !== undefined) {
      params.push(input.numGuests)
      setClauses.push(`num_guests = $${params.length}`)
    }
    if (input.budgetVnd !== undefined) {
      params.push(input.budgetVnd || null)
      setClauses.push(`budget_vnd = $${params.length}`)
    }
    if (input.interestNotes !== undefined) {
      params.push(input.interestNotes || null)
      setClauses.push(`interest_notes = $${params.length}`)
    }
    if (input.internalNotes !== undefined) {
      params.push(input.internalNotes || null)
      setClauses.push(`internal_notes = $${params.length}`)
    }
    if (input.assignedStaff !== undefined) {
      params.push(input.assignedStaff || null)
      setClauses.push(`assigned_staff = $${params.length}`)
    }
    if (input.tags !== undefined) {
      params.push(input.tags)
      setClauses.push(`tags = $${params.length}`)
    }

    const updateQuery = `
      UPDATE leads
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id;
    `
    const res = (await sql.query(updateQuery, params)) as { id: string }[]

    if (!res || res.length === 0) {
      return { ok: false, error: 'Không tìm thấy Lead để cập nhật' }
    }

    // Activity log
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${input.adminName},
          'UPDATE_LEAD',
          'LEAD',
          ${input.leadId},
          ${JSON.stringify({ updatedFields: Object.keys(input) })}
        );
      `
    } catch {}

    return { ok: true, leadId: input.leadId }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi cập nhật lead'
    console.error('updateLead error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 5. Cập nhật Pipeline Stage (Giai đoạn chuyển đổi) & tự động ghi nhận vào Interaction Timeline
 */
export async function updateLeadStage(input: {
  leadId: string
  stage: AdminLeadItem['stage']
  note?: string
  staffName?: string
}): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canUpdateLead) {
      return { ok: false, error: 'Tài khoản không có quyền thay đổi trạng thái Lead' }
    }
    if (auth.ok && !input.staffName) {
      input.staffName = auth.user.fullName
    }

    const validated = updateStageSchema.parse(input)
    const sql = getDb()

    // 1. Get current stage
    const current = (await sql`
      SELECT stage, full_name FROM leads WHERE id = ${validated.leadId} LIMIT 1;
    `) as { stage: string; full_name: string }[]

    if (!current || current.length === 0) {
      return { ok: false, error: 'Không tìm thấy Lead' }
    }

    const oldStage = current[0].stage

    // 2. Update lead stage
    await sql`
      UPDATE leads
      SET stage = ${validated.stage}, updated_at = NOW()
      WHERE id = ${validated.leadId};
    `

    // 3. Insert Stage Change interaction record
    const interactionContent = validated.note
      ? `Chuyển giai đoạn từ [${oldStage}] sang [${validated.stage}]: ${validated.note}`
      : `Chuyển giai đoạn từ [${oldStage}] sang [${validated.stage}].`

    await sql`
      INSERT INTO lead_interactions (lead_id, staff_name, type, content)
      VALUES (
        ${validated.leadId},
        ${validated.staffName},
        'STAGE_CHANGE',
        ${interactionContent}
      );
    `

    // 4. Log admin activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${validated.staffName},
          'UPDATE_LEAD_STAGE',
          'LEAD',
          ${validated.leadId},
          ${JSON.stringify({ from: oldStage, to: validated.stage, note: validated.note })}
        );
      `
    } catch {}

    return { ok: true, leadId: validated.leadId }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi cập nhật giai đoạn lead'
    console.error('updateLeadStage error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 6. Thêm tương tác chăm sóc khách hàng (Ghi chú cuộc gọi, Zalo, Email, Lịch hẹn)
 */
export async function addLeadInteraction(input: {
  leadId: string
  type: LeadInteraction['type']
  content: string
  staffName?: string
}): Promise<{ ok: true; interactionId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canUpdateLead) {
      return { ok: false, error: 'Tài khoản không có quyền thêm tương tác Lead' }
    }
    if (auth.ok && (!input.staffName || input.staffName === 'Sales Staff')) {
      input.staffName = auth.user.fullName
    }

    const validated = addInteractionSchema.parse(input)
    const sql = getDb()

    const [interaction] = (await sql`
      INSERT INTO lead_interactions (lead_id, staff_name, type, content)
      VALUES (
        ${validated.leadId},
        ${validated.staffName},
        ${validated.type},
        ${validated.content}
      )
      RETURNING id;
    `) as { id: string }[]

    // Touch lead updated_at
    await sql`UPDATE leads SET updated_at = NOW() WHERE id = ${validated.leadId};`

    return { ok: true, interactionId: interaction.id }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi thêm tương tác lead'
    console.error('addLeadInteraction error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 7. Chuyển đổi Lead thành Đơn Đặt Phòng Thực Tế (Convert Lead to PMS Booking)
 * - Tự động tạo / gắn Customer vào Neon DB
 * - Tạo Booking với mã đặt phòng PML-XXXX
 * - Cập nhật Lead stage = WON_BOOKED và liên kết converted_booking_id
 * - Tự động ghi chép vào lịch sử tương tác & Audit Log
 */
export async function convertLeadToBooking(
  rawInput: ConvertLeadToBookingInput
): Promise<{ ok: true; bookingId: string; bookingCode: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok) {
      if (!auth.user.permissions.canConvertLead) {
        return { ok: false, error: 'Tài khoản không có quyền chốt đặt phòng' }
      }
      if (auth.user.permissions.isBranchScoped && rawInput.branchId !== auth.user.branchId) {
        return { ok: false, error: 'Bạn chỉ có quyền chốt đặt phòng cho cơ sở được phân công' }
      }
      if (!rawInput.adminName || rawInput.adminName === 'Admin Staff') {
        rawInput.adminName = auth.user.fullName
      }
    }

    const input = convertToBookingSchema.parse(rawInput)
    const sql = getDb()

    // 1. Fetch Lead
    const leadRows = (await sql`
      SELECT id, full_name, phone, email, interest_notes
      FROM leads
      WHERE id = ${input.leadId}
      LIMIT 1;
    `) as { id: string; full_name: string; phone: string; email: string | null; interest_notes: string | null }[]

    if (!leadRows || leadRows.length === 0) {
      return { ok: false, error: 'Không tìm thấy Lead để chuyển đổi' }
    }

    const lead = leadRows[0]

    // 2. Find or create Customer
    let customerId: string | null = null
    const existingCust = (await sql`
      SELECT id FROM customers WHERE phone = ${lead.phone} LIMIT 1;
    `) as { id: string }[]

    if (existingCust && existingCust.length > 0) {
      customerId = existingCust[0].id
    } else {
      const [newCust] = (await sql`
        INSERT INTO customers (full_name, phone, email, notes)
        VALUES (${lead.full_name}, ${lead.phone}, ${lead.email || null}, 'Tạo tự động từ CRM Lead')
        RETURNING id;
      `) as { id: string }[]
      customerId = newCust.id
    }

    // 3. Generate booking code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const bookingCode = `PML-${randomSuffix}`

    const paymentStatus = input.depositAmountVnd && input.depositAmountVnd >= input.totalAmountVnd
      ? 'paid'
      : input.depositAmountVnd && input.depositAmountVnd > 0
      ? 'partial'
      : 'unpaid'

    // 4. Insert booking
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
        assigned_room_unit_id,
        special_requests,
        internal_notes
      ) VALUES (
        ${bookingCode},
        ${customerId},
        ${input.branchId},
        ${input.roomTypeId},
        ${input.checkInDate},
        ${input.checkOutDate},
        ${input.numGuests},
        ${input.numRooms},
        ${input.totalAmountVnd},
        ${input.depositAmountVnd},
        ${paymentStatus},
        ${input.paymentMethod},
        'confirmed',
        ${input.assignedRoomUnitId || null},
        ${input.specialRequests || lead.interest_notes || null},
        ${input.internalNotes || 'Chuyển đổi thành công từ CRM Lead'}
      )
      RETURNING id, booking_code;
    `) as { id: string; booking_code: string }[]

    // 5. Update Lead stage = WON_BOOKED & link converted_booking_id
    await sql`
      UPDATE leads
      SET 
        stage = 'WON_BOOKED',
        converted_booking_id = ${booking.id},
        updated_at = NOW()
      WHERE id = ${input.leadId};
    `

    // 6. Record interaction
    const wonNote = `Chốt đặt phòng thành công! Mã đơn: ${booking.booking_code}, tổng tiền: ${Number(input.totalAmountVnd).toLocaleString('vi-VN')} VND. Hình thức thanh toán: ${input.paymentMethod}.`
    await sql`
      INSERT INTO lead_interactions (lead_id, staff_name, type, content)
      VALUES (
        ${input.leadId},
        ${input.adminName},
        'STAGE_CHANGE',
        ${wonNote}
      );
    `

    // 7. Audit log
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${input.adminName},
          'CONVERT_LEAD_TO_BOOKING',
          'LEAD',
          ${input.leadId},
          ${JSON.stringify({ bookingId: booking.id, bookingCode: booking.booking_code, totalAmountVnd: input.totalAmountVnd })}
        );
      `
    } catch {}

    return { ok: true, bookingId: booking.id, bookingCode: booking.booking_code }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi chuyển đổi lead thành đơn đặt phòng'
    console.error('convertLeadToBooking error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 8. Thống kê KPI CRM (Tỷ lệ chuyển đổi, phân bổ theo nguồn, phễu giai đoạn)
 */
export async function getAdminLeadStats(
  branchId?: string
): Promise<{ ok: true; stats: AdminLeadStats } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canAccessLeads) {
      return { ok: false, error: 'Tài khoản không có quyền xem thống kê Leads' }
    }

    const sql = getDb()

    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : branchId

    const branchFilter = effectiveBranchId ? sql`WHERE branch_id = ${effectiveBranchId}` : sql``

    // 1. Overall stats
    const [overall] = (await sql`
      SELECT 
        COUNT(*)::int AS total_leads,
        COUNT(CASE WHEN stage = 'NEW' THEN 1 END)::int AS new_leads,
        COUNT(CASE WHEN stage IN ('CONTACTED', 'CONSULTING', 'PROPOSAL_SENT', 'NEGOTIATING') THEN 1 END)::int AS consulting_leads,
        COUNT(CASE WHEN stage = 'WON_BOOKED' THEN 1 END)::int AS won_leads,
        COUNT(CASE WHEN stage = 'LOST' THEN 1 END)::int AS lost_leads,
        COALESCE(SUM(CASE WHEN stage != 'LOST' THEN budget_vnd ELSE 0 END), 0)::numeric AS total_potential_revenue
      FROM leads
      ${branchFilter};
    `) as {
      total_leads: number
      new_leads: number
      consulting_leads: number
      won_leads: number
      lost_leads: number
      total_potential_revenue: string | number
    }[]

    const totalLeads = overall?.total_leads || 0
    const wonLeads = overall?.won_leads || 0
    const conversionRatePercent = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    // 2. Stage Breakdown
    const stageRows = (await sql`
      SELECT stage, COUNT(*)::int AS count
      FROM leads
      ${branchFilter}
      GROUP BY stage;
    `) as { stage: string; count: number }[]

    const stageBreakdown: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      CONSULTING: 0,
      PROPOSAL_SENT: 0,
      NEGOTIATING: 0,
      WON_BOOKED: 0,
      LOST: 0,
    }
    for (const r of stageRows) {
      stageBreakdown[r.stage] = r.count
    }

    // 3. Source Breakdown
    const sourceRows = (await sql`
      SELECT source, COUNT(*)::int AS count
      FROM leads
      ${branchFilter}
      GROUP BY source;
    `) as { source: string; count: number }[]

    const sourceBreakdown: Record<string, number> = {}
    for (const r of sourceRows) {
      sourceBreakdown[r.source] = r.count
    }

    // 4. Priority Breakdown
    const priorityRows = (await sql`
      SELECT priority, COUNT(*)::int AS count
      FROM leads
      ${branchFilter}
      GROUP BY priority;
    `) as { priority: string; count: number }[]

    const priorityBreakdown: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      VIP: 0,
    }
    for (const r of priorityRows) {
      priorityBreakdown[r.priority] = r.count
    }

    return {
      ok: true,
      stats: {
        totalLeads,
        newLeadsCount: overall?.new_leads || 0,
        consultingLeadsCount: overall?.consulting_leads || 0,
        wonLeadsCount: wonLeads,
        lostLeadsCount: overall?.lost_leads || 0,
        conversionRatePercent,
        totalPotentialRevenueVnd: Number(overall?.total_potential_revenue || 0),
        stageBreakdown,
        sourceBreakdown,
        priorityBreakdown,
      },
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi tải thống kê CRM leads'
    console.error('getAdminLeadStats error:', err)
    return { ok: false, error: errorMsg }
  }
}

