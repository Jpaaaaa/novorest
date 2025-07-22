<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h2 class="text-2xl font-bold text-center mb-4">📋 الطلبات المباشرة</h2>

    <div v-if="orders.length === 0" class="text-center text-gray-500">لا توجد طلبات حاليًا</div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id" class="bg-white border rounded shadow p-4">
        <div class="flex justify-between items-center mb-2">
          <p class="font-semibold text-lg">نوع الطلب: {{ formatType(order.type) }}</p>
          <p class="text-sm text-gray-500">{{ formatTime(order.created_at) }}</p>
        </div>

        <p v-if="order.type === 'hall' && order.table_number" class="text-sm text-gray-700">
          🪑 رقم الطاولة: {{ order.table_number }}
        </p>

        <ul class="list-disc list-inside my-2">
          <li v-for="item in parseItems(order.items)" :key="item.id">
            {{ getFoodName(item.id) }} × {{ item.qty }}
          </li>
        </ul>

        <p v-if="order.note" class="text-sm text-gray-700">📝 ملاحظة: {{ order.note }}</p>

        <p class="mt-2 font-semibold">المجموع: {{ getOrderTotal(order.items) }} د.ع</p>

        <div class="flex gap-4 mt-3">
          <button @click="openEdit(order)" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
            تعديل
          </button>
          <button @click="markAsDone(order.id)" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
            إنهاء الطلب
          </button>
          <button @click="cancelOrder(order.id)" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
            إلغاء الطلب
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ Edit Modal -->
    <transition name="modal-fade">
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
            <button @click="saveEdit" class="save-btn">حفظ</button>
            <button @click="editingOrder = null" class="cancel-btn">إلغاء</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>



<script setup>
import { ref, onMounted, computed } from 'vue'

const orders = ref([])
const foods = ref([])
const editingOrder = ref(null)
const editData = ref({})
const selectedSection = ref('')

onMounted(() => {
  fetchFoods()
  fetchOrders()
  setInterval(fetchOrders, 5000)
})

async function fetchOrders() {
  const res = await fetch('http://localhost:3000/api/orders?status=live')
  orders.value = await res.json()
}

async function fetchFoods() {
  const res = await fetch('http://localhost:3000/api/foods')
  foods.value = await res.json()
}

function parseItems(rawItems) {
  try {
    const first = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems
    return Array.isArray(first) ? first : JSON.parse(first)
  } catch {
    return []
  }
}

function getFoodName(id) {
  const food = foods.value.find(f => f.id === id)
  return food ? food.name : `#${id}`
}

function getOrderTotal(rawItems) {
  const items = parseItems(rawItems)
  return items.reduce((sum, item) => {
    const food = foods.value.find(f => f.id === item.id)
    return sum + (food ? food.price * item.qty : 0)
  }, 0)
}

function formatType(type) {
  return type === 'pickup' ? 'استلام' : type === 'hall' ? 'من داخل الصالة' : 'توصيل خارجي'
}

function formatTime(time) {
  return new Date(time).toLocaleString('ar-IQ')
}

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

  await fetch(`http://localhost:3000/api/orders/${editingOrder.value.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  editingOrder.value = null
  await fetchOrders()
}

async function markAsDone(id) {
  await fetch(`http://localhost:3000/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'done' })
  })
  fetchOrders()
}

async function cancelOrder(id) {
  const reason = prompt('سبب الإلغاء:')
  if (!reason) return

  await fetch(`http://localhost:3000/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'canceled', cancel_reason: reason })
  })
  fetchOrders()
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

const sectionNames = computed(() => foodsBySection.value.map(s => s.name))

const selectedSectionFoods = computed(() => {
  const section = foodsBySection.value.find(s => s.name === selectedSection.value)
  return section ? section.items : []
})
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

* {
  font-family: 'Cairo', sans-serif;
  direction: rtl;
  box-sizing: border-box;
}

/* Full-width container */
.max-w-3xl {
  width: 100%;
  min-width: 1400px;
  max-width: 1920px;
  padding: 2rem 4rem;
  margin: 0 auto;
}

/* Header */
h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color:#4e342e;
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #E0E0E0;
}

/* Empty state */
.text-center {
  font-size: 1.5rem;
  color: #7C7C7C;
  padding: 3rem;
}

/* Orders grid - full width */
.space-y-4 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* Order cards - expanded */
.bg-white {
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  height: 100%;
}

.bg-white:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.12);
}

/* Order header */
.flex.justify-between {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #F0F0F0;
}

.font-semibold {
  font-size: 1.5rem;
  font-weight: 600;
}

.text-sm {
  font-size: 1rem;
}

/* Order details */
.text-gray-700 {
  color: #555;
  margin: 0.75rem 0;
}

/* Items list */
.list-disc {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
}

.list-disc li {
  font-size: 1.2rem;
  color: #4E342E;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #F8F6F4;
  border-radius: 0.5rem;
}

/* Total price */
.mt-2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4E342E;
  background: #F0F8FF;
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: center;
  margin-top: 1.5rem;
}

/* Action buttons */
.flex.gap-4 {
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
.mb-6 {
  margin-bottom: 2rem;
}

.font-bold {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.flex.justify-between {
  padding: 1rem;
  margin-bottom: 1rem;
  background: #F8F6F4;
  border-radius: 0.75rem;
}

.w-16 {
  width: 5rem;
}

.text-red-600 {
  color: #EF5350;
  font-size: 1.2rem;
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
  .space-y-4 {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
}

@media (max-width: 1400px) {
  .max-w-3xl {
    min-width: 100%;
    padding: 2rem;
  }
}
/* ✅ Modal Overlay and Container */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 1100px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
  animation: modal-in 0.25s ease;
}

/* ✅ Animation */
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ✅ Transition Support */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

</style>