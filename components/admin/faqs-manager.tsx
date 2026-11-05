'use client'

import { useState, useTransition } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteAdminFaq, getAdminFaqs, saveAdminFaq } from '@/lib/actions/admin-faqs'
import type { FaqItem } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type FormState = {
  id?: string
  category: string
  question: string
  questionEn: string
  answer: string
  answerEn: string
  keywords: string
  isActive: boolean
  displayOrder: number
}

const emptyForm: FormState = {
  category: 'booking',
  question: '',
  questionEn: '',
  answer: '',
  answerEn: '',
  keywords: '',
  isActive: true,
  displayOrder: 0,
}

type Props = {
  initialFaqs: FaqItem[]
  initialError?: string
}

export function FaqsManager({ initialFaqs, initialError }: Props) {
  const [faqs, setFaqs] = useState(initialFaqs)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pending, startTransition] = useTransition()

  function openCreate() {
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(item: FaqItem) {
    setForm({
      id: item.id,
      category: item.category,
      question: item.question,
      questionEn: item.questionEn ?? '',
      answer: item.answer,
      answerEn: item.answerEn ?? '',
      keywords: item.keywords.join(', '),
      isActive: item.isActive,
      displayOrder: item.displayOrder,
    })
    setOpen(true)
  }

  function refresh() {
    return getAdminFaqs().then((result) => {
      if (result.ok) setFaqs(result.faqs)
      return result
    })
  }

  function save() {
    startTransition(async () => {
      const result = await saveAdminFaq({
        id: form.id,
        category: form.category.trim(),
        question: form.question.trim(),
        questionEn: form.questionEn.trim() || undefined,
        answer: form.answer.trim(),
        answerEn: form.answerEn.trim() || undefined,
        keywords: form.keywords
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(form.id ? 'Đã cập nhật FAQ' : 'Đã thêm FAQ mới')
      setOpen(false)
      await refresh()
    })
  }

  function remove(id: string) {
    if (!window.confirm('Xóa FAQ này khỏi knowledge base?')) return
    startTransition(async () => {
      const result = await deleteAdminFaq(id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Đã xóa FAQ')
      await refresh()
    })
  }

  if (initialError && faqs.length === 0) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{initialError}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl tracking-tight">FAQs / Knowledge</h1>
          <p className="text-sm text-muted-foreground">Nguồn kiến thức realtime cho AI Concierge.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Thêm FAQ
        </Button>
      </div>

      <div className="admin-faqs-panel rounded-xl border border-border bg-card shadow-sm">
        {pending && faqs.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Câu hỏi</TableHead>
                <TableHead className="w-[120px]">Danh mục</TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
                <TableHead className="w-[80px]">Thứ tự</TableHead>
                <TableHead className="w-[140px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-0">
                    <p className="truncate font-medium">{item.question}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.answer}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{item.category}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'Active' : 'Hidden'}</Badge>
                  </TableCell>
                  <TableCell>{item.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        <Pencil />
                        Sửa
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(item.id)} disabled={pending}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Chưa có FAQ nào.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}</DialogTitle>
            <DialogDescription>Thay đổi sẽ cập nhật ngay cho AI Concierge.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
            <div className="grid gap-1.5">
              <Label htmlFor="faq-category">Danh mục</Label>
              <Input id="faq-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="faq-question">Câu hỏi (VI)</Label>
              <Input id="faq-question" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="faq-question-en">Câu hỏi (EN)</Label>
              <Input id="faq-question-en" value={form.questionEn} onChange={(event) => setForm({ ...form, questionEn: event.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="faq-answer">Trả lời (VI)</Label>
              <Textarea id="faq-answer" rows={4} value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="faq-answer-en">Trả lời (EN)</Label>
              <Textarea id="faq-answer-en" rows={3} value={form.answerEn} onChange={(event) => setForm({ ...form, answerEn: event.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="faq-keywords">Keywords (phẩy)</Label>
              <Input id="faq-keywords" value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="faq-order">Thứ tự</Label>
                <Input
                  id="faq-order"
                  type="number"
                  value={form.displayOrder}
                  onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) || 0 })}
                />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
