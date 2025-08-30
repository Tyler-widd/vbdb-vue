<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import useLiveData from "@/composables/useLiveData.js";
import LiveHeader from "./LiveHeader.vue";
import LiveScoreCard from "./LiveScoreCard.vue";

// Use the live data composable
const { liveMatches, loading, error, fetchLiveData } = useLiveData();

// Filter states
const search = ref("");
const divisionFilter = ref(null);
const conferenceFilter = ref(null);
const showOnlyLive = ref(false); // New state for live-only filter
const showCompleted = ref(true); // New state for showing completed matches

// Get unique divisions from live data
const divisions = computed(() => {
  const divisionSet = new Set();

  liveMatches.value.forEach((match) => {
    if (match.team_1_division) divisionSet.add(match.team_1_division);
    if (match.team_2_division) divisionSet.add(match.team_2_division);
  });

  return Array.from(divisionSet).sort();
});

// Get available conferences based on selected division
const conferences = computed(() => {
  let matches = liveMatches.value;

  // Filter by division if selected
  if (divisionFilter.value) {
    matches = matches.filter(
      (match) =>
        match.team_1_division === divisionFilter.value ||
        match.team_2_division === divisionFilter.value
    );
  }

  // Extract unique conferences from filtered matches
  const confs = new Set();
  matches.forEach((match) => {
    if (match.team_1_conference) confs.add(match.team_1_conference);
    if (match.team_2_conference) confs.add(match.team_2_conference);
  });

  return Array.from(confs).sort();
});

// Event handlers
const updateSearch = (value) => {
  search.value = value;
};

const updateDivision = (value) => {
  divisionFilter.value = value;
  // Reset conference filter when division changes
  conferenceFilter.value = null;
};

const updateConference = (value) => {
  conferenceFilter.value = value;
};

const updateShowOnlyLive = (value) => {
  showOnlyLive.value = value;
  // If turning on "show only live", turn off "show completed"
  if (value) {
    showCompleted.value = false;
  }
};

const updateShowCompleted = (value) => {
  showCompleted.value = value;
  // If turning on "show completed", turn off "show only live"
  if (value) {
    showOnlyLive.value = false;
  }
};

const handleRetry = () => {
  error.value = null;
  fetchLiveData();
};

// Fetch data on mount
onMounted(() => {
  fetchLiveData();
});

// Watch for division changes to update conferences
watch(divisionFilter, () => {
  conferenceFilter.value = null;
});
</script>

<template>
  <!-- Error Alert -->
  <v-alert
    v-if="error"
    type="error"
    variant="tonal"
    closable
    class="mb-4"
    @click:close="error = null"
  >
    <template v-slot:title>Failed to load live matches</template>
    {{ error }}
    <template v-slot:append>
      <v-btn color="error" variant="outlined" size="small" @click="handleRetry">
        Retry
      </v-btn>
    </template>
  </v-alert>

  <!-- Live Header with Filters -->
  <LiveHeader
    class="mt-3"
    :divisions="divisions"
    :conferences="conferences"
    :selected-division="divisionFilter"
    :selected-conference="conferenceFilter"
    :show-only-live="showOnlyLive"
    :show-completed="showCompleted"
    :loading="loading"
    @update:search="updateSearch"
    @update:division="updateDivision"
    @update:conference="updateConference"
    @update:show-only-live="updateShowOnlyLive"
    @update:show-completed="updateShowCompleted"
  />

  <!-- Live Score Cards -->
  <LiveScoreCard
    :search="search"
    :division-filter="divisionFilter"
    :conference-filter="conferenceFilter"
    :show-only-live="showOnlyLive"
    :show-completed="showCompleted"
  />
</template>
