<script setup lang="ts">
import Card from 'primevue/card';
</script>

<template>
  <div class="flex justify-center gap-4">
    <Card class="mb-4">
      <template #title>Painel 1</template>
      <template #content>
        <p class="m-0">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur error repudiandae numquam
          deserunt quisquam repellat libero asperiores earum nam nobis, culpa ratione quam perferendis esse, cupiditate
          neque
          quas!
        </p>
      </template>
    </Card>

    <Card>
      <template #title>Painel 2</template>
      <template #content>
        <p class="m-0">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur error repudiandae numquam
          deserunt quisquam repellat libero asperiores earum nam nobis, culpa ratione quam perferendis esse, cupiditate
          neque
          quas!
        </p>
      </template>
    </Card>
  </div>
</template>
