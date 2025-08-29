<!-- views/Live/LiveScoreCard.vue -->
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import useLiveData from "../../composables/useLiveData.js";
import MatchCard from "@/component/MatchCard.vue";

const props = defineProps({
  search: {
    type: String,
    default: "",
  },
  divisionFilter: {
    type: String,
    default: null,
  },
  conferenceFilter: {
    type: String,
    default: null,
  },
});

// Use the live data composable
const {
  liveMatches,
  loading,
  error,
  fetchLiveData,
  startPolling,
  stopPolling,
  getScoreSummary,
} = useLiveData();

// Pagination state
const currentPage = ref(1);
const itemsPerPage = 10;

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Convert live match data to MatchCard format
const formatLiveMatchForCard = (match) => {
  const scoreSummary = getScoreSummary(match);

  // Build individual sets array
  const individualSets = [];
  const sets = [
    { team1: match.set_1_team_1, team2: match.set_1_team_2 },
    { team1: match.set_2_team_1, team2: match.set_2_team_2 },
    { team1: match.set_3_team_1, team2: match.set_3_team_2 },
    { team1: match.set_4_team_1, team2: match.set_4_team_2 },
    { team1: match.set_5_team_1, team2: match.set_5_team_2 },
  ];

  sets.forEach((set, index) => {
    if (set.team1 !== null && set.team2 !== null) {
      individualSets.push({
        setNumber: index + 1,
        team1Score: set.team1,
        team2Score: set.team2,
        team1Won: set.team1 > set.team2,
      });
    }
  });

  // Determine winner if match is completed
  let winnerId = null;
  if (scoreSummary.status === "completed") {
    winnerId = scoreSummary.winner === 1 ? match.team_1_id : match.team_2_id;
  }

  return {
    id: match.match_id || `${match.team_1_id}-${match.team_2_id}-${match.date}`,
    formattedDate: formatDate(match.date),
    time: match.time || null,

    // Team 1 data
    team1Name: match.team_1_name,
    team1Img: match.team_1_logo || null,
    team1Conference: match.team_1_conference || "",
    team1Division: match.team_1_division || "",
    team1Id: match.team_1_id,

    // Team 2 data
    team2Name: match.team_2_name,
    team2Img: match.team_2_logo || null,
    team2Conference: match.team_2_conference || "",
    team2Division: match.team_2_division || "",
    team2Id: match.team_2_id,

    // Score data
    team1SetsWon: scoreSummary.team1SetWins,
    team2SetsWon: scoreSummary.team2SetWins,
    individualSets,
    winnerId,

    // Updated to use live_stats_url instead of box_score
    boxScore: match.live_stats_url || null,

    // Live-specific data
    status: scoreSummary.status,
    currentSet: scoreSummary.currentSet,
  };
};

// Filter live matches based on props
const filteredMatches = computed(() => {
  let filtered = [...liveMatches.value];

  // Filter by division
  if (props.divisionFilter) {
    filtered = filtered.filter(
      (match) =>
        match.team_1_division === props.divisionFilter ||
        match.team_2_division === props.divisionFilter
    );
  }

  // Filter by conference
  if (props.conferenceFilter) {
    filtered = filtered.filter(
      (match) =>
        match.team_1_conference === props.conferenceFilter ||
        match.team_2_conference === props.conferenceFilter
    );
  }

  // Filter by search term
  if (props.search) {
    const searchLower = props.search.toLowerCase();
    filtered = filtered.filter(
      (match) =>
        match.team_1_name.toLowerCase().includes(searchLower) ||
        match.team_2_name.toLowerCase().includes(searchLower) ||
        match.date.includes(props.search) ||
        (match.location &&
          match.location.toLowerCase().includes(searchLower)) ||
        (match.team_1_conference &&
          match.team_1_conference.toLowerCase().includes(searchLower)) ||
        (match.team_2_conference &&
          match.team_2_conference.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
});

// Format filtered matches for MatchCard
const formattedMatches = computed(() => {
  return filteredMatches.value.map(formatLiveMatchForCard).sort((a, b) => {
    // Sort by status: in_progress first, then not_started, then completed
    const statusOrder = { in_progress: 0, not_started: 1, completed: 2 };
    const aOrder = statusOrder[a.status] || 3;
    const bOrder = statusOrder[b.status] || 3;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    // Within same status, sort by date
    return new Date(a.formattedDate) - new Date(b.formattedDate);
  });
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(formattedMatches.value.length / itemsPerPage);
});

const paginatedMatches = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return formattedMatches.value.slice(startIndex, endIndex);
});

// Watch for filter changes and reset to first page
watch(
  () => [props.search, props.divisionFilter, props.conferenceFilter],
  () => {
    currentPage.value = 1;
  }
);

// Start polling when component mounts
onMounted(() => {
  if (liveMatches.value.length === 0) {
    fetchLiveData();
  }
  startPolling(30000); // Poll every 30 seconds
});

// Stop polling when component unmounts
onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <v-card class="pt-4 pa-4">
    <!-- Loading state -->
    <v-card v-if="loading && liveMatches.length === 0" class="pa-4">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-h6 mt-2">Loading live matches...</p>
      </div>
    </v-card>

    <!-- Error state -->
    <v-card v-else-if="error && liveMatches.length === 0" class="pa-4">
      <v-alert type="error" variant="tonal">
        <template #title>Failed to load live matches</template>
        {{ error }}
      </v-alert>
    </v-card>

    <!-- Live matches -->
    <div v-else-if="formattedMatches.length > 0" class="pa-2">
      <div
        v-for="match in paginatedMatches"
        :key="match.id"
        class="position-relative"
      >
        <!-- Live status indicator for active matches -->
        <div
          v-if="match.status === 'in_progress'"
          class="position-absolute live-indicator"
          style="top: 8px; right: 12px; z-index: 3"
        >
          <v-chip
            color="error"
            size="x-small"
            variant="elevated"
            class="pulse-animation"
          >
            <v-icon size="8" class="mr-1">mdi-circle</v-icon>
            LIVE
          </v-chip>
        </div>

        <!-- Current set indicator for live matches -->
        <div
          v-if="match.status === 'in_progress' && match.currentSet"
          class="position-absolute"
          style="top: 8px; left: 12px; z-index: 3"
        >
          <v-chip color="primary" size="x-small" variant="tonal">
            Set {{ match.currentSet }}
          </v-chip>
        </div>

        <MatchCard
          :id="match.id"
          :formatted-date="match.formattedDate"
          :time="match.time"
          :team1-name="match.team1Name"
          :team1-img="match.team1Img"
          :team1-conference="match.team1Conference"
          :team1-division="match.team1Division"
          :team1-id="match.team1Id"
          :team2-name="match.team2Name"
          :team2-img="match.team2Img"
          :team2-conference="match.team2Conference"
          :team2-division="match.team2Division"
          :team2-id="match.team2Id"
          :team1-sets-won="match.team1SetsWon"
          :team2-sets-won="match.team2SetsWon"
          :individual-sets="match.individualSets"
          :winner-id="match.winnerId"
          :box-score="match.boxScore"
          :show-vs-for-no-score="match.status === 'not_started'"
          :match-status="match.status"
        />
      </div>

      <!-- Pagination Controls -->
      <v-card
        v-if="!loading && !error && formattedMatches.length > itemsPerPage"
        class="justify-center mt-4"
      >
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          rounded="circle"
          density="comfortable"
        />
      </v-card>
    </div>

    <!-- No matches found -->
    <v-card v-else class="pa-4">
      <div class="text-center">
        <v-icon size="48" color="medium-emphasis">mdi-volleyball</v-icon>
        <p class="text-h6 mt-2 text-medium-emphasis">No live matches found</p>
        <p class="text-body-2 text-medium-emphasis">
          Try adjusting your filters or check back later
        </p>
      </div>
    </v-card>

    <!-- Background refresh indicator -->
    <v-snackbar
      v-if="loading && liveMatches.length > 0"
      :model-value="true"
      timeout="2000"
      location="top"
      color="info"
      variant="tonal"
    >
      <v-icon class="mr-2">mdi-refresh</v-icon>
      Updating live scores...
    </v-snackbar>
  </v-card>
</template>

<style scoped>
.live-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.pulse-animation {
  animation: pulse 2s infinite;
}
</style>
