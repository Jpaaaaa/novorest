// utils/printerService.js (on VPS)

import { generateReceiptHTML } from './templates/receiptTemplate.js'

export async function printOrderReceipt(order) {
  try {
    const html = generateReceiptHTML(order)
    return html
  } catch (err) {
    console.error('❌ Failed to generate receipt HTML:', err)
    throw err
  }
}
