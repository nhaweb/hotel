'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  Bot,
  Calendar,
  Eye,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  PhoneCall,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react'
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
import { getAdminChatAudits, getChatMarketingInsights } from '@/lib/actions/admin-chat-audits'
import { formatPrice } from '@/lib/format-price'
import type {
  AdminLeadDetail,
  AdminLeadItem,
  AdminLeadStats,
  AdminUser,
  ChatAuditItem,
  ChatMarketingInsights,
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

  // State for AI Chatbot Behavior & Marketing Insights Tab
  const [viewTab, setViewTab] = useState<'crm' | 'chat_insights'>('crm')
  const [chatAudits, setChatAudits] = useState<PaginatedResult<ChatAuditItem> | null>(null)
  const [chatInsights, setChatInsights] = useState<ChatMarketingInsights | null>(null)
  const [chatSearch, setChatSearch] = useState('')
  const [chatHasPhoneOnly, setChatHasPhoneOnly] = useState(false)
  const [transcriptModal, setTranscriptModal] = useState<ChatAuditItem | null>(null)

  function reloadChatAudits(targetPage = 1, searchQuery = chatSearch, hasPhone = chatHasPhoneOnly) {
    startTransition(async () => {
      const [auditsRes, insightsRes] = await Promise.all([
        getAdminChatAudits({
          searchQuery: searchQuery.trim() || undefined,
          hasPhoneOnly: hasPhone,
          page: targetPage,
          pageSize: 10,
        }),
        getChatMarketingInsights(),
      ])
      if (!auditsRes.ok) {
        toast.error(auditsRes.error)
        return
      }
      setChatAudits(auditsRes.result)
      if (insightsRes.ok) setChatInsights(insightsRes.insights)
    })
  }

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

      {/* Tab Switcher: CRM Leads vs AI Chatbot Insights */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setViewTab('crm')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            viewTab === 'crm'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles size={16} />
          <span>Danh sách Leads CRM</span>
          <Badge variant="secondary" className="ml-1 text-xs">
            {stats?.totalLeads ?? result.total}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewTab('chat_insights')
            if (!chatAudits) reloadChatAudits(1)
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            viewTab === 'chat_insights'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot size={16} />
          <span>AI Chatbot Behavior & Marketing</span>
          {chatInsights?.totalSessions ? (
            <Badge variant="outline" className="ml-1 border-indigo-200 bg-indigo-50 text-indigo-700 text-xs">
              {chatInsights.totalSessions} phiên ({chatInsights.sessionsWithPhone} SĐT)
            </Badge>
          ) : null}
        </button>
      </div>

      {viewTab === 'crm' ? (
        <>
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
                      <TableCell>
                        {lead.source === 'AI_CHATBOT' ? (
                          <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-700 gap-1 font-medium text-xs">
                            <Bot size={13} className="text-indigo-600" />
                            AI Chatbot
                          </Badge>
                        ) : (
                          lead.source
                        )}
                      </TableCell>
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
        </>
      ) : (
        <>
          {/* Marketing Insights KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Bot size={14} className="text-indigo-600" />
                  Tổng phiên chat AI
                </CardDescription>
                <CardTitle className="text-2xl">{chatInsights?.totalSessions ?? (chatAudits?.total ?? 0)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-emerald-600" />
                  Thu thập được SĐT
                </CardDescription>
                <CardTitle className="text-2xl text-emerald-600">
                  {chatInsights?.sessionsWithPhone ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" />
                  Tỷ lệ chuyển đổi SĐT
                </CardDescription>
                <CardTitle className="text-2xl text-primary">
                  {chatInsights?.conversionRatePercent ?? 0}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Tag size={14} className="text-amber-600" />
                  Từ khóa hot nhất
                </CardDescription>
                <div className="mt-1 flex flex-wrap gap-1">
                  {chatInsights?.topKeywords && chatInsights.topKeywords.length > 0 ? (
                    chatInsights.topKeywords.slice(0, 3).map((kw) => (
                      <Badge key={kw.tag} variant="secondary" className="text-xs">
                        {kw.tag} ({kw.count})
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Đang cập nhật</span>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Filter Bar for Chat Audits */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-72"
                placeholder="Tìm khách / SĐT / nhu cầu / tag..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') reloadChatAudits(1, chatSearch, chatHasPhoneOnly)
                }}
              />
              <Button
                variant={chatHasPhoneOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const next = !chatHasPhoneOnly
                  setChatHasPhoneOnly(next)
                  reloadChatAudits(1, chatSearch, next)
                }}
              >
                <PhoneCall size={14} className="mr-1.5" />
                {chatHasPhoneOnly ? 'Đang lọc có SĐT' : 'Chỉ khách có SĐT'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => reloadChatAudits(1, chatSearch, chatHasPhoneOnly)}
                disabled={pending}
              >
                Lọc
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reloadChatAudits(chatAudits?.page || 1, chatSearch, chatHasPhoneOnly)}
              disabled={pending}
            >
              {pending ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <RefreshCw className="mr-1.5" size={14} />}
              Làm mới
            </Button>
          </div>

          {/* Chat Audits Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            {pending && !chatAudits ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Nhu cầu khách muốn gì</TableHead>
                    <TableHead>Cơ sở / Hạng phòng</TableHead>
                    <TableHead>Mức độ quan tâm</TableHead>
                    <TableHead>Tags hành vi</TableHead>
                    <TableHead>Tin nhắn</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatAudits?.data && chatAudits.data.length > 0 ? (
                    chatAudits.data.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell>
                          {audit.phone ? (
                            <div>
                              <p className="font-medium flex items-center gap-1.5 text-emerald-800">
                                <PhoneCall size={13} className="text-emerald-600" />
                                {audit.customerName || 'Khách AI Chatbot'}
                              </p>
                              <p className="text-xs font-mono text-emerald-700">{audit.phone}</p>
                            </div>
                          ) : (
                            <div>
                              <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                                Khách vãng lai
                              </Badge>
                              {audit.customerName ? (
                                <p className="text-xs text-muted-foreground mt-0.5">{audit.customerName}</p>
                              ) : null}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <p className="text-xs font-medium text-foreground line-clamp-2">
                            {audit.intentSummary || 'Đang trò chuyện tư vấn tổng quát'}
                          </p>
                          {audit.estimatedDates ? (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar size={11} />
                              {audit.estimatedDates}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{audit.preferredRoomTypeName || '—'}</p>
                          <span className="block text-[11px] text-muted-foreground">
                            {audit.preferredBranchName || 'Chưa rõ cơ sở'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              audit.readinessToBook?.toUpperCase().includes('READY') || audit.readinessToBook?.toUpperCase().includes('CAO')
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px]'
                                : 'border-slate-200 bg-slate-50 text-slate-700 text-[11px]'
                            }
                          >
                            {audit.readinessToBook || 'INQUIRING'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <div className="flex flex-wrap gap-1">
                            {audit.tags && audit.tags.length > 0 ? (
                              audit.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">
                            {audit.messageCount} lượt
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => setTranscriptModal(audit)}
                            >
                              <Eye size={12} />
                              Transcript
                            </Button>
                            {audit.leadId ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 text-xs gap-1"
                                onClick={() => openDetail(audit.leadId!)}
                              >
                                <Sparkles size={12} />
                                Mở Lead
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Chưa có dữ liệu phân tích hội thoại AI Chatbot nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination for Chat Audits */}
          {chatAudits && chatAudits.totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Trang {chatAudits.page}/{chatAudits.totalPages} · {chatAudits.total} phiên chat
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending || chatAudits.page <= 1}
                  onClick={() => reloadChatAudits(chatAudits.page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending || chatAudits.page >= chatAudits.totalPages}
                  onClick={() => reloadChatAudits(chatAudits.page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

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

      {/* Dialog xem toàn bộ Transcript hội thoại giữa Khách và AI Concierge */}
      <Dialog open={Boolean(transcriptModal)} onOpenChange={(open) => !open && setTranscriptModal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="text-indigo-600" size={20} />
              <span>Transcript Hội Thoại AI Concierge</span>
            </DialogTitle>
            <DialogDescription>
              {transcriptModal?.customerName ? `${transcriptModal.customerName} · ` : ''}
              {transcriptModal?.phone ? `SĐT: ${transcriptModal.phone} · ` : 'Khách vãng lai · '}
              Cơ sở: {transcriptModal?.preferredBranchName || 'Chưa chọn'}
            </DialogDescription>
          </DialogHeader>

          {transcriptModal ? (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Box phân tích ý định */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 space-y-1.5">
                <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  Phân tích tâm lý & nhu cầu khách hàng:
                </p>
                <p className="leading-relaxed">{transcriptModal.intentSummary || 'Đang tư vấn tổng quát.'}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {transcriptModal.tags.map((t, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-white text-[10px]">
                      #{t}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chi tiết từng lượt trò chuyện:
                </h4>
                {Array.isArray(transcriptModal.rawTranscript) && transcriptModal.rawTranscript.length > 0 ? (
                  transcriptModal.rawTranscript.map((turn, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                        {turn.role === 'user' ? (
                          <span>Khách hàng</span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-600 font-medium">
                            <Bot size={12} /> Trợ lý PML Hotel
                          </span>
                        )}
                      </div>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] text-xs leading-relaxed ${
                          turn.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm border border-border'
                        }`}
                      >
                        {turn.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Không có transcript chi tiết cho phiên này.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-between items-center pt-3 border-t">
            {transcriptModal?.leadId ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const leadId = transcriptModal.leadId!
                  setTranscriptModal(null)
                  openDetail(leadId)
                }}
              >
                <Sparkles size={14} className="mr-1.5" />
                Mở hồ sơ Lead trong CRM
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Khách chưa cung cấp SĐT để tạo Lead CRM.
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => setTranscriptModal(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
