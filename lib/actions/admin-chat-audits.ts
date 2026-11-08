'use server'

import { z } from 'zod'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import { branches } from '@/data/branches'
import { rooms } from '@/data/rooms'
import { isValidVietnamPhone } from '@/lib/anti-spam'
import { sendZaloNotification } from '@/lib/zalo-notify'
import type {
  ChatAuditItem,
  ChatAuditFilter,
  ChatMarketingInsights,
  PaginatedResult,
} from '@/types/admin'

const branchMap = new Map(branches.map((b) => [b.id, b.name]))
const roomMap = new Map(rooms.map((r) => [r.id, r.name]))

function normalizeBranchId(raw?: string): string | null {
  if (!raw) return null
  const lower = raw.toLowerCase()
  if (lower.includes('onsen') || lower.includes('hai-ba-trung') || lower.includes('bà trưng')) {
    return 'pml-onsen-hai-ba-trung'
  }
  if (lower.includes('dong-du') || lower.includes('đông du')) {
    return 'pml-dong-du'
  }
  if (lower.includes('central-park') || lower.includes('central') || lower.includes('vinhomes')) {
    return 'pml-central-park'
  }
  if (branchMap.has(raw)) return raw
  return null
}

function normalizeRoomTypeId(raw?: string): string | null {
  if (!raw) return null
  if (roomMap.has(raw)) return raw
  const lower = raw.toLowerCase()
  for (const r of rooms) {
    if (r.id === raw || lower.includes(r.name.toLowerCase()) || lower.includes(r.nameEn.toLowerCase())) {
      return r.id
    }
  }
  return null
}

export interface RecordChatAuditInput {
  sessionId: string
  messages: { role: 'user' | 'assistant'; text: string; at?: number }[]
  customerAudit?: {
    customerName?: string
    phone?: string
    email?: string
    intentSummary?: string
    preferredBranchId?: string
    preferredRoomTypeId?: string
    estimatedDates?: string
    budgetRange?: string
    numGuests?: number
    readinessToBook?: string
    tags?: string[]
  }
  lastUserText: string
}

/**
 * Ghi nhận & phân tích hành vi khách hàng từ AI Concierge Chatbot
 * Tự động tạo / cập nhật Lead CRM khi phát hiện số điện thoại khách hàng
 */
export async function recordChatAudit(input: RecordChatAuditInput): Promise<{ ok: boolean; leadId?: string }> {
  try {
    const sql = getDb()
    const { sessionId, messages, customerAudit, lastUserText } = input

    // 0. Check if an audit already exists for this session
    const existingAudits = (await sql`
      SELECT id, tags, message_count, lead_id, phone, customer_name, email
      FROM chat_audits
      WHERE session_id = ${sessionId}
      LIMIT 1;
    `) as { id: string; tags: string[]; message_count: number; lead_id: string | null; phone: string | null; customer_name: string | null; email: string | null }[]
    const existingAudit = existingAudits?.[0]

    // Extract phone: prefer structured audit, fallback to regex in last message, or scan turns, or existing audit
    let phone = customerAudit?.phone?.trim() || ''
    if (!phone) {
      const phoneMatch = lastUserText.match(/\b(0[1-9]\d{8,9})\b/)
      if (phoneMatch) phone = phoneMatch[1]
    }
    if (!phone) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const turnMatch = messages[i]?.text?.match(/\b(0[1-9]\d{8,9})\b/)
        if (turnMatch) {
          phone = turnMatch[1]
          break
        }
      }
    }
    if (!phone && existingAudit?.phone) {
      phone = existingAudit.phone
    }
    // Clean phone number (remove spaces, dots)
    phone = phone.replace(/[\s.-]/g, '')

    // Extract customer name
    let customerName = customerAudit?.customerName?.trim() || ''
    if (!customerName && existingAudit?.customer_name) {
      customerName = existingAudit.customer_name
    }
    if (customerName.length > 50) customerName = customerName.slice(0, 50)

    // Extract email
    let email = customerAudit?.email?.trim() || ''
    if (!email) {
      const emailMatch = lastUserText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/)
      if (emailMatch) email = emailMatch[0]
    }
    if (!email && existingAudit?.email) {
      email = existingAudit.email
    }

    const intentSummary = customerAudit?.intentSummary?.trim() || lastUserText.slice(0, 300)
    const preferredBranch = normalizeBranchId(customerAudit?.preferredBranchId)
    const preferredRoomType = normalizeRoomTypeId(customerAudit?.preferredRoomTypeId)
    const estimatedDates = customerAudit?.estimatedDates?.trim() || null
    const budgetRange = customerAudit?.budgetRange?.trim() || null
    const numGuests = customerAudit?.numGuests && customerAudit.numGuests > 0 ? customerAudit.numGuests : null
    const readinessToBook = customerAudit?.readinessToBook?.trim() || 'INQUIRING'
    const tags = Array.isArray(customerAudit?.tags) && customerAudit.tags.length > 0
      ? customerAudit.tags.map((t) => t.trim()).filter(Boolean)
      : ['AI_CHATBOT']

    let leadId: string | null = null

    // 1. TỰ ĐỘNG BẮT LEAD CRM KHI CÓ SĐT HỢP LỆ (Lọc bỏ số rác / spam)
    if (phone && isValidVietnamPhone(phone)) {
      try {
        // Kiểm tra xem đã có Lead với SĐT này chưa
        const existingLeads = (await sql`
          SELECT id, full_name, tags, interest_notes
          FROM leads
          WHERE phone = ${phone}
          ORDER BY created_at DESC
          LIMIT 1;
        `) as { id: string; full_name: string; tags: string[]; interest_notes: string }[]

        if (existingLeads && existingLeads.length > 0) {
          const lead = existingLeads[0]
          leadId = lead.id

          // Cập nhật nhu cầu mới nhất và merge tags
          const mergedTags = Array.from(new Set([...(lead.tags || []), 'AI_CHATBOT', ...tags]))
          await sql`
            UPDATE leads
            SET 
              interest_notes = ${intentSummary ? `${lead.interest_notes ? `${lead.interest_notes} | ` : ''}${intentSummary}`.slice(0, 1000) : lead.interest_notes},
              tags = ${mergedTags},
              branch_id = COALESCE(${preferredBranch}, branch_id),
              room_type_id = COALESCE(${preferredRoomType}, room_type_id),
              updated_at = NOW()
            WHERE id = ${lead.id};
          `

          // Ghi nhận tương tác mới vào timeline
          await sql`
            INSERT INTO lead_interactions (lead_id, staff_name, type, content)
            VALUES (
              ${lead.id},
              'PML AI Concierge',
              'NOTE',
              ${`[AI Concierge Tương tác]: ${intentSummary}. Tin nhắn mới nhất của khách: "${lastUserText.slice(0, 200)}"`}
            );
          `
        } else {
          // Tạo Lead mới từ AI Chatbot
          const displayName = customerName || `Khách AI Chatbot (${phone.slice(-4)})`
          const isHighPriority = readinessToBook.toUpperCase().includes('READY') || readinessToBook.toUpperCase().includes('CAO') || readinessToBook.toUpperCase().includes('HIGH')
          const initialTags = Array.from(new Set(['AI_CHATBOT', ...tags]))

          const [newLead] = (await sql`
            INSERT INTO leads (
              full_name,
              phone,
              email,
              source,
              stage,
              priority,
              branch_id,
              room_type_id,
              num_guests,
              interest_notes,
              assigned_staff,
              tags
            ) VALUES (
              ${displayName},
              ${phone},
              ${email || null},
              'AI_CHATBOT',
              'NEW',
              ${isHighPriority ? 'HIGH' : 'MEDIUM'},
              ${preferredBranch || null},
              ${preferredRoomType || null},
              ${numGuests || 2},
              ${intentSummary},
              'PML AI Concierge',
              ${initialTags}
            )
            RETURNING id;
          `) as { id: string }[]

          if (newLead && newLead.id) {
            leadId = newLead.id

            await sql`
              INSERT INTO lead_interactions (lead_id, staff_name, type, content)
              VALUES (
                ${newLead.id},
                'PML AI Concierge',
                'NOTE',
                ${`[PML AI Concierge]: Tiếp nhận khách hàng từ AI Chatbot trên Website. Nhu cầu: ${intentSummary}`}
              );
            `

            try {
              await sql`
                INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
                VALUES (
                  'PML AI Concierge',
                  'CREATE_LEAD_CHATBOT',
                  'LEAD',
                  ${newLead.id},
                  ${JSON.stringify({ phone, fullName: displayName, intent: intentSummary })}
                );
              `
            } catch {}
          }
        }

        // 🎯 BẮN ZALO NOTIFICATION TỚI LỄ TÂN MỖI KHI CÓ SĐT TỪ CHATBOT
        const finalDisplayName = customerName || (existingLeads && existingLeads[0]?.full_name) || `Khách AI Chatbot (${phone.slice(-4)})`
        await sendZaloNotification({
          type: 'ai_chatbot_lead',
          customerName: finalDisplayName,
          customerPhone: phone,
          customerEmail: email || null,
          branchName: preferredBranch ? branchMap.get(preferredBranch) || preferredBranch : null,
          roomTypeName: preferredRoomType ? roomMap.get(preferredRoomType) || preferredRoomType : null,
          intentSummary,
          numGuests,
          checkInDate: estimatedDates,
        }).catch((err) => console.warn('[recordChatAudit] Zalo notification error:', err))
      } catch (err) {
        console.warn('[recordChatAudit] Error syncing lead:', err)
      }
    }

    // 2. LƯU HOẶC CẬP NHẬT PHIÊN CHAT VÀO BẢNG chat_audits
    const rawTranscriptJson = JSON.stringify(messages.slice(-12))

    if (existingAudit) {
      const finalLeadId = leadId || existingAudit.lead_id || null
      const mergedTags = Array.from(new Set([...(existingAudit.tags || []), ...tags]))

      await sql`
        UPDATE chat_audits
        SET
          customer_name = COALESCE(NULLIF(${customerName}, ''), customer_name),
          phone = COALESCE(NULLIF(${phone}, ''), phone),
          email = COALESCE(NULLIF(${email}, ''), email),
          intent_summary = COALESCE(NULLIF(${intentSummary}, ''), intent_summary),
          preferred_branch = COALESCE(${preferredBranch}, preferred_branch),
          preferred_room_type = COALESCE(${preferredRoomType}, preferred_room_type),
          estimated_dates = COALESCE(NULLIF(${estimatedDates}, ''), estimated_dates),
          budget_range = COALESCE(NULLIF(${budgetRange}, ''), budget_range),
          num_guests = COALESCE(${numGuests}, num_guests),
          readiness_to_book = COALESCE(NULLIF(${readinessToBook}, ''), readiness_to_book),
          tags = ${mergedTags},
          message_count = ${existingAudit.message_count + 1},
          raw_transcript = ${rawTranscriptJson}::jsonb,
          lead_id = ${finalLeadId},
          updated_at = NOW()
        WHERE id = ${existingAudit.id};
      `
    } else {
      await sql`
        INSERT INTO chat_audits (
          session_id,
          customer_name,
          phone,
          email,
          intent_summary,
          preferred_branch,
          preferred_room_type,
          estimated_dates,
          budget_range,
          num_guests,
          readiness_to_book,
          tags,
          message_count,
          raw_transcript,
          lead_id
        ) VALUES (
          ${sessionId},
          ${customerName || null},
          ${phone || null},
          ${email || null},
          ${intentSummary},
          ${preferredBranch || null},
          ${preferredRoomType || null},
          ${estimatedDates || null},
          ${budgetRange || null},
          ${numGuests || null},
          ${readinessToBook},
          ${tags},
          ${messages.length},
          ${rawTranscriptJson}::jsonb,
          ${leadId || null}
        );
      `
    }

    return { ok: true, leadId: leadId || undefined }
  } catch (err) {
    console.error('[recordChatAudit] Unexpected error:', err)
    return { ok: false }
  }
}

/**
 * Lấy danh sách Chat Audits có phân trang và lọc theo nhu cầu marketing
 */
export async function getAdminChatAudits(
  rawFilter: ChatAuditFilter = {}
): Promise<{ ok: true; result: PaginatedResult<ChatAuditItem> } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canAccessLeads) {
      return { ok: false, error: 'Tài khoản không có quyền xem thông tin khách hàng' }
    }

    const sql = getDb()
    const page = Math.max(1, rawFilter.page || 1)
    const pageSize = Math.min(100, Math.max(1, rawFilter.pageSize || 10))
    const offset = (page - 1) * pageSize

    const conditions: string[] = ['1=1']
    const params: unknown[] = []

    // Scope branch for non-superadmin
    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : rawFilter.branchId

    if (effectiveBranchId) {
      params.push(effectiveBranchId)
      conditions.push(`ca.preferred_branch = $${params.length}`)
    }

    if (rawFilter.hasPhoneOnly) {
      conditions.push(`ca.phone IS NOT NULL AND ca.phone != ''`)
    }

    if (rawFilter.searchQuery?.trim()) {
      params.push(`%${rawFilter.searchQuery.trim().toLowerCase()}%`)
      conditions.push(
        `(LOWER(ca.customer_name) LIKE $${params.length} OR ca.phone LIKE $${params.length} OR LOWER(ca.intent_summary) LIKE $${params.length} OR EXISTS (SELECT 1 FROM unnest(ca.tags) t WHERE LOWER(t) LIKE $${params.length}))`
      )
    }

    const whereClause = conditions.join(' AND ')

    interface RawAuditRow {
      id: string
      session_id: string
      customer_name: string | null
      phone: string | null
      email: string | null
      intent_summary: string | null
      preferred_branch: string | null
      preferred_room_type: string | null
      estimated_dates: string | null
      budget_range: string | null
      num_guests: number | null
      sentiment: string | null
      readiness_to_book: string | null
      topics: string[] | null
      tags: string[] | null
      message_count: number
      lead_id: string | null
      raw_transcript: unknown
      created_at: string | Date
      updated_at: string | Date
    }

    const [countResult, rows] = await Promise.all([
      sql.query(`SELECT COUNT(*)::int as total FROM chat_audits ca WHERE ${whereClause};`, params),
      sql.query(
        `SELECT 
          ca.id, ca.session_id, ca.customer_name, ca.phone, ca.email, ca.intent_summary,
          ca.preferred_branch, ca.preferred_room_type, ca.estimated_dates, ca.budget_range,
          ca.num_guests, ca.sentiment, ca.readiness_to_book, ca.topics, ca.tags,
          ca.message_count, ca.lead_id, ca.raw_transcript, ca.created_at, ca.updated_at
        FROM chat_audits ca
        WHERE ${whereClause}
        ORDER BY ca.updated_at DESC
        LIMIT ${pageSize} OFFSET ${offset};`,
        params
      ),
    ])

    const total = (countResult as unknown as { total: number }[])[0]?.total || 0
    const rawRows = rows as unknown as RawAuditRow[]

    const data: ChatAuditItem[] = rawRows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      customerName: r.customer_name,
      phone: r.phone,
      email: r.email,
      intentSummary: r.intent_summary,
      preferredBranch: r.preferred_branch,
      preferredBranchName: r.preferred_branch ? branchMap.get(r.preferred_branch) || r.preferred_branch : null,
      preferredRoomType: r.preferred_room_type,
      preferredRoomTypeName: r.preferred_room_type ? roomMap.get(r.preferred_room_type) || r.preferred_room_type : null,
      estimatedDates: r.estimated_dates,
      budgetRange: r.budget_range,
      numGuests: r.num_guests,
      sentiment: r.sentiment,
      readinessToBook: r.readiness_to_book,
      topics: r.topics || [],
      tags: r.tags || [],
      messageCount: r.message_count,
      leadId: r.lead_id,
      rawTranscript: Array.isArray(r.raw_transcript) ? r.raw_transcript : null,
      createdAt: typeof r.created_at === 'string' ? r.created_at : r.created_at.toISOString(),
      updatedAt: typeof r.updated_at === 'string' ? r.updated_at : r.updated_at.toISOString(),
    }))

    return {
      ok: true,
      result: {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi truy vấn chat audits'
    return { ok: false, error: errorMsg }
  }
}

/**
 * Thống kê tổng quan hành vi khách chat dành cho Marketing & Ban Quản Lý
 */
export async function getChatMarketingInsights(branchId?: string): Promise<{ ok: true; insights: ChatMarketingInsights } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canAccessLeads) {
      return { ok: false, error: 'Không có quyền truy cập' }
    }

    const sql = getDb()
    const effectiveBranchId = auth.ok && auth.user.permissions.isBranchScoped
      ? auth.user.branchId || undefined
      : branchId

    const branchFilter = effectiveBranchId ? `WHERE preferred_branch = '${effectiveBranchId}'` : ''

    const [summaryRows, branchRows, tagRows] = await Promise.all([
      sql.query(`
        SELECT 
          COUNT(*)::int as total_sessions,
          COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END)::int as sessions_with_phone
        FROM chat_audits
        ${branchFilter};
      `, []),
      sql.query(`
        SELECT preferred_branch as branch_id, COUNT(*)::int as count
        FROM chat_audits
        WHERE preferred_branch IS NOT NULL AND preferred_branch != ''
        GROUP BY preferred_branch
        ORDER BY count DESC
        LIMIT 5;
      `, []),
      sql.query(`
        SELECT unnest(tags) as tag, COUNT(*)::int as count
        FROM chat_audits
        ${branchFilter}
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 8;
      `, []),
    ])

    const summary = (summaryRows as unknown as { total_sessions: number; sessions_with_phone: number }[])[0] || {
      total_sessions: 0,
      sessions_with_phone: 0,
    }

    const totalSessions = summary.total_sessions || 0
    const sessionsWithPhone = summary.sessions_with_phone || 0
    const conversionRatePercent = totalSessions > 0 ? Math.round((sessionsWithPhone / totalSessions) * 100) : 0

    const topBranches = (branchRows as unknown as { branch_id: string; count: number }[]).map((b) => ({
      branchId: b.branch_id,
      branchName: branchMap.get(b.branch_id) || b.branch_id,
      count: b.count,
    }))

    const topKeywords = (tagRows as unknown as { tag: string; count: number }[]).map((t) => ({
      tag: t.tag,
      count: t.count,
    }))

    return {
      ok: true,
      insights: {
        totalSessions,
        sessionsWithPhone,
        conversionRatePercent,
        topTopics: [],
        topBranches,
        topKeywords,
      },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi lấy thống kê marketing'
    return { ok: false, error: errorMsg }
  }
}
