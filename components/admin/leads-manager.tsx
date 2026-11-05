'use client'

import { useMemo, useState, useTransition } from 'react'
import { Loader2, MessageSquarePlus, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  addLeadInteraction,
  convertLeadToBooking,
  createLead,
  getAdminLeadDetails,
  getAdminLeads,
  getAdminLeadStats,
  updateLeadStage,
} from '@/lib/actions/admin-leads'
import { formatPrice } from '@/lib/format-price'
import type {
  AdminLeadDetail,
  AdminLeadItem,
  AdminLeadStats,
  AdminUser,
  LeadPriority,
  LeadSource,
  LeadStage,
  PaginatedResult,
} from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const STAGES: Array<LeadStage | 'all'> = [
  'all',
  'NEW',
  'CONTACTED',
  'CONSULTING',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'WON_BOOKED',
  'LOST',
]

const SOURCES: Array<LeadSource | 'all'> = [
  'all',
  'WEBSITE',
  'AI_CHATBOT',
  'HOTLINE',
  'ZALO',
  'FACEBOOK',
  'WALK_IN',
  'REFERRAL',
  'EVENT',
]

const PRIORITIES: Array<LeadPriority | 'all'> = ['all', 'LOW', 'MEDIUM', 'HIGH', 'VIP']

const stageTone: Record<LeadStage, string> = {
  NEW: 'bg-sky-100 text-sky-800 border-sky-200',
  CONTACTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CONSULTING: 'bg-violet-100 text-violet-800 border-violet-200',
  PROPOSAL_SENT: 'bg-amber-100 text-amber-900 border-amber-200',
  NEGOTIATING: 'bg-orange-100 text-orange-900 border-orange-200',
  WON_BOOKED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LOST: 'bg-rose-100 text-rose-800 border-rose-200',
}

type BranchOption = { id: string; name: string; shortName: string }
type RoomOption = { id: string; name: string; branchId: string; priceVnd: number }

type Props = {
  initialResult: PaginatedResult<AdminLeadItem>
  initialStats: AdminLeadStats | null
  initialError?: string
  branches: BranchOption[]
  rooms: RoomOption[]
  user?: AdminUser | null
}

type CreateForm = {
  fullName: string
  phone: string
  email: string
  source: LeadSource
  priority: LeadPriority
  branchId: string
  roomTypeId: string
  interestNotes: string
}

const emptyCreate: CreateForm = {
  fullName: '',
  phone: '',
  email: '',
  source: 'WEBSITE',
  priority: 'MEDIUM',
  branchId: '',
  roomTypeId: '',
  interestNotes: '',
}

export function LeadsManager({ initialResult, initialStats, initialError, branches, rooms, user }: Props) {
  const [result, setResult] = useState(initialResult)
  const [stats, setStats] = useState(initialStats)
  const [stage, setStage] = useState<LeadStage | 'all'>('all')
  const [source, setSource] = useState<LeadSource | 'all'>('all')
  const [priority, setPriority] = useState<LeadPriority | 'all'>('all')
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(() => ({
    ...emptyCreate,
    branchId: user?.permissions?.isBranchScoped && user?.branchId ? user.branchId : '',
  }))
  const [detail, setDetail] = useState<AdminLeadDetail | null>(null)
  const [note, setNote] = useState('')
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertForm, setConvertForm] = useState({
    branchId: '',
    roomTypeId: '',
    checkInDate: '',
    checkOutDate: '',
    totalAmountVnd: '',
    numGuests: '2',
  })

  const convertRooms = useMemo(
    () => rooms.filter((room) => !convertForm.branchId || room.branchId === convertForm.branchId),
    [rooms, convertForm.branchId]
  )

  function reload(next = { stage, source, priority, search, page: result.page }) {
    startTransition(async () => {
      const [leadsRes, statsRes] = await Promise.all([
        getAdminLeads({
          stage: next.stage,
          source: next.source,
          priority: next.priority,
          searchQuery: next.search.trim() || undefined,
          page: next.page,
          pageSize: result.pageSize || 10,
        }),
        getAdminLeadStats(),
      ])
      if (!leadsRes.ok) {
        toast.error(leadsRes.error)
        return
      }
      setResult(leadsRes.result)
      if (statsRes.ok) setStats(statsRes.stats)
    })
  }

  function openDetail(leadId: string) {
    startTransition(async () => {
      const response = await getAdminLeadDetails(leadId)
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      setDetail(response.lead)
      setNote('')
    })
  }

  function saveCreate() {
    startTransition(async () => {
      const response = await createLead({
        fullName: createForm.fullName.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || null,
        source: createForm.source,
        priority: createForm.priority,
        branchId: createForm.branchId || null,
        roomTypeId: createForm.roomTypeId || null,
        interestNotes: createForm.interestNotes.trim() || null,
      })
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      toast.success('Đã tạo lead mới')
      setCreateOpen(false)
      setCreateForm(emptyCreate)
      reload({ stage, source, priority, search, page: 1 })
    })
  }

  function changeStage(nextStage: LeadStage) {
    if (!detail) return
    startTransition(async () => {
      const response = await updateLeadStage({
        leadId: detail.id,
        stage: nextStage,
        note: note.trim() || undefined,
        staffName: 'Admin Staff',
      })
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      toast.success('Đã cập nhật stage')
      const refreshed = await getAdminLeadDetails(detail.id)
      if (refreshed.ok) setDetail(refreshed.lead)
      reload({ stage, source, priority, search, page: result.page })
    })
  }

  function saveNote() {
    if (!detail || !note.trim()) {
      toast.error('Nhập nội dung tương tác')
      return
    }
    startTransition(async () => {
      const response = await addLeadInteraction({
        leadId: detail.id,
        type: 'NOTE',
        content: note.trim(),
        staffName: 'Admin Staff',
      })
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      toast.success('Đã ghi tương tác')
      setNote('')
      const refreshed = await getAdminLeadDetails(detail.id)
      if (refreshed.ok) setDetail(refreshed.lead)
      reload({ stage, source, priority, search, page: result.page })
    })
  }

  function openConvert() {
    if (!detail) return
    const defaultBranchId = user?.permissions?.isBranchScoped && user?.branchId
      ? user.branchId
      : (detail.branchId ?? branches[0]?.id ?? '')

    setConvertForm({
      branchId: defaultBranchId,
      roomTypeId: detail.roomTypeId ?? '',
      checkInDate: detail.estimatedCheckIn ?? '',
      checkOutDate: detail.estimatedCheckOut ?? '',
      totalAmountVnd: detail.budgetVnd ? String(detail.budgetVnd) : '',
      numGuests: String(detail.numGuests || 2),
    })
    setConvertOpen(true)
  }

  function saveConvert() {
    if (!detail) return
    const total = Number(convertForm.totalAmountVnd)
    if (!convertForm.branchId || !convertForm.roomTypeId || !convertForm.checkInDate || !convertForm.checkOutDate || !Number.isFinite(total)) {
      toast.error('Thiếu thông tin chuyển booking')
      return
    }
    startTransition(async () => {
      const response = await convertLeadToBooking({
        leadId: detail.id,
        branchId: convertForm.branchId,
        roomTypeId: convertForm.roomTypeId,
        checkInDate: convertForm.checkInDate,
        checkOutDate: convertForm.checkOutDate,
        numGuests: Number(convertForm.numGuests) || 2,
        totalAmountVnd: total,
        adminName: user?.fullName || 'Admin Staff',
      })
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      toast.success(`Đã tạo booking ${response.bookingCode}`)
      setConvertOpen(false)
      const refreshed = await getAdminLeadDetails(detail.id)
      if (refreshed.ok) setDetail(refreshed.lead)
      reload({ stage, source, priority, search, page: result.page })
    })
  }

  if (initialError && result.data.length === 0) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{initialError}</p>
  }

  const kpi = [
    { label: 'Tổng leads', value: stats?.totalLeads ?? 0 },
    { label: 'New', value: stats?.newLeadsCount ?? 0 },
    { label: 'Consulting', value: stats?.consultingLeadsCount ?? 0 },
    { label: 'Won', value: stats?.wonLeadsCount ?? 0 },
    { label: 'Conversion', value: `${stats?.conversionRatePercent ?? 0}%` },
    { label: 'Potential', value: formatPrice(stats?.totalPotentialRevenueVnd ?? 0) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-[family-name:var(--font-serif)] text-3xl tracking-tight">Leads</h1>
            {user && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {user.role === 'SUPER_ADMIN' ? 'Toàn chuỗi (3 cơ sở)' : `Cơ sở: ${user.branchName || user.branchId}`}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {user?.permissions?.isBranchScoped
              ? `CRM quản lý khách tiềm năng được phân quyền riêng cho cơ sở ${user.branchName || user.branchId}.`
              : 'Mini-CRM pipeline cho sales & concierge follow-up toàn bộ chuỗi PML Hotel.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reload({ stage, source, priority, search, page: result.page })} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
          {(!user?.permissions || user.permissions.canCreateLead) && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Thêm lead
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpi.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
        <select
          className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
          value={stage}
          onChange={(event) => {
            const next = event.target.value as LeadStage | 'all'
            setStage(next)
            reload({ stage: next, source, priority, search, page: 1 })
          }}
          aria-label="Lọc stage"
        >
          {STAGES.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Tất cả stage' : item}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
          value={source}
          onChange={(event) => {
            const next = event.target.value as LeadSource | 'all'
            setSource(next)
            reload({ stage, source: next, priority, search, page: 1 })
          }}
          aria-label="Lọc nguồn"
        >
          {SOURCES.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Tất cả nguồn' : item}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
          value={priority}
          onChange={(event) => {
            const next = event.target.value as LeadPriority | 'all'
            setPriority(next)
            reload({ stage, source, priority: next, search, page: 1 })
          }}
          aria-label="Lọc ưu tiên"
        >
          {PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Tất cả priority' : item}
            </option>
          ))}
        </select>
        <Input
          className="max-w-xs"
          placeholder="Tên / SĐT / email / tag"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') reload({ stage, source, priority, search, page: 1 })
          }}
        />
        <Button variant="secondary" onClick={() => reload({ stage, source, priority, search, page: 1 })} disabled={pending}>
          Lọc
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {pending && result.data.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Ưu tiên</TableHead>
                <TableHead>Quan tâm</TableHead>
                <TableHead>Tương tác gần nhất</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <p className="font-medium">{lead.fullName}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={stageTone[lead.stage]}>
                      {lead.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.priority}</TableCell>
                  <TableCell>
                    {lead.roomTypeName ?? '—'}
                    <span className="mt-0.5 block text-xs text-muted-foreground">{lead.branchName ?? 'Chưa chọn chi nhánh'}</span>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {lead.latestInteraction ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openDetail(lead.id)} disabled={pending}>
                      Mở
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Không có lead phù hợp.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Trang {result.page}/{result.totalPages} · {result.total} leads
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pending || result.page <= 1}
            onClick={() => reload({ stage, source, priority, search, page: result.page - 1 })}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || result.page >= result.totalPages}
            onClick={() => reload({ stage, source, priority, search, page: result.page + 1 })}
          >
            Sau
          </Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm lead mới</DialogTitle>
            <DialogDescription>Tạo lead thủ công từ hotline / walk-in / referral.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="lead-name">Họ tên</Label>
              <Input id="lead-name" value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-phone">SĐT</Label>
                <Input id="lead-phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input id="lead-email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Nguồn</Label>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={createForm.source}
                  onChange={(e) => setCreateForm({ ...createForm, source: e.target.value as LeadSource })}
                >
                  {SOURCES.filter((item) => item !== 'all').map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as LeadPriority })}
                >
                  {PRIORITIES.filter((item) => item !== 'all').map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Chi nhánh</Label>
              <select
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={createForm.branchId}
                onChange={(e) => setCreateForm({ ...createForm, branchId: e.target.value, roomTypeId: '' })}
              >
                <option value="">Chưa chọn</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Hạng phòng quan tâm</Label>
              <select
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={createForm.roomTypeId}
                onChange={(e) => setCreateForm({ ...createForm, roomTypeId: e.target.value })}
              >
                <option value="">Chưa chọn</option>
                {rooms
                  .filter((room) => !createForm.branchId || room.branchId === createForm.branchId)
                  .map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lead-notes">Ghi chú quan tâm</Label>
              <Textarea
                id="lead-notes"
                rows={3}
                value={createForm.interestNotes}
                onChange={(e) => setCreateForm({ ...createForm, interestNotes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveCreate} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Tạo lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(next) => !next && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.fullName}</DialogTitle>
            <DialogDescription>
              {detail?.phone}
              {detail?.email ? ` · ${detail.email}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={stageTone[detail.stage]}>
                  {detail.stage}
                </Badge>
                <Badge variant="secondary">{detail.priority}</Badge>
                <Badge variant="outline">{detail.source}</Badge>
                {detail.convertedBookingCode ? <Badge>{detail.convertedBookingCode}</Badge> : null}
              </div>

              <div className="grid gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Chi nhánh:</span> {detail.branchName ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Phòng:</span> {detail.roomTypeName ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Check-in dự kiến:</span> {detail.estimatedCheckIn ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Ngân sách:</span>{' '}
                  {detail.budgetVnd != null ? formatPrice(detail.budgetVnd) : '—'}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Quan tâm:</span> {detail.interestNotes ?? '—'}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={detail.stage}
                  onChange={(event) => changeStage(event.target.value as LeadStage)}
                  disabled={pending}
                  aria-label="Cập nhật stage"
                >
                  {STAGES.filter((item) => item !== 'all').map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {(!user?.permissions || user.permissions.canConvertLead) ? (
                  <Button variant="secondary" onClick={openConvert} disabled={pending || detail.stage === 'WON_BOOKED'}>
                    <Sparkles />
                    Convert booking
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lead-interaction">Ghi chú tương tác</Label>
                <Textarea id="lead-interaction" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
                <Button variant="outline" className="w-fit" onClick={saveNote} disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />}
                  Thêm NOTE
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Timeline</h3>
                {detail.interactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có tương tác.</p>
                ) : (
                  detail.interactions.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{item.type}</Badge>
                        <span>{item.staffName}</span>
                        <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <p>{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Convert lead → booking</DialogTitle>
            <DialogDescription>Tạo reservation PMS từ lead đã đủ điều kiện.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Chi nhánh</Label>
              <select
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={convertForm.branchId}
                onChange={(e) => setConvertForm({ ...convertForm, branchId: e.target.value, roomTypeId: '' })}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Hạng phòng</Label>
              <select
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={convertForm.roomTypeId}
                onChange={(e) => {
                  const room = rooms.find((item) => item.id === e.target.value)
                  setConvertForm({
                    ...convertForm,
                    roomTypeId: e.target.value,
                    totalAmountVnd: room ? String(room.priceVnd) : convertForm.totalAmountVnd,
                  })
                }}
              >
                <option value="">Chọn hạng phòng</option>
                {convertRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Check-in</Label>
                <Input
                  type="date"
                  value={convertForm.checkInDate}
                  onChange={(e) => setConvertForm({ ...convertForm, checkInDate: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Check-out</Label>
                <Input
                  type="date"
                  value={convertForm.checkOutDate}
                  onChange={(e) => setConvertForm({ ...convertForm, checkOutDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Số khách</Label>
                <Input
                  type="number"
                  min={1}
                  value={convertForm.numGuests}
                  onChange={(e) => setConvertForm({ ...convertForm, numGuests: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Tổng tiền (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={convertForm.totalAmountVnd}
                  onChange={(e) => setConvertForm({ ...convertForm, totalAmountVnd: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveConvert} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Tạo booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
