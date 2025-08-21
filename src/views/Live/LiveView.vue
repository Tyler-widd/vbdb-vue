<!-- views/Live/LiveView.vue -->
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import useLiveData from "@/composables/useLiveData.js";
import LiveHeader from "./LiveHeader.vue";
import LiveTable from "./LiveTable.vue";

// Use the live data composable
const { liveMatches, loading, error, fetchLiveData, availableConferences } =
  useLiveData();

// Filter states
const search = ref("");
const divisionFilter = ref(null);
const conferenceFilter = ref(null);

// Get unique divisions from live data
const divisions = computed(() => {
  const uniqueDivisions = [
    ...new Set(liveMatches.value.map((match) => match.division)),
  ];
  return uniqueDivisions.filter((division) => division).sort();
});

// Get available conferences based on selected division
const conferences = computed(() => {
  let matches = liveMatches.value;

  // Filter by division if selected
  if (divisionFilter.value) {
    matches = matches.filter(
      (match) => match.division === divisionFilter.value
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

// Filter function for live matches
const filterLive = (liveData, searchTerm, divisionFilter, conferenceFilter) => {
  let filtered = [...liveData];

  // Filter by division
  if (divisionFilter) {
    filtered = filtered.filter((match) => match.division === divisionFilter);
  }

  // Filter by conference
  if (conferenceFilter) {
    filtered = filtered.filter(
      (match) =>
        match.team_1_conference === conferenceFilter ||
        match.team_2_conference === conferenceFilter ||
        match.conference === conferenceFilter
    );
  }

  // Filter by search term
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (match) =>
        match.team_1_name.toLowerCase().includes(searchLower) ||
        match.team_2_name.toLowerCase().includes(searchLower) ||
        match.date.includes(searchTerm) ||
        (match.location &&
          match.location.toLowerCase().includes(searchLower)) ||
        (match.team_1_conference &&
          match.team_1_conference.toLowerCase().includes(searchLower)) ||
        (match.team_2_conference &&
          match.team_2_conference.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
};

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

const handleRetry = () => {
  error.value = null;
  fetchLiveData();
};

// Fetch data on mount and set up auto-refresh
onMounted(() => {
  fetchLiveData();

  // Auto-refresh every 30 seconds for live data
  const refreshInterval = setInterval(() => {
    fetchLiveData(true); // Silent refresh
  }, 30000);

  // Cleanup interval on unmount
  onUnmounted(() => {
    clearInterval(refreshInterval);
  });
});

// Watch for division changes to update conferences
watch(divisionFilter, () => {
  conferenceFilter.value = null;
});
</script>

<template>
  <div class="mt-3">
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
        <v-btn
          color="error"
          variant="outlined"
          size="small"
          @click="handleRetry"
        >
          Retry
        </v-btn>
      </template>
    </v-alert>

    <!-- Live Header with Filters -->
    <LiveHeader
      :divisions="divisions"
      :conferences="conferences"
      :selected-division="divisionFilter"
      :loading="loading"
      @update:search="updateSearch"
      @update:division="updateDivision"
      @update:conference="updateConference"
    />

    <!-- Live Table -->
    <LiveTable
      :live-data="liveMatches"
      :loading="loading"
      :search="search"
      :division-filter="divisionFilter"
      :conference-filter="conferenceFilter"
      :filter-live="filterLive"
    />
  </div>
</template>
