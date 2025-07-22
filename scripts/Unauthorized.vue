<template>
  <div class="unauthorized-container">
    <h2>🚫 غير مسموح</h2>
    <p>ليس لديك صلاحية الوصول إلى هذه الصفحة.</p>
    <button @click="$router.push('/admin')">الرجوع إلى لوحة التحكم</button>
  </div>
</template>

<style scoped>
.unauthorized-container {
  max-width: 500px;
  margin: 5rem auto;
  text-align: center;
  background: #fff0f0;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #f88;
}
button {
  margin-top: 1rem;
  background: #7b4f35;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 10px;
  cursor: pointer;
}
</style>
