<template>
  <div class="menu-wrapper">
    <!-- Header -->
    <header class="menu-header">
      <div class="restaurant-name">NOVO</div>
      <div class="restaurant-type">Restaurant & Café</div>
      <h1 class="menu-title">OUR DIGITAL MENU</h1>
      <div class="header-divider">
        <div class="divider-line"></div>
        <div class="divider-icon">✻</div>
        <div class="divider-line"></div>
      </div>
    </header>

    <!-- Category Buttons -->
    <div class="category-buttons">
      <button
        v-for="category in categories"
        :key="category"
        @click="activeTab = category"
        :class="['category-btn', activeTab === category ? 'active' : '']"
        v-html="formatCategory(category)"
      ></button>
    </div>

    <!-- Loading Animation -->
    <div v-if="loading" class="menu-loading">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
      </svg>
      <p>Loading Menu...</p>
    </div>

    <!-- Menu Items -->
    <div v-else-if="activeItems && activeItems.length" class="menu-grid">
      <div v-for="item in activeItems" :key="item.id" class="menu-card">
        <div class="image-container">
          <img
            :src="getImageUrl(item.image_url)"
            class="menu-image"
            :alt="item.name"
            @error="onImageError"
          />
          <div class="image-overlay"></div>
        </div>
        <div class="menu-info">
          <h3 class="menu-name">{{ item.name }}</h3>
          <p class="menu-price">{{ item.price }} Dinar</p>
        </div>
      </div>
    </div>

    <!-- Empty Message -->
    <div v-else class="menu-empty">
      <div class="empty-icon">🍽️</div>
      <p>No items available in this section</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_URL = ''


const foods = ref([])
const categories = ref([])
const activeTab = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const foodRes = await fetch(`${API_URL}/api/foods`)
    const data = await foodRes.json()
    foods.value = data

    const unique = [...new Set(data.map(f => f.section_name).filter(Boolean))]
    categories.value = unique
    activeTab.value = unique[0] || ''
  } catch (err) {
    console.error('❌ Failed to load menu:', err)
  } finally {
    loading.value = false
  }
})

const activeItems = computed(() =>
  foods.value?.filter(f => f.section_name === activeTab.value) || []
)

function formatCategory(c) {
  if (c === 'meal' || c === 'وجبة') return 'Meals'
  if (c === 'drink' || c === 'مشروب') return 'Drinks'
  return c
}

function getImageUrl(path) {
  return path ? `${API_URL}${path}` : ''
}

function onImageError(event) {
  event.target.src = 'https://via.placeholder.com/300x300?text=No+Image'
}
</script>






<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap');

.menu-wrapper {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding-top: max(env(safe-area-inset-top), 2rem);
  padding-bottom: 2rem;
  padding-left: 0;
  padding-right: 0;
  box-sizing: border-box;
  min-height: 100vh;
  font-family: 'Tajawal', sans-serif;
  direction: ltr;
  background: #e7dfd3;
  color: #400000;
  position: relative;
  overflow-x: hidden;
}

/* Enhanced Loading States */
.menu-wrapper::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(64, 0, 0, 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}

/* Header Styling with Enhanced Animations */
.menu-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  padding: 2rem 1.5rem 2.5rem;
  background-color: #400000;
  color: #f9f7f4;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  border-radius: 0;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.restaurant-name {
  font-family: 'Playfair Display', serif;
  font-size: 3.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  line-height: 1;
  margin-bottom: 0.25rem;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.2);
  animation: fadeInScale 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.restaurant-type {
  font-family: 'Tajawal', sans-serif;
  font-size: 1rem;
  font-weight: 300;
  color: rgba(249, 247, 244, 0.8);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.4s both;
}

.menu-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  font-weight: 500;
  color: #f9f7f4;
  margin-bottom: 1rem;
  position: relative;
  animation: fadeInUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.6s both;
}

.header-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  width: 80%;
  animation: fadeInUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.8s both;
}

.divider-line {
  height: 1px;
  background: rgba(249, 247, 244, 0.5);
  flex-grow: 1;
  transition: all 0.3s ease;
}

.divider-icon {
  color: #f9f7f4;
  font-size: 1.2rem;
  padding: 0 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Enhanced Category Buttons */
.category-buttons {
  margin-top: 80px;
  margin-bottom: 2rem;
  padding: 0.5rem 1rem;
  z-index: 10;
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.75rem;
  overflow-x: auto;
  white-space: nowrap;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  justify-content: flex-start;
}

.category-buttons::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}


.category-btn {
  background: rgba(64, 0, 0, 0.1);
  color: #400000;
  padding: 0.85rem 1.5rem;
  border: 1px solid rgba(64, 0, 0, 0.3);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-weight: 600;
  font-size: 0.95rem;
  font-family: 'Tajawal', sans-serif;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  min-width: 120px;
}

.category-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(64, 0, 0, 0.1), transparent);
  transition: left 0.7s ease;
}

.category-btn:hover::before {
  left: 100%;
}

.category-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
}

.category-btn:active {
  transform: translateY(0) scale(0.96);
  transition: transform 0.1s ease;
}

.category-btn.active {
  background: linear-gradient(135deg, rgba(64, 0, 0, 0.1) 0%, rgba(64, 0, 0, 0.2) 100%);
  color: #400000;
  box-shadow: 
    0 4px 25px rgba(64, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(64, 0, 0, 0.5);
  transform: translateY(-2px);
}

/* Enhanced Menu Grid */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  animation: fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.menu-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(64, 0, 0, 0.1);
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  aspect-ratio: 1 / 1.25;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.1),
    0 6px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: relative;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
  animation: cardFadeIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered animation for cards */
.menu-card:nth-child(1) { animation-delay: 0.1s; }
.menu-card:nth-child(2) { animation-delay: 0.2s; }
.menu-card:nth-child(3) { animation-delay: 0.3s; }
.menu-card:nth-child(4) { animation-delay: 0.4s; }
.menu-card:nth-child(5) { animation-delay: 0.5s; }
.menu-card:nth-child(6) { animation-delay: 0.6s; }
.menu-card:nth-child(7) { animation-delay: 0.7s; }
.menu-card:nth-child(8) { animation-delay: 0.8s; }
.menu-card:nth-child(9) { animation-delay: 0.9s; }
.menu-card:nth-child(10) { animation-delay: 1s; }

.menu-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(249, 247, 244, 0.05) 0%, transparent 100%);
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.menu-card:hover::before {
  opacity: 1;
}

.menu-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.15),
    0 15px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(64, 0, 0, 0.2);
}

.menu-card:active {
  transform: translateY(-5px) scale(0.98);
  transition: transform 0.1s ease;
}

.image-container {
  flex: 1;
  background: linear-gradient(135deg, #e7dfd3 0%, #d9d1c5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 1.5rem;
  position: relative;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.menu-card:hover .image-overlay {
  opacity: 1;
}

.menu-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.2),
    0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(64, 0, 0, 0.1);
}

.menu-card:hover .menu-image {
  transform: scale(1.06);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.25),
    0 6px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(64, 0, 0, 0.2);
}

.menu-info {
  padding: 1.5rem 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(64, 0, 0, 0.1);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.menu-card:hover .menu-info {
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid rgba(64, 0, 0, 0.2);
}

.menu-name {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #400000;
  font-size: 1.1rem;
  line-height: 1.4;
  letter-spacing: -0.01em;
  font-family: 'Tajawal', sans-serif;
  transition: all 0.3s ease;
}

.menu-card:hover .menu-name {
  color: #400000;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.menu-price {
  color: #400000;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  font-family: 'Tajawal', sans-serif;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.menu-card:hover .menu-price {
  color: #400000;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Enhanced Empty State */
.menu-empty {
  text-align: center;
  color: #400000;
  margin-top: 3rem;
  font-size: 1.1rem;
  padding: 2.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  border: 1px solid rgba(64, 0, 0, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.1),
    0 6px 20px rgba(0, 0, 0, 0.05);
  font-family: 'Tajawal', sans-serif;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* Enhanced Responsive Design */
@media (max-width: 480px) {
  .menu-wrapper {
    padding-top: 220px;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 2rem;
  }

  .restaurant-name {
    font-size: 2.8rem;
  }

  .restaurant-type {
    font-size: 0.9rem;
  }

  .menu-title {
    font-size: 1.5rem;
  }

  .menu-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

 .category-btn {
  padding: 1rem 1.75rem;
  font-size: 1.05rem;
  min-width: 135px;
}


  .menu-card {
    border-radius: 24px;
  }

  .menu-image {
    border-radius: 18px;
  }

  .menu-info {
    padding: 1.25rem 0.75rem;
  }

  .menu-name {
    font-size: 1rem;
  }

  .menu-price {
    font-size: 1.05rem;
  }
}

/* iPhone SE and smaller */
@media (max-width: 375px) {
  .menu-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .category-btn {
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
    min-width: 100px;
  }
}

/* Tablet & Landscape Support */
@media (min-width: 768px) {
  .menu-header {
    padding: 3rem 2rem;
  }

  .restaurant-name {
    font-size: 4rem;
  }

  .menu-title {
    font-size: 2.2rem;
  }

  .menu-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2rem;
  }

  .menu-card:hover {
    transform: translateY(-15px) scale(1.03);
  }
}

/* Enhanced Focus States for Accessibility */
.category-btn:focus,
.menu-card:focus {
  outline: 2px solid rgba(64, 0, 0, 0.5);
  outline-offset: 2px;
}

/* Smooth Transitions on Tab Change */
.menu-grid {
  transition: opacity 0.3s ease;
}

/* Enhanced Scroll Behavior */
.menu-wrapper {
  scroll-behavior: smooth;
}

/* Performance Optimizations */
.menu-card,
.category-btn {
  will-change: transform;
}

.menu-image {
  will-change: transform;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.menu-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 4rem 0;
  animation: fadeIn 0.5s ease-in-out;
}

.spinner {
  animation: rotate 1.2s linear infinite;
  width: 60px;
  height: 60px;
  margin-bottom: 1rem;
}

.spinner .path {
  stroke: #400000;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>