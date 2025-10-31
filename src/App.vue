<script setup lang="ts">
import { onMounted, computed } from 'vue'

import Toast from 'primevue/toast'
import Menubar from 'primevue/menubar'
import Tag from 'primevue/tag';
import type { MenuItem } from 'primevue/menuitem'

import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()


const items = computed<MenuItem[]>(() => {
  if (!auth.user) {
    return []
  }
  return [
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
})

const authItem = computed<MenuItem>(() => {
  if (auth.user) {
    return {
      label: 'Sair',
      icon: 'pi pi-sign-out',
      command: async () => {
        await auth.signOut()
        router.push('/login')
      },
    }
  } else {
    return {
      label: 'Entrar',
      icon: 'pi pi-sign-in',
      command: () => router.push('/login'),
    }
  }
})

onMounted(() => {
  auth.fetchUser()
})
</script>

<template>
  <nav v-if="auth.user" class="p-4">
    <Menubar :model="items">
      <template #end>
        <div class="flex items-center">
          <div class="text-xs text-gray-500 mr-4">
            <Tag icon="pi pi-user" severity="secondary">{{ auth.user.email }}</Tag>
          </div>
          <Menubar :model="[authItem]" />
        </div>
      </template>
    </Menubar>
  </nav>

  <div v-else class="p-4 flex justify-end">
    <Menubar class="" :model="[authItem]" />
  </div>

  <main class="p-4">
    <Toast />
    <RouterView />
  </main>
</template>
<style scoped>
.p-menubar {
  padding: 2px;
}
</style>
