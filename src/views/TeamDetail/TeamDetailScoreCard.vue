<!-- views/TeamDetail/TeamDetailScoreCard.vue -->
<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useScheduleData } from "../../composables/useScheduleData.js";
import { useScoresData } from "../../composables/useScoresData.js";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";
import { formatConference } from "../../helpers/formatConference.js";
import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();
const router = useRouter();

const props = defineProps({
  orgId: {
    type: String,
    required: true,
  },
  selectedYear: {
    type: String,
    default: "2025",
  },
});

const emit = defineEmits(["update:record"]);

const currentPage = ref(1);
const itemsPerPage = ref(10);
const cccaaMapping = ref({});

// Import composables
const {
  scheduleData,
  fetchSchedule,
  loading: scheduleLoading,
  error: scheduleError,
} = useScheduleData();

const {
  scores,
  fetchScores,
  loading: scoresLoading,
  error: scoresError,
} = useScoresData();

// Data table headers
const headers = computed(() => [
  { title: "Date", key: "date", sortable: true, width: "80px" },
  { title: "Opponent", key: "opponent", sortable: false, width: "200px" },
  {
    title: "Score",
    key: "score",
    sortable: true,
    align: "start",
    width: "80px",
  },
]);

const navigateToBoxScore = (event, item) => {
  if (item.boxScore) {
    event.stopPropagation();
    window.open(item.boxScore, "_blank");
  }
};

// Load CCCAA mapping
const loadCCCAAMapping = async () => {
  try {
    const response = await fetch("/cccaaMapping.json");
    const data = await response.json();
    cccaaMapping.value = data.reduce((acc, item) => {
      acc[item.school_short] = item.new_org_id;
      return acc;
    }, {});
  } catch (err) {
    console.error("Error loading CCCAA mapping:", err);
  }
};
const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};
// Key changes to fix duplicate matches:

// 1. Updated getMatchId function to normalize match IDs
const getMatchId = (game) => {
  // First, try to use the match_id field if available
  if (game.match_id) {
    // For results API, extract the shorter ID from formats like "20250822_rxj1"
    if (game.match_id.includes("_")) {
      return game.match_id.split("_").pop();
    }
    // For schedule API, use as-is (already in short format like "rxj1")
    return game.match_id;
  }

  // If not available, try to extract from box_score URL
  if (game.box_score) {
    const match = game.box_score.match(/\/([^\/]+)\.xml$/);
    if (match) {
      const fullId = match[1];
      // Extract the short ID from formats like "20250822_rxj1"
      return fullId.includes("_") ? fullId.split("_").pop() : fullId;
    }
  }

  // Fallback: create a unique identifier using normalized date
  const date = normalizeDate(game.date);
  const team1 = game.team_1_id || game.team_1;
  const team2 = game.team_2_id || game.team_2;
  return `${date}_${team1}_${team2}`;
};

// Helper function to normalize date format
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;

  // Handle MM/DD/YYYY format from results API
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  // Handle YYYY-MM-DD HH:MM:SS format from schedule API
  if (dateStr.includes("-")) {
    return dateStr.split(" ")[0]; // Remove time part if present
  }

  return dateStr;
};

// Format date
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Get team results from scores API
const getTeamResultsFromScores = computed(() => {
  if (!scores.value.length) return [];

  const processedGames = new Map(); // Use Map for deduplication

  scores.value
    .filter((score) => {
      // Filter for games involving this team
      const isTeamInvolved =
        score.team_1_id === props.orgId || score.team_2_id === props.orgId;

      // Filter by year if not 2025
      if (props.selectedYear !== "2025") {
        const gameYear = score.date.split("/")[2] || score.date.split("-")[0];
        return isTeamInvolved && gameYear === props.selectedYear;
      }

      return isTeamInvolved;
    })
    .forEach((score) => {
      const matchId = getMatchId(score);

      // Skip if we've already processed this match
      if (processedGames.has(matchId)) {
        return;
      }

      const isTeam1 = score.team_1_id === props.orgId;
      const myTeam = isTeam1 ? "team_1" : "team_2";
      const opponentTeam = isTeam1 ? "team_2" : "team_1";

      let mySetsWon = 0;
      let opponentSetsWon = 0;
      const individualSets = [];

      // Calculate set scores - handle both number and float values
      for (let i = 1; i <= 5; i++) {
        const myScore = score[`set_${i}_${myTeam}`];
        const opponentScore = score[`set_${i}_${opponentTeam}`];

        if (
          myScore !== null &&
          myScore !== undefined &&
          opponentScore !== null &&
          opponentScore !== undefined &&
          (Number(myScore) > 0 || Number(opponentScore) > 0)
        ) {
          const myScoreNum = Number(myScore);
          const opponentScoreNum = Number(opponentScore);
          const myWon = myScoreNum > opponentScoreNum;

          if (myWon) mySetsWon++;
          else opponentSetsWon++;

          individualSets.push({
            myScore: myScoreNum,
            opponentScore: opponentScoreNum,
            myWon,
          });
        }
      }

      const isWinner = score.winner_id === props.orgId;

      const gameData = {
        id: score.match_id || matchId,
        matchId: matchId, // Use normalized match ID
        formattedDate: formatDate(score.date),
        date: normalizeDate(score.date),
        time: score.time,
        opponent: score[`${opponentTeam}_name`],
        opponentId: score[`${opponentTeam}_id`],
        opponentImg: score[`${opponentTeam}_logo`],
        opponentConference: formatConference(
          score[`${opponentTeam}_conference`]
        ),
        opponentDivision: score[`${opponentTeam}_division`],
        mySetsWon,
        opponentSetsWon,
        individualSets,
        isWinner,
        winnerId: isWinner ? props.orgId : score[`${opponentTeam}_id`],
        boxScore: score.box_score,
        hasResult: true,
        matchStatus: "completed",
      };

      processedGames.set(matchId, gameData);
    });

  return Array.from(processedGames.values()).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
});

// Format schedule data for 2025 (upcoming games without results)
const formattedSchedule = computed(() => {
  if (!scheduleData.value.length || props.selectedYear !== "2025") return [];

  // Get match IDs of games that already have results (using normalized IDs)
  const resultMatchIds = new Set(
    getTeamResultsFromScores.value.map((result) => result.matchId)
  );

  const processedScheduleGames = new Map();

  scheduleData.value
    .filter((game) => {
      const isTeamInvolved =
        game.team_1_id === props.orgId || game.team_2_id === props.orgId;
      return isTeamInvolved;
    })
    .forEach((game) => {
      const matchId = getMatchId(game);

      // Skip if this game already has results or we've processed it
      if (resultMatchIds.has(matchId) || processedScheduleGames.has(matchId)) {
        return;
      }

      const isTeam1 = game.team_1_id === props.orgId;
      const myTeam = isTeam1 ? "team_1" : "team_2";
      const opponentTeam = isTeam1 ? "team_2" : "team_1";

      const gameData = {
        id: `schedule_${matchId}`,
        matchId: matchId, // Use normalized match ID
        formattedDate: formatDate(game.date),
        date: normalizeDate(game.date),
        time: game.time,
        opponent: game[`${opponentTeam}_name`],
        opponentId: game[`${opponentTeam}_id`],
        opponentImg: game[`${opponentTeam}_logo`],
        opponentConference: formatConference(
          game[`${opponentTeam}_conference`]
        ),
        mySetsWon: null,
        opponentSetsWon: null,
        individualSets: [],
        isWinner: null,
        winnerId: null,
        boxScore: game.box_score || null,
        hasResult: false,
      };

      processedScheduleGames.set(matchId, gameData);
    });

  return Array.from(processedScheduleGames.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
});

// Display data (always uses scores/schedule APIs)
const displayData = computed(() => {
  if (props.selectedYear === "2025") {
    // Always include results that we have
    const results = getTeamResultsFromScores.value;

    // Add upcoming schedule games (that don't have results yet)
    const schedule = formattedSchedule.value;

    // Combine and sort by date
    const combined = [...results, ...schedule];

    // Final deduplication step based on match ID (just to be extra safe)
    const finalDeduped = new Map();
    combined.forEach((game) => {
      if (!finalDeduped.has(game.matchId)) {
        finalDeduped.set(game.matchId, game);
      }
    });

    return Array.from(finalDeduped.values()).sort((a, b) => {
      // Sort completed games (results) by date descending,
      // then upcoming games by date ascending
      if (a.hasResult && !b.hasResult) return -1;
      if (!a.hasResult && b.hasResult) return 1;

      if (a.hasResult && b.hasResult) {
        return new Date(b.date) - new Date(a.date); // Most recent first
      } else {
        return new Date(a.date) - new Date(b.date); // Upcoming chronologically
      }
    });
  } else {
    // For non-2025 years, only use scores data
    return getTeamResultsFromScores.value;
  }
});

// Calculate record (W-L)
const record = computed(() => {
  const results = getTeamResultsFromScores.value;
  const wins = results.filter((game) => game.isWinner).length;
  const losses = results.filter((game) => !game.isWinner).length;
  return `${wins}-${losses}`;
});

// Watch for record changes and emit them
watch(
  record,
  (newRecord) => {
    emit("update:record", newRecord);
  },
  { immediate: true }
);

// Combined loading and error states
const isLoading = computed(() => {
  if (props.selectedYear === "2025") {
    return scheduleLoading.value || scoresLoading.value;
  }
  return scoresLoading.value;
});

const hasError = computed(() => {
  if (props.selectedYear === "2025") {
    return scheduleError.value || scoresError.value;
  }
  return scoresError.value;
});

// Watch for year changes
watch(
  () => props.selectedYear,
  async (newYear) => {
    currentPage.value = 1;
    if (newYear === "2025") {
      if (scheduleData.value.length === 0) {
        await fetchSchedule();
      }
      if (scores.value.length === 0) {
        await fetchScores();
      }
    }
  }
);

// Helper functions for data table display
const getResultColor = (item) => {
  if (!item.hasResult) return "text-medium-emphasis";
  return item.isWinner ? "text-success" : "text-error";
};

const getResultText = (item) => {
  if (!item.hasResult) {
    return item.time ? "" : "";
  }
  return item.isWinner ? "W" : "L";
};

const handleOpponentClick = (item) => {
  if (item.opponentId) {
    navigateToTeam(router, item.opponentId, props.orgId);
  }
};

// Initialize
loadCCCAAMapping();

// Always fetch scores for all years, and schedule for 2025
if (props.selectedYear === "2025") {
  fetchSchedule();
}
fetchScores();
</script>

<template>
  <div>
    <!-- Data Table -->
    <v-data-table
      v-if="!isLoading && !hasError"
      :headers="headers"
      :items="displayData"
      :loading="isLoading"
      :items-per-page="itemsPerPage"
      :page="currentPage"
      :sort-by="[
        { key: 'date', order: 'asc' },
        { key: 'score', order: 'desc' },
      ]"
      multi-sort
      @update:page="currentPage = $event"
      @update:items-per-page="itemsPerPage = $event"
      class="elevation-1"
      density="comfortable"
      hover
    >
      <template v-slot:header.date>
        <span class="ml-2 pa-0">Date</span>
      </template>

      <!-- Date column -->
      <template #item.date="{ item }">
        <span class="text-body-2 font-weight-medium ml-2">
          {{ formatDateForDisplay(item.date) }}
        </span>
      </template>

      <!-- Opponent column -->
      <template #item.opponent="{ item }">
        <div class="text-body-2">
          <div class="d-flex align-center">
            <v-avatar :size="smAndDown ? '24' : '32'" class="mr-2">
              <v-img :src="item.opponentImg" :alt="item.opponent" />
            </v-avatar>

            <span
              :class="[
                smAndDown ? 'text-body-2' : 'text-subtitle-1',
                item.opponentId ? 'button-like' : '',
                getResultColor(item), // This will apply green for wins, red for losses
              ]"
              @click="handleOpponentClick(item)"
            >
              {{ item.opponent }}
              <div class="text-caption text-grey">
                {{ item.opponentConference }}
              </div>
            </span>
          </div>
        </div>
      </template>

      <!-- Conference column -->
      <template #item.opponentConference="{ item }">
        <span class="text-caption text-medium-emphasis">
          {{ item.opponentConference }}
        </span>
      </template>

      <!-- Score column -->
      <template #item.score="{ item }">
        <div v-if="item.hasResult">
          <div class="d-flex align-center justify-start">
            <div
              class="d-flex align-center button-like"
              @click="navigateToBoxScore($event, item)"
            >
              <span class="mr-1">[</span>
              <template
                v-for="(set, setIndex) in item.individualSets"
                :key="`my-set-${setIndex}`"
              >
                <span
                  :class="[
                    'text-caption mx-1',
                    set.myWon ? 'text-primary' : 'text-medium-emphasis',
                  ]"
                >
                  {{ set.myScore }}
                </span>
              </template>
              <span class="ml-1 mr-2">]</span>
              <span
                :class="[
                  smAndDown ? 'text-body-2' : 'text-subtitle-1',
                  getResultColor(item),
                  'font-weight-medium',
                ]"
              >
                ({{ item.mySetsWon || 0 }})
              </span>
            </div>
          </div>

          <div class="d-flex align-center justify-start mt-1">
            <div
              class="d-flex align-center button-like"
              @click="navigateToBoxScore($event, item)"
            >
              <span class="mr-1">[</span>
              <template
                v-for="(set, setIndex) in item.individualSets"
                :key="`opponent-set-${setIndex}`"
              >
                <span
                  :class="[
                    'text-caption mx-1',
                    !set.myWon ? 'text-primary' : 'text-medium-emphasis',
                  ]"
                >
                  {{ set.opponentScore }}
                </span>
              </template>
              <span class="ml-1 mr-2">]</span>
              <span
                :class="[
                  smAndDown ? 'text-body-2' : 'text-subtitle-1',
                  !item.isWinner ? 'text-success' : 'text-error',
                  'font-weight-medium',
                ]"
              >
                ({{ item.opponentSetsWon || 0 }})
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-caption text-medium-emphasis text-start">
          {{ item.time ? item.time.replace("Attend:", "").trim() : "Upcoming" }}
        </div>
      </template>
    </v-data-table>

    <!-- Loading state -->
    <v-card v-if="isLoading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-2">Loading match data...</p>
    </v-card>

    <!-- Error state -->
    <v-alert v-if="hasError" type="error" class="ma-4">
      Failed to load match data. Please try again later.
    </v-alert>
  </div>
</template>
