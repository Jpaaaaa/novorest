import { createRouter, createWebHistory } from 'vue-router'

// Shared Admin Layout
import AdminLayout from '../views/admin.vue'

// Admin Pages
import AdminAddFood from '../views/AdminAddFood.vue'
import AdminAddOrder from '../views/AdminAddOrder.vue'
import AdminLiveOrders from '../views/AdminLiveOrders.vue'
import FinishedOrders from '../views/FinishedOrders.vue'
import CanceledOrders from '../views/CanceledOrders.vue'
import Login from '../views/Login.vue'
import AdminPaidOrders from '../views/AdminPaidOrders.vue'
import PendingOrders from '../views/PendingOrders.vue'

// Customer Page
import Customer from '../views/customer.vue'

const routes = [
  // 🔐 Admin Routes (wrapped inside layout)
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/admin/add-food' },
      { path: 'add-food', component: AdminAddFood, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'add-order', component: AdminAddOrder, meta: { requiresAuth: true, roles: ['admin', 'hall'] } },
      { path: 'pending-orders', component: PendingOrders, meta: { requiresAuth: true, roles: ['admin', 'hall'] } },
      { path: 'live-orders', component: AdminLiveOrders, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'finished-orders', component: FinishedOrders, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'canceled-orders', component: CanceledOrders, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'paid-orders', component: AdminPaidOrders, meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'add-expense', component: () => import('../views/AddExpense.vue'), meta: { requiresAuth: true, roles: ['admin'] } }
    ]
  },

  // ✅ Public customer QR menu (no login)
  { path: '/customer', component: Customer },

  // ✅ Login route for admin
  { path: '/login', component: Login },

  // ✅ Homepage goes to digital menu
  { path: '/', redirect: '/customer' },

  // 🔁 Catch all → fallback to menu
  { path: '/:pathMatch(.*)*', redirect: '/customer' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔐 Auth Guard — applies only to routes with `requiresAuth: true`
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken')
  const role = localStorage.getItem('userRole')

  if (to.meta.requiresAuth) {
    if (!token) return next('/login')
    if (!to.meta.roles.includes(role)) return next('/login')
  }

  next()
})

export default router
