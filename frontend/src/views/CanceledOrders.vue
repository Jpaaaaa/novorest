<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <h2 class="text-2xl font-bold text-center mb-4">❌ الطلبات الملغاة</h2>
    <div v-if="orders.length === 0" class="text-center text-gray-500">لا توجد طلبات ملغاة</div>
    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white border border-red-300 rounded shadow p-4"
      >
        <div class="flex justify-between mb-2">
          <p class="font-semibold text-lg">📌 نوع الطلب: {{ order.type === 'pickup' ? 'استلام' : 'خارجي' }}</p>
          <p class="text-sm text-gray-500">{{ formatTime(order.created_at) }}</p>
        </div>
        <p class="text-sm">📝 {{ formatItems(order.items) }}</p>
        <p v-if="order.note" class="text-sm text-gray-700 mt-1">🗒️ ملاحظة: {{ order.note }}</p>
        <p v-if="order.cancel_reason" class="text-sm text-red-600 mt-2 font-semibold">❗ سبب الإلغاء: {{ order.cancel_reason }}</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const orders = ref([])
const foods = ref([])
onMounted(() => {
  fetchFoods()
  fetchOrders()
})
async function fetchOrders() {
  const res = await fetch('/api/orders?status=canceled')

  orders.value = await res.json()
}
async function fetchFoods() {
  const res = await fetch('http://localhost:3000/api/foods')
  foods.value = await res.json()
}
function formatItems(rawItems) {
  try {
    let parsed = rawItems
    // Sometimes items might be stringified twice
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    return parsed.map(i => {
      const food = foods.value.find(f => f.id === i.id)
      const name = food ? food.name : `عنصر #${i.id}`
      return `${i.qty} × ${name}`
    }).join('، ')
  } catch (err) {
    console.warn('❌ Failed to parse items:', rawItems)
    return '🧾 عناصر غير معروفة'
  }
}
function formatTime(time) {
  return new Date(time).toLocaleString('ar-IQ')
}
</script>

<style scoped>
/* Base container - full viewport width */
.max-w-3xl {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 2rem;
  box-sizing: border-box;
}

/* Header styling - full width */
.text-2xl {
  width: 100%;
  text-align: center;
  padding: 1.5rem;
  margin-bottom: 2rem;
  background-color: #fef2f2;
  border-bottom: 2px solid #fecaca;
  font-size: 2rem;
}

/* Empty state - full width */
.text-center.text-gray-500 {
  display: block;
  width: 100%;
  padding: 3rem;
  font-size: 1.25rem;
}

/* Orders grid container */
.space-y-4 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* Remove default space-y margins */
.space-y-4 > * + *,
.space-y-6 > * + * {
  margin-top: 0 !important;
}

/* Order card styling */
.bg-white {
  width: 100%;
  margin: 0;
  padding: 1.5rem;
  border: 1px solid #fecaca;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}

/* Order header row */
.flex.justify-between {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px dashed #fecaca;
}

/* Text elements scaling */
.font-semibold.text-lg {
  font-size: 1.25rem;
}

.text-sm {
  font-size: 1rem;
}

.text-sm.text-gray-500 {
  font-size: 0.9rem;
}

/* Responsive adjustments */
@media (min-width: 1600px) {
  .max-w-3xl {
    padding: 3rem;
  }
  
  .space-y-4 {
    grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
    gap: 2rem;
  }
  
  .text-2xl {
    font-size: 2.25rem;
    padding: 2rem;
  }
}

@media (min-width: 1920px) {
  .max-w-3xl {
    padding: 3rem 4rem;
  }
  
  .space-y-4 {
    grid-template-columns: repeat(auto-fill, minmax(700px, 1fr));
    gap: 2.5rem;
  }
  
  .bg-white {
    padding: 2rem;
  }
  
  .font-semibold.text-lg {
    font-size: 1.5rem;
  }
  
  .text-sm {
    font-size: 1.1rem;
  }
}

/* RTL-specific enhancements */
[dir="rtl"] .bg-white {
  text-align: right;
}

[dir="rtl"] .flex.justify-between {
  flex-direction: row-reverse;
}
</style>