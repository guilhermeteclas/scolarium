import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import { usePermissions } from '@/composables/usePermissions'

const routes = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/dashboard',
    component: () => import('@/views/DashView.vue'),
    meta: { requiresAuth: true, requiresPermission: 'canViewDashboard' },
  },
  {
    path: '/inventories',
    component: () => import('@/views/InventoriesView.vue'),
    meta: { requiresAuth: true, requiresPermission: 'canViewInventories' },
  },
  {
    path: '/items',
    component: () => import('@/views/ItemsView.vue'),
    meta: { requiresAuth: true, requiresPermission: 'canViewItems' },
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

  // Verifica autenticação e carrega dados do usuário
  if (to.meta.requiresAuth) {
    if (!auth.user) {
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
          return
        }
      } catch {
        next('/login')
        return
      }
    }

    // Garante que o profile está carregado
    if (!auth.profile) {
      await auth.fetchUser()

      // Se ainda não tem profile, algo está errado
      if (!auth.profile) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar seu perfil.',
          life: 3000,
        })
        next('/login')
        return
      }
    }
  }

  // Verifica permissões se a rota requer
  if (to.meta.requiresPermission && auth.user && auth.profile) {
    const permissions = usePermissions()
    const permissionKey = to.meta.requiresPermission as keyof ReturnType<typeof usePermissions>
    const hasPermission = permissions[permissionKey]

    if (!hasPermission.value) {
      next('/requests')
      toast.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para acessar esta página.',
        life: 3000,
      })
      return
    }
  }

  // Redireciona user para /requests se tentar acessar raiz
  if (to.path === '/' && auth.user && auth.profile?.role === 'user') {
    next('/requests')
    return
  }

  // Impede acesso à rota de login se já estiver logado
  if (to.path === '/login' && auth.user) {
    next('/dashboard')
    toast.add({
      severity: 'info',
      summary: 'Já está logado',
      detail: 'Você já está logado e foi redirecionado.',
      life: 3000,
    })
    return
  }

  next()
})

export default router
