<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

import { useToast } from 'primevue/usetoast'
import { useRequests } from '@/composables/useRequests'

import type { RequestItem } from '@/types'

/**
 * Dialog de leitura dos itens de um pedido.
 * Busca os próprios itens ao abrir (autocontido).
 */
const props = defineProps<{
  visible: boolean
  requestId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const toast = useToast()
const { fetchRequestItems } = useRequests()

const items = ref<RequestItem[]>([])
const loading = ref(false)

watch(
  () => props.visible,
  async (visible) => {
    if (!visible || props.requestId == null) {
      items.value = []
      return
    }
    loading.value = true
    try {
      items.value = await fetchRequestItems(props.requestId)
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Erro ao carregar itens do pedido')
      toast.add({
        severity: 'error',
        summary: 'Erro ao carregar itens',
        detail: err.message,
        life: 5000,
      })
      items.value = []
    } finally {
      loading.value = false
    }
  },
)
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :style="{ width: '40%' }"
    :header="requestId != null ? `Itens - Pedido ${requestId}` : 'Itens do pedido'"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div v-if="loading" class="flex justify-center py-4">
      <ProgressSpinner />
    </div>

    <div v-else-if="!items.length" class="text-center text-surface-500">
      Nenhum item encontrado para este pedido.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="pb-3 border-b border-surface-200 dark:border-surface-700 last:border-b-0"
      >
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
</template>
