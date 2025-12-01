<script setup lang="ts">
import { ref } from 'vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import AutoComplete from 'primevue/autocomplete'
import Calendar from 'primevue/calendar'

import { useToast } from 'primevue/usetoast'
import { useRequests } from '@/composables/useRequests'
import { useItems } from '@/composables/useItems'
import { usePermissions } from '@/composables/usePermissions'
import { supabase } from '@/lib/supabaseClient'

import { formatDate } from '@/utils/dateFormatter'
import { getStatusLabel, getStatusClass } from '@/utils/requestStatus'
import { getUserName } from '@/utils/userFormatter'

import type { Request, RequestItems, Item } from '@/types'

const requests = ref<Request[]>([])
const error = ref<Error | null>(null)
const toast = useToast()
const { loading, fetchRequests, fetchRequestItems, deleteRequest, createRequest, updateRequest } = useRequests()
const { canViewRequests, canDeleteRequests } = usePermissions()
const { searchItems, updateItem } = useItems()

const showItemsDialog = ref(false)
const itemsRequest = ref<RequestItems[]>([])
const itemsLoading = ref(false)
const currentRequestId = ref<number | null>(null)

// Form state para edição/criação
const isEditMode = ref(false)
const editItemsDialog = ref(false)
const editFormData = ref<{
  details: string | null
  reservation_start: Date | null
  reservation_end: Date | null
  status: Request['status']
}>({
  details: null,
  reservation_start: null,
  reservation_end: null,
  status: 'open',
})
const currentEditingRequest = ref<Request | null>(null)
const editLoading = ref(false)

// State para gerenciamento de itens na request
const selectedItems = ref<Map<number, { item: Item; quantity: number; checked_out?: number; returned?: number }>>(new Map())
const itemSearch = ref('')
const searchedItems = ref<Item[]>([])
const itemSearchLoading = ref(false)

async function handleSearchItems(event: { query: string }) {
  itemSearchLoading.value = true
  try {
    const results = await searchItems(event.query || '')
    searchedItems.value = results
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao buscar itens'
    toast.add({ severity: 'error', summary: 'Erro', detail: msg, life: 3000 })
  } finally {
    itemSearchLoading.value = false
  }
}

function addItemToRequest(item: Item) {
  if (!selectedItems.value.has(item.id)) {
    selectedItems.value.set(item.id, { item, quantity: 1 })
  }
  itemSearch.value = ''
}

function removeItemFromRequest(itemId: number) {
  selectedItems.value.delete(itemId)
}

function updateItemQuantity(itemId: number, quantity: number) {
  const itemData = selectedItems.value.get(itemId)
  if (itemData) {
    itemData.quantity = quantity
  }
}

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

const displayConfirmDelete = ref(false)
const requestToDelete = ref<Request | null>(null)

const confirmDelete = (request: Request) => {
  requestToDelete.value = request
  displayConfirmDelete.value = true
}

const handleDelete = async () => {
  if (!requestToDelete.value?.id) return

  try {
    await deleteRequest(requestToDelete.value.id)

    toast.add({
      severity: 'success',
      summary: 'Sucesso!',
      detail: `Pedido "${requestToDelete.value.id}" deletado.`,
      life: 3000,
    })

    displayConfirmDelete.value = false
    requestToDelete.value = null
    await loadRequests()
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao deletar pedido"
    toast.add({
      severity: 'error',
      summary: 'Erro na Deleção',
      detail: msg,
      life: 5000,
    })
  }
}


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

function openEditModal(request?: Request) {
  isEditMode.value = !!request
  currentEditingRequest.value = request || null

  if (request) {
    editFormData.value = {
      details: request.details,
      reservation_start: request.reservation_start ? new Date(request.reservation_start) : null,
      reservation_end: request.reservation_end ? new Date(request.reservation_end) : null,
      status: request.status,
    }
    // Buscar itens da request e popular selectedItems
    itemsLoading.value = true
    selectedItems.value.clear()
    fetchRequestItems(request.id)
      .then(items => {
        items.forEach(itemRow => {
          if (itemRow.item) {
            selectedItems.value.set(itemRow.item.id, {
              item: itemRow.item,
              quantity: itemRow.quantity,
              checked_out: itemRow.checked_out || 0,
              returned: itemRow.returned || 0
            })
          }
        })
      })
      .catch(() => {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar itens do pedido', life: 3000 })
      })
      .finally(() => {
        itemsLoading.value = false
      })
  } else {
    editFormData.value = {
      details: null,
      reservation_start: null,
      reservation_end: null,
      status: 'open', // status sempre 'open' na criação
    }
    selectedItems.value.clear()
  }

  editItemsDialog.value = true
}

async function handleSaveRequest() {
  const start = editFormData.value.reservation_start
  const end = editFormData.value.reservation_end
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Preencha datas válidas de início e término',
      life: 3000,
    })
    return
  }

  // Verifica se há itens
  const itemsArr = Array.from(selectedItems.value.entries()).map(([itemId, { quantity }]) => ({ item_id: itemId, quantity }))
  if (itemsArr.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Itens obrigatórios',
      detail: 'Selecione ao menos um item para o pedido',
      life: 3000,
    })
    return
  }

  editLoading.value = true

  try {
    const payload = {
      ...editFormData.value,
      reservation_start: start.toISOString(),
      reservation_end: end.toISOString(),
    }
    if (isEditMode.value && currentEditingRequest.value) {
      await updateRequest(currentEditingRequest.value.id, payload, itemsArr)
      // Atualiza estoque se status for 'ready' ou 'completed'
      if (editFormData.value.status === 'ready' || editFormData.value.status === 'completed') {
        for (const [itemId, itemData] of selectedItems.value.entries()) {
          const { item, quantity, checked_out = 0, returned = 0 } = itemData;

          if (checked_out < 0) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Retirados não pode ser negativo para o item ${item.name}`, life: 4000 })
            continue
          }
          if (checked_out > quantity) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Retirados não pode ser maior que solicitado para o item ${item.name}`, life: 4000 })
            continue
          }
          if (returned < 0) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Devolvidos não pode ser negativo para o item ${item.name}`, life: 4000 })
            continue
          }
          if (returned > checked_out) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Devolvidos não pode ser maior que retirados para o item ${item.name}`, life: 4000 })
            continue
          }

          const calculatedQuantity = item.quantity - checked_out + returned;

          if (calculatedQuantity !== item.quantity) {
            try {
              await updateItem(itemId, {
                name: item.name,
                type: item.type || '',
                quantity: calculatedQuantity,
                inventory_id: item.inventory_id,
              })
            } catch {
              toast.add({ severity: 'error', summary: 'Erro', detail: `Erro ao atualizar estoque do item ${item.name}`, life: 3000 })
            }
          }

          // Atualiza os campos checked_out e returned em request_items
          try {
            await supabase
              .from('request_items')
              .update({ checked_out, returned })
              .eq('request_id', currentEditingRequest.value.id)
              .eq('item_id', itemId)
          } catch {
            toast.add({ severity: 'error', summary: 'Erro', detail: `Erro ao atualizar retirada/devolução do item ${item.name}`, life: 3000 })
          }
        }
      }
    } else {
      await createRequest(payload, itemsArr)
      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: 'Pedido criado com sucesso',
        life: 3000,
      })
    }

    editItemsDialog.value = false
    await loadRequests()
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao salvar pedido'
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: msg,
      life: 5000,
    })
  } finally {
    editLoading.value = false
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
        <Button label="Novo Pedido" icon="pi pi-plus" severity="success" @click="openEditModal()" />
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
                        <span class="truncate">{{ getUserName(r) }}</span>
                      </p>
                      <p class="text-xl m-0 mb-2 flex items-center gap-2">
                        <i class="pi pi-info-circle"></i>
                        <span class="truncate">{{ r.details }} </span>
                      </p>
                    </div>

                    <div class="mt-2 flex justify-end">
                      <Button class="m-2" icon="pi pi-eye" severity="success" size="large" aria-label="Itens"
                        @click="openItems(r.id)" />

                      <Button class="m-2" icon="pi pi-pencil" severity="info" size="large" aria-label="Editar"
                        @click="openEditModal(r)" />

                      <Button v-if="canDeleteRequests" class="m-2" icon="pi pi-trash" severity="danger" size="large"
                        aria-label="Deletar" @click="confirmDelete(r)" />
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

    <Dialog v-model:visible="editItemsDialog" modal :style="{ width: '60%', maxHeight: '90vh' }" :draggable="false"
      :header="isEditMode ? `Editar - Pedido ${currentEditingRequest?.id}` : 'Criar Novo Pedido'"
      @hide="editItemsDialog = false" class="overflow-y-auto">
      <div v-if="editLoading" class="flex justify-center py-8">
        <ProgressSpinner />
      </div>

      <form v-else class="space-y-6" @submit.prevent="handleSaveRequest">
        <!-- Seção 1: Dados Principais -->
        <div class="border-b border-surface-200 dark:border-surface-700 pb-4">
          <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Informações do Pedido</h3>

          <!-- Detalhes -->
          <div class="flex flex-col gap-2 mb-4">
            <label for="details" class="font-semibold text-surface-900 dark:text-surface-0">Detalhes</label>
            <textarea id="details" v-model="editFormData.details" rows="3"
              class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descrição do pedido (opcional)" />
          </div>

          <!-- Data de Início -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-2">
              <label for="reservation_start" class="font-semibold text-surface-900 dark:text-surface-0">
                Data de Início *
              </label>
              <Calendar id="reservation_start" v-model="editFormData.reservation_start" showTime hourFormat="24"
                dateFormat="dd/mm/yy" required
                class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <!-- Data de Término -->
            <div class="flex flex-col gap-2">
              <label for="reservation_end" class="font-semibold text-surface-900 dark:text-surface-0">
                Data de Término *
              </label>
              <Calendar id="reservation_end" v-model="editFormData.reservation_end" showTime hourFormat="24"
                dateFormat="dd/mm/yy" required
                class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <!-- Status -->
          <div v-if="isEditMode" class="flex flex-col gap-2">
            <label for="status" class="font-semibold text-surface-900 dark:text-surface-0">Status</label>
            <select id="status" v-model="editFormData.status"
              class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="open">Aberto</option>
              <option value="in_progress">Em andamento</option>
              <option value="pending">Pendente</option>
              <option value="ready">Pronto</option>
              <option value="completed">Concluído</option>
              <option value="rejected">Rejeitado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <!-- Seção 2: Itens do Pedido -->
        <div class="border-b border-surface-200 dark:border-surface-700 pb-4">
          <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Itens do Pedido</h3>

          <!-- Busca de Itens -->
          <div class="flex flex-col gap-2 mb-4">
            <label for="itemSearch" class="font-semibold text-surface-900 dark:text-surface-0">Pesquisar Item</label>
            <AutoComplete v-model="itemSearch" :suggestions="searchedItems" @complete="handleSearchItems"
              :loading="itemSearchLoading" placeholder="Digite o nome do item..." option-label="name"
              @item-select="addItemToRequest($event.value)"
              class="w-full border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800"
              input-class="w-full px-3 py-2 bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none" />
          </div>

          <!-- Lista de Itens Selecionados -->
          <div v-if="selectedItems.size > 0" class="space-y-2">
            <div class="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2">
              {{ selectedItems.size }} item(ns) selecionado(s)
            </div>
            <div class="space-y-2">
              <div v-for="[itemId, { item, quantity, checked_out, returned }] of Array.from(selectedItems.entries())"
                :key="itemId"
                class="flex items-center justify-between gap-3 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <div class="flex-1">
                  <p class="font-medium text-surface-900 dark:text-surface-0">{{ item.name }}</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400">
                    Disponível: {{ item.quantity }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex flex-col items-center mx-2">
                    <label class="text-xs">Solicitados</label>
                    <input type="number" :value="quantity"
                      @input="updateItemQuantity(itemId, parseInt(($event.target as HTMLInputElement).value))" min="1"
                      class="w-16 px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-0 text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <template
                    v-if="isEditMode && (editFormData.status === 'ready' || editFormData.status === 'completed')">
                    <div class="flex flex-col items-center mx-2">
                      <label class="text-xs">Retirados</label>
                      <input type="number" :value="checked_out" min="0"
                        @input="(() => { const item = selectedItems.get(itemId); if (item) item.checked_out = parseInt(($event.target as HTMLInputElement).value) })()"
                        class="w-16 px-2 py-1 border border-primary-300 dark:border-primary-600 rounded bg-surface-0 dark:bg-surface-900 text-primary-900 dark:text-primary-200 text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div class="flex flex-col items-center mx-2">
                      <label class="text-xs">Devolvidos</label>
                      <input type="number" :value="returned" min="0"
                        @input="(() => { const item = selectedItems.get(itemId); if (item) item.returned = parseInt(($event.target as HTMLInputElement).value) })()"
                        class="w-16 px-2 py-1 border border-green-300 dark:border-green-600 rounded bg-surface-0 dark:bg-surface-900 text-green-900 dark:text-green-200 text-center focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  </template>
                  <Button icon="pi pi-trash" severity="danger" text size="small"
                    @click="removeItemFromRequest(itemId)" />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4 text-surface-500 dark:text-surface-400">
            Nenhum item selecionado
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" icon="pi pi-times" severity="secondary" text @click="editItemsDialog = false" />
          <Button :label="isEditMode ? 'Atualizar' : 'Criar'" icon="pi pi-check" severity="success"
            @click="handleSaveRequest" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="displayConfirmDelete" header="Confirmação de Deleção" :modal="true" :draggable="false"
      class="w-full md:w-2/5">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle text-red-500 text-3xl mr-4" />
        <span v-if="requestToDelete">
          Você realmente deseja deletar o pedido
          <b class="text-red-500">{{ requestToDelete.id }}</b>? Esta ação é irreversível.
        </span>
      </div>

      <template #footer>
        <Button label="Não" icon="pi pi-times" @click="displayConfirmDelete = false" text />
        <Button label="Sim, Deletar" icon="pi pi-trash" @click="handleDelete" severity="danger" autofocus />
      </template>
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
