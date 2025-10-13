<script setup lang="ts">
import Menubar from 'primevue/menubar';
import { useRouter } from 'vue-router';
import { ref, onMounted, watch } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import type { MenuItem } from 'primevue/menuitem';

const router = useRouter();
const userEmail = ref<string | null>(null);

async function fetchUser() {
  const { data } = await supabase.auth.getUser();
  userEmail.value = data.user?.email ?? null;
}

onMounted(fetchUser);

supabase.auth.onAuthStateChange(() => {
  fetchUser();
  updateMenuItems();
});

const items = ref<MenuItem[]>([]);

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
    userEmail.value
      ? {
        label: 'Sair',
        icon: 'pi pi-sign-out',
        command: async () => {
          await supabase.auth.signOut();
          userEmail.value = null;
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

watch(userEmail, updateMenuItems, { immediate: true });
</script>

<template>
  <nav class="p-4">
    <Menubar :model="items">
      <template #end>
        <div v-if="userEmail" class="text-xs text-gray-500 ml-4">
          Logado como: {{ userEmail }}
        </div>
      </template>
    </Menubar>
  </nav>
  <main class="p-4">
    <RouterView />
  </main>
</template>

<style scoped></style>
