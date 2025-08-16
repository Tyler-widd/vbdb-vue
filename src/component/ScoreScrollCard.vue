<!-- ScoreScrollCard.vue -->
<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import NavScoreCard from "./NavScoreCard.vue";
import useLiveData from "@/composables/useLiveData.js";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

// Initialize the live data composable
const { liveMatches, loading, error, fetchLiveData } = useLiveData();
const { mobile } = useDisplay();

// Initialize router
const router = useRouter();

// Slide group refs
const slider = ref(null);
const currentIndex = ref(0);

// Auto-refresh interval reference
let refreshInterval = null;

// Load live data on component mount
onMounted(() => {
  fetchLiveData();

  // Set up auto-refresh every 30 seconds for live updates
  refreshInterval = setInterval(() => {
    fetchLiveData();
  }, 30000);
});

// Cleanup interval on component unmount
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Computed property for games to display (with loading placeholders)
const games = computed(() => {
  if (loading.value) {
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

// Helper function to calculate match score data for display
const getMatchScoreData = (match) => {
  const sets = [
    { team1: match.set_1_team_1, team2: match.set_1_team_2 },
    { team1: match.set_2_team_1, team2: match.set_2_team_2 },
    { team1: match.set_3_team_1, team2: match.set_3_team_2 },
    { team1: match.set_4_team_1, team2: match.set_4_team_2 },
    { team1: match.set_5_team_1, team2: match.set_5_team_2 },
  ];

  const completedSets = sets.filter(
    (set) => set.team1 !== null && set.team2 !== null
  );

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
  fetchLiveData();
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
    <div
      v-if="!loading && !error && games.length === 0"
      class="no-games-message"
    >
      <v-card variant="tonal" class="pa-4 text-center">
        <v-icon size="48" color="medium-emphasis" class="mb-2">
          mdi-volleyball
        </v-icon>
        <div class="text-body-1 text-medium-emphasis">
          No live matches at the moment
        </div>
        <div class="text-caption text-medium-emphasis">
          Check back later for live updates
        </div>
      </v-card>
    </div>

    <!-- Slide group for live games -->
    <v-slide-group
      v-if="games.length > 0"
      :show-arrows="!mobile"
      v-model="currentIndex"
      ref="slider"
      class="scroll-group"
    >
      <v-slide-group-item
        v-for="(game, index) in games"
        :key="game.loading ? `loading-${index}` : `live-${game.id}-${index}`"
        v-slot="{ isSelected, toggle }"
      >
        <div class="slide-item">
          <NavScoreCard
            :game="game"
            :box-score="game.box_score"
            @click="!game.loading && gotoGame(game)"
            :class="{
              'loading-card': game.loading,
              'live-card': game.isLive && !game.loading,
            }"
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
.score-scroll-container {
  width: 100%;
  overflow: hidden;
}

.scroll-group {
  width: 100%;
}

.slide-item {
  flex: 0 0 auto;
  margin-right: 12px;
}

.slide-item:last-child {
  margin-right: 16px;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.prev-arrow {
  left: 8px;
}

.next-arrow {
  right: 8px;
}

.loading-card {
  opacity: 0.6;
  pointer-events: none;
}

.live-card {
  position: relative;
}

.live-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff4444, #ff6666);
  border-radius: 4px 4px 0 0;
  animation: live-pulse 2s ease-in-out infinite alternate;
}

.live-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.live-chip {
  animation: live-pulse 2s ease-in-out infinite alternate;
}

.no-games-message {
  margin: 16px 0;
}

@keyframes live-pulse {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* Mobile-specific styles */
@media (max-width: 959px) {
  .scroll-group {
    padding: 0 16px;
  }

  .slide-item {
    margin-right: 8px;
  }

  .slide-item:first-child {
    margin-left: 0;
  }

  .slide-item:last-child {
    margin-right: 16px;
  }

  .live-indicator {
    padding: 0 16px;
  }

  .no-games-message {
    margin: 16px;
  }
}
</style>
