<script setup lang="ts">
import { ref, reactive } from 'vue'

// Componentes PrimeVue
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'


import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { useToast } from 'primevue/usetoast'
import { safeParse } from 'valibot'

import { useInventories } from '@/composables/useInventories'
import { usePermissions } from '@/composables/usePermissions'
import { InventoryCreateSchema, InventoryUpdateSchema } from '@/schemas'
import type { Inventory, InventoryWithManager } from '@/types'

// Inicialização de hooks
const toast = useToast()
const { canCreateInventories, canEditInventories, canDeleteInventories } = usePermissions()
const { loading, createInventory, deleteInventory, updateInventory, fetchUserInventories } =
  useInventories()

// Estado
const inventories = ref<InventoryWithManager[]>([])
const error = ref<Error | null>(null)
const isEditing = ref(false)

const columns = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Nome do Inventário' },
  { field: 'description', header: 'Descrição do Local' },
  { field: 'manager.firstName', header: 'Responsável' },
]

const displayModal = ref(false)
const newInventory = reactive({
  name: '',
  description: '',
})

const displayConfirmDelete = ref(false)
const inventoryToDelete = ref<Inventory | null>(null)

// Função para carregar os dados
async function loadInventories() {
  try {
    inventories.value = await fetchUserInventories()
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Erro ao carregar inventários')
    toast.add({
      severity: 'error',
      summary: 'Erro de Carregamento',
      detail: error.value.message,
      life: 5000,
    })
  }
}

// Carregar dados iniciais
loadInventories()

// Funções de CRUD
const openModal = () => {
  isEditing.value = false
  newInventory.name = ''
  newInventory.description = ''
  inventoryToDelete.value = null
  displayModal.value = true
}

const confirmDeletion = (inventory: Inventory) => {
  inventoryToDelete.value = inventory
  displayConfirmDelete.value = true
}

const handleEdit = (inventory: Inventory) => {
  isEditing.value = true
  newInventory.name = inventory.name
  newInventory.description = inventory.description || ''
  inventoryToDelete.value = inventory
  displayModal.value = true
}

const handleSave = async () => {
  const formValues = {
    name: newInventory.name,
    description: newInventory.description,
  }
  // Schema de atualização no modo edição; de criação caso contrário
  const parsed = safeParse(isEditing.value ? InventoryUpdateSchema : InventoryCreateSchema, formValues)
  if (!parsed.success) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: parsed.issues[0].message,
      life: 3000,
    })
    return
  }

  try {
    if (isEditing.value && inventoryToDelete.value) {
      await updateInventory(inventoryToDelete.value.id, parsed.output)

      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: `Inventário "${parsed.output.name}" atualizado com sucesso.`,
        life: 3000,
      })
    } else {
      await createInventory(parsed.output)

      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: `Inventário "${parsed.output.name}" criado com sucesso.`,
        life: 3000,
      })
    }

    displayModal.value = false
    isEditing.value = false
    inventoryToDelete.value = null
    await loadInventories()
  } catch (e) {
    const action = isEditing.value ? 'editar' : 'criar'
    const message = e instanceof Error ? e.message : `Erro ao ${action} inventário`
    toast.add({
      severity: 'error',
      summary: `Erro ao ${action}`,
      detail: message,
      life: 5000,
    })
  }
}

const handleDelete = async () => {
  if (!inventoryToDelete.value?.id) return

  try {
    await deleteInventory(inventoryToDelete.value.id)

    toast.add({
      severity: 'success',
      summary: 'Sucesso!',
      detail: `Inventário "${inventoryToDelete.value.name}" deletado.`,
      life: 3000,
    })

    displayConfirmDelete.value = false
    inventoryToDelete.value = null
    await loadInventories()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao deletar inventário'
    toast.add({
      severity: 'error',
      summary: 'Erro na Deleção',
      detail: message,
      life: 5000,
    })
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header separado do Card -->
    <PageHeader title="Inventários" subtitle="Gerencie os almoxarifados e espaços de armazenamento" icon="pi-warehouse"
      icon-class="text-blue-600 dark:text-blue-400" icon-bg-class="bg-blue-100 dark:bg-blue-900/30">
      <template #actions>
        <Button v-if="canCreateInventories" label="Adicionar Inventário" icon="pi pi-plus" severity="success"
          @click="openModal" />
      </template>
    </PageHeader>

    <!-- Tabela de dados -->
    <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
      <template #content>
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :error="error" @retry="loadInventories" />

        <div v-else>
          <DataTable :value="inventories" tableStyle="min-width: 50rem">
            <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>

            <Column header="Ações" headerStyle="width: 10rem" class="text-center">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button v-if="canEditInventories" icon="pi pi-pencil" severity="info" size="small"
                    @click="handleEdit(slotProps.data)" aria-label="Editar" />
                  <Button v-if="canDeleteInventories" icon="pi pi-trash" severity="danger" size="small"
                    @click="confirmDeletion(slotProps.data)" aria-label="Deletar" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="displayModal" :header="isEditing ? 'Editar Inventário' : 'Adicionar Novo Inventário'"
      :modal="true" :draggable="false" class="w-full md:w-3/5 lg:w-2/5">
      <div class="p-fluid">
        <div class="mb-5">
          <label for="name" class="font-bold block mb-2">Nome</label>
          <InputText id="name" v-model="newInventory.name" class="w-full" :required="true" />
        </div>

        <div class="mb-5">
          <label for="description" class="font-bold block mb-2">Descrição</label>
          <Textarea id="description" v-model="newInventory.description" rows="5" class="w-full" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" @click="displayModal = false" text />
        <Button :label="isEditing ? 'Atualizar' : 'Salvar'" icon="pi pi-check" @click="handleSave" autofocus />
      </template>
    </Dialog>

    <ConfirmDeleteDialog v-model:visible="displayConfirmDelete"
      :message="inventoryToDelete ? `Você realmente deseja deletar o inventário <b class='text-red-500'>${inventoryToDelete.name}</b>? Esta ação é irreversível. Todos os itens vinculados a esse inventário também serão excluidos.` : ''"
      confirm-label="Sim, Deletar" cancel-label="Não" @confirm="handleDelete" />
  </div>
</template>

<style scoped>
/* Corrigir alinhamento vertical dos ícones */
.pi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

/* Garantir que ícones nos botões estejam centralizados */
:deep(.p-button .p-button-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
