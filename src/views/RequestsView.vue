<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import type { Request } from '@/types'
import { useRequests } from '@/composables/useRequests'

const requests = ref<Request[]>([])
const error = ref<Error | null>(null)
const toast = useToast()
const { loading, fetchRequests } = useRequests()


type StatusRequest = NonNullable<Request['status']>
const STATUS_OPTIONS = [
  { label: 'Aberto', value: 'open' },
  { label: 'Em andamento', value: 'in_progress' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Pronto', value: 'ready' },
  { label: 'Concluído', value: 'completed' },
  { label: 'Rejeitado', value: 'rejected' },
  { label: 'Cancelado', value: 'cancelled' },
] as const

const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, o.label])) as Record<StatusRequest, string>
function statusLabel(s: Request['status']): string {
  return s ? STATUS_LABEL[s as StatusRequest] : '—'
}

// cores coerentes com seus statuses
function statusClass(status?: string) {
  return {
    'bg-gray-100  text-gray-800 dark:bg-gray-700/40  dark:text-gray-200': status === 'open',
    'bg-blue-100  text-blue-800 dark:bg-blue-700/40  dark:text-blue-200': status === 'in_progress',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/40 dark:text-yellow-200': status === 'pending',
    'bg-teal-100  text-teal-800 dark:bg-teal-700/40  dark:text-teal-200': status === 'ready',
    'bg-green-100 text-green-800 dark:bg-green-700/40 dark:text-green-200': status === 'completed',
    'bg-red-100   text-red-800  dark:bg-red-700/40   dark:text-red-200': status === 'rejected',
    'bg-slate-200 text-slate-800 dark:bg-slate-700/40 dark:text-slate-200': status === 'cancelled',
  }
}

const fmt = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

async function loadRequests() {
  try {
    requests.value = await fetchRequests()
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Erro ao carregar pedidos')
    toast.add({ severity: 'error', summary: 'Erro', detail: error.value.message, life: 5000 })
  }
}
loadRequests()
</script>

<template>
  <div class="space-y-4">
    <!-- header -->
    <div
      class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
            <i class="pi pi-list text-purple-600 dark:text-purple-400 text-2xl"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">Pedidos</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">Controle de requisições e movimentações de
              materiais</p>
          </div>
        </div>
        <Button label="Novo Pedido" icon="pi pi-plus" severity="success" />
      </div>
    </div>

    <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
      <template #content>
        <div v-if="loading" class="flex justify-center py-8">
          <ProgressSpinner />
        </div>

        <div v-else-if="error" class="p-4">
          <p class="text-red-500 font-bold">Erro ao carregar dados: {{ error.message }}</p>
          <Button label="Recarregar" icon="pi pi-refresh" @click="loadRequests" class="mt-3" />
        </div>

        <div v-else>
          <DataView :value="requests" layout="grid" :rows="6" paginatorTemplate="PrevPageLink PageLinks NextPageLink"
            class="rounded-xl overflow-hidden">

            <!-- GRID -->
            <template #grid="{ items }">
              <!-- container flex com quebra de linha -->
              <div class="flex flex-wrap -mx-3 m-10 mb-5">
                <div v-for="r in items" :key="r.id" class="w-full md:w-1/2 px-3 mb-4">
                  <div class="cardPretty group h-full w-full p-5 rounded-xl border border-surface-200 dark:border-surface-700
                        bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]
                        hover:border-primary-400 transition-all">

                    <div class="flex items-start justify-between mb-3">
                      <span class="text-xl font-medium">ID: {{ r.id }}</span>
                      <span class="text-xl font-semibold px-2 py-1 rounded-md" :class="statusClass(r.status)">
                        {{ statusLabel(r.status) }}
                      </span>
                    </div>

                    <div class="space-y-10">
                      <p class="text-xl m-0 mb-2 flex items-center gap-2">
                        <i class="pi pi-calendar"></i>
                        <span>Início:</span>
                        <span class="font-medium">{{ fmt(r.reservation_start) }}</span>
                      </p>
                      <p class="text-xl m-0 mb-2 flex items-center gap-2">
                        <i class="pi pi-calendar-plus"></i>
                        <span>Término:</span>
                        <span class="font-medium">{{ fmt(r.reservation_end) }}</span>
                      </p>
                      <p class="text-xl m-0 mb-2 flex items-center gap-2">
                        <i class="pi pi-user"></i>
                        <span class="truncate">{{ r.profiles.first_name }} {{ r.profiles.last_name }}</span>
                      </p>
                    </div>

                    <div class="mt-2 flex justify-end">
                      <Button class="m-2" icon="pi pi-shopping-cart" severity="sucess" size="large" aria-label="Editar" />
                      <Button class="m-2" icon="pi pi-pencil" severity="info" size="large" aria-label="Editar" />
                      <Button class="m-2" icon="pi pi-trash" severity="danger" size="large" aria-label="Deletar" />
                    </div>
                  </div>
                </div>
              </div>
            </template>


            <template #empty>
              <div class="text-center p-6 text-surface-500 dark:text-surface-400">Nenhuma solicitação encontrada.</div>
            </template>
          </DataView>
        </div>
      </template>
    </Card>
  </div>
</template>


<style scoped>
.grid {
  justify-content: center;
  gap: 1rem;
}

.cardPretty {
  width: 100%;
  margin: 0;
}

.cardPretty:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
}

.pi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

:deep(.p-dataview) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.p-button .p-button-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
