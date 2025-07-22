<template>
  <div class="max-w-3xl mx-auto py-8 space-y-6">
    <h2 class="text-2xl font-bold text-center"> الطلبات المعلقة</h2>

    <div v-if="loading" class="text-center text-gray-600"> جارِ التحميل...</div>

    <div v-else-if="orders.length === 0" class="text-center text-gray-500">
      لا توجد طلبات حالياً.
    </div>

    <div v-else class="orders-grid">
      <div v-for="order in orders" :key="order.id" class="bg-white p-4 rounded shadow">
        <p class="text-lg font-semibold">طلب #{{ order.id }}</p>
        <p>النوع: {{ formatType(order.type) }}</p>
        <p v-if="order.type === 'hall' && order.table_number">رقم الطاولة: {{ order.table_number }}</p>
        <p>ملاحظات: {{ order.note || '—' }}</p>

        <ul class="list-disc list-inside my-2">
          <li v-for="item in parseItems(order.items)" :key="item.id">
             {{ getFoodName(item.id) }} × {{ item.qty }}
          </li>
        </ul>

        <p class="text-right font-bold mt-2">
           المجموع: {{ getOrderTotal(order) }} د.ع
        </p>

        <div class="flex gap-3 mt-3">
          <button @click="openEdit(order)" class="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-4 rounded">
             تعديل
          </button>
          <button @click="markAsLive(order.id)" class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded">
             قبول الطلب
          </button>
          <button @click="confirmCancel(order.id)" class="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded">
             إلغاء الطلب
          </button>
        </div>

        <div v-if="cancelId === order.id" class="mt-3 p-3 border border-red-300 rounded bg-red-50 text-sm text-red-800">
          هل أنت متأكد أنك تريد إلغاء هذا الطلب؟
          <div class="mt-2 flex gap-2">
            <button @click="cancelOrder(order.id)" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">نعم</button>
            <button @click="cancelId = null" class="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded">لا</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingOrder" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-2xl p-6 rounded-lg overflow-y-auto max-h-[90vh]">
        <h3 class="text-xl font-bold mb-4">تعديل الطلب #{{ editingOrder.id }}</h3>

        <label class="block font-semibold mb-1">نوع الطلب</label>
        <select v-model="editData.type" class="w-full border rounded p-2 mb-4">
          <option value="pickup">استلام من المحل</option>
          <option value="external">توصيل خارجي</option>
          <option value="hall">من داخل الصالة</option>
        </select>

        <!-- Table number (only for hall) -->
        <div v-if="editData.type === 'hall'" class="mb-4">
          <label class="block font-semibold mb-1">رقم الطاولة</label>
          <input type="number" v-model="editData.table_number" min="1" class="w-full border rounded p-2" />
        </div>

        <label class="block font-semibold mb-1">ملاحظات</label>
        <textarea v-model="editData.note" class="w-full border rounded p-2 mb-4"></textarea>

        <!-- Selected items list -->
        <div class="mb-6">
          <h4 class="font-bold text-[#7b4f35] mb-2">العناصر الحالية</h4>
          <div v-for="id in editData.selectedItems" :key="id" class="flex justify-between mb-2">
            <span>{{ getFoodName(id) }}</span>
            <input type="number" min="1" v-model.number="editData.quantities[id]" class="w-16 border rounded px-2" />
          </div>
        </div>

        <!-- Add item section -->
        <div class="border-t pt-4 mt-4">
          <h4 class="font-bold mb-2">➕ إضافة عنصر</h4>
          <select v-model="selectedSection" class="w-full border rounded p-2 mb-3">
            <option disabled value="">اختر القسم</option>
            <option v-for="section in sectionNames" :key="section" :value="section">{{ section }}</option>
          </select>

          <div v-if="selectedSectionFoods.length" class="space-y-2">
            <div v-for="item in selectedSectionFoods" :key="item.id" class="flex justify-between">
              <span>{{ item.name }} ({{ item.price }} د.ع)</span>
              <button @click="addItem(item)" class="text-green-600 font-semibold">➕ أضف</button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button @click="saveEdit" class="bg-green-600 text-white px-4 py-2 rounded"> حفظ</button>
          <button @click="editingOrder = null" class="bg-gray-400 text-white px-4 py-2 rounded">إلغاء</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { io } from 'socket.io-client'

const API_URL = 'http://localhost:3000'
const socket = io(API_URL)

// 🛒 Data
const orders = ref([])
const foods = ref([])
const loading = ref(true)
const cancelId = ref(null)
const editingOrder = ref(null)
const editData = ref({})
const selectedSection = ref('')
const previousOrderCount = ref(0)

// 🔊 Notification
const playNotification = () => {
  const audio = new Audio('/notification.wav')
  audio.play().catch(err => console.warn('🔇 Audio error:', err))
}

// 🌐 On mount
onMounted(async () => {
  await Promise.all([fetchOrders(), fetchFoods()])

  socket.on('newOrder', (order) => {
    if (order.status === 'pending') {
      orders.value.unshift(order)
      playNotification()
      previousOrderCount.value = orders.value.length
    }
  })

  loading.value = false
})

// 🔌 Disconnect
onBeforeUnmount(() => {
  socket.disconnect()
})

// 📦 Orders
async function fetchOrders() {
  const res = await fetch(`${API_URL}/api/orders?status=pending`)
  const data = await res.json()
  orders.value = data
  previousOrderCount.value = data.length
}

// 🍔 Foods
async function fetchFoods() {
  const res = await fetch(`${API_URL}/api/foods`)
  foods.value = await res.json()
}

// 🧠 Helpers
function parseItems(str) {
  try {
    const parsed = JSON.parse(str)
    return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
  } catch {
    return []
  }
}

function getFoodName(id) {
  const item = foods.value.find(f => f.id === Number(id))
  return item ? item.name : `#${id}`
}

function getOrderTotal(order) {
  const items = parseItems(order.items)
  return items.reduce((sum, item) => {
    const food = foods.value.find(f => f.id === item.id)
    return sum + (food?.price || 0) * item.qty
  }, 0)
}

function formatType(type) {
  return type === 'pickup' ? 'استلام من المحل' : type === 'hall' ? 'من داخل الصالة' : 'توصيل خارجي'
}

// ✅ Actions
async function markAsLive(orderId) {
  await fetch(`${API_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'live' })
  })
  await fetchOrders()
}

function confirmCancel(orderId) {
  cancelId.value = orderId
}

async function cancelOrder(orderId) {
  await fetch(`${API_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'canceled' })
  })
  await fetchOrders()
  cancelId.value = null
}

// ✏️ Edit
function openEdit(order) {
  const parsedItems = parseItems(order.items)
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

async function saveEdit() {
  const items = editData.value.selectedItems.map(id => ({
    id,
    qty: editData.value.quantities[id] || 1
  }))

  const payload = {
    type: editData.value.type,
    note: editData.value.note,
    items: JSON.stringify(items),
    tableNumber: editData.value.type === 'hall' ? editData.value.table_number : null
  }

  await fetch(`${API_URL}/api/orders/${editingOrder.value.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  editingOrder.value = null
  await fetchOrders()
}

// 🍽️ Computed
const foodsBySection = computed(() => {
  const grouped = {}
  for (const food of foods.value) {
    const section = food.section_name || 'غير محدد'
    if (!grouped[section]) grouped[section] = []
    grouped[section].push(food)
  }
  return Object.entries(grouped).map(([name, items]) => ({ name, items }))
})

const sectionNames = computed(() => foodsBySection.value.map(s => s.name))

const selectedSectionFoods = computed(() => {
  const section = foodsBySection.value.find(s => s.name === selectedSection.value)
  return section ? section.items : []
})

function addItem(item) {
  if (!editData.value.selectedItems.includes(item.id)) {
    editData.value.selectedItems.push(item.id)
    editData.value.quantities[item.id] = 1
  }
}
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap');

* {
  font-family: 'Cairo', 'Tahoma', sans-serif;
  direction: rtl;
}

/* Full-width container */
.max-w-3xl {
  width: 100%;
  min-width: 1400px;
  max-width: 1920px;
  padding: 2rem 4rem;
  margin: 0;
  background-color: #F8F6F4;
}

/* Header */
h2 {
  font-size: 2.5rem;
  font-weight: bold;
  color: #4E342E;
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #E0E0E0;
}

/* Loading and Empty States */
.text-center {
  font-size: 1.5rem;
  padding: 3rem;
  color: #7C7C7C;
}

/* Orders Grid Layout - full width */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 2rem;
  width: 100%;
}

/* Order Cards - expanded */
.bg-white {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
  border: 1px solid #E0E0E0;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bg-white:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.15);
}

/* Order header */
.text-lg {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4E342E;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #F0F0F0;
}

/* Order details */
p {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

/* Items list */
.list-disc {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  background: #F8F6F4;
  border-radius: 0.75rem;
  padding: 1.5rem;
  flex-grow: 1;
}

.list-disc li {
  font-size: 1.1rem;
  color: #4E342E;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #E8E8E8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.list-disc li:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

/* Total price */
.font-bold {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4E342E;
  background: #F0F8FF;
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: center;
  margin: 1.5rem 0;
}

/* Action buttons */
.flex.gap-3 {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

button:hover {
  transform: translateY(-0.125rem);
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
}

.bg-yellow-500 {
  background: #FFA726;
  color: #4E342E;
}

.bg-blue-600 {
  background: #42A5F5;
  color: white;
}

.bg-red-500 {
  background: #EF5350;
  color: white;
}

/* Cancel confirmation */
.bg-red-50 {
  background: #FFEBEE;
  border: 1px solid #EF9A9A;
  border-radius: 0.75rem;
  padding: 1.5rem;
  font-size: 1.1rem;
  color: #C62828;
  margin-top: 1.5rem;
}

.bg-red-50 .flex {
  gap: 1rem;
  margin-top: 1rem;
}

.bg-red-600, .bg-gray-300 {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

/* Edit Modal - full viewport */
.fixed {
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
}

/* Modal content - expanded */
.bg-white {
  width: 90%;
  max-width: 1400px;
  max-height: 90vh;
  padding: 3rem;
  border-radius: 1rem;
  overflow-y: auto;
}

.text-xl {
  font-size: 2rem;
  margin-bottom: 2rem;
}

/* Form elements */
select, input, textarea {
  width: 100%;
  border: 2px solid #E0E0E0;
  border-radius: 0.75rem;
  padding: 1rem;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

/* Items in edit mode */
.flex.justify-between {
  padding: 1rem;
  margin-bottom: 1rem;
  background: #F8F6F4;
  border-radius: 0.75rem;
}

.w-16 {
  width: 5rem;
}

/* Add item section */
.border-t {
  border-top: 2px solid #E0E0E0;
  padding-top: 2rem;
  margin-top: 2rem;
}

/* Modal buttons */
.justify-end {
  gap: 1rem;
  margin-top: 2rem;
}

.bg-green-600, .bg-gray-400 {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

/* Responsive adjustments */
@media (max-width: 1600px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

@media (max-width: 1400px) {
  .max-w-3xl {
    min-width: 100%;
    padding: 2rem;
  }
}
</style>