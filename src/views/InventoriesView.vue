<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

// Componentes PrimeVue
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast'

// Supabase
import { supabase } from '@/lib/supabaseClient'
import { useSupabaseFetch } from '@/composables/useSupabaseFetch'
import { useAuthStore } from '@/stores/auth'


import type { Inventory, UserInventory } from '@/types'

// Inicialização de hooks
const route = useRoute()
const toast = useToast()
const auth = useAuthStore()

// ESTADO DE DADOS E CONFIGURAÇÃO

const queryString = `
  id,
  profiles(
    first_name,
    last_name
  ),
  inventories(
    id,
    name,
    description
  )
`

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

// FETCH DE DADOS (useSupabaseFetch)
const {
  data: inventories,
  loading,
  error,
  refetch,
} = useSupabaseFetch<UserInventory>('user_inventories', queryString)

// Watcher para exibir Toast em caso de erro no fetch
watch(
  error,
  (newError) => {
    if (newError) {
      toast.add({
        severity: 'error',
        summary: 'Erro de Carregamento',
        detail: `Falha ao buscar inventários: ${newError.message}`,
        life: 5000,
      })
    }
  },
  { immediate: true },
)

//FUNÇÕES DE CRUD

const openModal = () => {
  newInventory.name = ''
  newInventory.description = ''
  displayModal.value = true
}

const saveInventory = async () => {
  if (!newInventory.name) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'O campo Nome é obrigatório.',
      life: 3000,
    })
    return
  }
  const userId = auth.user?.id;

  if (!userId) {
    toast.add({
      severity: 'error',
      summary: 'Erro de Autenticação',
      detail: 'Usuário não logado. Não é possível criar o inventário.',
      life: 5000,
    });
    return;
  }

  const { data: insertedInventory, error: insertError } = await supabase
    .from('inventories')
    .insert([
      {
        name: newInventory.name,
        description: newInventory.description,
      },
    ])
    .select('id')
    .single();

  if (insertError) {
    console.error('Erro ao inserir novo inventário:', insertError);
    toast.add({
      severity: 'error',
      summary: 'Erro ao Salvar',
      detail: `Não foi possível criar o inventário: ${insertError.message}`,
      life: 5000,
    });
    return;
  }

  const { error: userInventoryError } = await supabase
    .from('user_inventories')
    .insert([
      {
        inventory_id: insertedInventory.id,
        profile_id: userId,
      },
    ]);

  if (userInventoryError) {
    console.error('Erro ao vincular usuário ao inventário:', userInventoryError);
    toast.add({
      severity: 'error',
      summary: 'Alerta Parcial',
      detail: `O inventário foi criado, mas houve um erro ao atribuí-lo ao usuário: ${userInventoryError.message}`,
      life: 7000,
    });
  } else {
    toast.add({
      severity: 'success',
      summary: 'Sucesso!',
      detail: `Inventário "${newInventory.name}" adicionado e atribuído ao usuário.`,
      life: 3000,
    });
  }

  displayModal.value = false;
  await refetch();
}

const confirmDeletion = (inventory: Inventory) => {
  inventoryToDelete.value = inventory
  displayConfirmDelete.value = true
}
const deleteInventory = async () => {
  if (!inventoryToDelete.value || !inventoryToDelete.value.id) return

  const { id: inventoryId, name: inventoryName } = inventoryToDelete.value
  const userId = auth.user?.id;

  if (!userId) {
    toast.add({
      severity: 'error',
      summary: 'Erro de Autenticação',
      detail: 'Usuário não logado. Não é possível deletar o inventário.',
      life: 5000,
    });
    return;
  }

  const { error: deleteUserInventoryError } = await supabase
    .from('user_inventories')
    .delete()
    .eq('inventory_id', inventoryId)
    .eq('profile_id', userId)

  if (deleteUserInventoryError) {
    console.error('Erro ao remover permissão do inventário (user_inventories):', deleteUserInventoryError)
    toast.add({
      severity: 'error',
      summary: 'Erro na Deleção',
      detail: `Falha ao remover permissão para deletar "${inventoryName}": ${deleteUserInventoryError.message}`,
      life: 5000,
    })
    return
  }

  const { error: deleteError } = await supabase
    .from('inventories')
    .delete()
    .eq('id', inventoryId)

  displayConfirmDelete.value = false
  inventoryToDelete.value = null

  if (deleteError) {
    console.error('Erro ao deletar inventário:', deleteError)
    toast.add({
      severity: 'error',
      summary: 'Erro na Deleção',
      detail: `Não foi possível deletar "${inventoryName}": ${deleteError.message}`,
      life: 5000,
    })
    return
  }

  toast.add({
    severity: 'success',
    summary: 'Sucesso!',
    detail: `Inventário "${inventoryName}" deletado.`,
    life: 3000,
  })

  await refetch()
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
        <Button label="Recarregar" @click="refetch" class="mt-3" />
      </div>

      <div v-else>
        <DataTable :value="inventories" tableStyle="min-width: 50rem">
          <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>

          <Column header="Ações" headerStyle="width: 10rem" class="text-center">
            <template #body="slotProps">
              <Button icon="pi pi-trash" class="p-button-danger p-button-sm" @click="confirmDeletion(slotProps.data)"
                aria-label="Deletar" />
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </Card>

  <Dialog v-model:visible="displayModal" header="Adicionar Novo Inventário" :modal="true" :draggable="false"
    class="w-full md:w-3/5 lg:w-2/5">
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
      <Button label="Salvar" icon="pi pi-check" @click="saveInventory" autofocus />
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
      <Button label="Sim, Deletar" icon="pi pi-trash" @click="deleteInventory" class="p-button-danger" autofocus />
    </template>
  </Dialog>
</template>
