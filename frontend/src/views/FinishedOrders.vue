<template>
  <div class="container">
    <h2 class="page-title">📋 الطلبات المنجزة</h2>

    <!-- No orders -->
    <div v-if="orders.length === 0" class="no-orders">
      لا توجد طلبات حالياً.
    </div>

    <!-- Orders List -->
    <div v-else class="orders-grid">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >
        <div class="order-header">
          <p class="order-type">نوع الطلب: {{ formatType(order.type) }}</p>
          <p class="order-time">🕒 {{ formatTime(order.created_at) }}</p>
        </div>

        <p class="order-items">🧾 {{ formatItems(order.items) }}</p>

        <p v-if="order.note" class="order-note">🗒️ ملاحظة: {{ order.note }}</p>

        <p
          v-if="order.type === 'hall' && order.table_number"
          class="table-number"
        >
          🪑 رقم الطاولة: {{ order.table_number }}
        </p>

        <p class="order-total">
          💵 المجموع: {{ calculateOrderTotal(order.items).toLocaleString() }} دينار
        </p>

        <div class="order-actions">
          <button
            @click="confirmMarkAsPaid(order.id)"
            class="btn btn-pay"
          >
            💵 تأكيد الدفع
          </button>

          <button
            @click="openEdit(order)"
            class="btn btn-edit"
          >
            ✏️ تعديل
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingOrder" class="modal-overlay">
      <div class="modal-content">
        <h3 class="modal-title">تعديل الطلب #{{ editingOrder.id }}</h3>

        <label class="form-label">نوع الطلب</label>
        <select v-model="editData.type" class="form-select">
          <option value="pickup">استلام من المحل</option>
          <option value="external">توصيل خارجي</option>
          <option value="hall">من داخل الصالة</option>
        </select>

        <label v-if="editData.type === 'hall'" class="form-label">رقم الطاولة</label>
        <input
          v-if="editData.type === 'hall'"
          v-model="editData.table_number"
          type="number"
          placeholder="أدخل رقم الطاولة"
          class="form-input"
        />

        <label class="form-label">ملاحظات</label>
        <textarea v-model="editData.note" class="form-textarea" rows="3"></textarea>

        <div v-for="section in foodsBySection" :key="section.name" class="food-section">
          <h4 class="section-title">📂 {{ section.name }}</h4>
          <div v-for="item in section.items" :key="item.id" class="food-item">
            <label class="food-label">
              <input type="checkbox" v-model="editData.selectedItems" :value="item.id" />
              {{ item.name }} <span class="food-price">({{ item.price }} د.ع)</span>
            </label>
            <input
              type="number"
              min="1"
              v-model.number="editData.quantities[item.id]"
              :disabled="!editData.selectedItems.includes(item.id)"
              class="quantity-input"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button @click="saveEdit" class="btn btn-save">💾 حفظ</button>
          <button @click="editingOrder = null" class="btn btn-cancel">إغلاق</button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-content">
        <p class="confirm-text">هل أنت متأكد من تأكيد الدفع لهذا الطلب؟</p>
        <div class="confirm-actions">
          <button
            class="btn btn-confirm"
            @click="markAsPaid(confirmId)"
          >
            نعم
          </button>
          <button
            class="btn btn-cancel"
            @click="showConfirm = false"
          >
            لا
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const orders = ref([])
const foods = ref([])
const editingOrder = ref(null)
const editData = ref({})
const showConfirm = ref(false)
const confirmId = ref(null)

onMounted(() => {
  fetchFoods()
  fetchOrders()
})

async function fetchOrders() {
  const res = await fetch('/api/orders?status=done&paid=0')

  orders.value = await res.json()
}

async function fetchFoods() {
  const res = await fetch('/api/foods')

  foods.value = await res.json()
}

function formatItems(rawItems) {
  try {
    const parsed = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems
    return parsed
      .map(i => {
        const food = foods.value.find(f => f.id === i.id)
        const name = food ? food.name : `#${i.id}`
        return `${i.qty}x ${name}`
      })
      .join('، ')
  } catch {
    return rawItems
  }
}

function formatTime(time) {
  return new Date(time).toLocaleString('ar-IQ')
}

function formatType(type) {
  return type === 'pickup' ? 'استلام' : type === 'hall' ? 'من داخل الصالة' : 'توصيل خارجي'
}

function calculateOrderTotal(rawItems) {
  try {
    const parsed = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems
    return parsed.reduce((acc, item) => {
      const food = foods.value.find(f => f.id === item.id)
      return acc + (food ? food.price * item.qty : 0)
    }, 0)
  } catch {
    return 0
  }
}

function openEdit(order) {
  try {
    const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    editingOrder.value = order
    editData.value = {
      type: order.type,
      note: order.note,
      table_number: order.table_number || '',
      selectedItems: parsedItems.map(i => i.id),
      quantities: Object.fromEntries(parsedItems.map(i => [i.id, i.qty]))
    }
  } catch (err) {
    console.error('❌ Failed to parse order items:', err)
  }
}

async function saveEdit() {
  const items = editData.value.selectedItems.map(id => ({
    id,
    qty: editData.value.quantities[id] || 1
  }))

  const payload = {
    type: editData.value.type,
    note: editData.value.note,
    items: JSON.stringify(items)
  }

  if (editData.value.type === 'hall') {
    payload.table_number = editData.value.table_number
  }

  await fetch(`/api/orders/${editingOrder.value.id}`, {

    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  editingOrder.value = null
  fetchOrders()
}

function confirmMarkAsPaid(id) {
  confirmId.value = id
  showConfirm.value = true
}

async function markAsPaid(id) {
  console.log('🔘 markAsPaid triggered with ID:', id)
  try {
    const res = await fetch(`/api/orders/${id}/paid`, {

      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // ✅ Required even if empty
    })

    if (!res.ok) throw new Error('❌ Failed to mark as paid')

    let result = {}
    try {
      result = await res.json()
    } catch {
      console.warn('⚠️ No JSON in response — likely 204 No Content')
    }

    console.log('✅ Order marked as paid:', result)
    await fetchOrders()
    showConfirm.value = false
  } catch (err) {
    console.error('❌ Error marking as paid:', err)
    alert('فشل تأكيد الدفع')
    showConfirm.value = false
  }
}

const foodsBySection = computed(() => {
  const sections = {}
  for (const f of foods.value) {
    const s = f.section_name || 'غير محدد'
    if (!sections[s]) sections[s] = []
    sections[s].push(f)
  }
  return Object.entries(sections).map(([name, items]) => ({ name, items }))
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');

* {
  font-family: 'Tajawal', sans-serif;
}

.container {
  width: 100%;
  max-width: 1920px;
  min-width: 1400px;
  margin: 0 auto; /* ✅ Center it horizontally */
  padding: 2rem 3rem;
  min-height: 100vh;
  background: #f8f9fa;
  direction: rtl;
  box-sizing: border-box;
  font-family: 'Tajawal', sans-serif;
  overflow-x: hidden;
}




.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2.5rem;
  color: #2c3e50;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.no-orders {
  text-align: center;
  color: #6c757d;
  font-size: 1.5rem;
  margin-top: 4rem;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: none;
  margin: 0;
  font-family: 'Tajawal', sans-serif;
}

.order-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.order-type {
  font-weight: 600;
  font-size: 1.2rem;
  color: #2c3e50;
  font-family: 'Tajawal', sans-serif;
}

.order-time {
  font-size: 1rem;
  color: #6c757d;
  font-family: 'Tajawal', sans-serif;
}

.order-items {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #495057;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.order-note {
  font-size: 1rem;
  color: #495057;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.table-number {
  font-size: 1rem;
  color: #495057;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #e3f2fd;
  border-radius: 6px;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.order-total {
  font-size: 1.5rem;
  font-weight: 600;
  color: #28a745;
  margin-bottom: 1.5rem;
  text-align: left;
  padding: 1rem;
  background: #f8fff9;
  border-radius: 6px;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.order-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: flex-start;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
  font-family: 'Tajawal', sans-serif;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: 'Tajawal', sans-serif;
}

.modal-content {
  background: white;
  width: 95vw;
  max-width: none;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 95vh;
  overflow-y: auto;
  direction: rtl;
  font-family: 'Tajawal', sans-serif;
}

.modal-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #2c3e50;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-family: 'Tajawal', sans-serif;
}

.form-select, .form-input, .form-textarea {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  font-family: 'Tajawal', sans-serif;
}

.food-section {
  margin-bottom: 2rem;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.section-title {
  font-weight: bold;
  color: #7b4f35;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  font-family: 'Tajawal', sans-serif;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.food-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  cursor: pointer;
  font-size: 1.1rem;
  font-family: 'Tajawal', sans-serif;
}

.food-price {
  font-size: 0.9rem;
  color: #6c757d;
  font-family: 'Tajawal', sans-serif;
}

.quantity-input {
  width: 100px;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  text-align: center;
  font-size: 1rem;
  font-family: 'Tajawal', sans-serif;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  font-family: 'Tajawal', sans-serif;
}

.confirm-content {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 600px;
  text-align: center;
  direction: rtl;
  font-family: 'Tajawal', sans-serif;
}

.confirm-text {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 3rem;
  color: #2c3e50;
  font-family: 'Tajawal', sans-serif;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-family: 'Tajawal', sans-serif;
}

@media (min-width: 1600px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(650px, 1fr));
  }
  
  .container {
    padding: 3rem 4rem;
  }
  
  .order-card {
    padding: 2.5rem;
  }
}

@media (min-width: 1920px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(750px, 1fr));
    gap: 3rem;
  }
  
  .container {
    padding: 4rem 5rem;
  }
  
  .btn {
    padding: 1.25rem 2.5rem;
    font-size: 1.2rem;
    min-width: 180px;
  }
}
</style>