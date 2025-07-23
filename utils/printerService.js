import fetch from 'node-fetch' // make sure it's installed!
import { generateReceiptHTML } from './templates/receiptTemplate.js'

export async function printOrderReceipt(order) {
  try {
    const html = generateReceiptHTML(order)

    const response = await fetch('http://192.168.101.12:8989/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })

    if (!response.ok) {
      throw new Error(`❌ Local printer error: ${await response.text()}`)
    }

    console.log('✅ Sent to local printer')
    return true
  } catch (err) {
    console.error('❌ Failed to print via local listener:', err)
    throw err
  }
}
