'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  BedDouble,
  Building2,
  Calendar,
  Check,
  Layers,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  checkInRoomGuest,
  checkOutRoomGuest,
  createRoomType,
  createRoomUnit,
  deleteRoomType,
  deleteRoomUnit,
  getAdminRoomTypes,
  getAdminRoomUnits,
  updateRoomGuest,
  updateRoomType,
  updateRoomTypePricing,
  updateRoomUnit,
  updateRoomUnitStatus,
} from '@/lib/actions/admin-rooms'
import { formatPrice } from '@/lib/format-price'
import {
  normalizePhoneDigits,
  validateDepositAmount,
  validateGuestCheckOutDate,
  validateGuestName,
  validateGuestPhone,
} from '@/lib/validate-guest'
import type {
  AdminBranchItem,
  AdminRoomTypeItem,
  AdminUser,
  RoomUnit,
  RoomUnitStatus,
} from '@/types/admin'
import { RoomStatusBadge } from '@/components/admin/status-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const STATUSES: RoomUnitStatus[] = ['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE']

function getTomorrowDateString(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

type Props = {
  initialUnits: RoomUnit[]
  initialRoomTypes?: AdminRoomTypeItem[]
  branches?: AdminBranchItem[]
  initialError?: string
  user?: AdminUser | null
}

export function RoomsManager({
  initialUnits,
  initialRoomTypes = [],
  branches = [],
  initialError,
  user,
}: Props) {
  // Navigation & Data state
  const [activeTab, setActiveTab] = useState<'units' | 'types'>('units')
  const [units, setUnits] = useState(initialUnits)
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes)
  const [statusFilter, setStatusFilter] = useState<RoomUnitStatus | 'all'>('all')
  const [branchFilter, setBranchFilter] = useState<string | 'all'>('all')
  const [pending, startTransition] = useTransition()

  // Permissions
  const canManage = Boolean(user?.permissions?.canManageRooms)
  const canPrice = Boolean(!user?.permissions || user?.permissions?.canUpdateRoomPricing)
  const isBranchScoped = Boolean(user?.permissions?.isBranchScoped)
  const defaultBranchId = (isBranchScoped && user?.branchId) ? user.branchId : (branches[0]?.id ?? '')

  // Dialog states for Room Units
  const [editingUnit, setEditingUnit] = useState<RoomUnit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<RoomUnit | null>(null)
  const [isCreateUnitOpen, setIsCreateUnitOpen] = useState(false)

  // Edit Physical Room form fields
  const [editUnitNumber, setEditUnitNumber] = useState('')
  const [editUnitFloor, setEditUnitFloor] = useState(1)
  const [editUnitRoomTypeId, setEditUnitRoomTypeId] = useState('')
  const [editUnitStatus, setEditUnitStatus] = useState<RoomUnitStatus>('AVAILABLE')
  const [editUnitNotes, setEditUnitNotes] = useState('')
  const [editUnitGuestName, setEditUnitGuestName] = useState('')
  const [editUnitGuestPhone, setEditUnitGuestPhone] = useState('')
  const [editUnitCheckOut, setEditUnitCheckOut] = useState('')

  // Create Physical Room form fields
  const [createUnitBranchId, setCreateUnitBranchId] = useState(defaultBranchId)
  const [createUnitRoomTypeId, setCreateUnitRoomTypeId] = useState('')
  const [createUnitNumber, setCreateUnitNumber] = useState('')
  const [createUnitFloor, setCreateUnitFloor] = useState(1)
  const [createUnitStatus, setCreateUnitStatus] = useState<RoomUnitStatus>('AVAILABLE')
  const [createUnitNotes, setCreateUnitNotes] = useState('')

  // Quick price update dialog
  const [pricing, setPricing] = useState<{ roomTypeId: string; roomTypeName: string; price: string } | null>(null)

  // Guest Management Dialog (Edit Guest or Quick Check-in)
  const [guestModal, setGuestModal] = useState<{
    type: 'edit' | 'checkin'
    unit: RoomUnit
  } | null>(null)
  const [modalGuestName, setModalGuestName] = useState('')
  const [modalGuestPhone, setModalGuestPhone] = useState('')
  const [modalCheckOutDate, setModalCheckOutDate] = useState(getTomorrowDateString())
  const [modalDeposit, setModalDeposit] = useState('0')
  const [modalGuestErrors, setModalGuestErrors] = useState<{
    name?: string
    phone?: string
    checkOutDate?: string
    deposit?: string
  }>({})

  // Dialog states for Room Types (Categories)
  const [editingType, setEditingType] = useState<AdminRoomTypeItem | null>(null)
  const [deletingType, setDeletingType] = useState<AdminRoomTypeItem | null>(null)
  const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false)

  // Create Room Type form fields
  const [createTypeBranchId, setCreateTypeBranchId] = useState(defaultBranchId)
  const [createTypeName, setCreateTypeName] = useState('')
  const [createTypeSize, setCreateTypeSize] = useState(30)
  const [createTypeGuests, setCreateTypeGuests] = useState(2)
  const [createTypeInventory, setCreateTypeInventory] = useState(5)
  const [createTypePrice, setCreateTypePrice] = useState('1500000')
  const [createTypeDesc, setCreateTypeDesc] = useState('')
  const [createTypeFeatures, setCreateTypeFeatures] = useState('Bồn tắm Onsen, View thành phố, Ban công riêng')

  // Edit Room Type form fields
  const [editTypeName, setEditTypeName] = useState('')
  const [editTypeSize, setEditTypeSize] = useState(30)
  const [editTypeGuests, setEditTypeGuests] = useState(2)
  const [editTypeInventory, setEditTypeInventory] = useState(5)
  const [editTypePrice, setEditTypePrice] = useState('1500000')
  const [editTypeDesc, setEditTypeDesc] = useState('')
  const [editTypeFeatures, setEditTypeFeatures] = useState('')

  // Filtered physical rooms
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      if (statusFilter !== 'all' && unit.status !== statusFilter) return false
      if (branchFilter !== 'all' && unit.branchId !== branchFilter) return false
      return true
    })
  }, [units, statusFilter, branchFilter])

  // Filtered room types for dropdowns matching chosen branch
  const availableRoomTypesForCreateUnit = useMemo(() => {
    return roomTypes.filter((rt) => rt.branchId === createUnitBranchId)
  }, [roomTypes, createUnitBranchId])

  const availableRoomTypesForEditUnit = useMemo(() => {
    if (!editingUnit) return []
    return roomTypes.filter((rt) => rt.branchId === editingUnit.branchId)
  }, [roomTypes, editingUnit])

  // Refresh data from server
  function refresh() {
    startTransition(async () => {
      const branchIdParam = isBranchScoped ? user?.branchId || undefined : undefined
      const [unitsRes, typesRes] = await Promise.all([
        getAdminRoomUnits(branchIdParam),
        getAdminRoomTypes(branchIdParam),
      ])
      if (unitsRes.ok) setUnits(unitsRes.units)
      if (typesRes.ok) setRoomTypes(typesRes.roomTypes)
      toast.success('Đã đồng bộ dữ liệu phòng mới nhất')
    })
  }

  // Open Edit Physical Room modal
  function openEditUnit(unit: RoomUnit) {
    setEditingUnit(unit)
    setEditUnitNumber(unit.roomNumber)
    setEditUnitFloor(unit.floor)
    setEditUnitRoomTypeId(unit.roomTypeId)
    setEditUnitStatus(unit.status)
    setEditUnitNotes(unit.notes ?? '')
    setEditUnitGuestName(unit.currentGuestName ?? '')
    setEditUnitGuestPhone(unit.currentCustomerPhone ?? '')
    setEditUnitCheckOut(unit.currentCheckOut ?? getTomorrowDateString())
  }

  // Open Guest Modal
  function openGuestModal(type: 'edit' | 'checkin', unit: RoomUnit) {
    setGuestModal({ type, unit })
    setModalGuestErrors({})
    if (type === 'edit') {
      setModalGuestName(unit.currentGuestName ?? '')
      setModalGuestPhone(unit.currentCustomerPhone ?? '')
      setModalCheckOutDate(unit.currentCheckOut ?? getTomorrowDateString())
      setModalDeposit(String(unit.currentDepositAmountVnd || 0))
    } else {
      setModalGuestName('')
      setModalGuestPhone('')
      setModalCheckOutDate(getTomorrowDateString())
      setModalDeposit('0')
    }
  }

  function validateGuestModalFields() {
    const isCheckIn = guestModal?.type === 'checkin'
    const errors = {
      name: validateGuestName(modalGuestName, true),
      phone: validateGuestPhone(modalGuestPhone, Boolean(isCheckIn)),
      checkOutDate: validateGuestCheckOutDate(modalCheckOutDate, Boolean(isCheckIn)),
      deposit: validateDepositAmount(modalDeposit),
    }
    const cleaned = Object.fromEntries(
      Object.entries(errors).filter(([, value]) => Boolean(value))
    ) as typeof modalGuestErrors
    setModalGuestErrors(cleaned)
    return cleaned
  }

  // Submit Save Guest (from Guest Modal)
  function handleSaveGuestModal() {
    if (!guestModal) return

    const errors = validateGuestModalFields()
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0] || 'Vui lòng kiểm tra lại thông tin khách cư trú')
      return
    }

    const normalizedPhone = modalGuestPhone.trim()
      ? normalizePhoneDigits(modalGuestPhone)
      : undefined

    startTransition(async () => {
      if (guestModal.type === 'edit') {
        const result = await updateRoomGuest({
          roomUnitId: guestModal.unit.id,
          bookingId: guestModal.unit.currentBookingId || undefined,
          guestName: modalGuestName.trim().replace(/\s+/g, ' '),
          guestPhone: normalizedPhone,
          checkOutDate: modalCheckOutDate || undefined,
          depositAmountVnd: Number(modalDeposit) || 0,
          adminName: user?.fullName || 'Receptionist',
        })

        if (!result.ok) {
          toast.error(result.error)
          return
        }

        toast.success(`Đã cập nhật tên khách thành công (${result.bookingCode})`)
      } else {
        // Quick Check-in
        const result = await checkInRoomGuest({
          roomUnitId: guestModal.unit.id,
          guestName: modalGuestName.trim().replace(/\s+/g, ' '),
          guestPhone: normalizedPhone || '',
          checkOutDate: modalCheckOutDate,
          depositAmountVnd: Number(modalDeposit) || 0,
          adminName: user?.fullName || 'Receptionist',
        })

        if (!result.ok) {
          toast.error(result.error)
          return
        }

        toast.success(`Đã nhận phòng thành công! Mã booking: ${result.bookingCode}`)
      }

      setGuestModal(null)
      refresh()
    })
  }

  // Submit Quick Check-out
  function handleQuickCheckOut(unitId: string, bookingId?: string | null) {
    startTransition(async () => {
      const result = await checkOutRoomGuest({
        roomUnitId: unitId,
        bookingId: bookingId || undefined,
        adminName: user?.fullName || 'Receptionist',
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success('Đã làm thủ tục trả phòng! Phòng được chuyển sang DIRTY để dọn dẹp.')
      setGuestModal(null)
      if (editingUnit) setEditingUnit(null)
      refresh()
    })
  }

  // Open Create Physical Room modal
  function openCreateUnit() {
    const branch = defaultBranchId || branches[0]?.id || ''
    setCreateUnitBranchId(branch)
    const matchingTypes = roomTypes.filter((rt) => rt.branchId === branch)
    setCreateUnitRoomTypeId(matchingTypes[0]?.id || '')
    setCreateUnitNumber('')
    setCreateUnitFloor(1)
    setCreateUnitStatus('AVAILABLE')
    setCreateUnitNotes('')
    setIsCreateUnitOpen(true)
  }

  // Submit Create Physical Room
  function handleCreateRoomUnit() {
    if (!createUnitNumber.trim()) {
      toast.error('Vui lòng nhập số phòng')
      return
    }
    if (!createUnitRoomTypeId) {
      toast.error('Vui lòng chọn hạng phòng')
      return
    }

    startTransition(async () => {
      const result = await createRoomUnit({
        branchId: createUnitBranchId,
        roomTypeId: createUnitRoomTypeId,
        roomNumber: createUnitNumber.trim(),
        floor: Number(createUnitFloor) || 1,
        status: createUnitStatus,
        notes: createUnitNotes.trim() || null,
        adminName: user?.fullName || 'Admin Staff',
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(`Đã tạo phòng ${createUnitNumber.trim()} thành công`)
      setIsCreateUnitOpen(false)
      refresh()
    })
  }

  // Submit Update Physical Room
  function handleUpdateRoomUnit() {
    if (!editingUnit) return

    startTransition(async () => {
      // 1. Update room physical structure or housekeeping status
      if (canManage) {
        const result = await updateRoomUnit({
          roomUnitId: editingUnit.id,
          roomNumber: editUnitNumber.trim() || undefined,
          floor: Number(editUnitFloor) || undefined,
          roomTypeId: editUnitRoomTypeId || undefined,
          status: editUnitStatus,
          notes: editUnitNotes.trim() || null,
          adminName: user?.fullName || 'Admin Staff',
        })

        if (!result.ok) {
          toast.error(result.error)
          return
        }
      } else {
        const result = await updateRoomUnitStatus({
          roomUnitId: editingUnit.id,
          status: editUnitStatus,
          notes: editUnitNotes || undefined,
          adminName: user?.fullName || 'Housekeeping Staff',
        })

        if (!result.ok) {
          toast.error(result.error)
          return
        }
      }

      // 2. If guest name was edited and room remains OCCUPIED, update customer
      if (editUnitStatus === 'OCCUPIED' && editingUnit.currentGuestName && editUnitGuestName.trim() && editUnitGuestName !== editingUnit.currentGuestName) {
        await updateRoomGuest({
          roomUnitId: editingUnit.id,
          bookingId: editingUnit.currentBookingId || undefined,
          guestName: editUnitGuestName.trim(),
          guestPhone: editUnitGuestPhone.trim() || undefined,
          checkOutDate: editUnitCheckOut || undefined,
          adminName: user?.fullName || 'Admin Staff',
        })
      }

      toast.success(`Đã cập nhật phòng ${editUnitNumber || editingUnit.roomNumber}`)
      setEditingUnit(null)
      refresh()
    })
  }

  // Submit Delete Physical Room
  function handleDeleteRoomUnit() {
    if (!deletingUnit) return
    startTransition(async () => {
      const result = await deleteRoomUnit(deletingUnit.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(`Đã xoá phòng ${deletingUnit.roomNumber}`)
      setDeletingUnit(null)
      if (editingUnit?.id === deletingUnit.id) setEditingUnit(null)
      refresh()
    })
  }

  // Quick Price Save
  function saveQuickPricing() {
    if (!pricing) return
    const price = Number(pricing.price)
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Giá phòng không hợp lệ')
      return
    }
    startTransition(async () => {
      const result = await updateRoomTypePricing({
        roomTypeId: pricing.roomTypeId,
        basePriceVnd: price,
        adminName: user?.fullName || 'Admin Staff',
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Đã cập nhật giá ${pricing.roomTypeName}`)
      setPricing(null)
      refresh()
    })
  }

  // Open Edit Room Type modal
  function openEditType(rt: AdminRoomTypeItem) {
    setEditingType(rt)
    setEditTypeName(rt.name)
    setEditTypeSize(rt.sizeSqm)
    setEditTypeGuests(rt.maxGuests)
    setEditTypeInventory(rt.totalInventory)
    setEditTypePrice(String(rt.basePriceVnd))
    setEditTypeDesc(rt.description ?? '')
    setEditTypeFeatures((rt.features || []).join(', '))
  }

  // Open Create Room Type modal
  function openCreateType() {
    setCreateTypeBranchId(defaultBranchId || branches[0]?.id || '')
    setCreateTypeName('')
    setCreateTypeSize(32)
    setCreateTypeGuests(2)
    setCreateTypeInventory(5)
    setCreateTypePrice('1600000')
    setCreateTypeDesc('')
    setCreateTypeFeatures('Bồn tắm Onsen, View thành phố, Ban công riêng')
    setIsCreateTypeOpen(true)
  }

  // Submit Create Room Type
  function handleCreateRoomType() {
    if (!createTypeName.trim()) {
      toast.error('Vui lòng nhập tên hạng phòng')
      return
    }
    const price = Number(createTypePrice)
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Giá cơ bản không hợp lệ')
      return
    }

    startTransition(async () => {
      const featuresArray = createTypeFeatures
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)

      const result = await createRoomType({
        branchId: createTypeBranchId,
        name: createTypeName.trim(),
        sizeSqm: Number(createTypeSize) || 30,
        maxGuests: Number(createTypeGuests) || 2,
        totalInventory: Number(createTypeInventory) || 5,
        basePriceVnd: price,
        description: createTypeDesc.trim() || null,
        features: featuresArray,
        adminName: user?.fullName || 'Admin Staff',
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(`Đã tạo hạng phòng "${createTypeName.trim()}" thành công`)
      setIsCreateTypeOpen(false)
      refresh()
    })
  }

  // Submit Update Room Type
  function handleUpdateRoomType() {
    if (!editingType) return
    const price = Number(editTypePrice)
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Giá cơ bản không hợp lệ')
      return
    }

    startTransition(async () => {
      const featuresArray = editTypeFeatures
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)

      const result = await updateRoomType({
        roomTypeId: editingType.id,
        name: editTypeName.trim() || undefined,
        sizeSqm: Number(editTypeSize) || undefined,
        maxGuests: Number(editTypeGuests) || undefined,
        totalInventory: Number(editTypeInventory) || undefined,
        basePriceVnd: price,
        description: editTypeDesc.trim() || null,
        features: featuresArray,
        adminName: user?.fullName || 'Admin Staff',
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(`Đã cập nhật hạng phòng "${editTypeName || editingType.name}"`)
      setEditingType(null)
      refresh()
    })
  }

  // Submit Delete Room Type
  function handleDeleteRoomType() {
    if (!deletingType) return
    startTransition(async () => {
      const result = await deleteRoomType(deletingType.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(`Đã xoá hạng phòng "${deletingType.name}"`)
      setDeletingType(null)
      if (editingType?.id === deletingType.id) setEditingType(null)
      refresh()
    })
  }

  if (initialError && units.length === 0) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Lỗi khi tải danh sách phòng:</p>
        <p>{initialError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-foreground">
            Quản lý Phòng & Bảng giá
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cấu hình danh mục hạng phòng, giá bán, số phòng vật lý và trạng thái dọn buồng/housekeeping.
          </p>
        </div>

        {/* Action Controls & Tab switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switcher */}
          <div className="inline-flex rounded-lg border border-border bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'units'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BedDouble className="h-3.5 w-3.5" />
              Phòng vật lý ({units.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('types')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'types'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Hạng phòng & Giá ({roomTypes.length})
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={refresh} disabled={pending}>
            <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          {/* Add buttons with RBAC */}
          {canManage && (
            <>
              {activeTab === 'units' ? (
                <Button size="sm" onClick={openCreateUnit} className="bg-amber-600 text-white hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm phòng
                </Button>
              ) : (
                <Button size="sm" onClick={openCreateType} className="bg-amber-600 text-white hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm hạng phòng
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PHÒNG VẬT LÝ (ROOM UNITS) */}
      {/* ========================================================================= */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Lọc theo:</span>

              {/* Branch filter (visible for Super Admin) */}
              {!isBranchScoped && branches.length > 0 && (
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  aria-label="Lọc theo chi nhánh"
                >
                  <option value="all">Tất cả chi nhánh</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Status filter */}
              <select
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RoomUnitStatus | 'all')}
                aria-label="Lọc trạng thái phòng"
              >
                <option value="all">Tất cả trạng thái ({units.length})</option>
                {STATUSES.map((status) => {
                  const count = units.filter((u) => u.status === status).length
                  return (
                    <option key={status} value={status}>
                      {status} ({count})
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="text-xs text-muted-foreground">
              Đang hiển thị <span className="font-semibold text-foreground">{filteredUnits.length}</span> phòng
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            {pending && units.length === 0 ? (
              <div className="space-y-2 p-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-11 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[100px]">Phòng</TableHead>
                    <TableHead>Hạng phòng</TableHead>
                    <TableHead>Giá / đêm</TableHead>
                    <TableHead>Chi nhánh</TableHead>
                    <TableHead>Khách hiện tại</TableHead>
                    <TableHead>Checkout</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit) => (
                    <TableRow key={unit.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-bold">{unit.roomNumber}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            T{unit.floor}
                          </span>
                        </div>
                        {unit.notes && (
                          <span className="block max-w-[140px] truncate text-[11px] text-muted-foreground italic">
                            {unit.notes}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        {unit.roomTypeName}
                      </TableCell>

                      <TableCell className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatPrice(unit.basePriceVnd)}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {unit.branchName}
                      </TableCell>

                      {/* Guest Column */}
                      <TableCell>
                        {unit.currentGuestName ? (
                          <div className="flex items-start justify-between gap-1 group">
                            <div>
                              <div className="flex items-center gap-1">
                                <p className="font-semibold text-foreground">{unit.currentGuestName}</p>
                                <button
                                  type="button"
                                  onClick={() => openGuestModal('edit', unit)}
                                  className="text-muted-foreground hover:text-amber-600 transition-colors p-0.5 rounded"
                                  title="Sửa tên hoặc ngày checkout của khách"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {unit.currentBookingCode && (
                                  <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                                    {unit.currentBookingCode}
                                  </span>
                                )}
                                {unit.currentDepositAmountVnd !== undefined && unit.currentDepositAmountVnd > 0 ? (
                                  <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    Cọc: {formatPrice(unit.currentDepositAmountVnd)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                    Chưa cọc
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-normal text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                            onClick={() => openGuestModal('checkin', unit)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Nhận khách
                          </Button>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {unit.currentCheckOut ? (
                          <span className="font-mono font-medium text-foreground">
                            {unit.currentCheckOut}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell>
                        <RoomStatusBadge status={unit.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canPrice && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setPricing({
                                  roomTypeId: unit.roomTypeId,
                                  roomTypeName: unit.roomTypeName,
                                  price: unit.basePriceVnd ? String(unit.basePriceVnd) : '',
                                })
                              }
                            >
                              Sửa giá
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs"
                            onClick={() => openEditUnit(unit)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {canManage ? 'Quản lý' : 'Dọn phòng'}
                          </Button>

                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                              onClick={() => setDeletingUnit(unit)}
                              title={`Xoá phòng ${unit.roomNumber}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredUnits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        Không có phòng nào phù hợp với bộ lọc hiện tại.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HẠNG PHÒNG & GIÁ BÁN (ROOM TYPES & RATES) */}
      {/* ========================================================================= */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roomTypes.map((rt) => (
              <div
                key={rt.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {rt.branchName}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">{rt.name}</h3>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {rt.physicalRoomsCount} phòng vật lý
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-baseline gap-1 text-emerald-700 dark:text-emerald-400">
                    <span className="text-2xl font-bold">{formatPrice(rt.basePriceVnd)}</span>
                    <span className="text-xs text-muted-foreground">/ đêm</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                      {rt.sizeSqm} m²
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                      Tối đa {rt.maxGuests} khách
                    </span>
                    <span>•</span>
                    <span>Tổng kho: {rt.totalInventory}</span>
                  </div>

                  {rt.description && (
                    <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground">
                      {rt.description}
                    </p>
                  )}

                  {rt.features && rt.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {rt.features.slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                      {rt.features.length > 3 && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          +{rt.features.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => openEditType(rt)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Sửa hạng phòng
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                      onClick={() => setDeletingType(rt)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Xoá
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {roomTypes.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                Chưa có hạng phòng nào được thiết lập.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG: CẬP NHẬT TÊN KHÁCH / CHECK-IN NHANH (GUEST MODAL) */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(guestModal)} onOpenChange={(open) => !open && setGuestModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {guestModal?.type === 'edit'
                ? `Cập nhật thông tin khách — Phòng ${guestModal.unit.roomNumber}`
                : `Nhận phòng trực tiếp (Walk-in) — Phòng ${guestModal?.unit.roomNumber}`}
            </DialogTitle>
            <DialogDescription>
              {guestModal?.unit.branchName} · {guestModal?.unit.roomTypeName}
              {guestModal?.type === 'edit' && guestModal.unit.currentBookingCode && (
                <span className="ml-2 font-mono text-amber-700 dark:text-amber-400 font-semibold">
                  [{guestModal.unit.currentBookingCode}]
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-2">
            {guestModal?.type === 'edit' && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tổng tiền phòng dự kiến:</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(guestModal.unit.currentTotalAmountVnd || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tiền cọc hiện tại:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatPrice(Number(modalDeposit) || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1.5 font-medium">
                  <span>Còn lại cần thu khi Checkout:</span>
                  <span className="text-amber-800 dark:text-amber-300 font-bold">
                    {formatPrice(Math.max(0, (guestModal.unit.currentTotalAmountVnd || 0) - (Number(modalDeposit) || 0)))}
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="modal-guest-name">Họ và tên khách hàng *</Label>
              <Input
                id="modal-guest-name"
                placeholder="VD: Nguyễn Văn An"
                value={modalGuestName}
                aria-invalid={Boolean(modalGuestErrors.name)}
                className={modalGuestErrors.name ? 'border-rose-400 focus-visible:ring-rose-400/40' : ''}
                onChange={(e) => {
                  setModalGuestName(e.target.value)
                  if (modalGuestErrors.name) {
                    setModalGuestErrors((prev) => ({ ...prev, name: validateGuestName(e.target.value, true) }))
                  }
                }}
                onBlur={() => validateGuestModalFields()}
              />
              {modalGuestErrors.name ? (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {modalGuestErrors.name}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="modal-guest-phone">
                Số điện thoại liên hệ{guestModal?.type === 'checkin' ? ' *' : ''}
              </Label>
              <Input
                id="modal-guest-phone"
                inputMode="tel"
                placeholder="VD: 0912 345 678"
                value={modalGuestPhone}
                aria-invalid={Boolean(modalGuestErrors.phone)}
                className={modalGuestErrors.phone ? 'border-rose-400 focus-visible:ring-rose-400/40' : ''}
                onChange={(e) => {
                  setModalGuestPhone(e.target.value)
                  if (modalGuestErrors.phone) {
                    setModalGuestErrors((prev) => ({
                      ...prev,
                      phone: validateGuestPhone(e.target.value, guestModal?.type === 'checkin'),
                    }))
                  }
                }}
                onBlur={() => validateGuestModalFields()}
              />
              {modalGuestErrors.phone ? (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {modalGuestErrors.phone}
                </p>
              ) : (
                <span className="text-[11px] text-muted-foreground">SĐT di động 10 số (03/05/07/08/09)</span>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="modal-guest-checkout">
                Ngày trả phòng (Check-out){guestModal?.type === 'checkin' ? ' *' : ''}
              </Label>
              <Input
                id="modal-guest-checkout"
                type="date"
                value={modalCheckOutDate}
                min={new Date().toISOString().slice(0, 10)}
                aria-invalid={Boolean(modalGuestErrors.checkOutDate)}
                className={modalGuestErrors.checkOutDate ? 'border-rose-400 focus-visible:ring-rose-400/40' : ''}
                onChange={(e) => {
                  setModalCheckOutDate(e.target.value)
                  if (modalGuestErrors.checkOutDate) {
                    setModalGuestErrors((prev) => ({
                      ...prev,
                      checkOutDate: validateGuestCheckOutDate(e.target.value, guestModal?.type === 'checkin'),
                    }))
                  }
                }}
                onBlur={() => validateGuestModalFields()}
              />
              {modalGuestErrors.checkOutDate ? (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {modalGuestErrors.checkOutDate}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="modal-guest-deposit">Tiền cọc trước (VND)</Label>
              <Input
                id="modal-guest-deposit"
                type="number"
                min={0}
                value={modalDeposit}
                aria-invalid={Boolean(modalGuestErrors.deposit)}
                className={modalGuestErrors.deposit ? 'border-rose-400 focus-visible:ring-rose-400/40' : ''}
                onChange={(e) => {
                  setModalDeposit(e.target.value)
                  if (modalGuestErrors.deposit) {
                    setModalGuestErrors((prev) => ({
                      ...prev,
                      deposit: validateDepositAmount(e.target.value),
                    }))
                  }
                }}
                onBlur={() => validateGuestModalFields()}
                placeholder="0"
              />
              {modalGuestErrors.deposit ? (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {modalGuestErrors.deposit}
                </p>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {guestModal?.type === 'edit'
                    ? 'Số tiền khách đã đóng trước. Phần còn lại sẽ được thu khi làm thủ tục Checkout.'
                    : 'Khoản tiền nhận cọc từ khách khi nhận phòng (nếu có).'}
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div>
              {guestModal?.type === 'edit' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleQuickCheckOut(guestModal.unit.id, guestModal.unit.currentBookingId)}
                  disabled={pending}
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Trả phòng (Check-out)
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setGuestModal(null)} disabled={pending}>
                Hủy
              </Button>
              <Button onClick={handleSaveGuestModal} disabled={pending} className="bg-amber-600 text-white hover:bg-amber-700">
                {pending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1.5" />
                )}
                {guestModal?.type === 'edit' ? 'Lưu tên khách' : 'Xác nhận nhận phòng'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 1: THÊM PHÒNG VẬT LÝ MỚI (CREATE ROOM UNIT) */}
      {/* ========================================================================= */}
      <Dialog open={isCreateUnitOpen} onOpenChange={setIsCreateUnitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm phòng vật lý mới</DialogTitle>
            <DialogDescription>
              Tạo phòng vật lý mới trong hệ thống quản lý buồng phòng của khách sạn PML.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-2">
            {/* Chi nhánh */}
            <div className="grid gap-1.5">
              <Label htmlFor="create-unit-branch">Cơ sở / Chi nhánh</Label>
              <select
                id="create-unit-branch"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={createUnitBranchId}
                disabled={isBranchScoped}
                onChange={(e) => {
                  setCreateUnitBranchId(e.target.value)
                  const matching = roomTypes.filter((rt) => rt.branchId === e.target.value)
                  setCreateUnitRoomTypeId(matching[0]?.id || '')
                }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hạng phòng */}
            <div className="grid gap-1.5">
              <Label htmlFor="create-unit-type">Hạng phòng liên kết</Label>
              <select
                id="create-unit-type"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={createUnitRoomTypeId}
                onChange={(e) => setCreateUnitRoomTypeId(e.target.value)}
              >
                <option value="">-- Chọn hạng phòng --</option>
                {availableRoomTypesForCreateUnit.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({formatPrice(rt.basePriceVnd)}/đêm)
                  </option>
                ))}
              </select>
            </div>

            {/* Số phòng & Tầng */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="create-unit-num">Số phòng (VD: 204, 305)</Label>
                <Input
                  id="create-unit-num"
                  placeholder="204"
                  value={createUnitNumber}
                  onChange={(e) => setCreateUnitNumber(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-unit-floor">Tầng</Label>
                <Input
                  id="create-unit-floor"
                  type="number"
                  min={1}
                  value={createUnitFloor}
                  onChange={(e) => setCreateUnitFloor(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Trạng thái ban đầu */}
            <div className="grid gap-1.5">
              <Label htmlFor="create-unit-status">Trạng thái ban đầu</Label>
              <select
                id="create-unit-status"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={createUnitStatus}
                onChange={(e) => setCreateUnitStatus(e.target.value as RoomUnitStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Ghi chú */}
            <div className="grid gap-1.5">
              <Label htmlFor="create-unit-notes">Ghi chú phòng (tùy chọn)</Label>
              <Textarea
                id="create-unit-notes"
                placeholder="VD: Phòng góc nhìn ra phố, vừa thay ga trải giường..."
                value={createUnitNotes}
                onChange={(e) => setCreateUnitNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateUnitOpen(false)} disabled={pending}>
              Hủy
            </Button>
            <Button onClick={handleCreateRoomUnit} disabled={pending} className="bg-amber-600 text-white hover:bg-amber-700">
              {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
              Tạo phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: CẬP NHẬT PHÒNG VẬT LÝ (EDIT ROOM UNIT) */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingUnit)} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật phòng {editingUnit?.roomNumber}</DialogTitle>
            <DialogDescription>
              {editingUnit?.branchName} · {editingUnit?.roomTypeName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-2">
            {/* If room has guest, allow updating guest details */}
            {editingUnit?.currentGuestName && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      Khách đang ở ({editingUnit.currentBookingCode})
                    </span>
                    {editingUnit.currentDepositAmountVnd !== undefined && editingUnit.currentDepositAmountVnd > 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                        Cọc: {formatPrice(editingUnit.currentDepositAmountVnd)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-rose-600 hover:text-rose-700 p-0"
                    onClick={() => handleQuickCheckOut(editingUnit.id, editingUnit.currentBookingId)}
                  >
                    Trả phòng
                  </Button>
                </div>
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="edit-unit-guest" className="text-xs">Tên khách</Label>
                    <Input
                      id="edit-unit-guest"
                      className="h-8 text-xs bg-background"
                      value={editUnitGuestName}
                      onChange={(e) => setEditUnitGuestName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <Label htmlFor="edit-unit-guest-phone" className="text-xs">SĐT</Label>
                      <Input
                        id="edit-unit-guest-phone"
                        className="h-8 text-xs bg-background"
                        value={editUnitGuestPhone}
                        onChange={(e) => setEditUnitGuestPhone(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="edit-unit-guest-co" className="text-xs">Checkout</Label>
                      <Input
                        id="edit-unit-guest-co"
                        type="date"
                        className="h-8 text-xs bg-background"
                        value={editUnitCheckOut}
                        onChange={(e) => setEditUnitCheckOut(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If user has canManageRooms, show full editing */}
            {canManage ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-unit-num">Số phòng</Label>
                    <Input
                      id="edit-unit-num"
                      value={editUnitNumber}
                      onChange={(e) => setEditUnitNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-unit-floor">Tầng</Label>
                    <Input
                      id="edit-unit-floor"
                      type="number"
                      min={1}
                      value={editUnitFloor}
                      onChange={(e) => setEditUnitFloor(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="edit-unit-type">Hạng phòng</Label>
                  <select
                    id="edit-unit-type"
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    value={editUnitRoomTypeId}
                    onChange={(e) => setEditUnitRoomTypeId(e.target.value)}
                  >
                    {availableRoomTypesForEditUnit.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} ({formatPrice(rt.basePriceVnd)}/đêm)
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            {/* Trạng thái buồng phòng */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-unit-status">Trạng thái buồng phòng</Label>
              <select
                id="edit-unit-status"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={editUnitStatus}
                onChange={(e) => setEditUnitStatus(e.target.value as RoomUnitStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Ghi chú */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-unit-notes">Ghi chú buồng phòng</Label>
              <Textarea
                id="edit-unit-notes"
                value={editUnitNotes}
                onChange={(e) => setEditUnitNotes(e.target.value)}
                rows={3}
                placeholder="Ghi chú về kiểm tra minibar, bảo trì thiết bị..."
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div>
              {canManage && editingUnit && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeletingUnit(editingUnit)}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xoá phòng
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditingUnit(null)} disabled={pending}>
                Hủy
              </Button>
              <Button onClick={handleUpdateRoomUnit} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                Lưu thay đổi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: XÁC NHẬN XOÁ PHÒNG VẬT LÝ (DELETE ROOM UNIT) */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(deletingUnit)} onOpenChange={(open) => !open && setDeletingUnit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Xác nhận xoá phòng {deletingUnit?.roomNumber}?</DialogTitle>
            <DialogDescription>
              Hành động này sẽ xoá hoàn toàn phòng <strong className="text-foreground">{deletingUnit?.roomNumber}</strong> khỏi cơ sở{' '}
              <strong className="text-foreground">{deletingUnit?.branchName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {deletingUnit?.currentGuestName && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              ⚠️ Cảnh báo: Phòng này hiện đang có khách ở ({deletingUnit.currentGuestName}). Hệ thống sẽ chặn xoá nếu đơn đặt phòng còn hiệu lực.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingUnit(null)} disabled={pending}>
              Giữ lại
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoomUnit} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Xác nhận xoá phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 4: SỬA NHANH GIÁ PHÒNG (QUICK PRICING) */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(pricing)} onOpenChange={(open) => !open && setPricing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật giá bán loại phòng</DialogTitle>
            <DialogDescription>{pricing?.roomTypeName}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <Label htmlFor="quick-price">Giá cơ bản / đêm (VND)</Label>
            <Input
              id="quick-price"
              type="number"
              min={1}
              value={pricing?.price ?? ''}
              onChange={(e) =>
                setPricing((curr) => (curr ? { ...curr, price: e.target.value } : curr))
              }
              placeholder="VD: 1800000"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPricing(null)} disabled={pending}>
              Hủy
            </Button>
            <Button onClick={saveQuickPricing} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Lưu giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 5: THÊM HẠNG PHÒNG MỚI (CREATE ROOM TYPE) */}
      {/* ========================================================================= */}
      <Dialog open={isCreateTypeOpen} onOpenChange={setIsCreateTypeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm hạng phòng mới</DialogTitle>
            <DialogDescription>
              Thiết lập danh mục hạng phòng lưu trú và giá bán chuẩn cho khách sạn PML.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="create-rt-branch">Cơ sở / Chi nhánh</Label>
              <select
                id="create-rt-branch"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value={createTypeBranchId}
                disabled={isBranchScoped}
                onChange={(e) => setCreateTypeBranchId(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-rt-name">Tên hạng phòng</Label>
              <Input
                id="create-rt-name"
                placeholder="VD: Deluxe Saigon River View"
                value={createTypeName}
                onChange={(e) => setCreateTypeName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="grid gap-1.5">
                <Label htmlFor="create-rt-price">Giá cơ bản (VND)</Label>
                <Input
                  id="create-rt-price"
                  type="number"
                  min={1}
                  value={createTypePrice}
                  onChange={(e) => setCreateTypePrice(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-rt-size">Diện tích (m²)</Label>
                <Input
                  id="create-rt-size"
                  type="number"
                  min={1}
                  value={createTypeSize}
                  onChange={(e) => setCreateTypeSize(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-rt-guests">Sức chứa (Khách)</Label>
                <Input
                  id="create-rt-guests"
                  type="number"
                  min={1}
                  value={createTypeGuests}
                  onChange={(e) => setCreateTypeGuests(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-rt-inv">Kho phòng dự kiến (Total Inventory)</Label>
              <Input
                id="create-rt-inv"
                type="number"
                min={1}
                value={createTypeInventory}
                onChange={(e) => setCreateTypeInventory(Number(e.target.value))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-rt-features">Tiện nghi (ngăn cách bằng dấu phẩy)</Label>
              <Input
                id="create-rt-features"
                placeholder="Bồn tắm Onsen, View sông Sài Gòn, Máy pha cà phê Nespresso"
                value={createTypeFeatures}
                onChange={(e) => setCreateTypeFeatures(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-rt-desc">Mô tả hạng phòng</Label>
              <Textarea
                id="create-rt-desc"
                placeholder="Mô tả không gian, phong cách thiết kế và trải nghiệm đặc sắc..."
                rows={2}
                value={createTypeDesc}
                onChange={(e) => setCreateTypeDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateTypeOpen(false)} disabled={pending}>
              Hủy
            </Button>
            <Button onClick={handleCreateRoomType} disabled={pending} className="bg-amber-600 text-white hover:bg-amber-700">
              {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
              Tạo hạng phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 6: CẬP NHẬT HẠNG PHÒNG (EDIT ROOM TYPE) */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingType)} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật hạng phòng: {editingType?.name}</DialogTitle>
            <DialogDescription>{editingType?.branchName}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-rt-name">Tên hạng phòng</Label>
              <Input
                id="edit-rt-name"
                value={editTypeName}
                onChange={(e) => setEditTypeName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-rt-price">Giá cơ bản (VND)</Label>
                <Input
                  id="edit-rt-price"
                  type="number"
                  min={1}
                  value={editTypePrice}
                  onChange={(e) => setEditTypePrice(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-rt-size">Diện tích (m²)</Label>
                <Input
                  id="edit-rt-size"
                  type="number"
                  min={1}
                  value={editTypeSize}
                  onChange={(e) => setEditTypeSize(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-rt-guests">Sức chứa (Khách)</Label>
                <Input
                  id="edit-rt-guests"
                  type="number"
                  min={1}
                  value={editTypeGuests}
                  onChange={(e) => setEditTypeGuests(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-rt-inv">Kho phòng danh nghĩa (Inventory)</Label>
              <Input
                id="edit-rt-inv"
                type="number"
                min={1}
                value={editTypeInventory}
                onChange={(e) => setEditTypeInventory(Number(e.target.value))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-rt-features">Tiện nghi (ngăn cách bằng dấu phẩy)</Label>
              <Input
                id="edit-rt-features"
                value={editTypeFeatures}
                onChange={(e) => setEditTypeFeatures(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-rt-desc">Mô tả</Label>
              <Textarea
                id="edit-rt-desc"
                rows={2}
                value={editTypeDesc}
                onChange={(e) => setEditTypeDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingType(null)} disabled={pending}>
              Hủy
            </Button>
            <Button onClick={handleUpdateRoomType} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 7: XÁC NHẬN XOÁ HẠNG PHÒNG (DELETE ROOM TYPE) */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(deletingType)} onOpenChange={(open) => !open && setDeletingType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Xác nhận xoá hạng phòng?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xoá hạng phòng <strong className="text-foreground">{deletingType?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deletingType && deletingType.physicalRoomsCount > 0 && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              ⚠️ Không thể xoá: Hạng phòng này đang có{' '}
              <strong>{deletingType.physicalRoomsCount} phòng vật lý</strong> liên kết. Bạn cần xoá hoặc chuyển các phòng vật lý sang hạng khác trước.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingType(null)} disabled={pending}>
              Giữ lại
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoomType}
              disabled={pending || (deletingType ? deletingType.physicalRoomsCount > 0 : false)}
            >
              {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Xác nhận xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
