<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const auth = useAuthStore()


async function signIn() {
  loading.value = true
  errorMsg.value = null
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  if (error) {
    errorMsg.value = error.message
  }
  loading.value = false
  router.push('/dashboard')
}
</script>

<template>
  <div v-if="!auth.user"
    class="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-8 bg-surface-50 dark:bg-surface-950">
    <div class="w-full max-w-md">
      <div class="bg-surface-0 dark:bg-surface-900 rounded-2xl shadow-xl p-8 md:p-10 space-y-8">
        <!-- Header -->
        <div class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="bg-primary-100 dark:bg-primary-900/30 p-4 rounded-2xl">
              <img src="/material-escolar.png" alt="Logo Scolarium" class="w-16 h-16 drop-shadow-lg" />
            </div>
          </div>
          <div class="space-y-2">
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
              Bem-vindo de volta
            </h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="signIn" class="space-y-5">
          <div class="space-y-2">
            <label for="email" class="text-surface-900 dark:text-surface-0 font-medium block text-sm">
              E-mail
            </label>
            <InputText id="email" v-model="email" type="email" placeholder="seu@email.com" class="w-full"
              autocomplete="email" required />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-surface-900 dark:text-surface-0 font-medium block text-sm">
              Senha
            </label>
            <Password id="password" v-model="password" placeholder="Digite sua senha" :toggleMask="true"
              :feedback="false" inputClass="w-full" class="w-full" autocomplete="current-password" required />
          </div>

          <div v-if="errorMsg"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 text-sm"></i>
              <span class="text-red-600 dark:text-red-400 text-sm">{{ errorMsg }}</span>
            </div>
          </div>

          <Button type="submit" label="Entrar" icon="pi pi-sign-in" class="w-full justify-center" :loading="loading" />
        </form>

        <!-- Footer -->
        <div class="text-center text-xs text-surface-600 dark:text-surface-400">
          Problemas para acessar? Entre em contato com o suporte
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
}
</style>
