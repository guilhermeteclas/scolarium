import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import Lara from '@primeuix/themes/lara'
import ToastService from 'primevue/toastservice'

import './assets/main.css'

const app = createApp(App)

app.use(router)
app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Lara,
  },
  ripple: true,
  unstyled: false,
})
app.use(ToastService)

app.mount('#app')
