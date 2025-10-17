<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

interface Instrument {
  id: number
  name: string
}

const instruments = ref<Instrument[]>([])
const errorMsg = ref<string | null>(null)

async function getInstruments() {
  const { data, error } = await supabase
    .from('instruments')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching instruments:', error)
    errorMsg.value = 'Sorry, something went wrong while fetching the instruments.'
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
