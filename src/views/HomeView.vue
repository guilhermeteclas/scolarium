<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()

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
    icon: 'pi pi-shopping-cart',
    description: 'Controle entradas e saídas',
    color: 'bg-purple-500',
    route: '/requests',
  },
]

const stats = [
  {
    label: 'Total de Itens',
    value: '248',
    icon: 'pi pi-box',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    label: 'Pedidos Pendentes',
    value: '12',
    icon: 'pi pi-clock',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
  {
    label: 'Inventários Ativos',
    value: '5',
    icon: 'pi pi-warehouse',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    label: 'Itens Críticos',
    value: '8',
    icon: 'pi pi-exclamation-triangle',
    color: 'text-red-600',
    bg: 'bg-red-100',
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

    <!-- Informações Adicionais -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Atividades Recentes -->
      <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-clock text-primary-600 dark:text-primary-400"></i>
            <span class="text-lg">Atividades Recentes</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg shrink-0">
                <i class="pi pi-plus text-blue-600 dark:text-blue-400"></i>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-surface-900 dark:text-surface-0">
                  Novo item cadastrado
                </p>
                <p class="text-xs text-surface-600 dark:text-surface-400">Há 2 horas</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg shrink-0">
                <i class="pi pi-check text-green-600 dark:text-green-400"></i>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-surface-900 dark:text-surface-0">
                  Pedido aprovado
                </p>
                <p class="text-xs text-surface-600 dark:text-surface-400">Há 5 horas</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <div class="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg shrink-0">
                <i class="pi pi-warehouse text-purple-600 dark:text-purple-400"></i>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-surface-900 dark:text-surface-0">
                  Inventário atualizado
                </p>
                <p class="text-xs text-surface-600 dark:text-surface-400">Ontem</p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Alertas -->
      <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-bell text-orange-600 dark:text-orange-400"></i>
            <span class="text-lg">Alertas</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div
              class="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
            >
              <i
                class="pi pi-exclamation-circle text-orange-600 dark:text-orange-400 mt-1 shrink-0"
              ></i>
              <div class="flex-1">
                <p class="text-sm font-medium text-surface-900 dark:text-surface-0">
                  8 itens com estoque baixo
                </p>
                <p class="text-xs text-surface-600 dark:text-surface-400">
                  Verifique os itens e faça novos pedidos
                </p>
              </div>
            </div>

            <div
              class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-1 shrink-0"></i>
              <div class="flex-1">
                <p class="text-sm font-medium text-surface-900 dark:text-surface-0">
                  12 pedidos aguardando aprovação
                </p>
                <p class="text-xs text-surface-600 dark:text-surface-400">
                  Revise e aprove os pedidos pendentes
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>
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
