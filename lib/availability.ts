import { getDb } from '@/lib/db'

export type AvailabilityQuery = {
  isAskingAvailability: boolean
  branchId?: string
  branchName?: string
  checkIn: string
  checkOut: string
  specificRoom?: string
}

export function parseAvailabilityQuery(text: string): AvailabilityQuery {
  const lower = text.toLowerCase()
  
  // Check keywords for room availability
  const availabilityKeywords = [
    'còn phòng',
    'hết phòng',
    'phòng trống',
    'tình trạng phòng',
    'check phòng',
    'đặt phòng ngày',
    'trống phòng',
    'có phòng không',
    'còn chỗ',
    'kiểm tra phòng',
    'đặt phòng',
    'available',
    'vacancy',
    'vacancies',
    'any room',
    'rooms left',
    'fully booked',
  ]
  
  const isAskingAvailability = availabilityKeywords.some((k) => lower.includes(k))

  // Branch detection
  let branchId: string | undefined
  let branchName: string | undefined

  if (lower.includes('đông du') || lower.includes('dong du') || lower.includes('nguyễn huệ')) {
    branchId = 'pml-dong-du'
    branchName = 'PML Hotel Đông Du Edition'
  } else if (lower.includes('onsen') || lower.includes('hai bà trưng') || lower.includes('hai ba trung') || lower.includes('khoáng nóng')) {
    branchId = 'pml-onsen-hai-ba-trung'
    branchName = 'PML Hotel & Onsen Lounge'
  } else if (lower.includes('central park') || lower.includes('công viên') || lower.includes('tân định') || lower.includes('tan dinh')) {
    branchId = 'pml-central-park'
    branchName = 'PML Hotel Central Park & Rooftop'
  }

  // Date detection
  const now = new Date()
  let checkInDate = new Date(now)
  let checkOutDate = new Date(now)
  checkOutDate.setDate(checkInDate.getDate() + 1)

  // Explicit dates: DD/MM or DD-MM or YYYY-MM-DD
  const dateRangeMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})(?:\s*(?:đến|tới|-|to)\s*(\d{1,2})[\/\-](\d{1,2}))?/)
  const fullDateMatch = lower.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)

  if (fullDateMatch) {
    const y = parseInt(fullDateMatch[1], 10)
    const m = parseInt(fullDateMatch[2], 10) - 1
    const d = parseInt(fullDateMatch[3], 10)
    checkInDate = new Date(y, m, d)
    checkOutDate = new Date(y, m, d + 1)
  } else if (dateRangeMatch) {
    const currentYear = now.getFullYear()
    const d1 = parseInt(dateRangeMatch[1], 10)
    const m1 = parseInt(dateRangeMatch[2], 10) - 1
    checkInDate = new Date(currentYear, m1, d1)
    
    if (dateRangeMatch[3] && dateRangeMatch[4]) {
      const d2 = parseInt(dateRangeMatch[3], 10)
      const m2 = parseInt(dateRangeMatch[4], 10) - 1
      checkOutDate = new Date(currentYear, m2, d2)
    } else {
      checkOutDate = new Date(currentYear, m1, d1 + 1)
    }
  } else if (lower.includes('ngày mai') || lower.includes('tomorrow')) {
    checkInDate.setDate(now.getDate() + 1)
    checkOutDate.setDate(now.getDate() + 2)
  } else if (lower.includes('cuối tuần') || lower.includes('weekend')) {
    // Find next Friday/Saturday
    const day = now.getDay()
    const diffToFriday = (5 - day + 7) % 7 || 7
    checkInDate.setDate(now.getDate() + diffToFriday)
    checkOutDate.setDate(checkInDate.getDate() + 2)
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  return {
    isAskingAvailability,
    branchId,
    branchName,
    checkIn: formatDate(checkInDate),
    checkOut: formatDate(checkOutDate),
  }
}

export type RoomAvailabilityRecord = {
  room_type_id: string
  room_name: string
  branch_id: string
  branch_name: string
  total_inventory: number
  base_price_vnd: string | number
  booked_rooms: string | number
  available_rooms: string | number
}

export async function fetchLiveAvailability(params: {
  branchId?: string
  checkIn: string
  checkOut: string
}): Promise<RoomAvailabilityRecord[]> {
  const sql = getDb()

  const records = await sql`
    SELECT 
      rt.id AS room_type_id,
      rt.name AS room_name,
      rt.branch_id,
      br.name AS branch_name,
      rt.total_inventory,
      rt.base_price_vnd,
      COALESCE(SUM(b.num_rooms), 0) AS booked_rooms,
      (rt.total_inventory - COALESCE(SUM(b.num_rooms), 0)) AS available_rooms
    FROM room_types rt
    JOIN branches br ON rt.branch_id = br.id
    LEFT JOIN bookings b ON b.room_type_id = rt.id 
      AND b.booking_status IN ('confirmed', 'checked_in')
      AND NOT (b.check_out_date <= ${params.checkIn}::date OR b.check_in_date >= ${params.checkOut}::date)
    WHERE (${params.branchId || null}::text IS NULL OR rt.branch_id = ${params.branchId || null})
    GROUP BY rt.id, rt.name, rt.branch_id, br.name, rt.total_inventory, rt.base_price_vnd
    ORDER BY br.name, rt.base_price_vnd ASC;
  `

  return records as unknown as RoomAvailabilityRecord[]
}

export function formatAvailabilityContext(
  records: RoomAvailabilityRecord[],
  checkIn: string,
  checkOut: string,
  branchName?: string
): string {
  if (!records || records.length === 0) {
    return `\n[LIVE DATABASE ROOM AVAILABILITY]: Đã tra cứu dữ liệu thời gian thực từ Neon Postgres từ ${checkIn} đến ${checkOut}. Hiện tất cả các phòng đều đã kín chỗ hoặc không tìm thấy cơ sở.`
  }

  // Group by branch
  const byBranch: Record<string, RoomAvailabilityRecord[]> = {}
  for (const r of records) {
    if (!byBranch[r.branch_name]) byBranch[r.branch_name] = []
    byBranch[r.branch_name].push(r)
  }

  const lines: string[] = [
    `\n[LIVE DATABASE ROOM AVAILABILITY - NEON POSTGRES]:`,
    `Tình trạng phòng thực tế từ cơ sở dữ liệu Neon cho giai đoạn nhận phòng ${checkIn} - trả phòng ${checkOut}${branchName ? ` (Ưu tiên cơ sở ${branchName})` : ''}:`,
  ]

  for (const [bName, rooms] of Object.entries(byBranch)) {
    lines.push(`• Cơ sở ${bName}:`)
    for (const room of rooms) {
      const avail = Number(room.available_rooms)
      const price = Number(room.base_price_vnd).toLocaleString('vi-VN')
      if (avail > 0) {
        lines.push(`  + ${room.room_name}: CÒN ${avail} PHÒNG TRỐNG (Giá tham khảo: ${price}đ/đêm)`)
      } else {
        lines.push(`  + ${room.room_name}: ĐÃ HẾT PHÒNG (0 phòng trống cho giai đoạn này)`)
      }
    }
  }

  lines.push('')
  lines.push('HƯỚNG DẪN TRẢ LỜI:')
  lines.push('Hãy trả lời khách dựa trên số liệu phòng trống THỜI GIAN THỰC ở trên:')
  lines.push('- Khẳng định rõ ràng phòng còn trống hay đã hết cho giai đoạn khách hỏi.')
  lines.push('- Giới thiệu 1-2 hạng phòng phù hợp nhất kèm mức giá.')
  lines.push('- Hướng dẫn khách có thể đặt phòng trực tiếp trên mục "Đặt phòng" hoặc liên hệ hotline 0789 780 167 để giữ phòng.')

  return lines.join('\n')
}
