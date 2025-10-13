import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import UsersView from '@/views/UsersView.vue'
import InventoriesView from '@/views/InventoriesView.vue'

const routes = [
  { path: '/', component: HomeView, meta: { label: 'Scolarium' } },
  { path: '/users', component: UsersView, meta: { label: 'Usuários' } },
  { path: '/inventories', component: InventoriesView, meta: { label: 'Inventários' } },
  { path: '/login', component: LoginView, meta: { label: 'Login' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  if (to.path === '/login') {
    return next()
  }

  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return next('/login')
  }

  next()
})

export default router
