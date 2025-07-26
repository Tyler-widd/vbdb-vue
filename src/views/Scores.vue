<!-- views/Scores.vue -->
<script setup>
import { ref } from "vue";
import Header from "./Scores/Header.vue";
import Card from "./Scores/Card.vue";

// Filter state
const filters = ref({
  school: null,
  division: null,
  conference: null,
  season: "2024-25",
  search: "",
});

// Handle filter changes from header
const handleFilterChange = (newFilters) => {
  filters.value = { ...newFilters };
};
</script>

<template>
  <v-row class="justify-center ma-4" dense no-gutters>
    <v-col md="8">
      <v-row>
        <v-col cols="12">
          <Header @filter-change="handleFilterChange" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <Card :filters="filters" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
