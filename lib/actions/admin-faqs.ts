'use server'

import { z } from 'zod'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import type { FaqItem } from '@/types/admin'

const faqInputSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  question: z.string().min(3, 'Question must be at least 3 chars'),
  questionEn: z.string().optional(),
  answer: z.string().min(5, 'Answer must be at least 5 chars'),
  answerEn: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
})

export async function getAdminFaqs(
  category?: string
): Promise<{ ok: true; faqs: FaqItem[] } | { ok: false; error: string }> {
  try {
    const sql = getDb()

    interface RawFaqRow {
      id: string
      category: string
      question: string
      question_en: string | null
      answer: string
      answer_en: string | null
      keywords: string[] | null
      is_active: boolean
      display_order: number
      created_at: Date | string
      updated_at: Date | string
    }

    const rows = category
      ? ((await sql`
          SELECT id, category, question, question_en, answer, answer_en, keywords, is_active, display_order, created_at, updated_at
          FROM faqs
          WHERE category = ${category}
          ORDER BY display_order ASC, created_at DESC;
        `) as unknown as RawFaqRow[])
      : ((await sql`
          SELECT id, category, question, question_en, answer, answer_en, keywords, is_active, display_order, created_at, updated_at
          FROM faqs
          ORDER BY category ASC, display_order ASC, created_at DESC;
        `) as unknown as RawFaqRow[])

    const faqs: FaqItem[] = rows.map((r) => ({
      id: r.id,
      category: r.category,
      question: r.question,
      questionEn: r.question_en,
      answer: r.answer,
      answerEn: r.answer_en,
      keywords: r.keywords || [],
      isActive: r.is_active,
      displayOrder: r.display_order,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))

    return { ok: true, faqs }
  } catch (error) {
    console.error('getAdminFaqs Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Database error' }
  }
}

export async function saveAdminFaq(
  input: z.infer<typeof faqInputSchema>
): Promise<{ ok: true; faqId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageFaqs) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền cập nhật FAQ' }
    }

    const data = faqInputSchema.parse(input)
    const sql = getDb()
    const id = data.id || `faq-${Date.now().toString(36)}`

    await sql`
      INSERT INTO faqs (id, category, question, question_en, answer, answer_en, keywords, is_active, display_order, updated_at)
      VALUES (
        ${id}, 
        ${data.category}, 
        ${data.question}, 
        ${data.questionEn ?? null}, 
        ${data.answer}, 
        ${data.answerEn ?? null}, 
        ${data.keywords}, 
        ${data.isActive}, 
        ${data.displayOrder},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE 
      SET 
        category = EXCLUDED.category,
        question = EXCLUDED.question,
        question_en = EXCLUDED.question_en,
        answer = EXCLUDED.answer,
        answer_en = EXCLUDED.answer_en,
        keywords = EXCLUDED.keywords,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = NOW();
    `

    return { ok: true, faqId: id }
  } catch (error) {
    console.error('saveAdminFaq Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save FAQ' }
  }
}

export async function deleteAdminFaq(
  id: string
): Promise<{ ok: true; deletedId: string } | { ok: false; error: string }> {
  try {
    const auth = await getCurrentAdmin()
    if (auth.ok && !auth.user.permissions.canManageFaqs) {
      return { ok: false, error: 'Chỉ Quản lý hoặc Super Admin mới có quyền xóa FAQ' }
    }

    const sql = getDb()
    await sql`DELETE FROM faqs WHERE id = ${id}`
    return { ok: true, deletedId: id }
  } catch (error) {
    console.error('deleteAdminFaq Server Action Error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete FAQ' }
  }
}

