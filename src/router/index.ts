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

// Função para verificar permissões
function checkPermissions(
  to: import('vue-router').RouteLocationNormalized,
  auth: ReturnType<typeof useAuthStore>,
  toast: ReturnType<typeof useToast>,
) {
  if (to.meta.requiresPermission && auth.user && auth.profile) {
    const permissions = usePermissions()
    const permissionKey = to.meta.requiresPermission as keyof ReturnType<typeof usePermissions>
    const hasPermission = permissions[permissionKey]

    // Verifica se é uma função (como canEditRequestItems) ou um ComputedRef
    const permissionValue = typeof hasPermission === 'function' ? false : hasPermission.value

    if (!permissionValue) {
      toast.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para acessar esta página.',
        life: 3000,
      })
      return '/requests'
    }
  }

  return null
}

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  const toast = useToast()

  // Permite acesso à rota de login sem verificar autenticação
  if (to.path === '/login') {
    if (auth.user) {
      next('/')
      toast.add({
        severity: 'info',
        summary: 'Já está logado',
        detail: 'Você já está logado e foi redirecionado.',
        life: 3000,
      })
    } else {
      next()
    }
    return
  }

  // Verifica autenticação e carrega dados do usuário
  if (to.meta.requiresAuth) {
    if (!auth.user) {
      try {
        await auth.fetchUser()

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

    if (!auth.profile) {
      await auth.fetchUser()

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

  // Redireciona usuários com role 'user' para /requests
  if (auth.profile?.role === 'user' && to.path !== '/requests') {
    toast.add({
      severity: 'info',
      summary: 'Redirecionado',
      detail: 'Você foi redirecionado para sua página inicial.',
      life: 3000,
    })
    next('/requests')
    return
  }

  // Redireciona managers para /requests se tentarem acessar rotas não permitidas
  if (
    auth.profile?.role === 'manager' &&
    to.path === '/dashboard' // Bloqueia apenas o acesso ao dashboard
  ) {
    toast.add({
      severity: 'info',
      summary: 'Redirecionado',
      detail: 'Solicite ao admin do sistema acesso ao dashboard.',
      life: 3000,
    })
    next('/inventories')
    return
  }

  // Verifica permissões
  const permissionRedirect = checkPermissions(to, auth, toast)
  if (permissionRedirect) {
    next(permissionRedirect)
    return
  }

  next()
})

export default router
