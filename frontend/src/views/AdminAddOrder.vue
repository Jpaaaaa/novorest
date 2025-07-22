<template>
  <div class="full-viewport-container">
    <h2 class="main-title">إضافة طلب يدوي</h2>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="submitOrder" class="main-form">
      <!-- Order Type Toggle Buttons -->
      <div class="form-section">
        <label class="section-label">نوع الطلب</label>
        <div class="order-type-buttons">
          <button
            type="button"
            class="order-type-button"
            :class="{ active: orderType === 'pickup' }"
            @click="orderType = 'pickup'"
          >
            استلام من المحل
          </button>
          <button
            type="button"
            class="order-type-button"
            :class="{ active: orderType === 'external' }"
            @click="orderType = 'external'"
          >
            توصيل خارجي
          </button>
          <button
            type="button"
            class="order-type-button"
            :class="{ active: orderType === 'hall' }"
            @click="orderType = 'hall'"
          >
            طلب من داخل الصالة
          </button>
        </div>
      </div>

      <!-- Table number input (only for hall orders) -->
      <div v-if="orderType === 'hall'" class="form-section">
        <label class="section-label">رقم الطاولة</label>
        <input v-model="tableNumber" type="number" min="1" class="full-width-input" placeholder="أدخل رقم الطاولة" required />
      </div>

      <!-- Category Buttons -->
      <div class="form-section">
        <label class="section-label">اختر العناصر</label>
        <div class="categories-bar">
          <button
            v-for="(items, sectionName) in foodsBySection"
            :key="sectionName"
            type="button"
            class="category-button"
            :class="{ active: activeSection === sectionName }"
            @click="activeSection = sectionName"
          >
            {{ sectionName }}
          </button>
        </div>

        <!-- Food Items of selected section -->
        <div v-if="foodsBySection[activeSection]" class="food-items-grid">
          <div
            v-for="item in foodsBySection[activeSection]"
            :key="item.id"
            class="food-item"
            :class="{ selected: selectedItems.includes(item.id) }"
            @click="toggleItem(item.id)"
          >
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-price">{{ item.price }} د.ع</span>
            </div>
            <div class="quantity-controls" v-if="selectedItems.includes(item.id)" @click.stop>
              <button
                type="button"
                class="quantity-btn"
                @click="decreaseQuantity(item.id)"
                :disabled="quantities[item.id] <= 1"
              >
                -
              </button>
              <input
                v-model.number="quantities[item.id]"
                type="number"
                min="1"
                class="quantity-input"
                placeholder="1"
              />
              <button
                type="button"
                class="quantity-btn"
                @click="increaseQuantity(item.id)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Optional Note -->
      <div class="form-section">
        <label class="section-label">ملاحظات (اختياري)</label>
        <textarea
          v-model="note"
          rows="4"
          class="full-width-textarea"
          placeholder="اكتب ملاحظة إن وجدت"
        ></textarea>
      </div>

      <!-- Order Summary -->
      <div v-if="selectedItems.length > 0" class="order-summary">
        <h3 class="summary-title">ملخص الطلب</h3>
        <div class="summary-items">
          <div 
            v-for="itemId in selectedItems" 
            :key="itemId"
            class="summary-item"
          >
            <span class="summary-item-name">{{ getItemById(itemId)?.name }}</span>
            <span class="summary-item-qty">{{ quantities[itemId] || 1 }} ×</span>
            <span class="summary-item-price">{{ getItemById(itemId)?.price }} د.ع</span>
            <span class="summary-item-total">{{ ((quantities[itemId] || 1) * getItemById(itemId)?.price) }} د.ع</span>
          </div>
        </div>
        <div class="summary-total">
          <span class="total-label">المجموع الكلي:</span>
          <span class="total-amount">{{ calculateTotal() }} د.ع</span>
        </div>
      </div>

      <button type="submit" class="submit-button">
        تأكيد الطلب
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'

const orderType = ref('')
const tableNumber = ref('')
const foods = ref([])
const selectedItems = ref([])
const quantities = reactive({})
const note = ref('')
const errorMessage = ref('')
const activeSection = ref('')

onMounted(fetchFoods)

async function fetchFoods() {
  const res = await fetch('/api/foods')

  foods.value = await res.json()

  const sections = [...new Set(foods.value.map(f => f.section_name || 'غير محدد'))]
  activeSection.value = sections[0] || ''
}

async function submitOrder() {
  errorMessage.value = ''

  const items = selectedItems.value.map(id => ({
    id,
    qty: quantities[id] || 1
  }))

  if (!orderType.value || items.length === 0) {
    errorMessage.value = '❌ يرجى تحديد نوع الطلب والعناصر المطلوبة'
    return
  }

  const payload = {
    type: orderType.value,
    items: JSON.stringify(items),
    note: note.value,
    tableNumber: orderType.value === 'hall' ? tableNumber.value : null,
    status: 'pending'
  }

  try {
    await fetch('/api/order', {

      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    orderType.value = ''
    tableNumber.value = ''
    selectedItems.value = []
    note.value = ''
    Object.keys(quantities).forEach(id => delete quantities[id])
  } catch (err) {
    errorMessage.value = '❌ فشل في إرسال الطلب. حاول مرة أخرى.'
  }
}

const foodsBySection = computed(() => {
  const grouped = {}
  for (const food of foods.value) {
    const section = food.section_name || 'غير محدد'
    if (!grouped[section]) grouped[section] = []
    grouped[section].push(food)
  }
  return grouped
})

// New helper functions for UI improvements
function toggleItem(itemId) {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
    delete quantities[itemId]
  } else {
    selectedItems.value.push(itemId)
    quantities[itemId] = 1
  }
}

function increaseQuantity(itemId) {
  quantities[itemId] = (quantities[itemId] || 1) + 1
}

function decreaseQuantity(itemId) {
  if (quantities[itemId] > 1) {
    quantities[itemId] = quantities[itemId] - 1
  }
}

function getItemById(itemId) {
  return foods.value.find(item => item.id === itemId)
}

function calculateTotal() {
  return selectedItems.value.reduce((total, itemId) => {
    const item = getItemById(itemId)
    const qty = quantities[itemId] || 1
    return total + (item?.price || 0) * qty
  }, 0)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');

* {
  box-sizing: border-box;
}

/* Full Viewport Layout */
.full-viewport-container {
  width: calc(100vw - 280px);
  margin-right: 280px;
  min-height: 100vh;
  padding: 2rem 3rem;
  background: linear-gradient(135deg, #f8f6f3 0%, #ede7e0 100%);
  direction: rtl;
  font-family: 'Tajawal', sans-serif;
  margin: 0;
  box-sizing: border-box;
}

.main-title {
  font-size: 3rem;
  font-weight: 900;
  text-align: center;
  color: #4E342E;
  margin-bottom: 2rem;
  font-family: 'Tajawal', sans-serif;
  width: 100%;
  padding: 1rem 0;
  border-bottom: 3px solid #8D6E63;
}

/* Error Message */
.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 700;
  margin-bottom: 2rem;
  font-family: 'Tajawal', sans-serif;
  width: 100%;
  border-left: 5px solid #ef4444;
}

/* Main Form - Full Width */
.main-form {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: none;
  margin: 0 auto;
  font-family: 'Tajawal', sans-serif;
}

.form-section {
  margin-bottom: 2.5rem;
  width: 100%;
}

.section-label {
  font-weight: 700;
  color: #4E342E;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  display: block;
  font-family: 'Tajawal', sans-serif;
}

/* Order Type Toggle Buttons */
.order-type-buttons {
  display: flex;
  gap: 1rem;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 12px;
  width: 100%;
}

.order-type-button {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Tajawal', sans-serif;
  text-align: center;
}

.order-type-button:hover {
  background: rgba(78, 52, 46, 0.1);
  color: #4E342E;
}

.order-type-button.active {
  background: #4E342E;
  color: white;
  box-shadow: 0 2px 8px rgba(78, 52, 46, 0.3);
}

/* Form Inputs - Full Width */
.full-width-input,
.full-width-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Tajawal', sans-serif;
  background: #fafafa;
  transition: all 0.3s;
}

.full-width-input:focus,
.full-width-textarea:focus {
  outline: none;
  border-color: #8D6E63;
  background: white;
  box-shadow: 0 0 0 3px rgba(141, 110, 99, 0.2);
}

.full-width-textarea {
  min-height: 120px;
  resize: vertical;
}

/* Categories Bar - Full Width Grid */
.categories-bar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
  width: 100%;
}

.category-button {
  padding: 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #4E342E;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Tajawal', sans-serif;
  text-align: center;
}

.category-button:hover {
  background: #f5f5f5;
  border-color: #8D6E63;
}

.category-button.active {
  background: #4E342E;
  color: white;
  border-color: #4E342E;
}

/* Food Items Grid - Full Width */
.food-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  width: 100%;
  margin-top: 1.5rem;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.food-item:hover {
  border-color: #8D6E63;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.food-item.selected {
  border-color: #4E342E;
  background: #f8f6f3;
  box-shadow: 0 4px 12px rgba(78, 52, 46, 0.15);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.item-price {
  font-size: 1rem;
  font-weight: 500;
  color: #8D6E63;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.5rem;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: #4E342E;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn:hover:not(:disabled) {
  background: #3E2723;
}

.quantity-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.quantity-input {
  width: 60px;
  padding: 0.5rem;
  border: none;
  text-align: center;
  font-family: 'Tajawal', sans-serif;
  background: transparent;
  font-size: 1rem;
  font-weight: 600;
}

.quantity-input:focus {
  outline: none;
}

/* Order Summary */
.order-summary {
  background: #f8f6f3;
  border: 2px solid #8D6E63;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  width: 100%;
}

.summary-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4E342E;
  margin-bottom: 1.5rem;
  text-align: center;
  font-family: 'Tajawal', sans-serif;
}

.summary-items {
  margin-bottom: 1.5rem;
}

.summary-item {
  display: grid;
  grid-template-columns: 2fr auto auto 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-family: 'Tajawal', sans-serif;
}

.summary-item-name {
  font-weight: 600;
  color: #333;
}

.summary-item-qty {
  font-weight: 500;
  color: #666;
}

.summary-item-price {
  font-size: 0.9rem;
  color: #8D6E63;
}

.summary-item-total {
  font-weight: 700;
  color: #4E342E;
  text-align: left;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #4E342E;
  color: white;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 700;
}

.total-label {
  font-family: 'Tajawal', sans-serif;
}

.total-amount {
  font-family: 'Tajawal', sans-serif;
  font-size: 1.5rem;
}

/* Submit Button - Full Width */
.submit-button {
  width: 100%;
  background: #4E342E;
  color: white;
  padding: 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Tajawal', sans-serif;
  margin-top: 2rem;
}

.submit-button:hover {
  background: #3E2723;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive Adjustments */
@media (min-width: 1400px) {
  .food-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
  
  .categories-bar {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (min-width: 1600px) {
  .food-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  }
  
  .categories-bar {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (min-width: 1920px) {
  .food-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(550px, 1fr));
  }
  
  .main-form {
    padding: 4rem;
  }
  
  .section-label {
    font-size: 1.5rem;
  }
  
  .full-width-input,
  .full-width-textarea {
    padding: 1.25rem;
    font-size: 1.1rem;
  }
  
  .submit-button {
    padding: 1.5rem;
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .order-type-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .food-items-grid {
    grid-template-columns: 1fr;
  }
  
  .categories-bar {
    grid-template-columns: 1fr;
  }
  
  .summary-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    text-align: center;
  }
  
  .summary-total {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>