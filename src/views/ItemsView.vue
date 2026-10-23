<script setup lang="ts">
import { ref, reactive } from 'vue'

// Componentes PrimeVue
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'

import PageHeader from '@/components/common/PageHeader.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import EntityDataTable, { type EntityColumn } from '@/components/ui/EntityDataTable.vue'
import EntityModal from '@/components/forms/EntityModal.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSelect from '@/components/forms/FormSelect.vue'

import { useToast } from 'primevue/usetoast'
import { safeParse } from 'valibot'

import { usePermissions } from '@/composables/usePermissions'
import { useItems } from '@/composables/useItems'
import { useInventories } from '@/composables/useInventories'
import { ItemCreateSchema, fieldErrorsFor, type FieldErrors } from '@/schemas'

import type { Inventory, Item, ItemWithInventory, ItemType } from '@/types'

const toast = useToast()
const { canCreateItems, canEditItems, canDeleteItems } = usePermissions()
const { loading, createItem, fetchItems, updateItem, deleteItem } = useItems()
const { fetchInventories } = useInventories()

const items = ref<ItemWithInventory[]>([])

// opções PT-BR (valores em EN)
type TypeOption = { label: string; value: ItemType }
const TYPE_OPTIONS: TypeOption[] = [
  { label: 'Material', value: 'material' },
  { label: 'Serviço', value: 'service' },
  { label: 'Equipamento', value: 'equipment' },
]

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<
  ItemType,
  string
>

function typeLabel(t: Item['type']): string {
  return t ? TYPE_LABEL[t as ItemType] : '—'
}

const inventories = ref<Inventory[]>([])

const error = ref<Error | null>(null)
const isEditing = ref(false)
const fieldErrors = ref<FieldErrors>({})

const columns: EntityColumn[] = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Nome do Item' },
  { field: 'quantity', header: 'Quantidade' },
  { field: 'inventory.name', header: 'Inventário' },
  { field: 'type', header: 'Tipo do Item' },
]

const displayModal = ref(false)

type FormItem = {
  name: string
  type: ItemType
  quantity: number
  inventoryId: number | null
}

const newItem = reactive<FormItem>({
  name: '',
  type: '' as ItemType,
  quantity: 0,
  inventoryId: null,
})

const displayConfirmDelete = ref(false)
const itemWithId = ref<Item | null>(null)

async function loadItems() {
  try {
    items.value = await fetchItems()
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Erro ao carregar itens')
    toast.add({
      severity: 'error',
      summary: 'Erro de Carregamento',
      detail: error.value.message,
      life: 5000,
    })
  }
}
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

loadItems()
loadInventories()

const openModal = () => {
  isEditing.value = false
  newItem.name = ''
  newItem.type = '' as ItemType
  itemWithId.value = null
  fieldErrors.value = {}
  displayModal.value = true
}

const handleEdit = (item: Item) => {
  isEditing.value = true
  newItem.name = item.name
  newItem.type = item.type
  newItem.quantity = item.quantity
  newItem.inventoryId = item.inventoryId
  itemWithId.value = item
  fieldErrors.value = {}
  displayModal.value = true
}

const confirmDelete = (item: Item) => {
  itemWithId.value = item
  displayConfirmDelete.value = true
}

const handleSave = async () => {
  const parsed = safeParse(ItemCreateSchema, {
    name: newItem.name,
    type: newItem.type,
    quantity: newItem.quantity,
    inventoryId: newItem.inventoryId,
  })
  if (!parsed.success) {
    // Erros exibidos abaixo de cada campo
    fieldErrors.value = fieldErrorsFor(parsed.issues, ['name', 'type', 'quantity', 'inventoryId'])
    return
  }
  fieldErrors.value = {}

  try {
    if (isEditing.value && itemWithId.value) {
      await updateItem(itemWithId.value.id, parsed.output)
      toast.add({
        severity: 'success',
        summary: 'Atualizado!',
        detail: `Item "${parsed.output.name}" atualizado com sucesso.`,
        life: 3000,
      })
      displayModal.value = false
      isEditing.value = false
      itemWithId.value = null
      await loadItems()
      return
    }

    // CREATE
    await createItem(parsed.output)
    toast.add({
      severity: 'success',
      summary: 'Sucesso!',
      detail: `Item "${newItem.name}" criado com sucesso.`,
      life: 3000,
    })
    displayModal.value = false
    await loadItems()
  } catch (e) {
    const action = isEditing.value ? 'editar' : 'criar'
    const message = e instanceof Error ? e.message : `Erro ao ${action} item`
    toast.add({
      severity: 'error',
      summary: `Erro ao ${action}`,
      detail: message,
      life: 5000,
    })
  }
}

const handleDelete = async () => {
  if (!itemWithId.value?.id) return

  try {
    await deleteItem(itemWithId.value.id)

    toast.add({
      severity: 'success',
      summary: 'Sucesso!',
      detail: `Item "${itemWithId.value.name}" deletado.`,
      life: 3000,
    })

    displayConfirmDelete.value = false
    itemWithId.value = null
    await loadItems()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao deletar item'
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
      title="Itens"
      subtitle="Gerencie os materiais escolares do almoxarifado"
      icon="pi-box"
      icon-class="text-green-600 dark:text-green-400"
      icon-bg-class="bg-green-100 dark:bg-green-900/30"
    >
      <template #actions>
        <Button
          v-if="canCreateItems"
          label="Adicionar Item"
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
        :data="items"
        :columns="columns"
        :loading="loading"
        :error="error"
        empty-message="Nenhum item encontrado."
        @retry="loadItems"
      >
        <template #cell-type="{ data }">
          {{ typeLabel(data.type) }}
        </template>

        <template #actions="{ data }">
          <div class="flex gap-2">
            <Button
              v-if="canEditItems"
              icon="pi pi-pencil"
              severity="info"
              size="small"
              @click="handleEdit(data)"
              aria-label="Editar"
            />
            <Button
              v-if="canDeleteItems"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              @click="confirmDelete(data)"
              aria-label="Deletar"
            />
          </div>
        </template>
      </EntityDataTable>
    </div>

    <EntityModal
      v-model:visible="displayModal"
      :title="isEditing ? 'Editar Item' : 'Adicionar Novo Item'"
      @save="handleSave"
    >
      <div class="p-fluid">
        <FormField id="name" label="Nome" required :error="fieldErrors.name">
          <InputText
            id="name"
            v-model="newItem.name"
            class="w-full"
            :required="true"
            :aria-invalid="fieldErrors.name ? 'true' : undefined"
            :aria-describedby="fieldErrors.name ? 'name-error' : undefined"
          />
        </FormField>

        <FormSelect
          id="type"
          label="Tipo"
          required
          v-model="newItem.type"
          :options="TYPE_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="Selecione o tipo"
          :error="fieldErrors.type"
        />

        <FormField id="quantity" label="Quantidade" required :error="fieldErrors.quantity">
          <InputNumber
            id="quantity"
            v-model="newItem.quantity"
            class="w-full"
            :required="true"
            :use-grouping="false"
            :aria-invalid="fieldErrors.quantity ? 'true' : undefined"
            :aria-describedby="fieldErrors.quantity ? 'quantity-error' : undefined"
          />
        </FormField>

        <FormSelect
          id="inventary"
          label="Inventário"
          required
          v-model="newItem.inventoryId"
          :options="inventories"
          option-label="name"
          option-value="id"
          placeholder="Selecione um inventário"
          :error="fieldErrors.inventoryId"
        />
      </div>
    </EntityModal>

    <ConfirmDeleteDialog
      v-model:visible="displayConfirmDelete"
      :message="
        itemWithId
          ? `Você realmente deseja deletar o item <b class='text-red-500'>${itemWithId.name}</b>? Esta ação é irreversível.`
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
