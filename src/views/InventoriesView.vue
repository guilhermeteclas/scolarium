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
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

import { useInventories } from '@/composables/useInventories'
import { usePermissions } from '@/composables/usePermissions'
import type { Inventory, UserInventory } from '@/types'

// Inicialização de hooks
const toast = useToast()
const { canCreateInventories, canEditInventories, canDeleteInventories } = usePermissions()
const { loading, createInventory, deleteInventory, updateInventory, fetchUserInventories } =
  useInventories()

// Estado
const inventories = ref<UserInventory[]>([])
const error = ref<Error | null>(null)
const isEditing = ref(false)

const columns = [
  { field: 'inventories.id', header: 'ID' },
  { field: 'inventories.name', header: 'Nome do Inventário' },
  { field: 'inventories.description', header: 'Descrição do Local' },
  { field: 'profiles.first_name', header: 'Responsável' },
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
  if (!newInventory.name) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'O campo Nome é obrigatório.',
      life: 3000,
    })
    return
  }

  try {
    if (isEditing.value && inventoryToDelete.value) {
      await updateInventory(inventoryToDelete.value.id, {
        name: newInventory.name,
        description: newInventory.description,
      })

      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: `Inventário "${newInventory.name}" atualizado com sucesso.`,
        life: 3000,
      })
    } else {
      await createInventory({
        name: newInventory.name,
        description: newInventory.description,
      })

      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: `Inventário "${newInventory.name}" criado com sucesso.`,
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
    <div
      class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex items-center justify-center">
            <i class="pi pi-warehouse text-blue-600 dark:text-blue-400 text-2xl leading-none"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">Inventários</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
              Gerencie os almoxarifados e espaços de armazenamento
            </p>
          </div>
        </div>
        <Button v-if="canCreateInventories" label="Adicionar Inventário" icon="pi pi-plus" severity="success"
          @click="openModal" />
      </div>
    </div>

    <!-- Tabela de dados -->
    <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
      <template #content>
        <div v-if="loading" class="flex justify-center py-8">
          <ProgressSpinner />
        </div>
        <div v-else-if="error" class="p-4">
          <p class="text-red-500 font-bold">Erro ao carregar dados: {{ error.message }}</p>
          <Button label="Recarregar" icon="pi pi-refresh" @click="loadInventories" class="mt-3" />
        </div>

        <div v-else>
          <DataTable :value="inventories" tableStyle="min-width: 50rem">
            <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>

            <Column header="Ações" headerStyle="width: 10rem" class="text-center">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button v-if="canEditInventories" icon="pi pi-pencil" severity="info" size="small"
                    @click="handleEdit(slotProps.data.inventories)" aria-label="Editar" />
                  <Button v-if="canDeleteInventories" icon="pi pi-trash" severity="danger" size="small"
                    @click="confirmDeletion(slotProps.data.inventories)" aria-label="Deletar" />
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

    <Dialog v-model:visible="displayConfirmDelete" header="Confirmação de Deleção" :modal="true" :draggable="false"
      class="w-full md:w-2/5">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle text-red-500 text-3xl mr-4" />
        <span v-if="inventoryToDelete">
          Você realmente deseja deletar o inventário
          <b class="text-red-500">{{ inventoryToDelete.name }}</b>? Esta ação é irreversível. Todos os itens vinculados
          a
          esse inventátrio também serão excluidos.
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
