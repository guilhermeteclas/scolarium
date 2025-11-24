<script setup lang="ts">
import { ref } from 'vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

import { useToast } from 'primevue/usetoast'
import { useRequests } from '@/composables/useRequests'
import { usePermissions } from '@/composables/usePermissions'

import { formatDate } from '@/utils/dateFormatter'
import { getStatusLabel, getStatusClass } from '@/utils/requestStatus'

import type { Request, RequestItems } from '@/types'

const requests = ref<Request[]>([])
const error = ref<Error | null>(null)
const toast = useToast()
const { loading, fetchRequests, fetchRequestItems } = useRequests()
const { canViewRequests } = usePermissions()

const showItemsDialog = ref(false)
const itemsRequest = ref<RequestItems[]>([])
const itemsLoading = ref(false)
const currentRequestId = ref<number | null>(null)

const fmt = formatDate

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


async function openItems(requestId: number) {
  try {
    currentRequestId.value = requestId
    showItemsDialog.value = true
    itemsLoading.value = true

    const items = await fetchRequestItems(requestId)
    itemsRequest.value = items
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Erro ao carregar itens do pedido')
    toast.add({
      severity: 'error',
      summary: 'Erro ao carregar itens',
      detail: err.message,
      life: 5000,
    })
    showItemsDialog.value = false
  } finally {
    itemsLoading.value = false
  }
}

</script>

<template>
  <div class="space-y-4">
    <!-- header -->
    <div
      class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 ">
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

    <Card v-if="canViewRequests" class="shadow-sm border border-surface-200 dark:border-surface-700">
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
                      <span class="text-xl font-medium">Pedido {{ r.id }}</span>
                      <span class="text-xl font-semibold px-2 py-1 rounded-md" :class="getStatusClass(r.status)">
                        {{ getStatusLabel(r.status) }}
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
                      <p class="text-xl m-0 mb-2 flex items-center gap-2">
                        <i class="pi pi-info-circle"></i>
                        <span class="truncate">{{ r.details }} </span>
                      </p>
                    </div>

                    <div class="mt-2 flex justify-end">
                      <Button class="m-2" icon="pi pi-eye" severity="sucess" size="large" aria-label="Itens"
                        @click="openItems(r.id)" />
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
    <Dialog v-model:visible="showItemsDialog" modal :style="{ width: '40%' }"
      :header="currentRequestId ? `Itens - Pedido ${currentRequestId}` : 'Itens do pedido'">
      <div v-if="itemsLoading" class="flex justify-center py-4">
        <ProgressSpinner />
      </div>

      <div v-else-if="!itemsRequest.length" class="text-center text-surface-500">
        Nenhum item encontrado para este pedido.
      </div>

      <div v-else class="space-y-3">
        <div v-for="item in itemsRequest" :key="item.id"
          class="pb-3 border-b border-surface-200 dark:border-surface-700 last:border-b-0">
          <div class="flex items-start justify-between gap-4 mb-2">
            <span class="text-lg font-medium">
              {{ item.item?.name ?? '—' }}
            </span>
            <span class="text-lg font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap">
              {{ item.quantity }} unidade(s)
            </span>
          </div>

          <div class="flex gap-4 text-sm text-surface-500 dark:text-surface-400">
            <span>Retirado: <span class="font-medium">{{ item.checked_out || '-' }}</span></span>
            <span>Devolvido: <span class="font-medium">{{ item.returned || '-' }}</span></span>
          </div>
        </div>
      </div>
    </Dialog>


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
