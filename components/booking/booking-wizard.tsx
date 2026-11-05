'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Hotel,
  Info,
  Loader2,
  Percent,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  checkBookingPaymentStatus,
  checkRoomAvailability,
  confirmBookingPayment,
  createOnlineBooking,
} from '@/lib/actions/booking-engine'
import { formatPrice } from '@/lib/format-price'
import { siteConfig } from '@/config/site'
import type {
  AvailableRoomType,
  OnlineBookingResult,
  OnlinePaymentOption,
} from '@/types/booking-engine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BranchOption {
  id: string
  name: string
  tagline?: string
  address?: string
}

interface Props {
  branches: BranchOption[]
  defaultBranchId?: string
  defaultRoomTypeId?: string
  defaultCheckIn?: string
  defaultCheckOut?: string
  defaultGuests?: number
}

function toLocalYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTomorrowDateString(offsetDays = 1): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return toLocalYmd(d)
}

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return toLocalYmd(d)
}

function computeNights(checkIn: string, checkOut: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) return 0
  const start = new Date(`${checkIn}T12:00:00`)
  const end = new Date(`${checkOut}T12:00:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

function validateStayDates(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) return 'Vui lòng chọn đầy đủ ngày nhận và trả phòng'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return 'Định dạng ngày không hợp lệ'
  }
  const nights = computeNights(checkIn, checkOut)
  if (nights < 1) return 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm'
  const today = getTomorrowDateString(0)
  if (checkIn < today) return 'Ngày nhận phòng không được ở trong quá khứ'
  if (nights > 60) return 'Thời gian lưu trú tối đa 60 đêm mỗi lần đặt'
  return null
}

function isRoomMatch(candidateId?: string | null, targetId?: string | null): boolean {
  if (!candidateId || !targetId) return false
  if (candidateId === targetId) return true
  const cleanA = candidateId.trim().toLowerCase().replace(/^room-/, '')
  const cleanB = targetId.trim().toLowerCase().replace(/^room-/, '')
  return cleanA === cleanB
}

export function BookingWizard({
  branches,
  defaultBranchId,
  defaultRoomTypeId,
  defaultCheckIn,
  defaultCheckOut,
  defaultGuests,
}: Props) {
  // Wizard Step: 1 = Search & Pick Room, 2 = Guest Info & Payment Option, 3 = Payment & Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pending, startTransition] = useTransition()

  // Step 1: Search Criteria
  const [branchId, setBranchId] = useState(defaultBranchId || branches[0]?.id || '')
  const [checkInDate, setCheckInDate] = useState(defaultCheckIn || getTomorrowDateString(0))
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut || getTomorrowDateString(2))
  const [guests, setGuests] = useState(defaultGuests || 2)
  const [roomsCount, setRoomsCount] = useState(1)

  // Step 1 Results
  const [availableRooms, setAvailableRooms] = useState<AvailableRoomType[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoomType | null>(null)
  const [calculatedNights, setCalculatedNights] = useState(() =>
    Math.max(1, computeNights(defaultCheckIn || getTomorrowDateString(0), defaultCheckOut || getTomorrowDateString(2)) || 2)
  )
  const [dateError, setDateError] = useState<string | null>(null)
  const liveNights = Math.max(0, computeNights(checkInDate, checkOutDate))

  // Predefined Room from URL tracking
  const [predefinedRoomState, setPredefinedRoomState] = useState<{
    targetRoomId: string
    status: 'IDLE' | 'AVAILABLE' | 'SOLD_OUT' | 'NOT_FOUND'
    room: AvailableRoomType | null
    dismissed: boolean
  }>({
    targetRoomId: defaultRoomTypeId || '',
    status: 'IDLE',
    room: null,
    dismissed: false,
  })

  // Step 2: Guest Details & Payment Option
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [paymentOption, setPaymentOption] = useState<OnlinePaymentOption>('DEPOSIT_30')
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)

  // Step 3: Booking Confirmation & VietQR
  const [bookingResult, setBookingResult] = useState<OnlineBookingResult | null>(null)
  const [isPaidSuccess, setIsPaidSuccess] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(900) // 15 mins

  // Auto-validate + refresh availability when branch/dates change
  useEffect(() => {
    if (step !== 1) return

    const error = validateStayDates(checkInDate, checkOutDate)
    setDateError(error)
    if (error) return

    if (liveNights > 0) {
      setCalculatedNights(liveNights)
    }

    const timer = window.setTimeout(() => {
      handleSearchRooms({
        branchId,
        checkInDate,
        checkOutDate,
        guests,
        rooms: roomsCount,
        quiet: true,
      })
    }, 280)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, checkInDate, checkOutDate, guests, roomsCount, step])

  // Countdown timer for 15-minute payment hold
  useEffect(() => {
    if (step !== 3 || isPaidSuccess) return
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, isPaidSuccess])

  // Auto polling to check if payment was received
  useEffect(() => {
    if (step !== 3 || !bookingResult || isPaidSuccess) return

    const pollInterval = setInterval(async () => {
      const statusRes = await checkBookingPaymentStatus(bookingResult.bookingCode)
      if (statusRes.ok && statusRes.isPaid) {
        setIsPaidSuccess(true)
        clearInterval(pollInterval)
        toast.success(`Hệ thống đã nhận được thanh toán cho mã ${bookingResult.bookingCode}!`)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [step, bookingResult, isPaidSuccess])

  // Step 1: Search availability
  function handleSearchRooms(overrides?: {
    branchId?: string
    checkInDate?: string
    checkOutDate?: string
    guests?: number
    rooms?: number
    quiet?: boolean
  }) {
    const activeBranchId = overrides?.branchId ?? branchId
    const activeCheckIn = overrides?.checkInDate ?? checkInDate
    const activeCheckOut = overrides?.checkOutDate ?? checkOutDate
    const activeGuests = overrides?.guests ?? guests
    const activeRooms = overrides?.rooms ?? roomsCount
    const quiet = Boolean(overrides?.quiet)

    const error = validateStayDates(activeCheckIn, activeCheckOut)
    setDateError(error)
    if (error) {
      if (!quiet) toast.error(error)
      return
    }

    startTransition(async () => {
      const result = await checkRoomAvailability({
        branchId: activeBranchId,
        checkInDate: activeCheckIn,
        checkOutDate: activeCheckOut,
        guests: activeGuests,
        rooms: activeRooms,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setAvailableRooms(result.rooms)
      setCalculatedNights(result.nights)
      setHasSearched(true)
      setDateError(null)

      // Check if there is a target predefined room
      if (defaultRoomTypeId) {
        const matched = result.rooms.find((r) => isRoomMatch(r.id, defaultRoomTypeId))
        if (matched) {
          if (matched.availableRooms > 0) {
            setSelectedRoom(matched)
            setPredefinedRoomState({
              targetRoomId: defaultRoomTypeId,
              status: 'AVAILABLE',
              room: matched,
              dismissed: false,
            })
          } else {
            setSelectedRoom(null)
            setPredefinedRoomState({
              targetRoomId: defaultRoomTypeId,
              status: 'SOLD_OUT',
              room: matched,
              dismissed: false,
            })
            if (!quiet) {
              toast.error(
                `Hạng phòng "${matched.name}" hiện đã hết phòng cho ngày ${activeCheckIn} đến ${activeCheckOut}.`
              )
            }
          }
        } else {
          setPredefinedRoomState({
            targetRoomId: defaultRoomTypeId,
            status: 'NOT_FOUND',
            room: null,
            dismissed: false,
          })
        }
      } else if (selectedRoom) {
        const stillAvail = result.rooms.find((r) => r.id === selectedRoom.id)
        if (stillAvail && stillAvail.availableRooms > 0) {
          setSelectedRoom(stillAvail)
        } else {
          setSelectedRoom(null)
        }
      }
    })
  }

  function handleCheckInChange(value: string) {
    setCheckInDate(value)
    if (!value) {
      setDateError('Vui lòng chọn ngày nhận phòng')
      return
    }

    // If checkout is missing or not after check-in, bump to +1 night
    if (!checkOutDate || computeNights(value, checkOutDate) < 1) {
      const nextOut = addDaysYmd(value, 1)
      setCheckOutDate(nextOut)
      setDateError(null)
      setCalculatedNights(1)
      return
    }

    const error = validateStayDates(value, checkOutDate)
    setDateError(error)
    if (!error) setCalculatedNights(computeNights(value, checkOutDate))
  }

  function handleCheckOutChange(value: string) {
    setCheckOutDate(value)
    if (!value) {
      setDateError('Vui lòng chọn ngày trả phòng')
      return
    }

    const error = validateStayDates(checkInDate, value)
    setDateError(error)
    if (!error) {
      setCalculatedNights(computeNights(checkInDate, value))
    }
  }

  // Step 2: Proceed to Checkout
  function handleSelectRoom(room: AvailableRoomType) {
    if (room.availableRooms <= 0) {
      toast.error('Hạng phòng này hiện đã hết phòng trong thời gian bạn chọn')
      return
    }
    setSelectedRoom(room)
    setStep(2)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  // Step 2 -> 3: Create Booking & Initialize Payment
  function handleCreateBooking() {
    if (pending || isCreatingBooking) return

    if (!selectedRoom) {
      toast.error('Vui lòng chọn hạng phòng')
      return
    }
    if (!guestName.trim()) {
      toast.error('Vui lòng nhập họ và tên người đặt phòng')
      return
    }
    if (!guestPhone.trim() || guestPhone.trim().length < 8) {
      toast.error('Vui lòng nhập số điện thoại liên hệ hợp lệ')
      return
    }

    setIsCreatingBooking(true)
    startTransition(async () => {
      try {
        const result = await createOnlineBooking({
          branchId,
          roomTypeId: selectedRoom.id,
          checkInDate,
          checkOutDate,
          numGuests: guests,
          numRooms: roomsCount,
          customerName: guestName.trim(),
          customerPhone: guestPhone.trim(),
          customerEmail: guestEmail.trim() || null,
          specialRequests: specialRequests.trim() || null,
          paymentOption,
          paymentMethod: paymentOption === 'PAY_AT_HOTEL' ? 'CASH' : 'VIETQR',
        })

        if (!result.ok) {
          toast.error(result.error)
          return
        }

        setBookingResult(result.result)
        if (paymentOption === 'PAY_AT_HOTEL') {
          setIsPaidSuccess(true)
        } else {
          setIsPaidSuccess(false)
          setCountdownSeconds(900)
        }
        setStep(3)
        window.scrollTo({ top: 200, behavior: 'smooth' })
      } finally {
        setIsCreatingBooking(false)
      }
    })
  }

  // Simulate payment confirmation (Sandbox Test)
  function handleSimulatePayment() {
    if (!bookingResult) return
    startTransition(async () => {
      const res = await confirmBookingPayment({
        bookingCode: bookingResult.bookingCode,
        amountVnd: bookingResult.depositRequiredVnd,
        providerRef: 'SIMULATED_TEST',
        adminOrSystemName: 'DEMO_SANDBOX',
      })

      if (!res.ok) {
        toast.error(res.error)
        return
      }

      setIsPaidSuccess(true)
      toast.success('Mô phỏng thanh toán thành công! Đơn đặt phòng đã được kích hoạt.')
    })
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}`)
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentBranch = branches.find((b) => b.id === branchId) ?? branches[0]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step >= 1 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <span className={`text-sm font-medium ${step === 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            Chọn phòng
          </span>
        </div>

        <div className="h-0.5 w-12 bg-border sm:w-24" />

        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step >= 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
          <span className={`text-sm font-medium ${step === 2 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            Thông tin & Thanh toán
          </span>
        </div>

        <div className="h-0.5 w-12 bg-border sm:w-24" />

        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step >= 3 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            3
          </div>
          <span className={`text-sm font-medium ${step === 3 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            Xác nhận
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: TÌM KIẾM & CHỌN HẠNG PHÒNG THỜI GIAN THỰC */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Search Bar Panel */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight text-foreground">
              Tìm phòng tại {currentBranch?.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Kiểm tra phòng trống thời gian thực từ hệ thống cơ sở dữ liệu khách sạn PML.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Chi nhánh */}
              <div className="grid gap-1.5 lg:col-span-2">
                <Label htmlFor="bw-branch" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Cơ sở PML
                </Label>
                <select
                  id="bw-branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="booking-branch-select"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Check-in */}
              <div className="grid gap-1.5">
                <Label htmlFor="bw-checkin" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Nhận phòng
                </Label>
                <Input
                  id="bw-checkin"
                  type="date"
                  value={checkInDate}
                  min={getTomorrowDateString(0)}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  aria-invalid={Boolean(dateError)}
                  className={`h-10 ${dateError ? 'border-rose-400 focus-visible:ring-rose-400/40' : ''}`}
                />
              </div>

              {/* Check-out */}
              <div className="grid gap-1.5">
                <Label htmlFor="bw-checkout" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Trả phòng
                </Label>
                <Input
                  id="bw-checkout"
                  type="date"
                  value={checkOutDate}
                  min={checkInDate ? addDaysYmd(checkInDate, 1) : getTomorrowDateString(1)}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  aria-invalid={Boolean(dateError)}
                  className={`h-10 ${dateError ? 'border-rose-400 focus-visible:ring-rose-400/40' : ''}`}
                />
              </div>

              {/* Button — nights update live; search auto-runs after valid dates */}
              <div className="flex items-end">
                <Button
                  onClick={() => handleSearchRooms()}
                  disabled={pending || Boolean(dateError) || liveNights < 1}
                  className="h-10 w-full bg-amber-600 text-white hover:bg-amber-700"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Tìm phòng ({liveNights > 0 ? liveNights : calculatedNights} đêm)
                </Button>
              </div>
            </div>

            {dateError ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-rose-600" role="alert">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {dateError}
              </p>
            ) : liveNights > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Lưu trú <strong className="text-foreground">{liveNights} đêm</strong>
                {pending ? ' — đang kiểm tra phòng trống…' : ' — danh sách phòng cập nhật tự động.'}
              </p>
            ) : null}
          </div>

          {/* Predefined Room: SOLD OUT (HẾT PHÒNG) Alert Banner */}
          {predefinedRoomState.status === 'SOLD_OUT' && predefinedRoomState.room && !predefinedRoomState.dismissed && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-white to-rose-50/60 p-5 shadow-sm sm:p-6 dark:border-rose-900/60 dark:from-rose-950/40 dark:via-background dark:to-rose-950/20">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm dark:bg-rose-900/80 dark:text-rose-200">
                  <AlertTriangle className="h-6 w-6" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                        Rất tiếc: Hết phòng
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {currentBranch?.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPredefinedRoomState((p) => ({ ...p, dismissed: true }))}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Đóng thông báo ✕
                    </button>
                  </div>

                  <div>
                    <h3 className="font-[family-name:var(--font-serif)] text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Hạng phòng &ldquo;{predefinedRoomState.room.name}&rdquo; hiện đã kín chỗ!
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Hệ thống thời gian thực xác nhận hạng phòng này hiện <strong className="text-rose-600 dark:text-rose-400">không còn phòng trống (0 phòng)</strong> trong giai đoạn từ <strong className="text-foreground">{checkInDate}</strong> đến <strong className="text-foreground">{checkOutDate}</strong> ({calculatedNights} đêm).
                    </p>
                  </div>

                  {/* Solutions Grid */}
                  <div className="rounded-xl border border-rose-200/80 bg-white/90 p-4 dark:border-rose-900/40 dark:bg-card/90">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      💡 Gợi ý giải pháp cho Quý khách:
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-border/80 bg-background/50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          1. Đổi ngày lưu trú
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Hãy chọn ngày nhận / trả phòng khác ở khung tìm kiếm bên trên để kiểm tra phòng trống.
                        </p>
                      </div>

                      <div className="rounded-lg border border-border/80 bg-background/50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                          2. Chọn phòng thay thế
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Xem các hạng phòng khác còn trống ngay bên dưới ({availableRooms.filter((r) => r.availableRooms > 0).length} hạng phòng sẵn sàng).
                        </p>
                      </div>

                      <div className="rounded-lg border border-border/80 bg-background/50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <Phone className="h-4 w-4 text-blue-600" />
                          3. Hotline lễ tân 24/7
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Gọi <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`} className="font-bold text-foreground underline">{siteConfig.hotline}</a> để được hỗ trợ sắp xếp danh sách chờ hoặc nâng hạng phòng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Predefined Room: AVAILABLE Confirmation Banner */}
          {predefinedRoomState.status === 'AVAILABLE' && predefinedRoomState.room && !predefinedRoomState.dismissed && (
            <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/30 p-5 shadow-sm dark:border-amber-600/40 dark:from-amber-950/30 dark:via-background dark:to-amber-950/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" /> Hạng phòng bạn đã chọn
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ Còn {predefinedRoomState.room.availableRooms} phòng trống
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-serif)] text-xl font-bold text-foreground">
                    {predefinedRoomState.room.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentBranch?.name} · {calculatedNights} đêm ({checkInDate} → {checkOutDate}) · Tổng trọn gói: <strong className="text-emerald-700 dark:text-emerald-400 text-sm">{formatPrice(predefinedRoomState.room.totalPriceVnd)}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button
                    onClick={() => {
                      if (predefinedRoomState.room) {
                        handleSelectRoom(predefinedRoomState.room)
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm h-11 px-6 text-sm"
                  >
                    Tiếp tục đặt phòng này <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Room Types Listing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                Các hạng phòng tại {currentBranch?.name} ({calculatedNights} đêm lưu trú)
              </h3>
              <span className="text-xs text-muted-foreground">
                Giá đã bao gồm dịch vụ & tiện ích độc quyền PML
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[...availableRooms]
                .sort((a, b) => {
                  // If predefined room is sold out, sort available rooms to the top
                  if (predefinedRoomState.status === 'SOLD_OUT') {
                    if (a.availableRooms > 0 && b.availableRooms <= 0) return -1
                    if (a.availableRooms <= 0 && b.availableRooms > 0) return 1
                  }
                  return 0
                })
                .map((room) => {
                  const isSelected = selectedRoom?.id === room.id
                  const isSoldOut = room.availableRooms <= 0
                  const isTarget = isRoomMatch(room.id, defaultRoomTypeId)

                  return (
                    <div
                      key={room.id}
                      className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                        isTarget && !isSoldOut
                          ? 'border-amber-600 bg-amber-50/25 ring-2 ring-amber-500/40 shadow-sm'
                          : isSelected
                          ? 'border-amber-600 bg-amber-50/20 ring-1 ring-amber-600'
                          : 'border-border bg-card hover:border-amber-500/50 hover:shadow-md'
                      } ${isSoldOut ? 'opacity-65 bg-muted/20 border-dashed border-rose-200 dark:border-rose-950' : ''}`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold text-foreground">{room.name}</h4>
                            </div>
                            {isTarget && (
                              <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {isSoldOut ? 'Phòng bạn đang chọn (Đã hết)' : 'Phòng bạn đã chọn từ trang chi tiết'}
                              </span>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {room.sizeSqm} m²
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                Tối đa {room.maxGuests} khách
                              </span>
                            </div>
                          </div>

                          {/* Inventory Badge */}
                          {isSoldOut ? (
                            <span className="rounded bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                              Hết phòng
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Còn {room.availableRooms} phòng
                            </span>
                          )}
                        </div>

                        {room.description && (
                          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {room.description}
                          </p>
                        )}

                        {/* Features */}
                        {room.features && room.features.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {room.features.slice(0, 3).map((f, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                              >
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-3">
                        <div>
                          <div className="flex items-baseline gap-1 text-emerald-700 dark:text-emerald-400">
                            <span className="text-xl font-bold">{formatPrice(room.basePriceVnd)}</span>
                            <span className="text-xs text-muted-foreground">/ đêm</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            Tổng {calculatedNights} đêm: <strong>{formatPrice(room.totalPriceVnd)}</strong>
                          </span>
                        </div>

                        <Button
                          size="sm"
                          disabled={isSoldOut || pending}
                          onClick={() => handleSelectRoom(room)}
                          className={
                            isSoldOut
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : isTarget || isSelected
                              ? 'bg-amber-700 text-white hover:bg-amber-800 font-semibold shadow-sm'
                              : predefinedRoomState.status === 'SOLD_OUT'
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'bg-foreground text-background hover:bg-foreground/90'
                          }
                        >
                          {isSoldOut ? (
                            'Đã hết phòng'
                          ) : isTarget || isSelected ? (
                            <>
                              <span>Tiếp tục đặt phòng này</span>
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </>
                          ) : predefinedRoomState.status === 'SOLD_OUT' ? (
                            <>
                              <span>Chọn thay thế</span>
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </>
                          ) : (
                            <>
                              <span>Chọn phòng này</span>
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}

              {availableRooms.length === 0 && hasSearched && (
                <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                  Hiện không có phòng nào phù hợp với khoảng thời gian này. Vui lòng chọn ngày khác hoặc liên hệ hotline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: THÔNG TIN KHÁCH HÀNG & CHÍNH SÁCH ĐẶT CỌC */}
      {/* ========================================================================= */}
      {step === 2 && selectedRoom && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Guest Details Form */}
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-foreground">
                    Thông tin Khách lưu trú
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Vui lòng cung cấp thông tin chính xác để PML đón tiếp Quý khách chu đáo nhất.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Đổi phòng khác
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="guest-name">Họ và tên Quý khách *</Label>
                  <Input
                    id="guest-name"
                    placeholder="VD: Nguyễn Hoàng Nam"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="guest-phone">Số điện thoại liên hệ *</Label>
                  <Input
                    id="guest-phone"
                    placeholder="VD: 0987 654 321"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="guest-email">Địa chỉ Email (Nhận mã xác nhận)</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    placeholder="VD: hoangnam@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="guest-notes">Yêu cầu đặc biệt (Tuỳ chọn)</Label>
                  <Input
                    id="guest-notes"
                    placeholder="VD: Đến nhận phòng lúc 15:00, chuẩn bị bồn tắm Onsen thảo mộc, phòng tầng cao..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </div>
              </div>

              {/* 3 payment functions */}
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Chọn 1 trong 3 hình thức thanh toán
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Cọc / thanh toán đủ qua VietQR, hoặc trả khi nhận phòng.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('DEPOSIT_30')}
                    className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                      paymentOption === 'DEPOSIT_30'
                        ? 'border-amber-600 bg-amber-50/30 ring-1 ring-amber-600'
                        : 'border-border hover:border-amber-500/40'
                    }`}
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <Percent className="h-4 w-4" />
                    </div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-semibold text-foreground">Cọc 30%</span>
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Khuyên dùng
                      </span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-emerald-700">
                      {formatPrice(selectedRoom.deposit30Vnd)}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Quét VietQR giữ phòng. Còn lại{' '}
                      {formatPrice(selectedRoom.totalPriceVnd - selectedRoom.deposit30Vnd)} khi check-in.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('FULL_PAYMENT')}
                    className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                      paymentOption === 'FULL_PAYMENT'
                        ? 'border-amber-600 bg-amber-50/30 ring-1 ring-amber-600'
                        : 'border-border hover:border-amber-500/40'
                    }`}
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-semibold text-foreground">Thanh toán đủ</span>
                      <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        −5%
                      </span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-emerald-700">
                      {formatPrice(Math.round(selectedRoom.totalPriceVnd * 0.95))}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      VietQR trọn gói, tiết kiệm{' '}
                      {formatPrice(Math.round(selectedRoom.totalPriceVnd * 0.05))}. Không cần trả thêm tại quầy.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('PAY_AT_HOTEL')}
                    className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                      paymentOption === 'PAY_AT_HOTEL'
                        ? 'border-amber-600 bg-amber-50/30 ring-1 ring-amber-600'
                        : 'border-border hover:border-amber-500/40'
                    }`}
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-stone-200 text-stone-700">
                      <Hotel className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Trả tại khách sạn</span>
                    <p className="mt-1.5 text-lg font-bold text-foreground">0 ₫ hôm nay</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Giữ chỗ đến 18:00 ngày nhận phòng. Thanh toán tại quầy khi check-in.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Booking Folio Summary */}
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h4 className="font-semibold text-foreground">Tóm tắt chuyến đi</h4>

              <div className="space-y-2.5 border-b border-border pb-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Cơ sở lưu trú:</span>
                  <p className="font-semibold text-foreground">{currentBranch.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Hạng phòng:</span>
                  <p className="font-semibold text-foreground">{selectedRoom.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Thời gian:</span>
                  <p className="font-semibold text-foreground">
                    {checkInDate} → {checkOutDate} ({calculatedNights} đêm)
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Giá phòng ({calculatedNights} đêm):</span>
                  <span>{formatPrice(selectedRoom.totalPriceVnd)}</span>
                </div>
                {paymentOption === 'FULL_PAYMENT' && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>Ưu đãi thanh toán sớm (5%):</span>
                    <span>-{formatPrice(Math.round(selectedRoom.totalPriceVnd * 0.05))}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {paymentOption === 'FULL_PAYMENT'
                      ? formatPrice(Math.round(selectedRoom.totalPriceVnd * 0.95))
                      : formatPrice(selectedRoom.totalPriceVnd)}
                  </span>
                </div>
              </div>

              {/* Amount to pay now */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
                <span className="text-muted-foreground">Cần thanh toán ngay để giữ phòng:</span>
                <p className="mt-1 text-xl font-extrabold text-amber-900 dark:text-amber-200">
                  {paymentOption === 'DEPOSIT_30' && formatPrice(selectedRoom.deposit30Vnd)}
                  {paymentOption === 'FULL_PAYMENT' && formatPrice(Math.round(selectedRoom.totalPriceVnd * 0.95))}
                  {paymentOption === 'PAY_AT_HOTEL' && '0 ₫ (Trả tại quầy)'}
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleCreateBooking}
                disabled={pending || isCreatingBooking}
                className="w-full bg-amber-600 text-white hover:bg-amber-700 text-sm font-semibold"
              >
                {pending || isCreatingBooking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                {paymentOption === 'PAY_AT_HOTEL' ? 'Hoàn tất đặt phòng' : 'Tiến hành quét mã VietQR'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: MÀN HÌNH THANH TOÁN VIETQR & XÁC NHẬN TỨC THÌ */}
      {/* ========================================================================= */}
      {step === 3 && bookingResult && (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* If Paid / Success */}
          {isPaidSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center shadow-md dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="mt-4 font-[family-name:var(--font-serif)] text-3xl font-bold text-foreground">
                Đặt phòng thành công!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cảm ơn Quý khách <strong className="text-foreground">{bookingResult.customerName}</strong>. PML Hotel đã ghi nhận đơn đặt phòng của Quý khách.
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-card p-5 text-left text-xs shadow-xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">Mã đặt phòng:</span>
                  <span className="font-mono text-base font-bold text-amber-700 dark:text-amber-400">
                    {bookingResult.bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cơ sở lưu trú:</span>
                  <span className="font-medium text-foreground">{bookingResult.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hạng phòng:</span>
                  <span className="font-medium text-foreground">{bookingResult.roomTypeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kỳ nghỉ:</span>
                  <span className="font-medium text-foreground">
                    {bookingResult.checkInDate} → {bookingResult.checkOutDate} ({bookingResult.nights} đêm)
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Trạng thái thanh toán:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {bookingResult.paymentOption === 'PAY_AT_HOTEL' ? 'Thanh toán tại quầy' : 'Đã thanh toán thành công ✓'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    setStep(1)
                    setSelectedRoom(null)
                    setBookingResult(null)
                    setIsPaidSuccess(false)
                  }}
                  variant="outline"
                  size="sm"
                >
                  Đặt thêm phòng khác
                </Button>
                <Button
                  onClick={() => window.print()}
                  size="sm"
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  In phiếu xác nhận
                </Button>
              </div>
            </div>
          ) : (
            /* Pending Payment Screen with Dynamic VietQR */
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-foreground">
                    Quét mã VietQR để thanh toán
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mở ứng dụng ngân hàng bất kỳ để quét mã và hoàn tất đặt cọc phòng.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <Clock className="h-4 w-4 animate-spin text-amber-600" />
                  Giữ phòng trong: {formatCountdown(countdownSeconds)}
                </div>
              </div>

              {/* VietQR Code & Bank Info */}
              {bookingResult.qrPayment && (
                <div className="grid gap-6 sm:grid-cols-2 items-center">
                  {/* QR Image Box */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="relative h-64 w-64 overflow-hidden rounded-xl bg-white p-2 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bookingResult.qrPayment.qrImageUrl}
                        alt="VietQR PML Hotel"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="mt-3 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      Tự động xác nhận giao dịch trong 3 giây
                    </span>
                  </div>

                  {/* Transfer Details */}
                  <div className="space-y-3.5 text-xs">
                    <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1.5">
                      <span className="text-muted-foreground">Số tiền cọc cần chuyển:</span>
                      <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatPrice(bookingResult.qrPayment.amountVnd)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-border p-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase">Ngân hàng</span>
                          <p className="font-semibold text-foreground">{bookingResult.qrPayment.bankName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => copyToClipboard(bookingResult.qrPayment?.bankId || 'MB', 'Ngân hàng')}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border p-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase">Số tài khoản</span>
                          <p className="font-mono text-sm font-bold text-foreground">
                            {bookingResult.qrPayment.accountNo}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => copyToClipboard(bookingResult.qrPayment?.accountNo || '', 'Số tài khoản')}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border p-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase">Chủ tài khoản</span>
                          <p className="font-semibold text-foreground">{bookingResult.qrPayment.accountName}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50/60 p-2 dark:border-amber-900/60 dark:bg-amber-950/30">
                        <div>
                          <span className="text-[10px] text-amber-800 dark:text-amber-200 uppercase font-semibold">
                            Nội dung chuyển khoản (Bắt buộc)
                          </span>
                          <p className="font-mono text-base font-extrabold text-amber-900 dark:text-amber-200">
                            {bookingResult.qrPayment.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-amber-900"
                          onClick={() =>
                            copyToClipboard(bookingResult.qrPayment?.description || '', 'Nội dung chuyển khoản')
                          }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting status indicator */}
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                Đang chờ hệ thống ngân hàng ghi nhận tiền vào tài khoản...
              </div>

              {/* Sandbox Simulation button for dev testing */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Quay lại sửa thông tin
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulatePayment}
                  disabled={pending}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800"
                  title="Nhấn để mô phỏng webhook ngân hàng chuyển tiền thành công ngay lập tức"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Mô phỏng thanh toán thành công (Sandbox)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

