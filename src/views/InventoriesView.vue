<script setup lang="ts">
import { ref, reactive } from 'vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

import PageHeader from '@/components/common/PageHeader.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import EntityDataTable, { type EntityColumn } from '@/components/ui/EntityDataTable.vue'
import EntityModal from '@/components/forms/EntityModal.vue'
import FormField from '@/components/forms/FormField.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'

import { useToast } from 'primevue/usetoast'
import { safeParse } from 'valibot'

import { useInventories } from '@/composables/useInventories'
import { usePermissions } from '@/composables/usePermissions'
import {
  InventoryCreateSchema,
  InventoryUpdateSchema,
  fieldErrorsFor,
  type FieldErrors,
} from '@/schemas'
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
const fieldErrors = ref<FieldErrors>({})

const columns: EntityColumn[] = [
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
  fieldErrors.value = {}
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
  fieldErrors.value = {}
  displayModal.value = true
}

const handleSave = async () => {
  const formValues = {
    name: newInventory.name,
    description: newInventory.description,
  }
  // Schema de atualização no modo edição; de criação caso contrário
  const parsed = safeParse(
    isEditing.value ? InventoryUpdateSchema : InventoryCreateSchema,
    formValues,
  )
  if (!parsed.success) {
    // Erros exibidos abaixo de cada campo
    fieldErrors.value = fieldErrorsFor(parsed.issues, ['name', 'description'])
    return
  }
  fieldErrors.value = {}

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
    <PageHeader
      title="Inventários"
      subtitle="Gerencie os almoxarifados e espaços de armazenamento"
      icon="pi-warehouse"
      icon-class="text-blue-600 dark:text-blue-400"
      icon-bg-class="bg-blue-100 dark:bg-blue-900/30"
    >
      <template #actions>
        <Button
          v-if="canCreateInventories"
          label="Adicionar Inventário"
          icon="pi pi-plus"
          severity="success"
          @click="openModal"
        />
      </template>
    </PageHeader>

    <!-- Tabela de dados -->
    <div
      class="bg-surface-0 dark:bg-surface-900 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
    >
      <EntityDataTable
        :data="inventories"
        :columns="columns"
        :loading="loading"
        :error="error"
        empty-message="Nenhum inventário encontrado."
        @retry="loadInventories"
      >
        <template v-slot:[`cell-manager.firstName`]="{ data }">
          {{
            data.manager
              ? `${data.manager.firstName ?? ''} ${data.manager.lastName ?? ''}`.trim() || '—'
              : '—'
          }}
        </template>

        <template #actions="{ data }">
          <div class="flex gap-2">
            <Button
              v-if="canEditInventories"
              icon="pi pi-pencil"
              severity="info"
              size="small"
              @click="handleEdit(data)"
              aria-label="Editar"
            />
            <Button
              v-if="canDeleteInventories"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              @click="confirmDeletion(data)"
              aria-label="Deletar"
            />
          </div>
        </template>
      </EntityDataTable>
    </div>

    <EntityModal
      v-model:visible="displayModal"
      :title="isEditing ? 'Editar Inventário' : 'Adicionar Novo Inventário'"
      @save="handleSave"
    >
      <div class="p-fluid">
        <FormField id="name" label="Nome" required :error="fieldErrors.name">
          <InputText
            id="name"
            v-model="newInventory.name"
            class="w-full"
            :required="true"
            :aria-invalid="fieldErrors.name ? 'true' : undefined"
            :aria-describedby="fieldErrors.name ? 'name-error' : undefined"
          />
        </FormField>

        <FormTextarea
          id="description"
          label="Descrição"
          v-model="newInventory.description"
          :rows="5"
          :error="fieldErrors.description"
        />
      </div>
    </EntityModal>

    <ConfirmDeleteDialog
      v-model:visible="displayConfirmDelete"
      :message="
        inventoryToDelete
          ? `Você realmente deseja deletar o inventário <b class='text-red-500'>${inventoryToDelete.name}</b>? Esta ação é irreversível. Todos os itens vinculados a esse inventário também serão excluidos.`
          : ''
      "
      confirm-label="Sim, Deletar"
      cancel-label="Não"
      @confirm="handleDelete"
    />
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
