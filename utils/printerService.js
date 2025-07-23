// utils/printerService.js (VPS side)
export async function printOrderReceipt(order) {
  try {
    // ✅ Just return raw order data — no HTML needed
    return order
  } catch (err) {
    console.error('❌ Failed to prepare print payload:', err)
    throw err
  }
}
