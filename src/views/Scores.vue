<!-- src/views/Scores.vue -->
<script setup>
import { ref } from "vue";
import Header from "./Scores/Header.vue";
import Table from "./Scores/Table.vue";

const filters = ref({
  school: null,
  division: null,
  conference: null,
  season: null,
  search: "",
});

const handleFilterChange = (newFilters) => {
  filters.value = { ...newFilters };
};
</script>

<template>
  <v-container fluid class="pa-4">
    <Header @filter-change="handleFilterChange" />

    <v-card class="pa-4 mt-4">
      <Table :filters="filters" />
    </v-card>
  </v-container>
</template>
