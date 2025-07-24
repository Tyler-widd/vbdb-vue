<!-- views/TeamDetail/ScoreCard.vue -->
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";

const router = useRouter();
const { smAndDown } = useDisplay();

// Props
const props = defineProps({
  teamId: {
    type: String,
    required: true,
  },
  selectedYear: {
    type: String,
    default: "All",
  },
});

// Reactive data
const teamHistoryRecords = ref([]);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(5);

// Fetch team history records
const fetchTeamHistory = async (teamId) => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`http://localhost:4000/games/${teamId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    teamHistoryRecords.value = data;
  } catch (err) {
    console.error("Error fetching team history:", err);
    error.value = "Failed to load team history data";
  } finally {
    loading.value = false;
  }
};

const navigateToTeam = (teamId) => {
  router.push(`/teams/${teamId}`);
};

// Get available seasons for filtering
const availableSeasons = computed(() => {
  const seasons = [
    ...new Set(teamHistoryRecords.value.map((record) => record.season)),
  ];
  // Sort seasons in descending order (most recent first)
  const sortedSeasons = seasons.sort((a, b) => {
    const yearA = parseInt(a.split("-")[0]);
    const yearB = parseInt(b.split("-")[0]);
    return yearB - yearA;
  });
  return ["All", ...sortedSeasons];
});

// Get the most current season
const mostCurrentSeason = computed(() => {
  if (availableSeasons.value.length <= 1) return "All";
  return availableSeasons.value[1]; // Skip 'All' and get the first actual season
});

// Computed property to filter records by selected year
const filteredRecords = computed(() => {
  let records = teamHistoryRecords.value;

  if (props.selectedYear === "All") {
    // Show all records, sorted by date descending
    records = teamHistoryRecords.value;
  } else {
    // Filter by selected season
    records = teamHistoryRecords.value.filter(
      (record) => record.season === props.selectedYear
    );
  }

  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Team Record
const teamRecord = computed(() => {
  const records = filteredRecords.value;
  if (records.length === 0) return "";

  const wins = records.filter(
    (record) => record.winner_id.toString() === props.teamId
  ).length;
  const losses = records.length - wins;

  return `${wins}-${losses}`;
});

// Computed property to format records for display
const formattedRecords = computed(() => {
  return filteredRecords.value.map((record) => {
    // Determine if this team was home or away
    const isHome = record.home_team_id.toString() === props.teamId;

    // Get team names and images based on position
    const myTeamName = isHome ? record.home_team_name : record.away_team_name;
    const myTeamImg = isHome ? record.home_team_img : record.away_team_img;
    const opponentName = isHome ? record.away_team_name : record.home_team_name;
    const opponentImg = isHome ? record.away_team_img : record.home_team_img;
    const opponentId = isHome ? record.away_team_id : record.home_team_id;

    // Determine result (Win/Loss)
    const isWinner = record.winner_id.toString() === props.teamId;
    const result = isWinner ? "W" : "L";

    // Calculate sets won based on winner and team position
    // In volleyball, winner always wins 3 sets
    let mySetsWon, opponentSetsWon;

    if (isWinner) {
      mySetsWon = 3;
      // Count opponent's sets won
      opponentSetsWon = 0;
      const setData = [
        { team1: record.set_1_team_1, team2: record.set_1_team_2 },
        { team1: record.set_2_team_1, team2: record.set_2_team_2 },
        { team1: record.set_3_team_1, team2: record.set_3_team_2 },
        { team1: record.set_4_team_1, team2: record.set_4_team_2 },
        { team1: record.set_5_team_1, team2: record.set_5_team_2 },
      ];

      setData.forEach((set) => {
        if (set.team1 !== null && set.team2 !== null) {
          // Check if team_1 corresponds to home team
          const team1IsHome = record.team_1 === record.home_team_name;
          const mySetScore = isHome
            ? team1IsHome
              ? set.team1
              : set.team2
            : team1IsHome
            ? set.team2
            : set.team1;
          const oppSetScore = isHome
            ? team1IsHome
              ? set.team2
              : set.team1
            : team1IsHome
            ? set.team1
            : set.team2;

          if (oppSetScore > mySetScore) {
            opponentSetsWon++;
          }
        }
      });
    } else {
      opponentSetsWon = 3;
      // Count my sets won
      mySetsWon = 0;
      const setData = [
        { team1: record.set_1_team_1, team2: record.set_1_team_2 },
        { team1: record.set_2_team_1, team2: record.set_2_team_2 },
        { team1: record.set_3_team_1, team2: record.set_3_team_2 },
        { team1: record.set_4_team_1, team2: record.set_4_team_2 },
        { team1: record.set_5_team_1, team2: record.set_5_team_2 },
      ];

      setData.forEach((set) => {
        if (set.team1 !== null && set.team2 !== null) {
          // Check if team_1 corresponds to home team
          const team1IsHome = record.team_1 === record.home_team_name;
          const mySetScore = isHome
            ? team1IsHome
              ? set.team1
              : set.team2
            : team1IsHome
            ? set.team2
            : set.team1;
          const oppSetScore = isHome
            ? team1IsHome
              ? set.team2
              : set.team1
            : team1IsHome
            ? set.team1
            : set.team2;

          if (mySetScore > oppSetScore) {
            mySetsWon++;
          }
        }
      });
    }

    // Create individual set scores array
    const individualSets = [];
    const setData = [
      { team1: record.set_1_team_1, team2: record.set_1_team_2 },
      { team1: record.set_2_team_1, team2: record.set_2_team_2 },
      { team1: record.set_3_team_1, team2: record.set_3_team_2 },
      { team1: record.set_4_team_1, team2: record.set_4_team_2 },
      { team1: record.set_5_team_1, team2: record.set_5_team_2 },
    ];

    setData.forEach((set, index) => {
      if (set.team1 !== null && set.team2 !== null) {
        // Check if team_1 corresponds to home team
        const team1IsHome = record.team_1 === record.home_team_name;
        const mySetScore = isHome
          ? team1IsHome
            ? set.team1
            : set.team2
          : team1IsHome
          ? set.team2
          : set.team1;
        const opponentSetScore = isHome
          ? team1IsHome
            ? set.team2
            : set.team1
          : team1IsHome
          ? set.team1
          : set.team2;

        individualSets.push({
          myScore: mySetScore,
          opponentScore: opponentSetScore,
          myWon: mySetScore > opponentSetScore,
          setNumber: index + 1,
        });
      }
    });

    // Format date
    const dateObj = new Date(record.date);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    return {
      ...record,
      myTeamName,
      myTeamImg,
      opponentName,
      opponentImg,
      opponentId,
      result,
      mySetsWon,
      opponentSetsWon,
      formattedDate,
      isHome,
      isWinner,
      individualSets,
    };
  });
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(formattedRecords.value.length / itemsPerPage.value);
});

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return formattedRecords.value.slice(start, end);
});

// Reset to first page when filters change
watch(
  () => props.selectedYear,
  () => {
    currentPage.value = 1;
  }
);

// Emit event to parent when season changes
const emit = defineEmits(["update:selectedYear", "update:teamRecord"]);

// Watch for teamId changes
watch(
  () => props.teamId,
  (newTeamId) => {
    if (newTeamId) {
      fetchTeamHistory(newTeamId);
      currentPage.value = 1; // Reset pagination when team changes
    }
  },
  { immediate: true }
);

// Load data on component mount
onMounted(() => {
  if (props.teamId) {
    fetchTeamHistory(props.teamId);
  }
});

// Watch for when data is loaded to set default season
watch(
  () => teamHistoryRecords.value.length,
  (newLength) => {
    if (newLength > 0 && props.selectedYear === "All") {
      // Set to most current season by default
      emit("update:selectedYear", mostCurrentSeason.value);
    }
  }
);

watch(
  () => teamRecord.value,
  (newRecord) => {
    emit("update:teamRecord", newRecord);
  },
  { immediate: true }
);
watch(
  () => teamHistoryRecords.value.length,
  (newLength) => {
    if (newLength > 0 && props.selectedYear === "All") {
      // Set to most current season by default
      emit("update:selectedYear", mostCurrentSeason.value);
    }
  }
);
</script>

<template>
  <!-- Loading state -->
  <v-card v-if="loading" class="pa-4" rounded-lg>
    <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
  </v-card>

  <!-- Error state -->
  <v-alert v-else-if="error" type="error" class="mb-4">
    {{ error }}
  </v-alert>

  <!-- Match Cards -->
  <v-card v-else class="pa-2 pt-4" rounded-lg>
    <div v-for="record in paginatedRecords" :key="record.id" class="mb-6">
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
          {{ record.formattedDate }}
        </v-chip>
      </v-row>

      <!-- Main card -->
      <v-card variant="outlined" rounded="xl" class="pa-1">
        <v-row class="ma-0 align-center">
          <!-- Left team (current team being viewed) -->
          <v-col cols="4" class="d-flex align-center px-2">
            <v-avatar size="40" rounded="0" :size="smAndDown ? 32 : 40">
              <v-img :src="record.myTeamImg" :alt="record.myTeamName" />
            </v-avatar>
            <span
              class="text-primary font-weight-medium text-center ml-2"
              :class="[
                smAndDown ? 'text-caption' : 'text-body-2',
                record.isWinner ? 'text-success' : 'text-error',
              ]"
            >
              {{ record.myTeamName }}
            </span>
          </v-col>

          <!-- Score section -->
          <v-col cols="4" class="d-flex flex-column align-center">
            <div class="d-flex align-center mb-1">
              <span
                class="font-weight-bold text-h5 text-center"
                :class="[
                  smAndDown ? 'text-h6' : 'text-h5',
                  record.isWinner ? 'text-success' : '',
                ]"
                style="min-width: 24px"
              >
                {{ record.mySetsWon }}
              </span>
              <span class="mx-2 text-medium-emphasis">-</span>
              <span
                class="font-weight-bold text-h5 text-center"
                :class="[
                  smAndDown ? 'text-h6' : 'text-h5',
                  !record.isWinner ? 'text-success' : '',
                ]"
                style="min-width: 24px"
              >
                {{ record.opponentSetsWon }}
              </span>
            </div>

            <!-- Individual set scores -->
            <div class="d-flex flex-wrap justify-center mb-2" style="gap: 4px">
              <span
                v-for="set in record.individualSets"
                :key="set.setNumber"
                class="text-caption"
                style="white-space: nowrap"
              >
                <span :class="{ 'font-weight-bold': set.myWon }">{{
                  set.myScore
                }}</span
                >-<span :class="{ 'font-weight-bold': !set.myWon }">{{
                  set.opponentScore
                }}</span
                ><span v-if="set.setNumber < record.individualSets.length"
                  >,</span
                >
              </span>
            </div>
          </v-col>

          <!-- Right team (opponent) -->
          <v-col cols="3" class="d-flex align-center justify-end">
            <v-btn
              variant="text"
              class="text-primary font-weight-medium text-center mr-2"
              :class="[
                smAndDown ? 'text-caption' : 'text-body-2',
                !record.isWinner ? 'text-success' : 'text-error',
              ]"
              @click="navigateToTeam(record.opponentId)"
            >
              {{ record.opponentName }}
            </v-btn>
            <v-avatar size="40" rounded="0" :size="smAndDown ? 32 : 40">
              <v-img :src="record.opponentImg" :alt="record.opponentName" />
            </v-avatar>
          </v-col>

          <!-- Chevron button -->
          <v-col cols="auto" class="d-flex justify-end pa-0">
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              :href="record.box_score"
              target="_blank"
            />
          </v-col>
        </v-row>
      </v-card>
    </div>
  </v-card>
  <!-- Pagination Controls -->
  <v-card
    v-if="!loading && !error && formattedRecords.length > itemsPerPage"
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
    v-if="!loading && !error && formattedRecords.length === 0"
    class="justify-center"
  >
    <v-col cols="12" class="text-center pa-4">
      <v-icon size="48" color="medium-emphasis">mdi-volleyball</v-icon>
      <p class="text-h6 mt-2 text-medium-emphasis">No matches found</p>
      <p class="text-body-2 text-medium-emphasis">
        Try selecting a different season
      </p>
    </v-col>
  </v-row>
</template>
