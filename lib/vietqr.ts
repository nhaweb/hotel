/**
 * PML Boutique & Lifestyle Hotel
 * VietQR / NAPAS 24/7 QR Code Generator
 */

import type { VietQrPaymentDetails } from '@/types/booking-engine'

const DEFAULT_BANK_ID = process.env.VIETQR_BANK_ID || 'MB'
const DEFAULT_ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || '0789780167'
const DEFAULT_ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || 'PML BOUTIQUE HOTEL'

const BANK_NAMES: Record<string, string> = {
  MB: 'Ngân hàng TMCP Quân Đội (MB Bank)',
  VCB: 'Ngân hàng TMCP Ngoại Thương (Vietcombank)',
  TCB: 'Ngân hàng TMCP Kỹ Thương (Techcombank)',
  ACB: 'Ngân hàng TMCP Á Châu (ACB)',
  BIDV: 'Ngân hàng TMCP Đầu tư & Phát triển (BIDV)',
  VPB: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
  TPB: 'Ngân hàng TMCP Tiên Phong (TPBank)',
}

export function generateVietQrDetails(options: {
  bookingCode: string
  amountVnd: number
  expiresInMinutes?: number
}): VietQrPaymentDetails {
  const bankId = DEFAULT_BANK_ID
  const accountNo = DEFAULT_ACCOUNT_NO
  const accountName = DEFAULT_ACCOUNT_NAME
  const amount = Math.max(0, Math.round(options.amountVnd))
  const description = options.bookingCode.toUpperCase()

  const encodedAccountName = encodeURIComponent(accountName)
  const encodedDesc = encodeURIComponent(description)

  // Standard VietQR image URL
  const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodedDesc}&accountName=${encodedAccountName}`

  const expiresAt = new Date(Date.now() + (options.expiresInMinutes || 15) * 60 * 1000).toISOString()

  return {
    bankId,
    bankName: BANK_NAMES[bankId] || bankId,
    accountNo,
    accountName,
    amountVnd: amount,
    description,
    qrImageUrl,
    expiresAt,
  }
}

