<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import AutoComplete from 'primevue/autocomplete'
import Calendar from 'primevue/calendar'
import ProgressSpinner from 'primevue/progressspinner'

import { useToast } from 'primevue/usetoast'
import { safeParse } from 'valibot'
import { useRequests } from '@/composables/useRequests'
import { useItems } from '@/composables/useItems'
import { usePermissions } from '@/composables/usePermissions'
import { RequestWithItemsCreateSchema } from '@/schemas'
import { STATUS_OPTIONS } from '@/utils/requestStatus'

import type { Request, RequestItem, Item } from '@/types'

/**
 * Dialog autocontido de criação/edição de pedido.
 * - Valida via schema Valibot (datas, período, itens, retiradas/devoluções)
 * - Salva via service (regras de estoque ficam no service)
 * - Emite 'saved' após persistir com sucesso
 */
const props = defineProps<{
  visible: boolean
  request: Request | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const { fetchRequestItems, createRequest, updateRequest } = useRequests()
const { searchItems } = useItems()
const { canEditRequestStatus, canEditRequestItems } = usePermissions()

const isEditMode = computed(() => props.request !== null)

// Form state
const form = reactive<{
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

// Itens selecionados do pedido
type SelectedItemData = {
  item: Item
  quantity: number
  checkedOut: number
  returned: number
}
const selectedItems = ref<Map<number, SelectedItemData>>(new Map())

// Estado de carregamento/salvamento
const itemsLoading = ref(false)
const saving = ref(false)

// Busca de itens
const itemSearch = ref('')
const searchedItems = ref<Item[]>([])
const itemSearchLoading = ref(false)

const canEditStatus = computed(() => canEditRequestStatus)
const canEditItems = computed(() =>
  canEditRequestItems(isEditMode.value, form.status),
)

function resetState() {
  selectedItems.value.clear()
  itemSearch.value = ''
  searchedItems.value = []

  if (props.request) {
    form.details = props.request.details
    form.reservationStart = new Date(props.request.reservationStart)
    form.reservationEnd = new Date(props.request.reservationEnd)
    form.status = props.request.status
    loadRequestItems(props.request.id)
  } else {
    form.details = null
    form.reservationStart = null
    form.reservationEnd = null
    form.status = 'open'
  }
}

async function loadRequestItems(requestId: number) {
  itemsLoading.value = true
  try {
    const items = await fetchRequestItems(requestId)
    items.forEach((itemRow: RequestItem) => {
      if (itemRow.item) {
        selectedItems.value.set(itemRow.item.id, {
          item: itemRow.item,
          quantity: itemRow.quantity,
          checkedOut: itemRow.checkedOut,
          returned: itemRow.returned,
        })
      }
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Erro ao carregar itens do pedido',
      life: 3000,
    })
  } finally {
    itemsLoading.value = false
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) resetState()
  },
)

// Ações de busca/seleção de itens
async function handleSearchItems(event: { query: string }) {
  itemSearchLoading.value = true
  try {
    searchedItems.value = await searchItems(event.query || '')
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao buscar itens'
    toast.add({ severity: 'error', summary: 'Erro', detail: msg, life: 3000 })
  } finally {
    itemSearchLoading.value = false
  }
}

function addItemToRequest(item: Item) {
  if (!selectedItems.value.has(item.id)) {
    selectedItems.value.set(item.id, { item, quantity: 1, checkedOut: 0, returned: 0 })
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

function updateCheckedOut(itemId: number, value: string) {
  const itemData = selectedItems.value.get(itemId)
  if (itemData) itemData.checkedOut = parseInt(value)
}

function updateReturned(itemId: number, value: string) {
  const itemData = selectedItems.value.get(itemId)
  if (itemData) itemData.returned = parseInt(value)
}

function close() {
  emit('update:visible', false)
}

// Submissão (validação + save via service)
async function handleSubmit() {
  const parsed = safeParse(RequestWithItemsCreateSchema, {
    details: form.details,
    reservationStart: form.reservationStart,
    reservationEnd: form.reservationEnd,
    status: form.status,
    items: Array.from(selectedItems.value.entries()).map(([itemId, data]) => ({
      itemId,
      quantity: data.quantity,
      checkedOut: data.checkedOut,
      returned: data.returned,
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

  saving.value = true
  try {
    if (isEditMode.value && props.request) {
      await updateRequest(props.request.id, payload)
      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: 'Pedido atualizado com sucesso',
        life: 3000,
      })
    } else {
      await createRequest(payload)
      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: 'Pedido criado com sucesso',
        life: 3000,
      })
    }
    emit('saved')
    close()
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao salvar pedido'
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: msg,
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :style="{ width: '60%', maxHeight: '90vh' }"
    :draggable="false"
    :header="isEditMode ? `Editar - Pedido ${request?.id}` : 'Criar Novo Pedido'"
    class="overflow-y-auto"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div v-if="saving" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="itemsLoading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Seção 1: Dados Principais -->
      <div class="border-b border-surface-200 dark:border-surface-700 pb-4">
        <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Informações do Pedido</h3>

        <!-- Detalhes -->
        <div class="flex flex-col gap-2 mb-4">
          <label for="details" class="font-semibold text-surface-900 dark:text-surface-0">Detalhes</label>
          <textarea id="details" v-model="form.details" rows="3"
            class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Descrição do pedido (opcional)" />
        </div>

        <!-- Datas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="flex flex-col gap-2">
            <label for="reservation_start" class="font-semibold text-surface-900 dark:text-surface-0">
              Data de Início *
            </label>
            <Calendar id="reservation_start" v-model="form.reservationStart" showTime hourFormat="24"
              dateFormat="dd/mm/yy" required panelClass="min-w-[12rem]"
              class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="reservation_end" class="font-semibold text-surface-900 dark:text-surface-0">
              Data de Término *
            </label>
            <Calendar id="reservation_end" v-model="form.reservationEnd" showTime hourFormat="24"
              dateFormat="dd/mm/yy" required panelClass="min-w-[12rem]"
              class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Status (apenas edição) -->
        <div v-if="isEditMode" class="flex flex-col gap-2">
          <label for="status" class="font-semibold text-surface-900 dark:text-surface-0">Status</label>
          <select id="status" v-model="form.status" :disabled="!canEditStatus"
            class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
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
                <template v-if="isEditMode && (form.status === 'ready' || form.status === 'completed')">
                  <div class="flex flex-col items-center mx-2">
                    <label class="text-xs">Retirados</label>
                    <input type="number" :value="checkedOut" min="0"
                      @input="updateCheckedOut(itemId, ($event.target as HTMLInputElement).value)"
                      class="w-16 px-2 py-1 border border-primary-300 dark:border-primary-600 rounded bg-surface-0 dark:bg-surface-900 text-primary-900 dark:text-primary-200 text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div class="flex flex-col items-center mx-2">
                    <label class="text-xs">Devolvidos</label>
                    <input type="number" :value="returned" min="0"
                      @input="updateReturned(itemId, ($event.target as HTMLInputElement).value)"
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
        <Button type="button" label="Cancelar" icon="pi pi-times" severity="secondary" text @click="close" />
        <Button type="submit" :label="isEditMode ? 'Atualizar' : 'Criar'" icon="pi pi-check"
          severity="success" />
      </div>
    </form>
  </Dialog>
</template>
