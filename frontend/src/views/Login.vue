<template>
  <div class="login-container">
    <h2>تسجيل الدخول</h2>
    <form @submit.prevent="login">
      <input v-model="username" placeholder="اسم المستخدم" required />
      <input v-model="password" type="password" placeholder="كلمة المرور" required />
      <button type="submit">دخول</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')

const login = async () => {
  error.value = ''
  try {
    const res = await axios.post('/api/login', {

      username: username.value,
      password: password.value,
    }, { withCredentials: true })

    // ✅ Save auth data
    localStorage.setItem('authToken', res.data.token)
    localStorage.setItem('userRole', res.data.role)

    // ✅ Redirect to proper dashboard based on role
    if (res.data.role === 'admin') {
      router.push('/admin/add-food')
    } else if (res.data.role === 'hall') {
      router.push('/admin/add-order')
    }

  } catch (err) {
    error.value = err.response?.data?.error || 'فشل تسجيل الدخول'
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 5rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  text-align: center;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
input {
  display: block;
  width: 100%;
  margin: 1rem 0;
  padding: 0.8rem;
  font-size: 1rem;
}
button {
  padding: 0.8rem 2rem;
  font-size: 1rem;
  cursor: pointer;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>
