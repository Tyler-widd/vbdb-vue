<!-- views/TeamDetail/TeamDetailScoreCard.vue -->
<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useScheduleData } from "../../composables/useScheduleData.js";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

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
const formatConference = (conference) => {
  if (conference && conference.includes(".0")) {
    return `Region ${conference.replace(".0", "")}`;
  }
  return conference;
};

// ADD THIS LINE - Define emits
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
    // Create a mapping object for quick lookups
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
  // Only map for CCCAA games
  if (game.team_1_division !== "CCCAA" && game.team_2_division !== "CCCAA") {
    return game.winner_id;
  }

  // Check if winner_id matches team_1_id or team_2_id already
  if (game.winner_id === game.team_1_id || game.winner_id === game.team_2_id) {
    return game.winner_id;
  }

  // Try to map the winner_id to the correct team
  // First, check if we can determine winner by looking at set scores
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

  // If team1 won more sets, check if team1 is CCCAA and needs mapping
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
      `https://api.volleyballdatabased.com/games/${props.orgId}`,
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

// Parse game data to match the expected format
const formattedRecords = computed(() => {
  if (!games.value.length) return [];

  return games.value
    .filter((game) => {
      // Filter by selected year
      const gameYear = game.date.split("/")[2];
      return gameYear === props.selectedYear;
    })
    .map((game) => {
      // Determine which team is "my team" based on org_id
      const isTeam1 = game.team_1_id === props.orgId;
      const myTeam = isTeam1 ? "team_1" : "team_2";
      const opponentTeam = isTeam1 ? "team_2" : "team_1";

      // Calculate sets won
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
        myTeamName: game[`${myTeam}_school`],
        myTeamImg: game[`${myTeam}_img`],
        myConference: formatConference(game[`${myTeam}_conference`]),
        opponentName: game[`${opponentTeam}_school`],
        opponentImg: game[`${opponentTeam}_img`],
        opponentId: game[`${opponentTeam}_id`],
        opponentConference: game[`${opponentTeam}_conference`],
        mySetsWon,
        opponentSetsWon,
        individualSets,
        isWinner,
        box_score: game.box_score,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
});

// Format schedule data for 2025
const formattedSchedule = computed(() => {
  if (!scheduleData.value.length || props.selectedYear !== "2025") return [];

  // Filter schedule data for the current team
  return scheduleData.value
    .filter((game) => {
      return game.team_1_id === props.orgId || game.team_2_id === props.orgId;
    })
    .map((game) => {
      // Determine which team is "my team" based on org_id
      const isTeam1 = game.team_1_id === props.orgId;
      const myTeam = isTeam1 ? "team_1" : "team_2";
      const opponentTeam = isTeam1 ? "team_2" : "team_1";

      return {
        id: `${game.date}_${game.time}_${game.team_1_id}_${game.team_2_id}`,
        formattedDate: formatDate(game.date),
        date: game.date,
        time: game.time,
        myTeamName: game[`${myTeam}_name`],
        myTeamImg: game[`${myTeam}_img`],
        myConference: game[`${myTeam}_conference`],
        opponentName: game[`${opponentTeam}_name`],
        opponentImg: game[`${opponentTeam}_img`],
        opponentId: game[`${opponentTeam}_id`],
        opponentConference: game[`${opponentTeam}_conference`],
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending for future games
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
    // No record for future games
    return "0-0";
  }

  const filtered = formattedRecords.value;
  const wins = filtered.filter((game) => game.isWinner).length;
  const losses = filtered.length - wins;
  return `${wins}-${losses}`;
});

// Watch for record changes and emit them
watch(
  record,
  (newRecord) => {
    emit("update:record", newRecord);
  },
  { immediate: true },
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

// Combined loading state
const isLoading = computed(() => {
  return props.selectedYear === "2025" ? scheduleLoading.value : loading.value;
});

// Combined error state
const hasError = computed(() => {
  return props.selectedYear === "2025" ? scheduleError.value : error.value;
});

// Watch for year changes
watch(
  () => props.selectedYear,
  async (newYear) => {
    currentPage.value = 1;

    // Fetch schedule data if 2025 is selected and we haven't already
    if (newYear === "2025" && scheduleData.value.length === 0) {
      await fetchSchedule();
    }
  },
);

// Initialize
loadCCCAAMapping();
fetchGames();

// Also fetch schedule data on mount if 2025 is selected
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
    <div v-for="item in paginatedData" :key="item.id" class="mb-6">
      <!-- Date chip centered at top -->
      <v-row
        class="justify-center mb-n3"
        style="z-index: 2; position: relative"
      >
        <v-chip
          variant="elevated"
          size="small"
          class="bg-surface"
          style="border: 2px solid rgb(var(--v-theme-surface-variant))"
        >
          {{ item.formattedDate }}
          <span v-if="item.time" class="ml-1">• {{ item.time }}</span>
        </v-chip>
      </v-row>

      <!-- Main card -->
      <v-card variant="outlined" rounded="xl" class="pa-1">
        <v-row class="ma-0 align-center" no-gutters>
          <!-- Left team (current team being viewed) -->
          <v-col
            cols="4"
            class="d-flex align-center"
            :class="smAndDown ? 'pa-1' : 'px-2'"
          >
            <v-avatar
              :size="smAndDown ? 28 : 40"
              :class="smAndDown ? 'mr-2' : 'mr-4'"
            >
              <v-img
                v-if="item.myTeamImg"
                :src="item.myTeamImg"
                :alt="item.myTeamName"
              />
              <v-icon v-else :size="smAndDown ? 20 : 24">mdi-school</v-icon>
            </v-avatar>
            <div class="d-flex flex-column flex-grow-1 text-wrap">
              <div class="text-wrap">
                <span
                  class="text-primary d-block"
                  :class="[
                    smAndDown ? 'text-body-2' : 'text-h6 mb-2',
                    item.isWinner !== undefined
                      ? item.isWinner
                        ? 'text-success'
                        : 'text-error'
                      : '',
                  ]"
                  :style="{
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: '1.2',
                  }"
                >
                  {{ item.myTeamName }}
                </span>
              </div>
              <div
                class="text-caption font-italic text-medium-emphasis text-wrap"
                :style="{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.2',
                }"
              >
                {{ formatConference(item.myConference) }}
              </div>
            </div>
          </v-col>

          <!-- Score section or VS for schedule -->
          <v-col cols="4" class="d-flex flex-column align-center py-3">
            <!-- Show scores for past games -->
            <template v-if="props.selectedYear !== '2025'">
              <div class="d-flex align-center mb-1">
                <span
                  class="text-center"
                  :class="[
                    smAndDown ? 'text-h6' : 'text-h5',
                    item.isWinner
                      ? 'font-weight-bold text-success'
                      : 'font-weight-light',
                  ]"
                  style="min-width: 24px"
                >
                  {{ item.mySetsWon }}
                </span>
                <span
                  class="text-medium-emphasis"
                  :class="smAndDown ? 'text-h6' : 'text-h5 mx-2'"
                  >-</span
                >
                <span
                  class="text-center"
                  :class="[
                    smAndDown ? 'text-h6' : 'text-h5',
                    !item.isWinner
                      ? 'font-weight-bold text-success'
                      : 'font-weight-light',
                  ]"
                  style="min-width: 24px"
                >
                  {{ item.opponentSetsWon }}
                </span>
              </div>

              <!-- Individual set scores -->
              <div
                class="d-flex flex-wrap justify-center"
                :style="smAndDown ? `column-gap: 12px` : `column-gap: 12px`"
              >
                <span
                  v-for="set in item.individualSets"
                  :key="set.setNumber"
                  class="gap-4"
                  :class="smAndDown ? 'text-body-2' : 'text-body-1'"
                >
                  <span
                    :class="{
                      'text-success': set.myWon,
                      'font-weight-thin': !set.myWon,
                    }"
                  >
                    {{ set.myScore }} </span
                  >-<span
                    :class="{
                      'text-success': !set.myWon,
                      'font-weight-thin': set.myWon,
                    }"
                  >
                    {{ set.opponentScore }} </span
                  ><span v-if="set.setNumber < item.individualSets.length"
                    >,</span
                  >
                </span>
              </div>
            </template>

            <!-- Show VS for future games -->
            <template v-else>
              <span
                class="text-medium-emphasis font-weight-medium"
                :class="smAndDown ? 'text-h6' : 'text-h5'"
              >
                VS
              </span>
            </template>
          </v-col>

          <!-- Right team (opponent) -->
          <v-col
            cols="4"
            class="d-flex align-center"
            :class="smAndDown ? 'pa-1' : 'px-2'"
          >
            <div class="d-flex flex-column flex-grow-1 text-wrap text-right">
              <div class="text-wrap">
                <span
                  class="text-primary button-like"
                  :class="[
                    smAndDown ? 'text-body-2' : 'text-h6 mb-2',
                    item.isWinner !== undefined
                      ? item.isWinner
                        ? 'text-error'
                        : 'text-success'
                      : '',
                  ]"
                  :style="{
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: '1.2',
                    display: 'inline-block',
                  }"
                  @click="navigateToTeam($router, item.opponentId, orgId)"
                >
                  {{ item.opponentName }}
                </span>
              </div>
              <div
                class="text-caption font-italic text-medium-emphasis text-wrap"
                :style="{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.2',
                }"
              >
                {{ formatConference(item.opponentConference) }}
              </div>
            </div>
            <v-avatar
              :size="smAndDown ? 28 : 40"
              :class="smAndDown ? 'ml-2' : 'ml-4'"
            >
              <v-img
                v-if="item.opponentImg"
                :src="item.opponentImg"
                :alt="item.opponentName"
              />
              <v-icon v-else :size="smAndDown ? 20 : 24">mdi-school</v-icon>
            </v-avatar>
          </v-col>
        </v-row>

        <!-- Box score button only for past games -->
        <v-row
          v-if="item.box_score"
          class="text-center justify-center"
          dense
          no-gutters
        >
          <v-btn
            variant="tonal"
            :href="item.box_score"
            target="_blank"
            prepend-icon="mdi-open-in-new"
            :class="smAndDown ? 'w-75' : 'w-25'"
            class="mb-1"
          >
            Box Score
          </v-btn>
        </v-row>
      </v-card>
    </div>
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
