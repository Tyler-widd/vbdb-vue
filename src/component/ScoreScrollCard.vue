<!-- ScoreScrollCard.vue -->
<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import NavScoreCard from "./NavScoreCard.vue";
import { useGamesData } from "@/composables/useGamesData";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

// Initialize the composable
const { getRandomPreviousDayGames } = useGamesData();
const { mobile } = useDisplay();

// Initialize router
const router = useRouter();

// Reactive data for previous day games
const previousDayGames = ref([]);
const gamesLoading = ref(true);

// Slide group refs
const slider = ref(null);
const currentIndex = ref(0);

// Test date for development (10/15/2024)
const TEST_DATE = "2024-10-15";

// Fetch and set previous day games
const loadPreviousDayGames = async () => {
  try {
    gamesLoading.value = true;
    // In production, remove the TEST_DATE parameter to use actual previous day
    const games = await getRandomPreviousDayGames(10, TEST_DATE);
    previousDayGames.value = games;
  } catch (err) {
    console.error("Error loading previous day games:", err);
  } finally {
    gamesLoading.value = false;
  }
};

// Load games on component mount
onMounted(() => {
  loadPreviousDayGames();
});

// Computed property for games to display (with loading placeholders)
const games = computed(() => {
  if (gamesLoading.value) {
    return Array.from({ length: 20 }, (_, index) => ({
      loading: true,
      id: `loading-${index}`,
    }));
  }
  return previousDayGames.value;
});

// Navigation methods
const onPrevClick = () => {
  slider.value?.focus("prev");
};

const onNextClick = () => {
  slider.value?.focus("next");
};

// Method to navigate to game detail
const gotoGame = (game) => {
  if (game.loading) return;

  router.push({
    name: "game-detail",
    params: {
      team_1_id: game.team_1_id,
      team_2_id: game.team_2_id,
    },
  });
};
</script>

<template>
  <div class="score-scroll-container">
    <v-slide-group
      :show-arrows="!mobile"
      v-model="currentIndex"
      ref="slider"
      class="scroll-group"
    >
      <v-slide-group-item
        v-for="(game, index) in games"
        :key="
          game.loading
            ? `loading-${index}`
            : `${game.team_1_id}-${game.team_2_id}-${index}`
        "
        v-slot="{ isSelected, toggle }"
      >
        <div class="slide-item">
          <NavScoreCard
            :game="game"
            :box-score="game.box_score"
            @click="!game.loading && gotoGame(game)"
            :class="{ 'loading-card': game.loading }"
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
}
</style>
