<!-- src/views/Schedule.vue -->
<script setup>
import { ref, onMounted } from "vue";
import Header from "./Schedule/Header.vue";
import Table from "./Schedule/Table.vue";

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
    const response = await fetch(`${API_BASE}/schedule`);
    if (response.ok) {
      const data = await response.json();

      // Remove duplicates first
      const uniqueData = removeDuplicates(data);

      // Sort games by date and time (newest first based on your original sort)
      scheduleData.value = uniqueData.sort((a, b) => {
        // Parse dates properly
        const parseDateTime = (dateStr, timeStr) => {
          if (!dateStr) return new Date(0);

          // Handle MM/DD/YYYY format
          let parsedDate;
          if (dateStr.includes("/")) {
            const [month, day, year] = dateStr.split("/");
            parsedDate = new Date(year, month - 1, day);
          } else {
            parsedDate = new Date(dateStr);
          }

          // Add time if available
          if (timeStr) {
            const [hours, minutes] = timeStr.split(":");
            parsedDate.setHours(parseInt(hours), parseInt(minutes));
          }

          return parsedDate;
        };

        const dateA = parseDateTime(a.date, a.time);
        const dateB = parseDateTime(b.date, b.time);

        // Sort newest first (descending)
        return dateB - dateA;
      });

      console.log(
        `Loaded ${uniqueData.length} unique games (removed ${
          data.length - uniqueData.length
        } duplicates)`
      );
    } else {
      console.error("Failed to fetch schedule:", response.statusText);
      scheduleData.value = [];
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
    scheduleData.value = [];
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
