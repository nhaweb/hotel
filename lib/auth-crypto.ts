import crypto from 'crypto'

/**
 * Hash a password using PBKDF2 with SHA-512 and 100,000 iterations
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return { hash, salt }
}

/**
 * Verify a plain password against the stored hash and salt with timing-safe comparison
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    const hashBuf = Buffer.from(hash, 'hex')
    const verifyBuf = Buffer.from(verifyHash, 'hex')
    if (hashBuf.length !== verifyBuf.length) {
      return false
    }
    return crypto.timingSafeEqual(hashBuf, verifyBuf)
  } catch {
    return false
  }
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

