<script setup lang="ts">
import { useRoute } from 'vue-router'
import Card from 'primevue/card'

const route = useRoute()
</script>

<template>
  <Card>
    <template #title>
      <h1 class="text-primary">
        {{ route.meta.label }}
      </h1>
    </template>
    <template #content>
      <p class="m-0">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur error repudiandae numquam
        deserunt quisquam repellat libero asperiores earum nam nobis, culpa ratione quam perferendis esse, cupiditate
        neque quas!
      </p>
    </template>
  </Card>
</template>
