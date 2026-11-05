'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { hashPassword, verifyPassword, generateSessionToken } from '@/lib/auth-crypto'
import { getRolePermissions } from '@/lib/auth-permissions'
import type { AdminUser, LoginCredentials, ChangePasswordInput } from '@/types/admin'

const loginSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập hoặc email phải từ 3 ký tự trở lên'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Mật khẩu hiện tại không hợp lệ'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
})

const SESSION_COOKIE_NAME = 'pml_admin_session'
const SESSION_DURATION_DAYS = 7

interface RawAdminUserRow {
  id: string
  username: string
  email: string
  password_hash: string
  salt: string
  full_name: string
  role: string
  branch_id: string | null
  branch_name: string | null
  is_active: boolean
  last_login_at: string | Date | null
  created_at: string | Date
}

function formatIso(val: string | Date | null | undefined): string | null {
  if (!val) return null
  if (typeof val === 'string') return val
  return val.toISOString()
}

/**
 * 1. Đăng nhập Admin / Nhân viên vận hành
 * - Xác thực username/email và mật khẩu với PBKDF2
 * - Khởi tạo session trong database
 * - Thiết lập Secure HttpOnly Cookie
 */
export async function loginAdmin(
  rawInput: LoginCredentials
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  try {
    const input = loginSchema.parse(rawInput)
    const sql = getDb()

    // Query user by username or email
    const users = (await sql`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.salt,
        u.full_name,
        u.role,
        u.branch_id,
        b.name AS branch_name,
        u.is_active,
        u.last_login_at,
        u.created_at
      FROM admin_users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE (u.username = ${input.username} OR u.email = ${input.username})
      LIMIT 1;
    `) as unknown as RawAdminUserRow[]

    if (!users || users.length === 0) {
      return { ok: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác' }
    }

    const user = users[0]

    if (!user.is_active) {
      return { ok: false, error: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.' }
    }

    // Verify password hash
    const isValid = verifyPassword(input.password, user.password_hash, user.salt)
    if (!isValid) {
      return { ok: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác' }
    }

    // Generate session token
    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

    // Save session in Neon DB
    await sql`
      INSERT INTO admin_sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()});
    `

    // Update last_login_at
    await sql`
      UPDATE admin_users
      SET last_login_at = NOW()
      WHERE id = ${user.id};
    `

    // Log admin activity
    try {
      await sql`
        INSERT INTO admin_activity_logs (admin_name, action, entity_type, entity_id, details)
        VALUES (
          ${user.full_name},
          'LOGIN',
          'BOOKING', -- general admin category
          ${user.id},
          ${JSON.stringify({ username: user.username, role: user.role })}
        );
      `
    } catch {}

    // Set secure HttpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

    const adminUser: AdminUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role as AdminUser['role'],
      branchId: user.branch_id,
      branchName: user.branch_name,
      isActive: user.is_active,
      lastLoginAt: new Date().toISOString(),
      createdAt: formatIso(user.created_at) || new Date().toISOString(),
      permissions: getRolePermissions(user.role as AdminUser['role']),
    }

    return { ok: true, user: adminUser }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi đăng nhập'
    console.error('loginAdmin error:', err)
    return { ok: false, error: errorMsg }
  }
}

/**
 * 2. Lấy thông tin tài khoản Admin đang đăng nhập hiện tại
 * - Xác thực token từ HttpOnly Cookie với Neon DB
 * - Tự động dọn dẹp nếu session hết hạn
 */
export async function getCurrentAdmin(): Promise<
  { ok: true; user: AdminUser } | { ok: false; error: string }
> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return { ok: false, error: 'Chưa đăng nhập' }
    }

    const sql = getDb()

    const users = (await sql`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.branch_id,
        b.name AS branch_name,
        u.is_active,
        u.last_login_at,
        u.created_at
      FROM admin_sessions s
      JOIN admin_users u ON s.user_id = u.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE s.session_token = ${token}
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
      LIMIT 1;
    `) as unknown as RawAdminUserRow[]

    if (!users || users.length === 0) {
      // Invalid or expired token: clear cookie
      cookieStore.delete(SESSION_COOKIE_NAME)
      return { ok: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }
    }

    const user = users[0]

    const adminUser: AdminUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role as AdminUser['role'],
      branchId: user.branch_id,
      branchName: user.branch_name,
      isActive: user.is_active,
      lastLoginAt: formatIso(user.last_login_at),
      createdAt: formatIso(user.created_at) || new Date().toISOString(),
      permissions: getRolePermissions(user.role as AdminUser['role']),
    }

    return { ok: true, user: adminUser }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err
    }
    return { ok: false, error: 'Chưa đăng nhập' }
  }
}

/**
 * 3. Đăng xuất Admin
 * - Xoá session trong database
 * - Xoá HttpOnly Cookie
 */
export async function logoutAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      const sql = getDb()
      await sql`DELETE FROM admin_sessions WHERE session_token = ${token};`
      cookieStore.delete(SESSION_COOKIE_NAME)
    }

    return { ok: true }
  } catch (err: unknown) {
    console.error('logoutAdmin error:', err)
    return { ok: false, error: 'Lỗi khi đăng xuất' }
  }
}

/**
 * 4. Đổi mật khẩu tài khoản Admin
 */
export async function changeAdminPassword(
  rawInput: ChangePasswordInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const input = changePasswordSchema.parse(rawInput)
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return { ok: false, error: 'Chưa đăng nhập' }
    }

    const sql = getDb()

    // Get current user and password hash
    const users = (await sql`
      SELECT u.id, u.password_hash, u.salt, u.full_name
      FROM admin_sessions s
      JOIN admin_users u ON s.user_id = u.id
      WHERE s.session_token = ${token} AND s.expires_at > NOW()
      LIMIT 1;
    `) as { id: string; password_hash: string; salt: string; full_name: string }[]

    if (!users || users.length === 0) {
      return { ok: false, error: 'Phiên đăng nhập đã hết hạn' }
    }

    const user = users[0]

    // Verify current password
    const isCurrentValid = verifyPassword(input.currentPassword, user.password_hash, user.salt)
    if (!isCurrentValid) {
      return { ok: false, error: 'Mật khẩu hiện tại không chính xác' }
    }

    // Hash new password
    const { hash: newHash, salt: newSalt } = hashPassword(input.newPassword)

    await sql`
      UPDATE admin_users
      SET 
        password_hash = ${newHash},
        salt = ${newSalt},
        updated_at = NOW()
      WHERE id = ${user.id};
    `

    return { ok: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu'
    console.error('changeAdminPassword error:', err)
    return { ok: false, error: errorMsg }
  }
}

