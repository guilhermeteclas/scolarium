import type { MenuItem } from 'primevue/menuitem'
import { markRaw } from 'vue'

import { useRouter } from 'vue-router'

export const createMenuItems = () => {
  const router = useRouter()

  const items: MenuItem[] = [
    {
      label: 'Scolarium',
      icon: 'pi pi-home',
      command: () => router.push('/'),
    },
    {
      label: 'Inventários',
      icon: 'pi pi-warehouse',
      command: () => router.push('/inventories'),
    },
    {
      label: 'Itens',
      icon: 'pi pi-objects-column',
      command: () => router.push('/items'),
    },
    {
      label: 'Pedidos',
      icon: 'pi pi-list',
      command: () => router.push('/requests'),
    },
  ]

  return markRaw(items)
}
