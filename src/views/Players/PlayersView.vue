<!-- Players/PlayersView.vue -->
<script setup>
import { debounce } from "lodash-es";
import { nextTick, onMounted, ref, watch } from "vue";
import { usePlayersData } from "../../composables/usePlayersData.js";
import PlayersHeader from "./PlayersHeader.vue";
import PlayersTable from "./PlayersTable.vue";

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

// Filter state - Set divisions to array with all divisions selected by default
const filters = ref({
  divisions: ["D-I", "D-II", "D-III"], // Changed to array with all divisions
  conference: null,
  school: null,
  position: null,
  search: "",
  page: 1,
  perPage: 10,
});

// Create a debounced version of loadPlayers for search
const debouncedLoadPlayers = debounce(async (maintainFocus = false) => {
  const searchInput = document.querySelector('input[type="text"]');
  const cursorPosition = searchInput?.selectionStart;

  await loadPlayers();

  // Restore focus and cursor position if needed
  if (maintainFocus && searchInput) {
    await nextTick();
    searchInput.focus();
    searchInput.setSelectionRange(cursorPosition, cursorPosition);
  }
}, 500);

// Load filter options and initial data on mount
onMounted(async () => {
  filterOptions.value = await fetchFilterOptions();
  await loadPlayers();
});

// Load players with current filters
const loadPlayers = async () => {
  const result = await fetchPlayers({
    page: filters.value.page,
    perPage: filters.value.perPage,
    divisions: filters.value.divisions, // Pass array of divisions
    conference: filters.value.conference,
    school: filters.value.school,
    position: filters.value.position,
    search: filters.value.search,
  });

  players.value = result.players;
};

// Watch for non-search filter changes
watch(
  () => ({
    divisions: filters.value.divisions,
    conference: filters.value.conference,
    school: filters.value.school,
    position: filters.value.position,
    page: filters.value.page,
  }),
  async () => {
    await loadPlayers();
  }
);

// Watch search separately with debounce and focus preservation
watch(
  () => filters.value.search,
  () => {
    debouncedLoadPlayers(true); // Pass true to maintain focus
  }
);

// Handle filter updates from PlayersHeader
const handleDivisionsUpdate = (value) => {
  filters.value.divisions = value;
  filters.value.page = 1;
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
  // Remove this function as it's no longer needed
};
</script>

<template>
  <div>
    <PlayersHeader
      class="mt-3"
      :filter-options="filterOptions"
      :loading="loading"
      :divisions="filters.divisions"
      :current-filters="filters"
      :players="players"
      @update:divisions="handleDivisionsUpdate"
      @update:conference="handleConferenceUpdate"
      @update:school="handleSchoolUpdate"
      @update:search="handleSearchUpdate"
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
