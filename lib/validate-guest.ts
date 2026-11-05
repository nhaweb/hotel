/**
 * Shared client-side validation for guest stay / booking contact fields.
 */

export type GuestFieldErrors = {
  name?: string
  phone?: string
  email?: string
  notes?: string
  checkOutDate?: string
  deposit?: string
}

export function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+84')) digits = `0${digits.slice(3)}`
  else if (digits.startsWith('84') && digits.length >= 10) digits = `0${digits.slice(2)}`
  return digits
}

export function validateGuestName(name: string, required = true): string | undefined {
  const value = name.trim().replace(/\s+/g, ' ')
  if (!value) return required ? 'Vui lòng nhập họ và tên khách' : undefined
  if (value.length < 2) return 'Họ tên tối thiểu 2 ký tự'
  if (value.length > 80) return 'Họ tên tối đa 80 ký tự'
  if (!/^[\p{L}\p{M}\s'.-]+$/u.test(value)) {
    return 'Họ tên chỉ gồm chữ cái, khoảng trắng và dấu (không chứa số)'
  }
  return undefined
}

export function validateGuestPhone(phone: string, required = true): string | undefined {
  const raw = phone.trim()
  if (!raw) return required ? 'Vui lòng nhập số điện thoại liên hệ' : undefined
  const digits = normalizePhoneDigits(raw)
  if (!/^0(3|5|7|8|9)\d{8}$/.test(digits)) {
    return 'SĐT di động Việt Nam không hợp lệ (10 số, đầu 03/05/07/08/09)'
  }
  return undefined
}

export function validateGuestEmail(email: string, required = false): string | undefined {
  const value = email.trim()
  if (!value) return required ? 'Vui lòng nhập email' : undefined
  if (value.length > 120) return 'Email tối đa 120 ký tự'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Email không đúng định dạng'
  return undefined
}

export function validateGuestNotes(notes: string): string | undefined {
  if (notes.trim().length > 500) return 'Yêu cầu đặc biệt tối đa 500 ký tự'
  return undefined
}

export function validateGuestCheckOutDate(checkOutDate: string, required = true): string | undefined {
  if (!checkOutDate) return required ? 'Vui lòng chọn ngày trả phòng' : undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) return 'Ngày trả phòng không hợp lệ'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const out = new Date(`${checkOutDate}T12:00:00`)
  if (Number.isNaN(out.getTime())) return 'Ngày trả phòng không hợp lệ'
  if (out < today) return 'Ngày trả phòng không được ở trong quá khứ'
  return undefined
}

export function validateDepositAmount(deposit: string): string | undefined {
  if (deposit.trim() === '') return undefined
  if (!/^\d+(\.\d+)?$/.test(deposit.trim())) return 'Tiền cọc phải là số'
  const amount = Number(deposit)
  if (!Number.isFinite(amount) || amount < 0) return 'Tiền cọc không được âm'
  if (amount > 500_000_000) return 'Tiền cọc vượt quá giới hạn cho phép'
  return undefined
}

export function validateGuestStayFields(input: {
  name: string
  phone: string
  email?: string
  notes?: string
  phoneRequired?: boolean
  emailRequired?: boolean
}): GuestFieldErrors {
  const errors: GuestFieldErrors = {}
  const nameError = validateGuestName(input.name, true)
  const phoneError = validateGuestPhone(input.phone, input.phoneRequired !== false)
  const emailError = validateGuestEmail(input.email ?? '', Boolean(input.emailRequired))
  const notesError = validateGuestNotes(input.notes ?? '')

  if (nameError) errors.name = nameError
  if (phoneError) errors.phone = phoneError
  if (emailError) errors.email = emailError
  if (notesError) errors.notes = notesError
  return errors
}
