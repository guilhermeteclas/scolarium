<script setup lang="ts">
import Toast from 'primevue/toast'
import Menubar from 'primevue/menubar'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'

const auth = useAuthStore()
const { navigationItems, authItem } = useNavigation()
</script>

<template>
  <nav v-if="auth.user" class="p-4">
    <Menubar :model="navigationItems">
      <template #end>
        <div class="flex items-center gap-4">
          <ProgressSpinner v-if="auth.loading" class="w-4 h-4" />
          <div v-else class="text-xs text-gray-500">
            <Tag icon="pi pi-user" severity="secondary">{{ auth.user?.email }}</Tag>
          </div>
          <Menubar :model="[authItem]" class="border-none" />
        </div>
      </template>
    </Menubar>
  </nav>

  <div v-else class="p-4 flex justify-end items-center gap-4">
    <ProgressSpinner v-if="auth.loading" class="w-4 h-4" />
    <Menubar :model="[authItem]" class="border-none" />
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

:deep(.p-menubar.border-none) {
  border: none;
  background: transparent;
}
</style>
