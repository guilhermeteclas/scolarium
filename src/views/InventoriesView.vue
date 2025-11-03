<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'

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
import type { Inventory, UserInventory } from '@/types'

// Inicialização de hooks
const route = useRoute()
const toast = useToast()
const { loading, createInventory, deleteInventory, updateInventory, fetchInventories } = useInventories()

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
    inventories.value = await fetchInventories()
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
  inventoryToDelete.value = inventory // Reusing this ref to store the inventory being edited
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
      await updateInventory(String(inventoryToDelete.value.id), {
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
    await deleteInventory(String(inventoryToDelete.value.id))

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
  <Card class="shadow-md">
    <template #title>
      <div class="p-4 w-full flex justify-between items-center">
        <h1 class="text-primary text-xl font-semibold m-0">
          {{ route.meta.label }}
        </h1>
        <Button label="Adicionar Inventário" icon="pi pi-plus" class="p-button-success" @click="openModal" />
      </div>
    </template>

    <template #content>
      <div v-if="loading" class="p-4 flex justify-center">
        <ProgressSpinner />
      </div>
      <div v-else-if="error" class="p-4">
        <p class="text-red-500 font-bold">Erro ao carregar dados: {{ error.message }}</p>
        <Button label="Recarregar" @click="loadInventories" class="mt-3" />
      </div>

      <div v-else>
        <DataTable :value="inventories" tableStyle="min-width: 50rem">
          <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>

          <Column header="Ações" headerStyle="width: 10rem" class="text-center">
            <template #body="slotProps">
              <div class="flex gap-2 justify-center">
                <Button icon="pi pi-pencil" class="p-button-info p-button-sm"
                  @click="handleEdit(slotProps.data.inventories)" aria-label="Editar" />
                <Button icon="pi pi-trash" class="p-button-danger p-button-sm"
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
      <Button label="Cancelar" icon="pi pi-times" @click="displayModal = false" class="p-button-text" />
      <Button :label="isEditing ? 'Atualizar' : 'Salvar'" icon="pi pi-check" @click="handleSave" autofocus />
    </template>
  </Dialog>

  <Dialog v-model:visible="displayConfirmDelete" header="Confirmação de Deleção" :modal="true" :draggable="false"
    class="w-full md:w-2/5">
    <div class="flex items-center">
      <i class="pi pi-exclamation-triangle text-red-500 text-3xl mr-4" />
      <span v-if="inventoryToDelete">
        Você realmente deseja deletar o inventário
        <b class="text-red-500">{{ inventoryToDelete.name }}</b>? Esta ação é irreversível.
      </span>
    </div>

    <template #footer>
      <Button label="Não" icon="pi pi-times" @click="displayConfirmDelete = false" class="p-button-text" />
      <Button label="Sim, Deletar" icon="pi pi-trash" @click="handleDelete" class="p-button-danger" autofocus />
    </template>
  </Dialog>
</template>
