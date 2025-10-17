<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const route = useRoute()
const products = ref();

onMounted(() => {
  products.value = [
    { code: 'P100', name: 'Materiais', local: 'CEIM' },
    { code: 'P101', name: 'Almoxarifado Escola', local: 'Blandina' },
    { code: 'P102', name: 'Reserva', local: 'CEIM' },
  ];
});


const columns = [
  { field: 'code', header: 'Code' },
  { field: 'name', header: 'Name' },
  { field: 'local', header: 'Local' },
];


</script>

<template>
  <Card>
    <template #title>
      <h1 class="text-primary">
        {{ route.meta.label }}
      </h1>
    </template>
    <template #content>
      <DataTable :value="products" tableStyle="min-width: 50rem">
        <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>
      </DataTable>
    </template>
  </Card>
</template>
