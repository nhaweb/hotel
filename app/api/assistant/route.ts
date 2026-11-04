import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { parseAvailabilityQuery, fetchLiveAvailability, formatAvailabilityContext } from '@/lib/availability'
import { rooms } from '@/data/rooms'
import { branches } from '@/data/branches'
import { roomCover } from '@/lib/media'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATASET_FILES = [
  '01_brand_policies.json',
  '02_branches.json',
  '03_rooms.json',
  '04_amenities_services_offers.json',
  '05_local_guide.json',
  '06_faq.json',
  '07_ai_assistant.json',
  '08_content_seo.json',
] as const

const LANGUAGE: Record<string, string> = {
  vi: 'Vietnamese',
  en: 'English',
  zh: 'Simplified Chinese',
}

const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest']

type ChatTurn = { role: 'user' | 'assistant'; text: string }

function generateFallbackSuggestions(reply: string, lastUserQuery: string, locale: string): string[] {
  const combined = `${lastUserQuery} ${reply}`.toLowerCase()

  if (locale === 'en') {
    if (combined.includes('available') || combined.includes('vacancy') || combined.includes('vacancies') || combined.includes('any room') || combined.includes('booked')) {
      return [
        'How do I book this room directly?',
        'Is daily breakfast included in the rate?',
        'Early check-in & cancellation policy?',
      ]
    }
    if (combined.includes('onsen') || combined.includes('spa') || combined.includes('mineral')) {
      return [
        'What are the Onsen rates & rules?',
        'Can outside guests use the Onsen?',
        'Rooms with complimentary Onsen access',
      ]
    }
    if (combined.includes('check-in') || combined.includes('check out') || combined.includes('checkout') || combined.includes('time') || combined.includes('airport') || combined.includes('location')) {
      return [
        'Can I store luggage before check-in?',
        'Airport transfer options & rates?',
        'Early check-in & late check-out policy?',
      ]
    }
    if (combined.includes('room') || combined.includes('suite') || combined.includes('stay') || combined.includes('bed')) {
      return [
        'Is daily breakfast included in the room?',
        'Best romantic room options for couples?',
        'What room promotions are available now?',
      ]
    }
    if (combined.includes('bar') || combined.includes('restaurant') || combined.includes('food') || combined.includes('drink') || combined.includes('coffee') || combined.includes('cafe')) {
      return [
        'Signature dishes & cocktail menu?',
        'Is 24/7 in-room dining available?',
        'Dining discounts for hotel guests',
      ]
    }
    if (combined.includes('offer') || combined.includes('deal') || combined.includes('discount') || combined.includes('promo')) {
      return [
        'How to claim the 20% early booking perk?',
        'Details of the Romance Anniversary package',
        'Contact concierge for special rates',
      ]
    }
    return [
      'Recommend romantic rooms for couples',
      'How does the Onsen experience work?',
      'Best room offers available today',
    ]
  }

  // Vietnamese default
  if (combined.includes('còn phòng') || combined.includes('phòng trống') || combined.includes('hết phòng') || combined.includes('trống')) {
    return [
      'Hướng dẫn tôi các bước đặt phòng trực tiếp',
      'Giá phòng đã bao gồm bữa sáng chưa?',
      'Chính sách nhận phòng sớm và hủy phòng',
    ]
  }
  if (combined.includes('onsen') || combined.includes('khoáng') || combined.includes('spa') || combined.includes('xông hơi')) {
    return [
      'Giá vé Onsen và quy chuẩn tắm khoáng?',
      'Khách không lưu trú có được dùng Onsen không?',
      'Đặt phòng kèm vé Onsen miễn phí',
    ]
  }
  if (combined.includes('nhận phòng') || combined.includes('trả phòng') || combined.includes('check-in') || combined.includes('check in') || combined.includes('check out') || combined.includes('giờ') || combined.includes('sân bay') || combined.includes('địa chỉ') || combined.includes('vị trí')) {
    return [
      'Khách sạn có giữ hành lý trước khi nhận phòng?',
      'Cách di chuyển từ sân bay Tân Sơn Nhất về khách sạn?',
      'Chính sách nhận phòng sớm và trả phòng muộn?',
    ]
  }
  if (combined.includes('phòng') || combined.includes('cặp đôi') || combined.includes('đặt phòng') || combined.includes('suite')) {
    return [
      'Giá phòng đã bao gồm bữa sáng chưa?',
      'Gợi ý phòng có bồn tắm view đẹp nhất?',
      'Ưu đãi đặt phòng tốt nhất mùa này',
    ]
  }
  if (combined.includes('ăn') || combined.includes('nhà hàng') || combined.includes('bar') || combined.includes('cafe') || combined.includes('ẩm thực')) {
    return [
      'Menu món đặc trưng và cocktail tại Bar?',
      'Khách sạn có phục vụ ẩm thực tại phòng không?',
      'Ưu đãi giảm giá ẩm thực cho khách lưu trú',
    ]
  }
  if (combined.includes('ưu đãi') || combined.includes('khuyến mãi') || combined.includes('giảm giá') || combined.includes('gói')) {
    return [
      'Điều kiện áp dụng ưu đãi giảm 20% đặt sớm?',
      'Gói kỷ niệm cặp đôi bao gồm những dịch vụ gì?',
      'Liên hệ lễ tân nhận tư vấn ưu đãi trực tiếp',
    ]
  }

  return [
    'Gợi ý phòng lãng mạn cho cặp đôi tại PML',
    'Dịch vụ Onsen khoáng nóng tại khách sạn',
    'Ưu đãi đặt phòng tốt nhất hôm nay',
  ]
}

export type RoomCardInfo = {
  id: string
  slug: string
  name: string
  nameEn: string
  branchId: string
  branchName: string
  priceVnd: number
  sizeSqm: number
  bedType: string
  capacity: string
  imageUrl: string
  bookingUrl: string
  detailUrl: string
}

function findRelevantRoomCards(
  replyText: string,
  userQuery: string,
  modelRoomIds?: string[]
): RoomCardInfo[] {
  const combined = `${userQuery} ${replyText}`.toLowerCase()
  const matched = new Map<string, RoomCardInfo>()

  // 1. If model explicitly provided valid roomIds
  if (Array.isArray(modelRoomIds)) {
    for (const rawId of modelRoomIds) {
      if (typeof rawId !== 'string') continue
      const normalized = rawId.trim().toLowerCase()
      const room = rooms.find(
        (r) => r.id.toLowerCase() === normalized || r.id.replace('room-', '').toLowerCase() === normalized
      )
      if (room && !matched.has(room.id)) {
        const branch = branches.find((b) => b.id === room.branchId)
        matched.set(room.id, {
          id: room.id,
          slug: room.id.replace('room-', ''),
          name: room.name,
          nameEn: room.nameEn,
          branchId: room.branchId,
          branchName: branch?.name ?? 'PML Hotel',
          priceVnd: room.priceVnd,
          sizeSqm: room.sizeSqm,
          bedType: room.bedType,
          capacity: room.capacity,
          imageUrl: roomCover(room.id),
          bookingUrl: `/dat-phong?branchId=${room.branchId}&roomId=${room.id}`,
          detailUrl: `/phong/${room.id.replace('room-', '')}`,
        })
      }
    }
  }

  // 2. Scan for specific rooms mentioned by name or slug in reply or query
  for (const room of rooms) {
    if (matched.size >= 3) break
    const roomNameLower = room.name.toLowerCase()
    const roomSlugWords = room.id.replace('room-', '').replace(/-/g, ' ')

    if (
      replyText.toLowerCase().includes(roomNameLower) ||
      combined.includes(roomNameLower) ||
      combined.includes(roomSlugWords)
    ) {
      if (!matched.has(room.id)) {
        const branch = branches.find((b) => b.id === room.branchId)
        matched.set(room.id, {
          id: room.id,
          slug: room.id.replace('room-', ''),
          name: room.name,
          nameEn: room.nameEn,
          branchId: room.branchId,
          branchName: branch?.name ?? 'PML Hotel',
          priceVnd: room.priceVnd,
          sizeSqm: room.sizeSqm,
          bedType: room.bedType,
          capacity: room.capacity,
          imageUrl: roomCover(room.id),
          bookingUrl: `/dat-phong?branchId=${room.branchId}&roomId=${room.id}`,
          detailUrl: `/phong/${room.id.replace('room-', '')}`,
        })
      }
    }
  }

  // 3. If user has booking intent (e.g. "đặt phòng", "book", "còn phòng", "thuê phòng") but no specific room matched yet:
  if (
    matched.size === 0 &&
    (combined.includes('đặt') ||
      combined.includes('book') ||
      combined.includes('phòng') ||
      combined.includes('còn phòng'))
  ) {
    let targetBranchId = ''
    if (combined.includes('đông du') || combined.includes('dong du')) targetBranchId = 'pml-dong-du'
    else if (combined.includes('hai bà trưng') || combined.includes('onsen')) targetBranchId = 'pml-onsen-hai-ba-trung'
    else if (combined.includes('central park') || combined.includes('công viên')) targetBranchId = 'pml-central-park'

    if (targetBranchId) {
      const branchRooms = rooms.filter((r) => r.branchId === targetBranchId).slice(0, 2)
      for (const room of branchRooms) {
        const branch = branches.find((b) => b.id === room.branchId)
        matched.set(room.id, {
          id: room.id,
          slug: room.id.replace('room-', ''),
          name: room.name,
          nameEn: room.nameEn,
          branchId: room.branchId,
          branchName: branch?.name ?? 'PML Hotel',
          priceVnd: room.priceVnd,
          sizeSqm: room.sizeSqm,
          bedType: room.bedType,
          capacity: room.capacity,
          imageUrl: roomCover(room.id),
          bookingUrl: `/dat-phong?branchId=${room.branchId}&roomId=${room.id}`,
          detailUrl: `/phong/${room.id.replace('room-', '')}`,
        })
      }
    }
  }

  return Array.from(matched.values()).slice(0, 3)
}

function extractReplyAndSuggestions(
  rawText: string,
  lastUserQuery: string,
  locale: string
): { reply: string; suggestions: string[]; roomCards: RoomCardInfo[] } {
  let reply = ''
  let suggestions: string[] = []
  let modelRoomIds: string[] = []

  let cleaned = rawText.trim()
  // Strip markdown code fences if model wrapped in ```json ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  // 1. Try direct JSON.parse
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed.reply === 'string') {
      reply = parsed.reply.trim()
      if (Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions
          .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
          .slice(0, 3)
      }
      if (Array.isArray(parsed.roomIds)) {
        modelRoomIds = parsed.roomIds.filter((id: unknown) => typeof id === 'string')
      }
    }
  } catch {
    // 2. Try regex match for unclosed/truncated JSON
    const replyMatch = cleaned.match(/"reply"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/)
    if (replyMatch && replyMatch[1]) {
      reply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim()
      
      const suggMatch = cleaned.match(/"suggestions"\s*:\s*\[([\s\S]*?)\]/)
      if (suggMatch && suggMatch[1]) {
        try {
          const parsedSugg = JSON.parse(`[${suggMatch[1]}]`)
          if (Array.isArray(parsedSugg)) {
            suggestions = parsedSugg
              .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
              .slice(0, 3)
          }
        } catch {}
      }

      const roomsMatch = cleaned.match(/"roomIds"\s*:\s*\[([\s\S]*?)\]/)
      if (roomsMatch && roomsMatch[1]) {
        try {
          const parsedRooms = JSON.parse(`[${roomsMatch[1]}]`)
          if (Array.isArray(parsedRooms)) {
            modelRoomIds = parsedRooms.filter((id: unknown) => typeof id === 'string')
          }
        } catch {}
      }
    } else {
      // 3. Fallback: strip any JSON artifacts
      reply = cleaned
        .replace(/^[{\s]*"?reply"?\s*:\s*"?/i, '')
        .replace(/["}\s]*$/, '')
        .trim()
    }
  }

  if (!reply || reply === '{}') {
    reply = cleaned
  }

  // Ensure suggestions are available
  if (!suggestions || suggestions.length === 0) {
    suggestions = generateFallbackSuggestions(reply, lastUserQuery, locale)
  }

  const roomCards = findRelevantRoomCards(reply, lastUserQuery, modelRoomIds)

  return { reply, suggestions, roomCards }
}

let knowledgeCache: Promise<string> | null = null

function loadKnowledge() {
  if (!knowledgeCache) {
    knowledgeCache = Promise.all(
      DATASET_FILES.map(async (name) => {
        const fullPath = path.join(process.cwd(), 'files', name)
        const raw = await readFile(fullPath, 'utf8')
        JSON.parse(raw)
        return `# ${name}\n${raw}`
      }),
    )
      .then((parts) => parts.join('\n\n'))
      .catch((error) => {
        knowledgeCache = null
        throw error
      })
  }
  return knowledgeCache
}

function isChatTurn(value: unknown): value is ChatTurn {
  if (!value || typeof value !== 'object') return false
  const turn = value as ChatTurn
  return (turn.role === 'user' || turn.role === 'assistant') && typeof turn.text === 'string' && turn.text.trim().length > 0
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'missing_key' }, { status: 503 })
  }

  let knowledge: string
  try {
    knowledge = await loadKnowledge()
  } catch {
    return NextResponse.json({ error: 'missing_data' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const locale = typeof (body as { locale?: unknown }).locale === 'string' ? (body as { locale: string }).locale : 'vi'
  const language = LANGUAGE[locale] ?? LANGUAGE.vi
  const rawMessages = (body as { messages?: unknown }).messages
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 12 || !rawMessages.every(isChatTurn)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const messages = rawMessages.map((turn) => ({
    role: turn.role,
    text: turn.text.trim().slice(0, 2000),
  }))
  if (messages[messages.length - 1]?.role !== 'user') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  let liveDatabaseContext = ''
  try {
    const lastUserText = messages[messages.length - 1]?.text ?? ''
    const codeMatch = lastUserText.match(/\b(PML-[A-Z0-9]{4,10})\b/i)
    const phoneMatch = lastUserText.match(/\b(0[1-9]\d{8,9})\b/)

    if (codeMatch || (phoneMatch && (lastUserText.toLowerCase().includes('đặt') || lastUserText.toLowerCase().includes('booking') || lastUserText.toLowerCase().includes('tra cứu')))) {
      const sql = getDb()
      let bookings
      if (codeMatch) {
        bookings = await sql`
          SELECT b.booking_code, b.check_in_date, b.check_out_date, b.booking_status, b.payment_status,
                 c.full_name, c.phone, br.name as branch_name, rt.name as room_name
          FROM bookings b
          JOIN customers c ON b.customer_id = c.id
          JOIN branches br ON b.branch_id = br.id
          JOIN room_types rt ON b.room_type_id = rt.id
          WHERE UPPER(b.booking_code) = ${codeMatch[1].toUpperCase()}
          LIMIT 1;
        `
        if (bookings && bookings.length > 0) {
          const b = bookings[0]
          liveDatabaseContext = `\n[LIVE DATABASE RESERVATION]: Mã đặt phòng ${b.booking_code} của khách hàng ${b.full_name}: Cơ sở: ${b.branch_name}, Hạng phòng: ${b.room_name}, Nhận phòng: ${b.check_in_date}, Trả phòng: ${b.check_out_date}, Trạng thái: ${b.booking_status}. Hãy dùng thông tin này để thông báo rõ ràng cho khách.`
        } else {
          liveDatabaseContext = `\n[LIVE DATABASE RESERVATION]: Không tìm thấy mã đặt phòng ${codeMatch[1]} trong hệ thống. Vui lòng hướng dẫn khách kiểm tra lại mã hoặc liên hệ hotline 0789 780 167.`
        }
      } else if (phoneMatch) {
        bookings = await sql`
          SELECT b.booking_code, b.check_in_date, b.check_out_date, b.booking_status, b.payment_status,
                 c.full_name, c.phone, br.name as branch_name, rt.name as room_name
          FROM bookings b
          JOIN customers c ON b.customer_id = c.id
          JOIN branches br ON b.branch_id = br.id
          JOIN room_types rt ON b.room_type_id = rt.id
          WHERE c.phone = ${phoneMatch[1]}
          ORDER BY b.created_at DESC
          LIMIT 1;
        `
        if (bookings && bookings.length > 0) {
          const b = bookings[0]
          liveDatabaseContext = `\n[LIVE DATABASE RESERVATION]: Tìm thấy đơn đặt phòng gần nhất của SĐT ${b.phone} (Khách: ${b.full_name}): Mã booking: ${b.booking_code}, Cơ sở: ${b.branch_name}, Hạng phòng: ${b.room_name}, Nhận phòng: ${b.check_in_date}, Trả phòng: ${b.check_out_date}, Trạng thái: ${b.booking_status}. Hãy dùng thông tin này để thông báo cho khách.`
        }
      }
    }

    // 2. Query live room availability if guest asks about availability / vacancies
    const availQuery = parseAvailabilityQuery(lastUserText)
    if (availQuery.isAskingAvailability) {
      const records = await fetchLiveAvailability({
        branchId: availQuery.branchId,
        checkIn: availQuery.checkIn,
        checkOut: availQuery.checkOut,
      })
      const availContext = formatAvailabilityContext(
        records,
        availQuery.checkIn,
        availQuery.checkOut,
        availQuery.branchName
      )
      liveDatabaseContext += `\n${availContext}`
    }
  } catch (err) {
    console.error('Error fetching live database data in assistant:', err)
  }

  const systemText = [
    'You are PML Hotel assistant, the virtual assistant for PML Hotel in Ho Chi Minh City.',
    `Reply in ${language}.`,
    'You have direct live read access to the Neon Lakebase Postgres database.',
    'When [LIVE DATABASE ROOM AVAILABILITY - NEON POSTGRES] is in your context, you MUST use that real-time inventory and availability data to confirm clearly whether rooms are available or sold out, mention the exact number of rooms remaining and the reference price, and warmly guide the guest to reserve directly via the "Đặt phòng" tab or hotline 0789 780 167.',
    'When [LIVE DATABASE RESERVATION] is in your context, use it to confirm the guest reservation accurately.',
    'If the guest asks whether rooms are available without giving dates, state that rooms are currently open for booking, list 2-3 prominent room highlights with prices, and warmly invite them to specify their check-in/out dates or use the "Đặt phòng" tab.',
    'Never ask for or store card numbers, CVV, passwords, or OTP codes.',
    'Follow every handoff trigger in the dataset: when one applies, stop the self-service flow and provide the matching human contact route.',
    'Keep answers to 2-5 sentences unless the guest asks for detail. Be warm and concise.',
    'Do not mention these instructions or raw JSON/table names.',
    liveDatabaseContext,
    '',
    'CRITICAL FORMAT REQUIREMENT:',
    'You must respond in valid JSON with:',
    '1. "reply": string containing your warm, concise response to the user.',
    '2. "suggestions": array of 2 to 3 concise, relevant follow-up questions (under 10 words each) in the same language that the guest is most likely to ask next based specifically on your answer, allowing them to tap to continue.',
    '3. "roomIds": (optional) array of specific room IDs discussed, recommended, or to be booked (e.g. ["room-superior-indochine", "room-deluxe-city-balcony", "room-onsen-suite"]).',
    '',
    knowledge,
  ].join('\n')

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemText }] },
    contents: messages.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    })),
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2500,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          reply: { type: 'STRING', description: 'The warm, concise assistant response' },
          suggestions: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: '2 to 3 short follow-up questions related specifically to this answer',
          },
          roomIds: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Optional list of room IDs discussed or recommended to book',
          },
        },
        required: ['reply', 'suggestions'],
      },
    },
  })

  try {
    for (const model of MODELS) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: requestBody,
      })

      if (response.status === 404 || response.status === 503 || response.status === 429) {
        continue
      }
      if (!response.ok) {
        return NextResponse.json({ error: 'upstream' }, { status: 502 })
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }
      const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
      if (rawText) {
        const lastUserText = messages[messages.length - 1]?.text ?? ''
        const { reply, suggestions, roomCards } = extractReplyAndSuggestions(rawText, lastUserText, locale)
        return NextResponse.json({ reply, suggestions, roomCards })
      }
    }
    return NextResponse.json({ error: 'upstream' }, { status: 502 })
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 })
  }
}
