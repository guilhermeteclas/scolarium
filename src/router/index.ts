import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

const routes = [
  { path: '/', component: () => import('@/views/HomeView.vue'), meta: { requiresAuth: true } },
  {
    path: '/inventories',
    component: () => import('@/views/InventoriesView.vue'),
    meta: { requiresAuth: true, label: 'Inventários' },
  },
  {
    path: '/items',
    component: () => import('@/views/ItemsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/requests',
    component: () => import('@/views/RequestsView.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/login', component: () => import('@/views/LoginView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  const toast = useToast()

  // Verifica autenticação apenas se a rota requer auth e não há usuário
  if (to.meta.requiresAuth && !auth.user) {
    try {
      await auth.fetchUser()

      // Se ainda não há usuário após fetchUser, redireciona para login
      if (!auth.user) {
        next('/login')
        toast.add({
          severity: 'warn',
          summary: 'Rota protegida',
          detail: 'Você precisa estar logado para acessar esta página.',
          life: 3000,
        })
      } else {
        next()
      }
    } catch {
      next('/login')
    }
  } else {
    next()
  }
})

export default router
