<!-- ScoreScrollCard.vue -->
<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import useLiveData from "@/composables/useLiveData.js";
import NavScoreCard from "./NavScoreCard.vue";

// Initialize the live data composable
const { liveMatches, loading, fetchLiveData, startPolling, stopPolling } =
  useLiveData();

const { smAndDown } = useDisplay();

// Initialize router
const router = useRouter();

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

// Shuffle array function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Computed property for games to display (with loading placeholders and random selection)
const games = computed(() => {
  if (loading.value && liveMatches.value.length === 0) {
    // Only show loading placeholders if we have no data yet
    return Array.from({ length: 5 }, (_, index) => ({
      loading: true,
      id: `loading-${index}`,
    }));
  }

  // Filter matches to exclude games where both teams have 0 for set 1
  const filteredMatches = liveMatches.value.filter((match) => {
    const set1Team1 =
      match.set_1_team_1 !== null && match.set_1_team_1 !== ""
        ? parseInt(match.set_1_team_1, 10)
        : null;
    const set1Team2 =
      match.set_1_team_2 !== null && match.set_1_team_2 !== ""
        ? parseInt(match.set_1_team_2, 10)
        : null;

    // Don't show games where both teams have 0 for set 1
    if (set1Team1 === 0 && set1Team2 === 0) {
      return false;
    }

    // Also filter out completely null/empty scores
    return set1Team1 !== null || set1Team2 !== null;
  });

  // Shuffle and take 5 random matches
  const randomMatches = shuffleArray(filteredMatches).slice(0, 5);

  // Transform live match data to match the expected game format
  return randomMatches.map((match) => ({
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
</script>

<template>
  <!-- Desktop: Grid layout -->
  <v-row v-if="!smAndDown" no-gutters class="justify-space-around">
    <v-col
      v-for="(game, index) in games"
      :key="game.loading ? `loading-${index}` : `live-${game.id}-${index}`"
      cols="12"
      sm="6"
      md="2"
      class="d-flex justify-center"
    >
      <NavScoreCard
        :game="game"
        :box-score="game.live_stats_url || null"
        @card-click="!game.loading && gotoGame(game)"
      />
    </v-col>
  </v-row>

  <!-- Mobile: Horizontal scroll -->
  <div v-else class="mobile-scroll-container">
    <div class="mobile-cards-wrapper">
      <div
        v-for="(game, index) in games"
        :key="game.loading ? `loading-${index}` : `live-${game.id}-${index}`"
        class="mobile-card-item"
      >
        <NavScoreCard
          :game="game"
          :box-score="game.live_stats_url || null"
          @card-click="!game.loading && gotoGame(game)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-scroll-container {
  width: 100%;
  overflow-x: auto;
  /* Hide scrollbar on webkit browsers for cleaner look */
  -webkit-overflow-scrolling: touch;
}

.mobile-scroll-container {
  scrollbar-width: none;
}

.mobile-cards-wrapper {
  display: flex;
  gap: 8px;
  padding: 0 4px;
  min-width: min-content;
}
</style>
