<!-- src/views/Schedule.vue -->
<script setup>
import { ref, onMounted } from "vue";
import Header from "./Schedule/Header.vue";
import Table from "./Schedule/Table.vue";
import apiService from "../services/apiService.js";

// API base URL
const API_BASE = "https://api.volleyballdatabased.com";

// Shared data
const scheduleData = ref([]);
const loading = ref(false);

// Filter state
const filters = ref({
  school: null,
  division: null,
  conference: null,
  season: "2024-25",
  search: "",
});

// Remove duplicates from schedule data
const removeDuplicates = (data) => {
  const uniqueGamesMap = new Map();

  data.forEach((game) => {
    // Create a unique key based on date, time, and both teams
    const uniqueKey = `${game.date}-${game.time}-${game.team_1_id}-${game.team_2_id}`;

    // Only add if we haven't seen this combination before
    if (!uniqueGamesMap.has(uniqueKey)) {
      uniqueGamesMap.set(uniqueKey, game);
    }
  });

  return Array.from(uniqueGamesMap.values());
};

// Fetch schedule data once
const fetchSchedule = async () => {
  loading.value = true;
  try {
    // Only fetch current season by default
    const currentSeason = "2024-25";
    const response = await apiService.getMegaGames({
      season: currentSeason,
      limit: 100, // Start with limited data
    });

    scheduleData.value = removeDuplicates(response);
  } catch (error) {
    console.error("Error fetching schedule:", error);
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = (newFilters) => {
  filters.value = { ...newFilters };
};

onMounted(() => {
  fetchSchedule();
});
</script>

<template>
  <v-container fluid class="pa-4">
    <Header
      :schedule-data="scheduleData"
      :loading="loading"
      @filter-change="handleFilterChange"
    />

    <v-card class="pa-4 mt-4">
      <Table
        :schedule-data="scheduleData"
        :filters="filters"
        :loading="loading"
      />
    </v-card>
  </v-container>
</template>
