export type BookingRequest = {
  branchId: string
  checkIn: string
  checkOut: string
  guests: number
  name: string
  phone: string
  email?: string
  note?: string
}

export async function submitBooking(request: BookingRequest) {
  await new Promise((resolve) => setTimeout(resolve, 450))
  return { ok: true as const, reference: `PML-${Date.now().toString(36).toUpperCase()}`, request }
}
