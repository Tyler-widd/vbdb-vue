<!-- Players/PlayersView.vue -->
<script setup>
import { ref, onMounted, watch } from "vue";
import PlayersHeader from "./PlayersHeader.vue";
import PlayersTable from "./PlayersTable.vue";
import { usePlayersData } from "@/composables/usePlayersData";

// Use the players data composable
const {
  loading,
  error,
  fetchPlayers,
  fetchFilterOptions,
  currentPage,
  totalPages,
  totalPlayers,
} = usePlayersData();

// State for players data and filters
const players = ref([]);
const filterOptions = ref({
  divisions: [],
  conferences: [],
  schools: [],
  positions: [],
});

// Filter state
const filters = ref({
  division: null,
  conference: null,
  school: null,
  position: null,
  search: "",
  allDivisions: false,
  page: 1,
  perPage: 100,
});

// Load filter options on mount
onMounted(async () => {
  filterOptions.value = await fetchFilterOptions();
  await loadPlayers();
});

// Load players with current filters
const loadPlayers = async () => {
  const result = await fetchPlayers({
    page: filters.value.page,
    perPage: filters.value.perPage,
    division: filters.value.division,
    conference: filters.value.conference,
    teamId: filters.value.school, // If you want to filter by school, you might need to map school to teamId
    position: filters.value.position,
    search: filters.value.search,
    allDivisions: filters.value.allDivisions,
  });

  players.value = result.players;
};

// Watch for filter changes and reload data
watch(
  filters,
  async () => {
    await loadPlayers();
  },
  { deep: true }
);

// Handle filter updates from PlayersHeader
const handleDivisionUpdate = (value) => {
  filters.value.division = value;
  filters.value.page = 1; // Reset to first page
};

const handleConferenceUpdate = (value) => {
  filters.value.conference = value;
  filters.value.page = 1;
};

const handleSchoolUpdate = (value) => {
  filters.value.school = value;
  filters.value.page = 1;
};

const handleSearchUpdate = (value) => {
  filters.value.search = value;
  filters.value.page = 1;
};

const handlePageUpdate = (value) => {
  filters.value.page = value;
};

const handleAllDivisionsUpdate = (value) => {
  filters.value.allDivisions = value;
  filters.value.page = 1;
};
</script>

<template>
  <div>
    <PlayersHeader
      :filter-options="filterOptions"
      :loading="loading"
      :all-divisions="filters.allDivisions"
      :current-filters="filters"
      :players="players"
      @update:division="handleDivisionUpdate"
      @update:conference="handleConferenceUpdate"
      @update:school="handleSchoolUpdate"
      @update:search="handleSearchUpdate"
      @update:all-divisions="handleAllDivisionsUpdate"
    />

    <PlayersTable
      :players="players"
      :loading="loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-players="totalPlayers"
      @update:page="handlePageUpdate"
    />

    <!-- Error display at the view level -->
    <v-alert v-if="error" type="error" class="mt-4" dismissible>
      {{ error }}
    </v-alert>
  </div>
</template>
