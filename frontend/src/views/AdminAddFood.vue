<template>
  <div class="dashboard">
    <!-- Header Section -->
    <header class="dashboard-header">
      <h1>إضافة عنصر جديد</h1>
      <p>إدارة أصناف الطعام والأقسام</p>
    </header>

    <!-- Add New Section Form -->
    <section class="section-form">
      <div class="form-container">
        <input
          v-model="newSectionName"
          type="text"
          placeholder="اسم قسم جديد (مثال: سلطات)"
          class="section-input"
        />
        <button @click="addSection" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          إضافة قسم
        </button>
      </div>
    </section>

    <!-- Add Food Form -->
    <section class="food-form">
      <form @submit.prevent="submitFood" class="form-grid">
        <div class="form-group">
          <label>اسم العنصر</label>
          <input
            v-model="name"
            type="text"
            placeholder="أدخل اسم العنصر"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label>السعر</label>
          <input
            v-model.number="price"
            type="number"
            placeholder="0"
            class="form-input"
            required
          />
          <span class="currency">د.ع</span>
        </div>

        <div class="form-group">
          <label>القسم</label>
          <select v-model="sectionId" class="form-select" required>
            <option disabled value="">اختر القسم</option>
            <option v-for="section in sections" :key="section.id" :value="section.id">
              {{ section.name }}
            </option>
          </select>
        </div>

        <div class="form-group file-group">
          <label>صورة العنصر</label>
          <input
            @change="onFileChange"
            type="file"
            accept="image/*"
            class="file-input"
            required
          />
        </div>

        <button type="submit" class="btn btn-submit">
          إضافة العنصر
        </button>
      </form>
    </section>

    <!-- Food Categories -->
    <main class="categories-container">
      <section v-for="section in sections" :key="section.id" class="category-section">
        <div class="category-header">
          <h2>{{ section.name }}</h2>
          <div class="category-actions">
            <span class="item-count">{{ foodsBySection(section.id).length }} عنصر</span>
            <button @click="deleteSection(section.id)" class="btn btn-danger btn-sm">
              <span class="btn-icon">🗑</span>
              حذف القسم
            </button>
          </div>
        </div>

        <div class="food-grid">
          <div v-for="item in foodsBySection(section.id)" :key="item.id" class="food-card">
            <div class="card-image-container">
              <img
                :src="getImageUrl(item.image_url)"
                @error="onImageError"
                :alt="item.name"
                class="card-image"
              />
              <button @click="deleteFood(item.id)" class="delete-overlay">
                <span>حذف</span>
              </button>
            </div>
            <div class="card-content">
              <h3 class="card-title">{{ item.name }}</h3>
              <div class="card-price">{{ item.price }} د.ع</div>
            </div>
          </div>
        </div>

        <div v-if="foodsBySection(section.id).length === 0" class="empty-state">
          <div class="empty-icon">🍽️</div>
          <p>لا توجد عناصر في هذا القسم</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_URL = 'http://localhost:3000'

const name = ref('')
const price = ref(0)
const imageFile = ref(null)
const sectionId = ref('')
const newSectionName = ref('')
const sections = ref([])
const foods = ref([])

onMounted(async () => {
  await fetchSections()
  await fetchFoods()
})

function onFileChange(e) {
  imageFile.value = e.target.files[0]
}

function getImageUrl(path) {
  return path ? `${API_URL}${path}` : ''
}

function onImageError(event) {
  event.target.src = '/fallback-image.png'
}

async function fetchSections() {
  const res = await fetch(`${API_URL}/api/sections`)
  sections.value = await res.json()
}

async function fetchFoods() {
  const res = await fetch(`${API_URL}/api/foods`)
  foods.value = await res.json()
}

async function addSection() {
  if (!newSectionName.value.trim()) return

  try {
    await fetch(`${API_URL}/api/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSectionName.value })
    })
    newSectionName.value = ''
    await fetchSections()
  } catch {
    alert('❌ فشل في إضافة القسم')
  }
}

async function deleteSection(id) {
  if (!confirm('هل أنت متأكد أنك تريد حذف هذا القسم؟')) return
  try {
    const res = await fetch(`${API_URL}/api/sections/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const { error } = await res.json()
      alert(`❌ ${error}`)
      return
    }
    await fetchSections()
  } catch {
    alert('❌ فشل في حذف القسم')
  }
}

async function submitFood() {
  const formData = new FormData()
  formData.append('name', name.value)
  formData.append('price', price.value)
  formData.append('image', imageFile.value)
  formData.append('section_id', sectionId.value)

  try {
    await fetch(`${API_URL}/api/foods`, {
      method: 'POST',
      body: formData
    })

    name.value = ''
    price.value = 0
    imageFile.value = null
    sectionId.value = ''
    await fetchFoods()
  } catch {
    alert('❌ فشل في إضافة العنصر')
  }
}

async function deleteFood(id) {
  if (!confirm('هل أنت متأكد أنك تريد حذف هذا العنصر؟')) return
  try {
    await fetch(`${API_URL}/api/foods/${id}`, { method: 'DELETE' })
    await fetchFoods()
  } catch {
    alert('❌ فشل في حذف العنصر')
  }
}

function foodsBySection(id) {
  return foods.value.filter(f => f.section_id === id)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;600;700&display=swap');

/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard {
  font-family: 'Tajawal', sans-serif;
  background-color: #fdfaf7;
  min-height: 100vh;
  color: #4E342E;
  direction: rtl;
  line-height: 1.6;
}

/* Header Styles */
.dashboard-header {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #fdfaf7 0%, #f8f5f2 100%);
  border-bottom: 1px solid #e8e5e2;
}

.dashboard-header h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #7b4f35;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.dashboard-header p {
  font-size: 1.1rem;
  color: #8d6e63;
  font-weight: 400;
}

/* Section Form Styles */
.section-form {
  padding: 30px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e8e5e2;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.section-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e8e5e2;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  background-color: #fdfaf7;
  transition: all 0.3s ease;
}

.section-input:focus {
  outline: none;
  border-color: #7b4f35;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(123, 79, 53, 0.1);
}

/* Food Form Styles */
.food-form {
  padding: 40px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e8e5e2;
}

.form-grid {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: end;
}

.form-group {
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #5d4037;
  font-size: 0.95rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e8e5e2;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  background-color: #fdfaf7;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #7b4f35;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(123, 79, 53, 0.1);
}

.currency {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #8d6e63;
  font-weight: 600;
  pointer-events: none;
}

.file-group {
  grid-column: 1 / -1;
}

.file-input {
  width: 100%;
  padding: 20px;
  border: 2px dashed #d0c4b8;
  border-radius: 12px;
  background-color: #fdfaf7;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-size: 1rem;
}

.file-input:hover {
  border-color: #7b4f35;
  background-color: #f8f5f2;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  justify-content: center;
}

.btn-primary {
  background-color: #7b4f35;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #6d4530;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(123, 79, 53, 0.3);
}

.btn-submit {
  grid-column: 1 / -1;
  background-color: #7b4f35;
  color: #ffffff;
  padding: 16px 32px;
  font-size: 1.1rem;
  margin-top: 16px;
}

.btn-submit:hover {
  background-color: #6d4530;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(123, 79, 53, 0.3);
}

.btn-danger {
  background-color: #d32f2f;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #c62828;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(211, 47, 47, 0.3);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.9rem;
}

.btn-icon {
  font-size: 1.1em;
}

/* Categories Container */
.categories-container {
  padding: 40px 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 60px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 3px solid #7b4f35;
}

.category-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #7b4f35;
  margin: 0;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-count {
  background-color: #f8f5f2;
  color: #7b4f35;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Food Grid - Square Cards */
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
}

.food-card {
  background-color: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
}

.food-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: #7b4f35;
}

.card-image-container {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.food-card:hover .card-image {
  transform: scale(1.05);
}

.delete-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: rgba(211, 47, 47, 0.95);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  font-family: inherit;
}

.food-card:hover .delete-overlay {
  opacity: 1;
  transform: translateY(0);
}

.delete-overlay:hover {
  background-color: #c62828;
  transform: scale(1.05);
}

.card-content {
  padding: 20px;
  text-align: center;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #4E342E;
  margin-bottom: 8px;
  line-height: 1.4;
}

.card-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #7b4f35;
  background-color: #f8f5f2;
  padding: 6px 16px;
  border-radius: 20px;
  display: inline-block;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8d6e63;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .dashboard-header p {
    font-size: 1rem;
  }
  
  .form-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .currency {
    left: 12px;
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .category-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .food-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .categories-container {
    padding: 20px 12px;
  }
  
  .section-form,
  .food-form {
    padding: 20px 12px;
  }
}

@media (max-width: 480px) {
  .dashboard-header h1 {
    font-size: 1.8rem;
  }
  
  .food-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  
  .food-card {
    border-radius: 12px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .card-price {
    font-size: 1.1rem;
  }
}

/* Large Screen Optimization */
@media (min-width: 1600px) {
  .food-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 32px;
  }
  
  .categories-container {
    padding: 60px 40px;
  }
}
</style>