<template>
  <div class="add-expense">

    <!-- 🔥 Total Always Visible -->
    <div class="total-box">
      <p><strong>إجمالي المصروفات:</strong> {{ total !== null ? total + ' د.ع' : '---' }}</p>
    </div>

    <h2>إضافة مصروف</h2>

    <!-- ✅ Expense Form -->
    <form @submit.prevent="submitExpense">
      <div class="form-group">
        <label>📸 صورة الوصل:</label>
        <input type="file" accept="image/*" @change="onFileChange" required />
      </div>

      <div class="form-group">
        <label>💰 المبلغ:</label>
        <input type="number" v-model="amount" required />
      </div>

      <div class="form-group">
        <label>📝 ملاحظة (اختياري):</label>
        <input type="text" v-model="note" />
      </div>

      <button type="submit">حفظ المصروف</button>
    </form>

    <p v-if="successMessage" class="success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <!-- ✅ Date Filter -->
    <div class="filter-section">
  <h3>📅 تصفية حسب التاريخ</h3>
  <div class="date-row">
    <div class="date-input">
      <label>من:</label>
      <input type="date" v-model="startDate" />
    </div>
    <div class="date-input">
      <label>إلى:</label>
      <input type="date" v-model="endDate" />
    </div>
    <button class="filter-button" @click="filterByDate">فلترة</button>
  </div>
  <p v-if="total !== null"><strong>إجمالي المصروفات:</strong> {{ total }} د.ع</p>
</div>


    <!-- ✅ Expense List -->
    <div class="expense-list" v-if="expenses.length">
      <h3>📋 المصاريف</h3>
      <div v-for="expense in expenses" :key="expense.id" class="expense-item">
      <button class="delete-button" @click="deleteExpense(expense.id)">🗑️ حذف</button>
        <img :src="`http://localhost:3000/${expense.image_path}`" alt="receipt" />
        <div>
          <p><strong>المبلغ:</strong> {{ expense.amount }} د.ع</p>
          <p v-if="expense.note"><strong>ملاحظة:</strong> {{ expense.note }}</p>
          <p><strong>التاريخ:</strong> {{ new Date(expense.created_at).toLocaleString('ar-IQ') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const amount = ref('')
const note = ref('')
const file = ref(null)
const successMessage = ref('')
const errorMessage = ref('')
const expenses = ref([])
const total = ref(null)
const startDate = ref('')
const endDate = ref('')

// 🖼️ Handle image file input
function onFileChange(event) {
  file.value = event.target.files[0]
}

// 🔁 Fetch all expenses (on page load & after submit/delete)
async function fetchAllExpenses() {
  try {
    const res = await axios.get('http://localhost:3000/expenses')
    expenses.value = res.data.expenses
    total.value = res.data.total
  } catch (err) {
    console.error('❌ fetchAllExpenses error:', err)
  }
}

// 🧾 Filter expenses by date
async function filterByDate() {
  if (!startDate.value || !endDate.value) {
    errorMessage.value = 'يرجى تحديد التاريخين'
    return
  }

  try {
    const res = await axios.get('http://localhost:3000/expenses/filter', {
      params: {
        start: startDate.value,
        end: endDate.value
      }
    })
    expenses.value = res.data.expenses
    total.value = res.data.total
    errorMessage.value = ''
  } catch (err) {
    console.error('❌ filter error:', err)
    errorMessage.value = 'فشل في الفلترة'
  }
}

// 💾 Submit a new expense
async function submitExpense() {
  if (!file.value || !amount.value) {
    errorMessage.value = 'الرجاء تعبئة الحقول المطلوبة'
    return
  }

  const formData = new FormData()
  formData.append('image', file.value)
  formData.append('amount', amount.value)
  if (note.value) formData.append('note', note.value)

  try {
    await axios.post('http://localhost:3000/expenses', formData)
    successMessage.value = '✅ تم حفظ المصروف بنجاح'
    errorMessage.value = ''
    amount.value = ''
    note.value = ''
    file.value = null
    fetchAllExpenses()
  } catch (err) {
    console.error(err)
    errorMessage.value = '❌ فشل في حفظ المصروف'
    successMessage.value = ''
  }
}

// 🗑️ Delete an expense
async function deleteExpense(id) {
  const confirmed = confirm('هل أنت متأكد من حذف هذا المصروف؟')
  if (!confirmed) return

  try {
    await axios.delete(`http://localhost:3000/expenses/${id}`)
    expenses.value = expenses.value.filter(e => e.id !== id)
    successMessage.value = '✅ تم حذف المصروف'
    errorMessage.value = ''
  } catch (err) {
    console.error('❌ deleteExpense error:', err)
    errorMessage.value = '❌ فشل في حذف المصروف'
    successMessage.value = ''
  }
}

// ⏱️ Run on mount
onMounted(fetchAllExpenses)
</script>


<style scoped>
.add-expense {
  width: calc(100vw - 280px);
  margin-right: 280px;
  min-height: 100vh;
  padding: 2rem 3rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  font-family: 'Tajawal', sans-serif;
  direction: rtl;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto 1fr;
  gap: 2rem;
  box-sizing: border-box;
}

h2 {
  grid-column: 1 / -1;
  text-align: center;
  color: #5a3e2b;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

h3 {
  color: #5a3e2b;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: 600;
}

.total-box {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 3px solid #ffc107;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: #7b4f35;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

form {
  background: #fff;
  border-radius: 15px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  border: 2px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: fit-content;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

label {
  font-weight: 700;
  font-size: 1.2rem;
  color: #5a3e2b;
}

input[type="number"],
input[type="text"],
input[type="file"],
input[type="date"] {
  padding: 1rem 1.5rem;
  border: 2px solid #d8c1a3;
  border-radius: 10px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background: #fefefe;
}

input[type="number"]:focus,
input[type="text"]:focus,
input[type="file"]:focus,
input[type="date"]:focus {
  outline: none;
  border-color: #7b4f35;
  box-shadow: 0 0 0 3px rgba(123, 79, 53, 0.1);
}

button {
  padding: 1.2rem 2rem;
  background: linear-gradient(135deg, #7b4f35 0%, #5a3e2b 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(123, 79, 53, 0.3);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(123, 79, 53, 0.4);
}

.success, .error {
  grid-column: 1 / -1;
  text-align: center;
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1.1rem;
}

.success { 
  color: #155724;
  background: #d4edda;
  border: 2px solid #c3e6cb;
}

.error { 
  color: #721c24;
  background: #f8d7da;
  border: 2px solid #f5c6cb;
}

.filter-section {
  background: #fff;
  border-radius: 15px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  border: 2px solid #e9ecef;
  height: fit-content;
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 2rem;
  align-items: end;
  margin-bottom: 2rem;
}

.date-input {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.date-input label {
  font-weight: 700;
  font-size: 1.2rem;
  color: #5a3e2b;
}

.filter-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
  white-space: nowrap;
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
}

.expense-list {
  grid-column: 1 / -1;
  background: #fff;
  border-radius: 15px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  border: 2px solid #e9ecef;
}

.expense-item {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2.5rem;
  align-items: flex-start;
  border: 2px solid #e8dcc6;
  border-radius: 16px;
  padding: 2.5rem;
  margin-bottom: 2.5rem;
  background: linear-gradient(135deg, #fefcf8 0%, #f9f6f1 50%, #ffffff 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 20px rgba(123, 79, 53, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.expense-item::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #d4a574 0%, #c19a5b 100%);
  transition: width 0.3s ease;
}

.expense-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(123, 79, 53, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #d4a574;
}

.expense-item:hover::before {
  width: 6px;
}

.expense-item img {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  border: 2px solid #f0f0f0;
}

.expense-item:hover img {
  transform: scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
  border-color: #d4a574;
}

.expense-item div {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 0.5rem 0;
}

.expense-item p {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #4a4a4a;
}

.expense-item strong {
  color: #5a3e2b;
  font-weight: 700;
}

.delete-button {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  margin-top: 1.2rem;
  width: fit-content;
  align-self: flex-start;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.25);
}

.delete-button:hover {
  background: linear-gradient(135deg, #c82333 0%, #a71d2a 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 53, 69, 0.35);
}

/* Desktop-specific responsive adjustments */
@media (min-width: 1400px) {
  .add-expense {
    padding: 3rem 4rem;
    gap: 3rem;
  }
  
  .expense-item {
    grid-template-columns: 250px 1fr;
    gap: 3.5rem;
    padding: 3rem;
  }
  
  .expense-item img {
    height: 180px;
  }
}

@media (min-width: 1920px) {
  .add-expense {
    padding: 4rem 5rem;
    gap: 4rem;
  }
  
  .date-row {
    grid-template-columns: 1fr 1fr 1fr auto;
  }
  
  .expense-item {
    grid-template-columns: 300px 1fr;
    gap: 4rem;
    padding: 3.5rem;
  }
  
  .expense-item img {
    height: 200px;
  }
}

@media (max-width: 768px) {
  .add-expense {
    width: 100vw;
    margin: 0;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h2 {
    font-size: 1.8rem;
    text-align: center;
  }

  h3 {
    font-size: 1.3rem;
  }

  .form-group label,
  .date-input label {
    font-size: 1rem;
  }

  .total-box {
    font-size: 1.3rem;
    padding: 1.2rem;
  }

  form,
  .filter-section,
  .expense-list {
    padding: 1.2rem;
  }

  .date-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .expense-item {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.2rem;
    margin-bottom: 1.5rem;
  }

  .expense-item img {
    width: 100%;
    height: 180px;
    margin-bottom: 0.5rem;
  }

  .expense-item div {
    gap: 0.8rem;
  }

  .expense-item p {
    font-size: 1rem;
  }

  .filter-button,
  button {
    font-size: 1rem;
    padding: 1rem;
    width: 100%;
  }

  .delete-button {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
    width: auto;
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .add-expense {
    padding: 0.8rem;
    gap: 1.2rem;
  }

  h2 {
    font-size: 1.6rem;
  }

  h3 {
    font-size: 1.2rem;
  }

  .total-box {
    font-size: 1.2rem;
    padding: 1rem;
  }

  form,
  .filter-section,
  .expense-list {
    padding: 1rem;
  }

  .expense-item {
    padding: 1rem;
    gap: 0.8rem;
  }

  .expense-item img {
    height: 150px;
  }

  .expense-item p {
    font-size: 0.95rem;
  }

  input[type="number"],
  input[type="text"],
  input[type="file"],
  input[type="date"] {
    padding: 0.8rem 1rem;
    font-size: 1rem;
  }

  .filter-button,
  button {
    padding: 0.8rem;
    font-size: 0.95rem;
  }

  .delete-button {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}
</style>