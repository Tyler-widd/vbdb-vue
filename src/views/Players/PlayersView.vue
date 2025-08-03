<!-- Players/PlayersView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import PlayersHeader from "./PlayersHeader.vue";
import PlayersTable from "./PlayersTable.vue";
import { usePlayersData } from "@/composables/usePlayersData";

// Use the players data composable
const { loading, error, getAllPlayers } = usePlayersData();

// State for players data and filters
const players = ref([]);
const divisionFilter = ref(null);
const conferenceFilter = ref(null);
const schoolFilter = ref(null);
const searchFilter = ref("");

// Load players data on component mount
onMounted(async () => {
  try {
    players.value = await getAllPlayers({
      format: true,
      sortBy: "player",
      ascending: true,
    });
  } catch (err) {
    console.error("Error loading players:", err);
  }
});

// Handle filter updates from PlayersHeader
const handleDivisionUpdate = (value) => {
  divisionFilter.value = value;
};

const handleConferenceUpdate = (value) => {
  conferenceFilter.value = value;
};

const handleSchoolUpdate = (value) => {
  schoolFilter.value = value;
};

const handleSearchUpdate = (value) => {
  searchFilter.value = value;
};
</script>

<template>
  <div>
    <PlayersHeader
      :players="players"
      :loading="loading"
      @update:division="handleDivisionUpdate"
      @update:conference="handleConferenceUpdate"
      @update:school="handleSchoolUpdate"
      @update:search="handleSearchUpdate"
    />
    <PlayersTable
      :players="players"
      :loading="loading"
      :search="searchFilter"
      :division-filter="divisionFilter"
      :conference-filter="conferenceFilter"
      :school-filter="schoolFilter"
    />

    <!-- Error display at the view level -->
    <v-alert v-if="error" type="error" class="mt-4" dismissible>
      {{ error }}
    </v-alert>
  </div>
</template>
