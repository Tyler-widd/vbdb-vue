<!-- views/Live/LiveScoreCard.vue -->
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import useLiveData from "../../composables/useLiveData.js";
import MatchCard from "@/component/MatchCard.vue";

const props = defineProps({
  formattedMatches: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
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
} = useLiveData();

// Pagination state
const currentPage = ref(1);
const itemsPerPage = 10;







// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(props.formattedMatches.length / itemsPerPage);
});

const paginatedMatches = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return props.formattedMatches.slice(startIndex, endIndex);
});

// Watch for changes and reset to first page
watch(
  () => props.formattedMatches,
  () => {
    currentPage.value = 1;
  }
);

// Start polling when component mounts
onMounted(() => {
  if (liveMatches.value.length === 0) {
    fetchLiveData();
  }
  startPolling(20000);
});

// Stop polling when component unmounts
onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <v-card class="pt-4 pa-4">
    <!-- Loading state -->
    <v-card v-if="props.loading && props.formattedMatches.length === 0" class="pa-4">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-h6 mt-2">Loading live matches...</p>
      </div>
    </v-card>

    <!-- Error state -->
    <v-card v-else-if="error && props.formattedMatches.length === 0" class="pa-4">
      <v-alert type="error" variant="tonal">
        <template #title>Failed to load live matches</template>
        {{ error }}
      </v-alert>
    </v-card>

    <!-- Live matches -->
    <div v-else-if="props.formattedMatches.length > 0" class="pa-2">
      <div
        v-for="match in paginatedMatches"
        :key="match.id"
        class="position-relative"
      >
        <!-- Live status indicator for active matches only (moved higher and more to left) -->
        <div
          v-if="match.status === 'in_progress'"
          class="position-absolute live-indicator"
          style="top: -8px; right: 8px; z-index: 5"
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

        <MatchCard
          :id="match.id"
          :formatted-date="match.formattedDate"
          :time="match.time"
          :team1-set1="match.team1Set1"
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
        v-if="!props.loading && !error && props.formattedMatches.length > itemsPerPage"
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
        <p class="text-h6 mt-2 text-medium-emphasis">
          {{
            showOnlyLive
              ? "No live matches currently"
              : showCompleted
              ? "No completed matches"
              : "No matches found"
          }}
        </p>
        <p class="text-body-2 text-medium-emphasis">
          {{
            showOnlyLive
              ? "Check back when matches are in progress"
              : showCompleted
              ? "No matches have been completed yet"
              : "Try adjusting your filters or check back later"
          }}
        </p>
      </div>
    </v-card>

    <!-- Background refresh indicator -->
    <v-snackbar
      v-if="props.loading && props.formattedMatches.length > 0"
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
