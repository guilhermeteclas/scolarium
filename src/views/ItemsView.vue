<script setup lang="ts">
import { ref, reactive } from 'vue'

// Componentes PrimeVue
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'


import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { useToast } from 'primevue/usetoast'

import { usePermissions } from '@/composables/usePermissions'
import { useItems } from '@/composables/useItems'
import { useInventories } from '@/composables/useInventories'

import type { Inventory, Item } from '@/types'

const toast = useToast()
const { canCreateItems, canEditItems, canDeleteItems } = usePermissions()
const { loading, createItems, fetchItems, updateItem, deleteItem } = useItems()
const { fetchInventories } = useInventories()


type ItemWithInventory = Item & { inventory: { id: number; name: string } | null }
const items = ref<ItemWithInventory[]>([])

type ItemType = NonNullable<Item['type']> // 'material' | 'service' | 'equipment'

// opções PT-BR (valores em EN)
type TypeOption = { label: string; value: ItemType }
const TYPE_OPTIONS: TypeOption[] = [
  { label: 'Material', value: 'material' },
  { label: 'Serviço', value: 'service' },
  { label: 'Equipamento', value: 'equipment' },
]

const TYPE_LABEL = Object.fromEntries(
  TYPE_OPTIONS.map(o => [o.value, o.label])
) as Record<ItemType, string>

function typeLabel(t: Item['type']): string {
  return t ? TYPE_LABEL[t as ItemType] : '—'
}

//type UserInventory = { id: number; name: string }

const inventories = ref<Inventory[]>([])

const error = ref<Error | null>(null)
const isEditing = ref(false)

const columns = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Nome do Item' },
  { field: 'quantity', header: 'Quantidade' },
  { field: 'inventory.name', header: 'Inventário' },
]

const displayModal = ref(false)

type FormItem = {
  name: string
  type: Item['type']
  quantity: number
  inventory_id: number | null
}

const newItem = reactive<FormItem>({
  name: '',
  type: null,
  quantity: 0,
  inventory_id: null,
})

const displayConfirmDelete = ref(false)
const itemWhithId = ref<Item | null>(null)

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
  newItem.type = null
  itemWhithId.value = null
  displayModal.value = true
}

const handleEdit = (item: Item) => {
  isEditing.value = true
  newItem.name = item.name
  newItem.type = item.type
  newItem.quantity = item.quantity
  newItem.inventory_id = item.inventory_id
  itemWhithId.value = item
  displayModal.value = true
}

const confirmDelete = (item: Item) => {
  itemWhithId.value = item
  displayConfirmDelete.value = true
}

const handleSave = async () => {
  if (!newItem.name) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O campo Nome é obrigatório.', life: 3000 })
    return
  }

  if (!newItem.type) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O campo Tipo é obrigatório.', life: 3000 })
    return
  }

  const inventoryId = newItem.inventory_id != null ? Number(newItem.inventory_id) : null
  if (inventoryId == null || Number.isNaN(inventoryId)) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um Inventário.', life: 3000 })
    return
  }

  try {
    if (isEditing.value && itemWhithId.value) {
      await updateItem(itemWhithId.value.id, {
        name: newItem.name,
        type: newItem.type,
        quantity: newItem.quantity,
        inventory_id: Number(newItem.inventory_id),
      })
      toast.add({
        severity: 'success',
        summary: 'Atualizado!',
        detail: `Item "${newItem.name}" atualizado com sucesso.`,
        life: 3000,
      })
      displayModal.value = false
      isEditing.value = false
      itemWhithId.value = null
      await loadItems()
      return
    }

    // CREATE
    await createItems({
      name: newItem.name,
      type: newItem.type,
      quantity: newItem.quantity,
      inventory_id: Number(inventoryId),
    })
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
    toast.add({ severity: 'error', summary: `Erro ao ${action}`, detail: message, life: 5000 })
  }
}

const handleDelete = async () => {
  if (!itemWhithId.value?.id) return

  try {
    await deleteItem(itemWhithId.value.id)

    toast.add({
      severity: 'success',
      summary: 'Sucesso!',
      detail: `Inventário "${itemWhithId.value.name}" deletado.`,
      life: 3000,
    })

    displayConfirmDelete.value = false
    itemWhithId.value = null
    await loadItems()
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
    <PageHeader title="Itens" subtitle="Gerencie os materiais escolares do almoxarifado" icon="pi-box"
      icon-class="text-green-600 dark:text-green-400" icon-bg-class="bg-green-100 dark:bg-green-900/30">
      <template #actions>
        <Button v-if="canCreateItems" label="Adicionar Item" icon="pi pi-plus" severity="success" @click="openModal" />
      </template>
    </PageHeader>

    <!-- Tabela de dados -->
    <Card class="shadow-sm border border-surface-200 dark:border-surface-700">
      <template #content>
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :error="error" @retry="loadItems" />

        <div v-else>
          <DataTable :value="items" tableStyle="min-width: 50rem">
            <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>
            <Column header="Tipo do Item">
              <template #body="{ data }">
                {{ typeLabel(data.type) }}
              </template>
            </Column>
            <Column header="Ações" headerStyle="width: 10rem" class="text-center">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button v-if="canEditItems" icon="pi pi-pencil" severity="info" size="small"
                    @click="handleEdit(slotProps.data)" aria-label="Editar" />
                  <Button v-if="canDeleteItems" icon="pi pi-trash" severity="danger" size="small"
                    @click="confirmDelete(slotProps.data)" aria-label="Deletar" />
                </div>
              </template>
            </Column>

          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="displayModal" :header="isEditing ? 'Editar Item' : 'Adicionar Novo Item'" :modal="true"
      :draggable="false" class="w-full md:w-3/5 lg:w-2/5">
      <div class="p-fluid">
        <div class="mb-5">
          <label for="name" class="font-bold block mb-2">Nome</label>
          <InputText id="name" v-model="newItem.name" class="w-full" :required="true" />
        </div>

        <div class="mb-5">
          <label for="type" class="font-bold block mb-2">Tipo</label>
          <Dropdown id="type" v-model="newItem.type" :options="TYPE_OPTIONS" optionLabel="label" optionValue="value"
            placeholder="Selecione o tipo" class="w-full" />
        </div>

        <div class="mb-5">
          <label for="quantity" class="font-bold block mb-2">Quantidade</label>
          <InputNumber id="quantity" v-model="newItem.quantity" class="w-full" :required="true" />
        </div>

        <div class="mb-5">
          <label for="inventary" class="font-bold block mb-2">Inventário</label>
          <Dropdown v-model="newItem.inventory_id" :options="inventories" optionLabel="name" optionValue="id"
            placeholder="Selecione um inventário" class="w-full" id="inventary" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" @click="displayModal = false" text />
        <Button :label="isEditing ? 'Atualizar' : 'Salvar'" icon="pi pi-check" @click="handleSave" autofocus />
      </template>
    </Dialog>

    <ConfirmDeleteDialog v-model:visible="displayConfirmDelete"
      :message="itemWhithId ? `Você realmente deseja deletar o item <b class='text-red-500'>${itemWhithId.name}</b>? Esta ação é irreversível.` : ''"
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
