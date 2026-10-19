<script setup lang="ts">
import { ref, computed } from 'vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import AutoComplete from 'primevue/autocomplete'
import Calendar from 'primevue/calendar'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'

import { useToast } from 'primevue/usetoast'
import { safeParse } from 'valibot'
import { useRequests } from '@/composables/useRequests'
import { useItems } from '@/composables/useItems'
import { usePermissions } from '@/composables/usePermissions'
import { supabase } from '@/api/client'
import { RequestWithItemsCreateSchema } from '@/schemas'

import { formatDate } from '@/utils/dateFormatter'
import { getStatusLabel, getStatusClass } from '@/utils/requestStatus'

import type { Request, RequestItem, Item } from '@/types'

const requests = ref<Request[]>([])
const error = ref<Error | null>(null)
const toast = useToast()
const { loading, fetchRequests, fetchRequestItems, deleteRequest, createRequest, updateRequest } = useRequests()
const { canViewRequests, canDeleteRequests, canEditRequestStatus, canEditRequestItems } = usePermissions()
const { searchItems, updateItem } = useItems()

const showItemsDialog = ref(false)
const itemsRequest = ref<RequestItem[]>([])
const itemsLoading = ref(false)
const currentRequestId = ref<number | null>(null)

// Form state para edição/criação
const isEditMode = ref(false)
const editItemsDialog = ref(false)
const editFormData = ref<{
  details: string | null
  reservationStart: Date | null
  reservationEnd: Date | null
  status: Request['status']
}>({
  details: null,
  reservationStart: null,
  reservationEnd: null,
  status: 'open',
})
const currentEditingRequest = ref<Request | null>(null)
const editLoading = ref(false)

// State para gerenciamento de itens na request
type SelectedItemData = {
  item: Item
  quantity: number
  checkedOut?: number
  returned?: number
  originalCheckedOut?: number
  originalReturned?: number
}
const selectedItems = ref<Map<number, SelectedItemData>>(new Map())
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

// Verifica se pode editar itens
// - Admin e Manager: podem editar sempre
// - User: apenas quando status é 'open' (ou criando novo pedido)
const canEditItems = computed(() => {
  return canEditRequestItems(isEditMode.value, editFormData.value.status)
})

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
      reservationStart: request.reservationStart ? new Date(request.reservationStart) : null,
      reservationEnd: request.reservationEnd ? new Date(request.reservationEnd) : null,
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
              checkedOut: itemRow.checkedOut || 0,
              returned: itemRow.returned || 0,
              originalCheckedOut: itemRow.checkedOut || 0,
              originalReturned: itemRow.returned || 0
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
      reservationStart: null,
      reservationEnd: null,
      status: 'open', // status sempre 'open' na criação
    }
    selectedItems.value.clear()
  }

  editItemsDialog.value = true
}

async function handleSaveRequest() {
  const parsed = safeParse(RequestWithItemsCreateSchema, {
    details: editFormData.value.details,
    reservationStart: editFormData.value.reservationStart,
    reservationEnd: editFormData.value.reservationEnd,
    status: editFormData.value.status,
    items: Array.from(selectedItems.value.entries()).map(([itemId, { quantity }]) => ({
      itemId,
      quantity,
    })),
  })
  if (!parsed.success) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: parsed.issues[0].message,
      life: 3000,
    })
    return
  }
  const payload = parsed.output

  editLoading.value = true

  try {
    if (isEditMode.value && currentEditingRequest.value) {
      await updateRequest(currentEditingRequest.value.id, payload)
      // Atualiza estoque se status for 'ready' ou 'completed'
      if (payload.status === 'ready' || payload.status === 'completed') {
        for (const [itemId, itemData] of selectedItems.value.entries()) {
          const { item, quantity, checkedOut = 0, returned = 0, originalCheckedOut = 0, originalReturned = 0 } = itemData;

          // Validações
          if (checkedOut < 0) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Retirados não pode ser negativo para o item ${item.name}`, life: 4000 })
            continue
          }
          if (checkedOut > quantity) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Retirados não pode ser maior que solicitado para o item ${item.name}`, life: 4000 })
            continue
          }
          if (returned < 0) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Devolvidos não pode ser negativo para o item ${item.name}`, life: 4000 })
            continue
          }
          if (returned > checkedOut) {
            toast.add({ severity: 'warn', summary: 'Valor inválido', detail: `Devolvidos não pode ser maior que retirados para o item ${item.name}`, life: 4000 })
            continue
          }

          // Calcula o delta (diferença) entre valores antigos e novos
          const deltaCheckedOut = checkedOut - originalCheckedOut  // Positivo = retirou mais, Negativo = devolveu retirada
          const deltaReturned = returned - originalReturned          // Positivo = devolveu mais

          // Atualiza estoque baseado nos deltas
          // - Retiradas diminuem o estoque (deltaCheckedOut positivo diminui)
          // - Devoluções aumentam o estoque (deltaReturned positivo aumenta)
          const inventoryChange = -deltaCheckedOut + deltaReturned

          if (inventoryChange !== 0) {
            const newQuantity = item.quantity + inventoryChange
            try {
              await updateItem(itemId, {
                name: item.name,
                type: item.type,
                quantity: newQuantity,
                inventoryId: item.inventoryId,
              })
              // Atualiza a quantidade local para refletir a mudança
              item.quantity = newQuantity
            } catch {
              toast.add({ severity: 'error', summary: 'Erro', detail: `Erro ao atualizar estoque do item ${item.name}`, life: 3000 })
            }
          }

          // Atualiza os campos checked_out e returned em request_items
          try {
            await supabase
              .from('request_items')
              .update({ checked_out: checkedOut, returned })
              .eq('request_id', currentEditingRequest.value.id)
              .eq('item_id', itemId)
          } catch {
            toast.add({ severity: 'error', summary: 'Erro', detail: `Erro ao atualizar retirada/devolução do item ${item.name}`, life: 3000 })
          }
        }
      }
    } else {
      await createRequest(payload)
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
    <PageHeader title="Pedidos" subtitle="Controle de requisições e movimentações de materiais" icon="pi-list"
      icon-class="text-purple-600 dark:text-purple-400" icon-bg-class="bg-purple-100 dark:bg-purple-900/30"
      button-label="Novo Pedido" button-icon="pi pi-plus" button-severity="success" @action="openEditModal()" />

    <Card v-if="canViewRequests" class="shadow-sm border border-surface-200 dark:border-surface-700">
      <template #content>
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :error="error" @retry="loadRequests" />

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
                        <span class="font-medium">{{ fmt(r.reservationStart) }}</span>
                      </p>
                      <p class="text-xl m-0 mb-2 flex items-center gap-2">
                        <i class="pi pi-calendar-plus"></i>
                        <span>Término:</span>
                        <span class="font-medium">{{ fmt(r.reservationEnd) }}</span>
                      </p>
                      <p class="text-xl m-0 mb-2 flex items-center gap-2">
                        <i class="pi pi-user"></i>
                        <span class="truncate">{{ r.requesterName }}</span>
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
            <span>Retirado: <span class="font-medium">{{ item.checkedOut || '-' }}</span></span>
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
              <Calendar id="reservation_start" v-model="editFormData.reservationStart" showTime hourFormat="24"
                dateFormat="dd/mm/yy" required panelClass="min-w-[12rem]"
                class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <!-- Data de Término -->
            <div class="flex flex-col gap-2">
              <label for="reservation_end" class="font-semibold text-surface-900 dark:text-surface-0">
                Data de Término *
              </label>
              <Calendar id="reservation_end" v-model="editFormData.reservationEnd" showTime hourFormat="24"
                dateFormat="dd/mm/yy" required panelClass="min-w-[12rem]"
                class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <!-- Status -->
          <div v-if="isEditMode" class="flex flex-col gap-2">
            <label for="status" class="font-semibold text-surface-900 dark:text-surface-0">Status</label>
            <select id="status" v-model="editFormData.status" :disabled="!canEditRequestStatus"
              class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
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
              @item-select="addItemToRequest($event.value)" :disabled="!canEditItems"
              class="w-full border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800"
              input-class="w-full px-3 py-2 bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none" />
            <p v-if="!canEditItems" class="text-xs text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ Itens só podem ser adicionados/removidos quando o status for "Aberto"
            </p>
          </div>

          <!-- Lista de Itens Selecionados -->
          <div v-if="selectedItems.size > 0" class="space-y-2">
            <div class="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2">
              {{ selectedItems.size }} item(ns) selecionado(s)
            </div>
            <div class="space-y-2">
              <div v-for="[itemId, { item, quantity, checkedOut, returned }] of Array.from(selectedItems.entries())"
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
                    <input type="number" :value="quantity" :disabled="!canEditItems"
                      @input="updateItemQuantity(itemId, parseInt(($event.target as HTMLInputElement).value))" min="1"
                      class="w-16 px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-0 text-center focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <template
                    v-if="isEditMode && (editFormData.status === 'ready' || editFormData.status === 'completed')">
                    <div class="flex flex-col items-center mx-2">
                      <label class="text-xs">Retirados</label>
                      <input type="number" :value="checkedOut" min="0"
                        @input="(() => { const item = selectedItems.get(itemId); if (item) item.checkedOut = parseInt(($event.target as HTMLInputElement).value) })()"
                        class="w-16 px-2 py-1 border border-primary-300 dark:border-primary-600 rounded bg-surface-0 dark:bg-surface-900 text-primary-900 dark:text-primary-200 text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div class="flex flex-col items-center mx-2">
                      <label class="text-xs">Devolvidos</label>
                      <input type="number" :value="returned" min="0"
                        @input="(() => { const item = selectedItems.get(itemId); if (item) item.returned = parseInt(($event.target as HTMLInputElement).value) })()"
                        class="w-16 px-2 py-1 border border-green-300 dark:border-green-600 rounded bg-surface-0 dark:bg-surface-900 text-green-900 dark:text-green-200 text-center focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  </template>
                  <Button icon="pi pi-trash" severity="danger" text size="small" :disabled="!canEditItems"
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

    <ConfirmDeleteDialog v-model:visible="displayConfirmDelete"
      :message="requestToDelete ? `Você realmente deseja deletar o pedido <b class='text-red-500'>${requestToDelete.id}</b>? Esta ação é irreversível.` : ''"
      confirm-label="Sim, Deletar" cancel-label="Não" @confirm="handleDelete" />

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
