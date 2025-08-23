<!-- ScoreScrollCard.vue -->
<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import useLiveData from "@/composables/useLiveData.js";
import NavScoreCard from "./NavScoreCard.vue";

// Initialize the live data composable
const {
  liveMatches,
  loading,
  error,
  fetchLiveData,
  startPolling,
  stopPolling,
} = useLiveData();
const { mobile } = useDisplay();

// Initialize router
const router = useRouter();

// Slide group refs
const slider = ref(null);
const currentIndex = ref(0);

// Load live data on component mount
onMounted(async () => {
  // Initial load with loading indicator
  await fetchLiveData(false);

  // Start polling for updates (silent updates every 30 seconds)
  startPolling(30000);
});

// Cleanup interval on component unmount
onUnmounted(() => {
  stopPolling();
});

// Helper function to calculate match score data for display
const getMatchScoreData = (match) => {
  const sets = [
    { team1: match.set_1_team_1, team2: match.set_1_team_2 },
    { team1: match.set_2_team_1, team2: match.set_2_team_2 },
    { team1: match.set_3_team_1, team2: match.set_3_team_2 },
    { team1: match.set_4_team_1, team2: match.set_4_team_2 },
    { team1: match.set_5_team_1, team2: match.set_5_team_2 },
  ];

  // Helper function to check if a set is complete
  const isSetComplete = (set) => {
    if (set.team1 === null || set.team2 === null) return false;

    const score1 = set.team1;
    const score2 = set.team2;

    // Win by 2, minimum 25 points
    return (
      (score1 >= 25 && score1 - score2 >= 2) ||
      (score2 >= 25 && score2 - score1 >= 2)
    );
  };

  const completedSets = sets.filter(isSetComplete);

  const team1SetWins = completedSets.filter(
    (set) => set.team1 > set.team2
  ).length;

  const team2SetWins = completedSets.filter(
    (set) => set.team2 > set.team1
  ).length;

  // Determine match status
  let matchStatus = "not_started";
  let currentSet = 1;

  if (completedSets.length === 0) {
    matchStatus = "not_started";
    currentSet = 1;
  } else if (team1SetWins >= 3 || team2SetWins >= 3) {
    matchStatus = "final";
    currentSet = completedSets.length;
  } else {
    matchStatus = "in_progress";
    currentSet = completedSets.length + 1;
  }

  return {
    team_1_score: team1SetWins,
    team_2_score: team2SetWins,
    matchStatus,
    currentSet,
    completedSets: completedSets.length,
    // Create box_score data for compatibility with NavScoreCard
    box_score: {
      team_1_score: team1SetWins,
      team_2_score: team2SetWins,
      status: matchStatus,
      current_set: currentSet,
    },
  };
};

// Computed property for games to display (with loading placeholders)
const games = computed(() => {
  if (loading.value && liveMatches.value.length === 0) {
    // Only show loading placeholders if we have no data yet
    return Array.from({ length: 10 }, (_, index) => ({
      loading: true,
      id: `loading-${index}`,
    }));
  }

  // Transform live match data to match the expected game format
  return liveMatches.value.map((match) => ({
    ...match,
    // Map live data fields to expected game format
    team_1_name: match.team_1_name,
    team_2_name: match.team_2_name,
    team_1_img: match.team_1_img,
    team_2_img: match.team_2_img,
    team_1_id: match.team_1_id,
    team_2_id: match.team_2_id,
    date: match.date,
    location: match.location,
    division: match.division,
    // Add live-specific data
    isLive: true,
    // Calculate current score status
    ...getMatchScoreData(match),
  }));
});

// Navigation methods
const onPrevClick = () => {
  slider.value?.focus("prev");
};

const onNextClick = () => {
  slider.value?.focus("next");
};

// Method to navigate to game detail or live view
const gotoGame = (game) => {
  if (game.loading) return;

  // For live games, you might want to navigate to a live view instead
  if (game.isLive) {
    router.push({
      name: "live-game-detail", // Adjust route name as needed
      params: {
        gameId: game.id,
        team_1_id: game.team_1_id,
        team_2_id: game.team_2_id,
      },
    });
  } else {
    router.push({
      name: "game-detail",
      params: {
        team_1_id: game.team_1_id,
        team_2_id: game.team_2_id,
      },
    });
  }
};

// Manual refresh function
const handleRefresh = () => {
  fetchLiveData(false); // Manual refresh shows loading indicator
};
</script>

<template>
  <div class="score-scroll-container">
    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mb-2"
      @click:close="error = null"
    >
      Failed to load live matches: {{ error }}
      <template v-slot:append>
        <v-btn color="error" variant="text" size="small" @click="handleRefresh">
          Retry
        </v-btn>
      </template>
    </v-alert>

    <!-- No live games message -->
    <v-container
      v-if="!loading && !error && games.length === 0"
      class="d-flex justify-center"
    >
      <v-card variant="tonal" class="pa-4">
        <v-card-text class="text-center"> No Live matches found </v-card-text>
      </v-card>
    </v-container>

    <!-- Slide group for live games -->
    <v-slide-group
      v-if="games.length > 0"
      :show-arrows="!mobile"
      v-model="currentIndex"
      ref="slider"
    >
      <v-slide-group-item
        v-for="(game, index) in games"
        :key="game.loading ? `loading-${index}` : `live-${game.id}-${index}`"
        v-slot="{ isSelected, toggle }"
      >
        <div class="slide-item">
          <NavScoreCard
            :game="game"
            :box-score="game.live_stats_url || null"
            @card-click="!game.loading && gotoGame(game)"
          />
        </div>
      </v-slide-group-item>

      <!-- Desktop arrows -->
      <template #prev v-if="!mobile">
        <v-icon @click="onPrevClick">mdi-chevron-left</v-icon>
      </template>

      <template #next v-if="!mobile">
        <v-icon @click="onNextClick">mdi-chevron-right</v-icon>
      </template>
    </v-slide-group>
  </div>
</template>
<style scoped>
@media (max-width: 600px) {
  .score-scroll-container {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .v-slide-group__wrapper {
    overflow-x: auto !important;
  }

  .slide-item {
    flex: 0 0 auto;
  }
}
</style>
