<template>
  <div class="desktop-container">
    <h2 class="page-title">💰 سجل الطلبات المدفوعة</h2>

    <!-- Date Filter -->
    <div class="date-filter">
      <input type="date" v-model="fromDate" class="date-input" />
      <span>إلى</span>
      <input type="date" v-model="toDate" class="date-input" />
      <button @click="fetchOrders" class="filter-btn">
        عرض
      </button>
     <!-- Inside .export-section or below it -->
<div class="clear-section">
  <button @click="clearAllOrders" class="clear-all-btn">🧹 مسح الكل</button>
</div>

    </div>

    <!-- No orders -->
    <div v-if="orders.length === 0" class="no-orders">
      لا توجد طلبات مدفوعة في هذا النطاق الزمني.
    </div>

    <!-- Orders List -->
    <div v-else class="orders-container">
      <div class="orders-grid">
        <div
          v-for="order in orders"
          :key="order.id"
          class="order-card"
        >
          <div class="order-header">
            <p class="order-type"> نوع الطلب: {{ formatType(order.type) }}</p>
            <p class="order-time"> {{ formatTime(order.created_at) }}</p>
          </div>

          <p v-if="order.type === 'hall' && order.table_number" class="table-number">
             رقم الطاولة: {{ order.table_number }}
          </p>

          <p class="order-items"> {{ formatItems(order.items) }}</p>
          <p v-if="order.note" class="order-note"> ملاحظة: {{ order.note }}</p>

          <div class="order-actions">
            <button @click="openEdit(order)" class="edit-btn">
               تعديل
            </button>
            <button @click="printReceipt(order)" class="print-btn">
               طباعة الوصل
            </button>
            
          </div>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="revenue-section">
         المجموع الكلي: {{ totalRevenue.toLocaleString() }} دينار عراقي
      </div>

      <!-- Export Button -->
      <div class="export-section">
        <button @click="exportCSV" class="export-btn">
           تصدير CSV
        </button>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingOrder" class="modal-overlay">
      <div class="modal-container">
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
        <textarea v-model="editData.note" class="form-textarea"></textarea>

        <div class="current-items">
          <h4 class="section-title">العناصر الحالية</h4>
          <div v-for="id in editData.selectedItems" :key="id" class="current-item">
            <span>{{ getFoodName(id) }}</span>
            <input type="number" min="1" v-model.number="editData.quantities[id]" class="quantity-input" />
            <button @click="removeItem(id)" class="remove-btn">❌</button>
          </div>
        </div>

        <div class="add-item-section">
          <h4 class="section-title">➕ إضافة عنصر</h4>
          <select v-model="selectedSection" class="form-select">
            <option disabled value="">اختر القسم</option>
            <option v-for="section in sectionNames" :key="section" :value="section">{{ section }}</option>
          </select>

          <div v-if="selectedSectionFoods.length" class="available-foods">
            <div v-for="item in selectedSectionFoods" :key="item.id" class="food-item">
              <span>{{ item.name }} ({{ item.price }} د.ع)</span>
              <button @click="addItem(item)" class="add-btn">➕ أضف</button>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="saveEdit" class="save-btn"> حفظ</button>
          <button @click="editingOrder = null" class="cancel-btn">إلغاء</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'

const orders = ref([])
const foods = ref([])
const fromDate = ref('')
const toDate = ref('')
const editingOrder = ref(null)
const editData = ref({})
const selectedSection = ref('')

onMounted(() => {
  fetchFoods()
  fetchOrders()
})

async function fetchOrders() {
  const query = new URLSearchParams({ status: 'paid', paid: 1 })
  if (fromDate.value) query.append('from', fromDate.value)
  if (toDate.value) query.append('to', toDate.value)

  const res = await fetch(`/api/orders?${query.toString()}`)

  orders.value = await res.json()
}

async function fetchFoods() {
  const res = await fetch('/api/foods')

  foods.value = await res.json()
}

function formatItems(rawItems) {
  try {
    let parsed = rawItems
    if (typeof parsed === 'string') parsed = JSON.parse(parsed)
    if (typeof parsed === 'string') parsed = JSON.parse(parsed)

    return parsed.map(i => {
      const food = foods.value.find(f => f.id === i.id)
      const name = food ? food.name : `عنصر #${i.id}`
      return `${i.qty} × ${name}`
    }).join('، ')
  } catch (err) {
    console.error('❌ Failed to parse items:', rawItems, err)
    return rawItems
  }
}

function getFoodName(id) {
  const food = foods.value.find(f => f.id === id)
  return food ? food.name : `#${id}`
}

function formatType(type) {
  return type === 'pickup' ? 'استلام من المحل'
       : type === 'hall' ? 'من داخل الصالة'
       : type === 'external' ? 'توصيل خارجي'
       : type
}

function formatTime(time) {
  return new Date(time).toLocaleString('ar-IQ')
}

const totalRevenue = computed(() => {
  return orders.value.reduce((sum, order) => {
    try {
      let items = order.items
      if (typeof items === 'string') {
        items = JSON.parse(items)
        if (typeof items === 'string') {
          items = JSON.parse(items)
        }
      }

      return sum + items.reduce((acc, item) => {
        const food = foods.value.find(f => f.id === item.id)
        return acc + (food ? food.price * item.qty : 0)
      }, 0)
    } catch (err) {
      console.error('❌ Revenue parse error:', order.items, err)
      return sum
    }
  }, 0)
})


function exportCSV() {
  const headers = ['ID', 'نوع الطلب', 'رقم الطاولة', 'الوجبات', 'الملاحظات', 'الوقت', 'السعر الكلي']
  const rows = orders.value.map(order => {
    let items = []
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      if (typeof items === 'string') items = JSON.parse(items)
    } catch {}

    const orderTotal = items.reduce((sum, item) => {
      const food = foods.value.find(f => f.id === item.id)
      return sum + (food ? food.price * item.qty : 0)
    }, 0)

    return [
      order.id,
      formatType(order.type),
      order.type === 'hall' ? order.table_number || '' : '',
      formatItems(order.items),
      order.note || '',
      formatTime(order.created_at),
      orderTotal.toLocaleString()
    ]
  })

  // ➕ Add final total revenue as last row
  const finalTotal = totalRevenue.value.toLocaleString()
  rows.push([])
  rows.push(['', '', '', '', '', 'المجموع الكلي', finalTotal])

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'paid_orders.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


function openEdit(order) {
  let parsedItems
  try {
    parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    if (typeof parsedItems === 'string') parsedItems = JSON.parse(parsedItems)
  } catch {
    parsedItems = []
  }

  editingOrder.value = order
  editData.value = {
    type: order.type,
    note: order.note,
    table_number: order.table_number || '',
    selectedItems: parsedItems.map(i => i.id),
    quantities: Object.fromEntries(parsedItems.map(i => [i.id, i.qty]))
  }
  selectedSection.value = ''
}

function removeItem(id) {
  editData.value.selectedItems = editData.value.selectedItems.filter(itemId => itemId !== id)
  delete editData.value.quantities[id]
}

function addItem(item) {
  if (!editData.value.selectedItems.includes(item.id)) {
    editData.value.selectedItems.push(item.id)
    editData.value.quantities[item.id] = 1
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
    items: JSON.stringify(items),
    table_number: editData.value.type === 'hall' ? editData.value.table_number : null
  }

  await fetch(`/api/orders/${editingOrder.value.id}`, {

    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  editingOrder.value = null
  await fetchOrders()
}

const foodsBySection = computed(() => {
  const grouped = {}
  for (const food of foods.value) {
    const section = food.section_name || 'غير محدد'
    if (!grouped[section]) grouped[section] = []
    grouped[section].push(food)
  }
  return Object.entries(grouped).map(([name, items]) => ({ name, items }))
})

async function printReceipt(order) {
  try {
    let parsedItems = order.items
    if (typeof parsedItems === 'string') parsedItems = JSON.parse(parsedItems)
    if (typeof parsedItems === 'string') parsedItems = JSON.parse(parsedItems)

    const enrichedItems = parsedItems.map(i => {
      const food = foods.value.find(f => f.id === i.id)
      return {
        name: food?.name || `عنصر #${i.id}`,
        qty: i.qty,
        price: food?.price || 0,
      }
    })

    const res = await fetch('/api/print', {

      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify({ ...order, items: enrichedItems }),
    })

    if (!res.ok) throw new Error('❌ فشل في طباعة الوصل')
    alert('✅ تم طباعة الوصل بنجاح')
  } catch (err) {
    console.error(err)
    alert('❌ حدث خطأ أثناء الطباعة')
  }
}

const sectionNames = computed(() => foodsBySection.value.map(s => s.name))

const selectedSectionFoods = computed(() => {
  const section = foodsBySection.value.find(s => s.name === selectedSection.value)
  return section ? section.items : []
})

async function clearAllOrders() {
  if (!confirm('هل أنت متأكد من حذف جميع الطلبات المدفوعة؟')) return

  try {
    const res = await fetch('/api/orders/paid/all', {

      method: 'DELETE'
    })

    if (!res.ok) throw new Error('فشل الحذف')
    orders.value = []
  } catch (err) {
    alert('❌ فشل حذف جميع الطلبات')
    console.error(err)
  }
}
</script>


<style scoped>
/* Main Layout - Full Width Desktop */
.desktop-container {
  width: calc(100vw - 280px); /* Reserve space for sidebar */
  margin-right: 280px;         /* Push content to the left of sidebar */
  min-height: 100vh;
  padding: 10rem;
  background: #f8f9fa;
  direction: rtl;
  font-family: 'Tajawal', sans-serif;
  box-sizing: border-box;
}


.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
  font-family: 'Tajawal', sans-serif;
  width: 100%;
}

/* Date Filter - Full Width */
.date-filter {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  font-family: 'Tajawal', sans-serif;
}

.date-input {
  border: 1px solid #ddd;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 180px;
  font-family: 'Tajawal', sans-serif;
}

.filter-btn {
  background: #7b4f35;
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: 'Tajawal', sans-serif;
}

.filter-btn:hover {
  background: #6d4329;
  transform: translateY(-2px);
}

/* No Orders State */
.no-orders {
  text-align: center;
  color: #6c757d;
  margin-top: 4rem;
  font-size: 1.2rem;
  font-family: 'Tajawal', sans-serif;
  width: 100%;
}

/* Orders Layout - Full Width Grid */
.orders-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 2rem;
  width: 100%;
}

/* Order Card - Expanded */
.order-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  font-family: 'Tajawal', sans-serif;
  margin: 0;
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;
}

.order-type {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
  font-family: 'Tajawal', sans-serif;
}

.order-time {
  font-size: 0.9rem;
  color: #6c757d;
  font-family: 'Tajawal', sans-serif;
}

.table-number {
  font-size: 1rem;
  color: #495057;
  margin-bottom: 1rem;
  font-family: 'Tajawal', sans-serif;
}

.order-items {
  font-size: 1.1rem;
  color: #2c3e50;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-family: 'Tajawal', sans-serif;
}

.order-note {
  font-size: 1rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-family: 'Tajawal', sans-serif;
}

.order-actions {
  display: flex;
  gap: 1rem;
  justify-content: start;
  width: 100%;
}

.edit-btn, .print-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: 'Tajawal', sans-serif;
}

.edit-btn {
  background: #ffc107;
  color: white;
}

.edit-btn:hover {
  background: #ffb301;
  transform: translateY(-2px);
}

.print-btn {
  background: #007bff;
  color: white;
}

.print-btn:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

/* Revenue Section - Full Width */
.revenue-section {
  display: flex;
  justify-content: start;
  width: 100%;
  padding: 2rem;
  border-top: 2px solid #e9ecef;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-family: 'Tajawal', sans-serif;
}

.export-section {
  display: flex;
  justify-content: start;
  width: 100%;
}

.export-btn {
  background: #28a745;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Tajawal', sans-serif;
}

.export-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: 'Tajawal', sans-serif;
}

.modal-container {
  background: white;
  width: 90%;
  max-width: none;
  max-height: 90vh;
  padding: 2rem;
  border-radius: 12px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  font-family: 'Tajawal', sans-serif;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  grid-column: 1 / -1;
  font-family: 'Tajawal', sans-serif;
}

.form-label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-family: 'Tajawal', sans-serif;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.8rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  font-family: 'Tajawal', sans-serif;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.current-items {
  grid-column: 1 / -1;
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #7b4f35;
  margin-bottom: 1rem;
  font-family: 'Tajawal', sans-serif;
}

.current-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-family: 'Tajawal', sans-serif;
}

.quantity-input {
  width: 80px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: 'Tajawal', sans-serif;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
}

.add-item-section {
  grid-column: 1 / -1;
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.available-foods {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-family: 'Tajawal', sans-serif;
}

.add-btn {
  background: none;
  border: none;
  color: #28a745;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  font-family: 'Tajawal', sans-serif;
}

.modal-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: end;
  gap: 1rem;
  margin-top: 1rem;
  width: 100%;
}

.save-btn, .cancel-btn {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: 'Tajawal', sans-serif;
}

.save-btn {
  background: #28a745;
  color: white;
}

.save-btn:hover {
  background: #218838;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

/* Ensure full width for all elements */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}


.clear-all-btn {
  background-color: #c0392b; /* strong red */
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin: 20px auto;
  display: block;
  transition: background-color 0.3s ease;
}

.clear-all-btn:hover {
  background-color: #a93226;
}



</style>