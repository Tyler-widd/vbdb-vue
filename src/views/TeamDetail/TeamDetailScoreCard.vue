<!-- views/TeamDetail/TeamDetailScoreCard.vue -->
<script setup>
import { computed, ref, watch } from "vue";
import { useScheduleData } from "../../composables/useScheduleData.js";
import MatchCard from "../../component/MatchCard.vue";

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

const loading = ref(false);
const error = ref(null);
const games = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const cccaaMapping = ref({});

// Import schedule data composable
const {
  scheduleData,
  fetchSchedule,
  loading: scheduleLoading,
  error: scheduleError,
} = useScheduleData();

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

// Get mapped winner ID for CCCAA games
const getMappedWinnerId = (game) => {
  if (game.team_1_division !== "CCCAA" && game.team_2_division !== "CCCAA") {
    return game.winner_id;
  }

  if (game.winner_id === game.team_1_id || game.winner_id === game.team_2_id) {
    return game.winner_id;
  }

  let team1SetsWon = 0;
  let team2SetsWon = 0;

  for (let i = 1; i <= 5; i++) {
    const team1Score = game[`set_${i}_team_1`];
    const team2Score = game[`set_${i}_team_2`];

    if (team1Score > 0 || team2Score > 0) {
      if (team1Score > team2Score) team1SetsWon++;
      else team2SetsWon++;
    }
  }

  if (team1SetsWon > team2SetsWon) {
    if (
      game.team_1_division === "CCCAA" &&
      cccaaMapping.value[game.team_1_school]
    ) {
      return cccaaMapping.value[game.team_1_school];
    }
    return game.team_1_id;
  } else {
    if (
      game.team_2_division === "CCCAA" &&
      cccaaMapping.value[game.team_2_school]
    ) {
      return cccaaMapping.value[game.team_2_school];
    }
    return game.team_2_id;
  }
};

// Fetch games data
const fetchGames = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(
      `https://api.volleyballdatabased.com/games/${props.orgId}`
    );
    if (!response.ok) throw new Error("Failed to fetch games");
    const data = await response.json();
    games.value = data;
  } catch (err) {
    error.value = err.message;
    games.value = [];
  } finally {
    loading.value = false;
  }
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

// Parse game data for MatchCard component
const formattedRecords = computed(() => {
  if (!games.value.length) return [];

  return games.value
    .filter((game) => {
      const gameYear = game.date.split("/")[2];
      return gameYear === props.selectedYear;
    })
    .map((game) => {
      const isTeam1 = game.team_1_id === props.orgId;
      const myTeam = isTeam1 ? "team_1" : "team_2";
      const opponentTeam = isTeam1 ? "team_2" : "team_1";

      let mySetsWon = 0;
      let opponentSetsWon = 0;
      const individualSets = [];

      for (let i = 1; i <= 5; i++) {
        const myScore = game[`set_${i}_${myTeam}`];
        const opponentScore = game[`set_${i}_${opponentTeam}`];

        if (myScore > 0 || opponentScore > 0) {
          const myWon = myScore > opponentScore;
          if (myWon) mySetsWon++;
          else opponentSetsWon++;

          individualSets.push({
            setNumber: i,
            myScore,
            opponentScore,
            myWon,
          });
        }
      }

      const isWinner = getMappedWinnerId(game) === props.orgId;

      return {
        id: game.match_id,
        formattedDate: formatDate(game.date),
        date: game.date,
        // Map to MatchCard props format
        team1Name: game[`${myTeam}_school`],
        team1Img: game[`${myTeam}_img`],
        team1Conference: game[`${myTeam}_conference`],
        team1Id: props.orgId, // My team ID
        team2Name: game[`${opponentTeam}_school`],
        team2Img: game[`${opponentTeam}_img`],
        team2Conference: game[`${opponentTeam}_conference`],
        team2Id: game[`${opponentTeam}_id`],
        team1SetsWon: mySetsWon,
        team2SetsWon: opponentSetsWon,
        individualSets,
        winnerId: isWinner ? props.orgId : game[`${opponentTeam}_id`],
        boxScore: game.box_score,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Format schedule data for 2025
const formattedSchedule = computed(() => {
  if (!scheduleData.value.length || props.selectedYear !== "2025") return [];

  return scheduleData.value
    .filter((game) => {
      return game.team_1_id === props.orgId || game.team_2_id === props.orgId;
    })
    .map((game) => {
      const isTeam1 = game.team_1_id === props.orgId;
      const myTeam = isTeam1 ? "team_1" : "team_2";
      const opponentTeam = isTeam1 ? "team_2" : "team_1";

      return {
        id: `${game.date}_${game.time}_${game.team_1_id}_${game.team_2_id}`,
        formattedDate: formatDate(game.date),
        date: game.date,
        time: game.time,
        // Map to MatchCard props format
        team1Name: game[`${myTeam}_name`],
        team1Img: game[`${myTeam}_img`],
        team1Conference: game[`${myTeam}_conference`],
        team1Id: props.orgId,
        team2Name: game[`${opponentTeam}_name`],
        team2Img: game[`${opponentTeam}_img`],
        team2Conference: game[`${opponentTeam}_conference`],
        team2Id: game[`${opponentTeam}_id`],
        // No scores for future games
        team1SetsWon: null,
        team2SetsWon: null,
        individualSets: [],
        winnerId: null,
        boxScore: null,
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
});

// Decide which data to display based on year
const displayData = computed(() => {
  return props.selectedYear === "2025"
    ? formattedSchedule.value
    : formattedRecords.value;
});

// Calculate record (W-L)
const record = computed(() => {
  if (props.selectedYear === "2025") {
    return "0-0";
  }

  const filtered = formattedRecords.value;
  const wins = filtered.filter((game) => game.winnerId === props.orgId).length;
  const losses = filtered.length - wins;
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

// Pagination
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return displayData.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(displayData.value.length / itemsPerPage);
});

// Combined loading and error states
const isLoading = computed(() => {
  return props.selectedYear === "2025" ? scheduleLoading.value : loading.value;
});

const hasError = computed(() => {
  return props.selectedYear === "2025" ? scheduleError.value : error.value;
});

// Watch for year changes
watch(
  () => props.selectedYear,
  async (newYear) => {
    currentPage.value = 1;
    if (newYear === "2025" && scheduleData.value.length === 0) {
      await fetchSchedule();
    }
  }
);

// Initialize
loadCCCAAMapping();
fetchGames();

if (props.selectedYear === "2025") {
  fetchSchedule();
}
</script>

<template>
  <!-- Match/Schedule Cards -->
  <v-card
    v-if="!isLoading && !hasError && displayData.length > 0"
    class="pa-2 pt-4"
    rounded-lg
  >
    <MatchCard
      v-for="item in paginatedData"
      :key="item.id"
      :id="item.id"
      :formatted-date="item.formattedDate"
      :time="item.time"
      :team1-name="item.team1Name"
      :team1-img="item.team1Img"
      :team1-conference="item.team1Conference"
      :team1-id="item.team1Id"
      :team2-name="item.team2Name"
      :team2-img="item.team2Img"
      :team2-conference="item.team2Conference"
      :team2-id="item.team2Id"
      :team1-sets-won="item.team1SetsWon"
      :team2-sets-won="item.team2SetsWon"
      :individual-sets="item.individualSets"
      :winner-id="item.winnerId"
      :box-score="item.boxScore"
      :org-id="orgId"
      :show-vs-for-no-score="selectedYear === '2025'"
    />
  </v-card>

  <!-- Pagination Controls -->
  <v-card
    v-if="!isLoading && !hasError && displayData.length > itemsPerPage"
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

  <!-- No records message -->
  <v-row
    v-if="!isLoading && !hasError && displayData.length === 0"
    class="justify-center"
  >
    <v-col cols="12" class="text-center pa-4">
      <v-icon size="48" color="medium-emphasis">mdi-volleyball</v-icon>
      <p class="text-h6 mt-2 text-medium-emphasis">
        {{
          props.selectedYear === "2025"
            ? "No scheduled matches found"
            : "No matches found"
        }}
      </p>
      <p class="text-body-2 text-medium-emphasis">
        Try selecting a different season
      </p>
    </v-col>
  </v-row>
</template>
