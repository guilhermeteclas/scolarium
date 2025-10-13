<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { PostgrestError } from '@supabase/supabase-js'

interface Instrument {
  id: number
  name: string
}

const instruments = ref<Instrument[]>([])
const errorMsg = ref<string | null>(null)

async function getInstruments() {
  const { data, error }: { data: Instrument[] | null, error: PostgrestError | null } = await supabase
    .from('instruments')
    .select()

  if (error) {
    errorMsg.value = error.message
    instruments.value = []
    return
  }

  instruments.value = data ?? []
}

onMounted(() => {
  getInstruments()
})
</script>

<template>
  <div>
    <div v-if="errorMsg" class="text-red-500">{{ errorMsg }}</div>
    <ul v-else>
      <li v-for="instrument in instruments" :key="instrument.id">{{ instrument.name }}</li>
    </ul>
  </div>
</template>
