<script setup lang="ts">
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useDashboard } from '@/composables/useDashboard'

const router = useRouter()

const { 
  totalInventarios,
  totalItens,
  pedidosPendentes,
  loadStats
} = useDashboard()

onMounted(() => {
  loadStats()
})

const quickActions = [
  {
    title: 'Inventários',
    icon: 'pi pi-warehouse',
    description: 'Gerencie seus almoxarifados',
    color: 'bg-blue-500',
    route: '/inventories',
  },
  {
    title: 'Itens',
    icon: 'pi pi-box',
    description: 'Cadastre e organize materiais',
    color: 'bg-green-500',
    route: '/items',
  },
  {
    title: 'Pedidos',
    icon: 'pi pi-list',
    description: 'Controle entradas e saídas',
    color: 'bg-purple-500',
    route: '/requests',
  },
]

const stats = [
  {
    label: 'Total de Itens',
    value: totalItens,
    icon: 'pi pi-box',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    label: 'Pedidos Pendentes',
    value: pedidosPendentes,
    icon: 'pi pi-clock',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
  {
    label: 'Inventários Ativos',
    value: totalInventarios,
    icon: 'pi pi-warehouse',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Cabeçalho de Boas-vindas -->
    <div
      class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
    >
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
        Bem-vindo ao Scolarium! 👋
      </h1>
      <p class="text-surface-600 dark:text-surface-400">
        Sistema de gestão de materiais escolares e almoxarifado
      </p>
    </div>

    <!-- Estatísticas Rápidas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-surface-0 dark:bg-surface-900 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">{{ stat.label }}</p>
            <p class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ stat.value }}</p>
          </div>
          <div :class="[stat.bg, 'p-3 rounded-lg']">
            <i :class="[stat.icon, stat.color, 'text-xl']"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Ações Rápidas -->
    <div>
      <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4">Ações Rápidas</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="action in quickActions"
          :key="action.title"
          class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 cursor-pointer"
          @click="router.push(action.route)"
        >
          <div class="flex flex-col items-center text-center space-y-4">
            <div
              :class="[
                action.color,
                'w-16 h-16 rounded-full flex items-center justify-center text-white',
              ]"
            >
              <i :class="[action.icon, 'text-2xl']"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-1">
                {{ action.title }}
              </h3>
              <p class="text-sm text-surface-600 dark:text-surface-400">
                {{ action.description }}
              </p>
            </div>
            <Button label="Acessar" text size="small" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
:deep(.p-card .p-card-title) {
  font-size: 1.125rem;
  font-weight: 600;
}

:deep(.p-card .p-card-content) {
  padding-top: 0;
}
</style>
