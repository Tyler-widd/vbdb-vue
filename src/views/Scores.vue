<!-- src/views/Scores.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useGamesStore } from "@/composables/useGamesStore";
import Header from "./Scores/Header.vue";
import Table from "./Scores/Table.vue";
import Card from "./Scores/Card.vue";

// Use the games store for data management
const { fetchGames, loading, error } = useGamesStore();

const filters = ref({
  school: null,
  division: null,
  conference: null,
  season: "2024-25", // Default to current season
  search: "",
});

const handleFilterChange = (newFilters) => {
  filters.value = { ...newFilters };
};

// Fetch games data on mount if not already loaded
onMounted(async () => {
  try {
    await fetchGames();
  } catch (err) {
    console.error("Failed to load games data:", err);
  }
});
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Show loading state -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <div class="mt-4 text-h6">Loading games data...</div>
    </div>

    <!-- Show error state -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      <div class="text-h6">Error loading data</div>
      <div>{{ error }}</div>
      <v-btn @click="fetchGames" class="mt-2" variant="outlined">
        Try Again
      </v-btn>
    </v-alert>

    <!-- Main content -->
    <template v-else>
      <Header @filter-change="handleFilterChange" />
      <v-card class="pa-4 mt-4">
        <Card />
        <!-- <Table :filters="filters" /> -->
      </v-card>
    </template>
  </v-container>
</template>
