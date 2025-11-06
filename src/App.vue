<script setup lang="ts">
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'
import { usePermissions } from '@/composables/usePermissions'

const auth = useAuthStore()
const { authItem } = useNavigation()
const { canViewDashboard, canViewInventories, canViewItems } = usePermissions()
</script>

<template>
  <div
    class="min-h-screen max-h-screen overflow-hidden bg-surface-50 dark:bg-surface-950 flex flex-col"
  >
    <!-- Barra de Navegação -->
    <header
      class="bg-surface-0 dark:bg-surface-900 shadow-md shrink-0 border-b border-surface-200 dark:border-surface-700"
    >
      <!-- Menu quando usuário está logado -->
      <nav v-if="auth.user" class="container mx-auto px-6 py-3">
        <div class="flex items-center justify-between gap-6">
          <!-- Logo e Nome -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
              <img src="/material-escolar.png" alt="Logo Scolarium" class="w-7 h-7" />
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                Scolarium
              </span>
              <span class="text-xs text-surface-500 dark:text-surface-400">
                Gestão de Materiais
              </span>
            </div>
          </div>

          <!-- Menu de Navegação -->
          <div class="flex-1 flex justify-center items-center gap-1">
            <RouterLink
              v-if="canViewDashboard"
              to="/"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
              active-class="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold"
            >
              <i class="pi pi-home text-base"></i>
              <span class="font-medium text-sm">Dashboard</span>
            </RouterLink>
            <RouterLink
              v-if="canViewInventories"
              to="/inventories"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
              active-class="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold"
            >
              <i class="pi pi-warehouse text-base"></i>
              <span class="font-medium text-sm">Inventários</span>
            </RouterLink>
            <RouterLink
              v-if="canViewItems"
              to="/items"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
              active-class="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold"
            >
              <i class="pi pi-box text-base"></i>
              <span class="font-medium text-sm">Itens</span>
            </RouterLink>
            <RouterLink
              to="/requests"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
              active-class="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold"
            >
              <i class="pi pi-shopping-cart text-base"></i>
              <span class="font-medium text-sm">Pedidos</span>
            </RouterLink>
          </div>

          <!-- Área do Usuário -->
          <div class="flex items-center gap-3 shrink-0">
            <ProgressSpinner v-if="auth.loading" class="w-5 h-5" strokeWidth="4" />
            <template v-else>
              <div
                class="hidden md:flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg"
              >
                <Avatar
                  icon="pi pi-user"
                  class="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                  size="small"
                  shape="circle"
                />
                <div class="flex flex-col">
                  <span class="text-xs font-medium text-surface-900 dark:text-surface-0">
                    {{ auth.profile?.first_name }} {{ auth.profile?.last_name }}
                  </span>
                  <span class="text-xs text-surface-500 dark:text-surface-400">
                    {{ auth.user?.email }}
                  </span>
                </div>
              </div>
              <Button
                :label="typeof authItem.label === 'string' ? authItem.label : undefined"
                :icon="typeof authItem.icon === 'string' ? authItem.icon : undefined"
                text
                rounded
                severity="secondary"
                size="small"
                @click="(event) => authItem.command?.({ originalEvent: event, item: authItem })"
                class="hover:bg-surface-100 dark:hover:bg-surface-800"
              />
            </template>
          </div>
        </div>
      </nav>

      <!-- Menu quando usuário NÃO está logado -->
      <nav v-else class="container mx-auto px-6 py-3 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
            <img src="/material-escolar.png" alt="Logo Scolarium" class="w-7 h-7" />
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">Scolarium</span>
            <span class="text-xs text-surface-500 dark:text-surface-400">
              Gestão de Materiais
            </span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <ProgressSpinner v-if="auth.loading" class="w-5 h-5" strokeWidth="4" />
          <Button
            v-else
            :label="typeof authItem.label === 'string' ? authItem.label : undefined"
            :icon="typeof authItem.icon === 'string' ? authItem.icon : undefined"
            severity="primary"
            size="small"
            @click="(event) => authItem.command?.({ originalEvent: event, item: authItem })"
          />
        </div>
      </nav>
    </header>

    <!-- Conteúdo Principal -->
    <main class="flex-1 overflow-y-auto">
      <Toast position="top-right" />
      <div class="container mx-auto px-6 py-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
:deep(.p-toast) {
  z-index: 9999;
}
</style>
