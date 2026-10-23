<script setup lang="ts">
import { ref } from 'vue'

import Card from 'primevue/card'
import DataView from 'primevue/dataview'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import RequestCard from '@/components/requests/RequestCard.vue'
import RequestForm from '@/components/requests/RequestForm.vue'
import RequestItemList from '@/components/requests/RequestItemList.vue'

import { useToast } from 'primevue/usetoast'
import { useRequests } from '@/composables/useRequests'
import { usePermissions } from '@/composables/usePermissions'

import type { Request } from '@/types'

/**
 * Lista de pedidos — apenas orquestração de UI.
 * Formulário e leitura de itens são componentes autocontidos;
 * regras de negócio/estoque ficam no request.service.
 */
const toast = useToast()
const { loading, fetchRequests, deleteRequest } = useRequests()
const { canViewRequests, canDeleteRequests } = usePermissions()

const requests = ref<Request[]>([])
const error = ref<Error | null>(null)

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

// Dialog de leitura de itens
const showItemsDialog = ref(false)
const viewedRequestId = ref<number | null>(null)

function openItems(requestId: number) {
  viewedRequestId.value = requestId
  showItemsDialog.value = true
}

// Dialog de criação/edição
const showFormDialog = ref(false)
const editingRequest = ref<Request | null>(null)

function openForm(request?: Request) {
  editingRequest.value = request ?? null
  showFormDialog.value = true
}

// Exclusão
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao deletar pedido'
    toast.add({
      severity: 'error',
      summary: 'Erro na Deleção',
      detail: msg,
      life: 5000,
    })
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- header -->
    <PageHeader
      title="Pedidos"
      subtitle="Controle de requisições e movimentações de materiais"
      icon="pi-list"
      icon-class="text-purple-600 dark:text-purple-400"
      icon-bg-class="bg-purple-100 dark:bg-purple-900/30"
      button-label="Novo Pedido"
      button-icon="pi pi-plus"
      button-severity="success"
      @action="openForm()"
    />

    <Card
      v-if="canViewRequests"
      class="shadow-sm border border-surface-200 dark:border-surface-700"
    >
      <template #content>
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :error="error" @retry="loadRequests" />

        <div v-else>
          <DataView
            :value="requests"
            layout="grid"
            :rows="6"
            paginatorTemplate="PrevPageLink PageLinks NextPageLink"
            class="rounded-xl overflow-hidden"
          >
            <!-- GRID -->
            <template #grid="{ items }">
              <div class="flex flex-wrap -mx-3 m-10 mb-5">
                <RequestCard
                  v-for="r in items"
                  :key="r.id"
                  :request="r"
                  :can-delete="canDeleteRequests"
                  @view="openItems(r.id)"
                  @edit="openForm(r)"
                  @delete="confirmDelete(r)"
                />
              </div>
            </template>

            <template #empty>
              <div class="text-center p-6 text-surface-500 dark:text-surface-400">
                Nenhuma solicitação encontrada.
              </div>
            </template>
          </DataView>
        </div>
      </template>
    </Card>

    <RequestItemList v-model:visible="showItemsDialog" :request-id="viewedRequestId" />

    <RequestForm v-model:visible="showFormDialog" :request="editingRequest" @saved="loadRequests" />

    <ConfirmDeleteDialog
      v-model:visible="displayConfirmDelete"
      :message="
        requestToDelete
          ? `Você realmente deseja deletar o pedido <b class='text-red-500'>${requestToDelete.id}</b>? Esta ação é irreversível.`
          : ''
      "
      confirm-label="Sim, Deletar"
      cancel-label="Não"
      @confirm="handleDelete"
    />
  </div>
</template>

<style scoped>
.grid {
  justify-content: center;
  gap: 1rem;
}

:deep(.p-dataview) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}
</style>
