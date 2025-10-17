<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

import Toast from 'primevue/toast';
import Menubar from 'primevue/menubar';
import type { MenuItem } from 'primevue/menuitem';

import { useRouter } from 'vue-router';
import { useToast } from "primevue/usetoast";
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const items = ref<MenuItem[]>([]);

onMounted(() => {
  auth.fetchUser();
});


function updateMenuItems() {
  items.value = [
    {
      label: 'Scolarium',
      icon: 'pi pi-home',
      command: () => router.push('/')
    },
    {
      label: 'Usuários',
      icon: 'pi pi-users',
      command: () => router.push('/users')
    },
    {
      label: 'Inventários',
      icon: 'pi pi-warehouse',
      command: () => router.push('/inventories')
    },
    {
      label: 'Itens',
      icon: 'pi pi-objects-column',
      command: () => router.push('/items')
    },
    {
      label: 'Pedidos',
      icon: 'pi pi-list',
      command: () => router.push('/requests')
    },
    auth.userEmail
      ? {
        label: 'Sair',
        icon: 'pi pi-sign-out',
        command: async () => {
          await auth.signOut();
          router.push('/login');
        }
      }
      : {
        label: 'Entrar',
        icon: 'pi pi-sign-in',
        command: () => router.push('/login')
      }
  ];
}

watch(() => auth.userEmail, (email, prevEmail) => {
  updateMenuItems();
  if (email && !prevEmail) {
    toast.add({ severity: 'success', summary: 'Login', detail: 'Usuário entrou com sucesso!', life: 3000 });
  }
  if (!email && prevEmail) {
    toast.add({ severity: 'info', summary: 'Logout', detail: 'Usuário saiu.', life: 3000 });
  }
}, { immediate: true });
</script>

<template>

  <nav class="p-4">
    <Menubar :model="items">
      <template #end>
        <div v-if="auth.userEmail" class="text-xs text-gray-500 ml-4">
          Logado como: {{ auth.userEmail }}
        </div>
      </template>
    </Menubar>


  </nav>
  <main class="p-4">
    <Toast />
    <RouterView />
  </main>
</template>
