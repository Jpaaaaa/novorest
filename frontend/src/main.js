// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'  // ✅ Correct: This applies your plain CSS

const app = createApp(App)
app.use(router)
app.mount('#app')
