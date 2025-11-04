import type { MenuItem } from 'primevue/menuitem'
import { useRouter } from 'vue-router'

export const createMenuItems = (): MenuItem[] => {
  const router = useRouter()

  const items: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => {
        router.push('/')
      },
    },
    {
      label: 'Inventários',
      icon: 'pi pi-warehouse',
      command: () => {
        router.push('/inventories')
      },
    },
    {
      label: 'Itens',
      icon: 'pi pi-box',
      command: () => {
        router.push('/items')
      },
    },
    {
      label: 'Pedidos',
      icon: 'pi pi-shopping-cart',
      command: () => {
        router.push('/requests')
      },
    },
  ]

  return items
}
