<template>
  <div class="app-container">
    <!-- Main Content Area -->
    <div class="main-content">
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </div>

    <!-- Fixed Right Sidebar -->
    <div class="sidebar">
      <div class="branding">
        <h1>NOVO</h1>
        <p>مطعم الوجبات السريعة</p>
      </div>

      <div class="navigation">
        <router-link
          v-if="role === 'admin'"
          to="/admin/add-food"
          :class="['nav-button', buttonClass('/admin/add-food')]"
        >إضافة وجبة</router-link>

        <router-link
          to="/admin/add-order"
          :class="['nav-button', buttonClass('/admin/add-order')]"
        >إضافة طلب</router-link>

        <router-link
          to="/admin/pending-orders"
          :class="['nav-button', 'relative', buttonClass('/admin/pending-orders')]"
        >
          الطلبات المعلقة
          <span v-if="pendingCount > 0" class="notif-badge">{{ pendingCount }}</span>
        </router-link>

        <router-link
          to="/admin/live-orders"
          :class="['nav-button', 'relative', buttonClass('/admin/live-orders')]"
        >
          الطلبات الجارية
          <span v-if="liveCount > 0" class="notif-badge">{{ liveCount }}</span>
        </router-link>

        <router-link
          v-if="role === 'admin'"
          to="/admin/finished-orders"
          :class="['nav-button', 'relative', buttonClass('/admin/finished-orders')]"
        >
          الطلبات المُنجزة
          <span v-if="finishedCount > 0" class="notif-badge">{{ finishedCount }}</span>
        </router-link>

      <router-link
          v-if="role === 'admin'"
          to="/admin/paid-orders"
          :class="['nav-button', buttonClass('/admin/paid-orders')]"
        >تقرير الإيرادات المدفوعة</router-link>


        <router-link
          v-if="role === 'admin'"
          to="/admin/canceled-orders"
          :class="['nav-button', buttonClass('/admin/canceled-orders')]"
        >الطلبات الملغاة</router-link>



        <router-link
          v-if="role === 'admin'"
          to="/admin/add-expense"
          :class="['nav-button', buttonClass('/admin/add-expense')]"
        >إضافة مصروف</router-link>
      </div>

      <!-- Logout -->
      <button @click="logout" class="logout-button">تسجيل الخروج</button>

      <!-- ✅ Sidebar Footer INSIDE -->
      <div class="sidebar-footer">
        <small>جميع الحقوق محفوظة © 2025</small>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const role = ref(localStorage.getItem('userRole'))

function buttonClass(path) {
  return route.path === path ? 'active' : ''
}

function logout() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userRole')
  router.push('/login')
}

const pendingCount = ref(0)
const liveCount = ref(0)
const finishedCount = ref(0)

let lastPending = 0
let lastLive = 0
let lastFinished = 0

const ding = new Audio('/sounds/ding.mp3')

onMounted(() => {
  fetchCounts()
  setInterval(fetchCounts, 5000)
})

async function fetchCounts() {
  try {
    const res = await fetch('/api/orders/counts')

    const data = await res.json()

    if (data.pending > lastPending || data.live > lastLive || data.finished > lastFinished) {
      ding.play().catch(() => {})
    }

    pendingCount.value = data.pending || 0
    liveCount.value = data.live || 0
    finishedCount.value = data.finished || 0

    lastPending = data.pending
    lastLive = data.live
    lastFinished = data.finished
  } catch (err) {
    console.error('❌ Failed to fetch counts', err)
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/2family=Tajawal:wght@400;500;700&display=swap');

* {
  font-family: 'Tajawal', sans-serif;
}

.app-container {
  display: flex;
  height: 100vh;
  background: #fdfaf7;
  margin: 0;
  padding: 0;
  width: 100vw;
}

.main-content {
  flex: 1;
  padding: 2rem;
  padding-right: 300px; /* ✅ enough space for sidebar */
  overflow-y: auto;
  box-sizing: border-box; /* ✅ ensures padding doesn't overflow */
}


.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: #ffffff;
  border-left: 2px solid #d8c1a3;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.branding {
  text-align: center;
  border-bottom: 1px solid #e5d0b7;
  padding-bottom: 1.5rem;
}

.branding h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #5a3e2b;
  margin-bottom: 0.5rem;
}

.branding p {
  color: #a97b62;
  font-size: 1.2rem;
  font-weight: 500;
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.nav-button {
  position: relative;
  width: 100%;
  padding: 1rem 1.5rem;
  background: #fff;
  border: 2px solid #d8c1a3;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  color: #5a3e2b;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: block;
  line-height: 1.3;
}

.nav-button:hover {
  background: #f3e8dd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.nav-button.active {
  background: #e3c3a1;
  border-color: #c9a783;
  color: #4a3423;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

.notif-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background: red;
  color: white;
  border-radius: 999px;
  padding: 0.3em 0.6em;
  font-size: 0.8rem;
  font-weight: bold;
  line-height: 1;
  box-shadow: 0 0 0 2px white;
  z-index: 10;
}

.logout-button {
  width: 100%;
  padding: 1rem 2rem;
  background: #7b4f35;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(0, 0, 2, 0.15);
  margin-top: auto;
}

.logout-button:hover {
  background: #5a3e2b;
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .main-content {
    margin-right: 0;
    margin-bottom: 80px;
  }
  
  .sidebar {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100%;
    height: auto;
    max-height: 50vh;
    border-left: none;
    border-top: 2px solid #d8c1a3;
    padding: 1rem;
    gap: 1rem;
  }
  
  .branding {
    display: none;
  }
  
  .navigation {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  
  .nav-button {
    flex: 1;
    min-width: 140px;
    max-width: 150px;
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  .sidebar-footer {
  text-align: center;
  font-size: 0.9rem;
  color: #a97b62;
  padding-top: 1rem;
  border-top: 1px solid #e5d0b7;
  margin-top: 1.5rem;
}

}
</style>