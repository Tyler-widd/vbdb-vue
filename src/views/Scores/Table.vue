<!-- views/Scores/Table.vue -->
<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

// Router and display composables
const router = useRouter();
const { smAndDown } = useDisplay();

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
});

// API base URL
const API_BASE = "http://localhost:4000";

// Data refs
const games = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const hasMore = ref(true);
const totalGames = ref(0);

// Pagination
const paginationOptions = [10, 25, 50, 100, 200, 500];

// Function to deduplicate games based on multiple criteria
const deduplicateGames = (gamesList) => {
  const seen = new Set();
  const result = [];

  gamesList.forEach((game) => {
    const homeTeam = game.home_team_name || "";
    const awayTeam = game.away_team_name || "";
    const date = game.date || "";
    const matchId = game.match_id || "";
    const uniqueKey = `${matchId}_${date}_${homeTeam}_${awayTeam}`;

    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      result.push(game);
    }
  });

  return result;
};

const dateSort = (a, b) => {
  return new Date(a) - new Date(b);
};

// Updated fetchGames function in Table.vue
const fetchGames = async (loadingMore = false) => {
  if (!loadingMore) {
    loading.value = true;
    currentPage.value = 1;
    games.value = [];
    hasMore.value = true;
    totalGames.value = 0;
  }

  try {
    const params = new URLSearchParams();

    // Only add season parameter if a specific season is selected
    // If props.filters.season is null (All Seasons), don't add the parameter
    if (props.filters.season) {
      params.append("season", props.filters.season);
    } else {
      // Optionally, you can add a comment or log to indicate all seasons are being fetched
      console.log("Fetching games for all seasons");
    }

    // Default to D-I if no division is selected
    const division = props.filters.division || "D-I";
    params.append("division", division);

    if (props.filters.conference) {
      params.append("conference", props.filters.conference);
    }

    if (props.filters.school) {
      params.append("team", props.filters.school);
    }

    // Add pagination
    params.append("limit", itemsPerPage.value.toString());
    params.append(
      "offset",
      ((currentPage.value - 1) * itemsPerPage.value).toString()
    );

    // Add ordering to ensure consistent results
    params.append("order", "date");
    params.append("sort", "desc");

    const url = `${API_BASE}/megagames${
      params.toString() ? "?" + params.toString() : ""
    }`;

    const response = await fetch(url);
    if (response.ok) {
      let fetchedGames = await response.json();

      // Deduplicate games
      fetchedGames = deduplicateGames(fetchedGames);

      // Check if we've reached the end
      if (fetchedGames.length < itemsPerPage.value) {
        hasMore.value = true;
      }

      // Client-side search filter (only for text search)
      if (props.filters.search) {
        fetchedGames = fetchedGames.filter((game) => {
          const searchTerm = props.filters.search.toLowerCase();
          return (
            (game.home_team_name &&
              game.home_team_name.toLowerCase().includes(searchTerm)) ||
            (game.away_team_name &&
              game.away_team_name.toLowerCase().includes(searchTerm))
          );
        });
      }

      if (loadingMore) {
        // For load more, we need to deduplicate against existing games too
        const combinedGames = [...games.value, ...fetchedGames];
        const deduplicatedCombined = deduplicateGames(combinedGames);

        games.value = deduplicatedCombined;
      } else {
        games.value = fetchedGames;
      }

      // Update total count after deduplication and filtering
      totalGames.value = games.value.length;
    } else {
      console.error("Failed to fetch games:", response.statusText);
      if (!loadingMore) {
        games.value = [];
        totalGames.value = 0;
      }
    }
  } catch (error) {
    console.error("Error fetching games:", error);
    if (!loadingMore) {
      games.value = [];
      totalGames.value = 0;
    }
  } finally {
    loading.value = false;
  }
};
// Format time for display
const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
};

// Format date for display
const formatDate = (date) => {
  if (!date) return "";

  const dateObj = new Date(date);

  // Format: YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  // Get abbreviated weekday
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });

  return `${formattedDate}, ${weekday}`;
};

// Get score display with winner information
const getScoreInfo = (item) => {
  if (!item.winner_name && !item.home_set_1)
    return { score: "TBD", winner: null };

  const sets = [];
  for (let i = 1; i <= 5; i++) {
    const homeScore = item[`home_set_${i}`];
    const awayScore = item[`away_set_${i}`];
    if (homeScore !== null && awayScore !== null) {
      // Skip 0-0 scores
      if (homeScore === 0 && awayScore === 0) continue;
      sets.push(`${awayScore}-${homeScore}`); // away-home format
    }
  }

  return {
    score:
      sets.length > 0 ? sets.join(", ") : item.winner_name ? "Final" : "TBD",
    winner: item.winner_name,
  };
};

// Determine team names and images (updated for megagames format)
const getHomeTeam = (item) => {
  return {
    name: item.home_team_name || "TBD",
    img: item.home_team_img || null,
    id: item.home_team_id || null,
    conf: item.home_conference || null,
  };
};

const getAwayTeam = (item) => {
  return {
    name: item.away_team_name || "TBD",
    img: item.away_team_img || null,
    id: item.away_team_id || null,
    conf: item.away_conference || null,
  };
};

const getFormattedScore = (item) => {
  if (!item.winner_name && !item.home_set_1)
    return { text: "TBD", isColorized: false };

  const sets = [];
  const awayTeamName = item.away_team_name;
  const homeTeamName = item.home_team_name;
  const isAwayWinner = item.winner_name === awayTeamName;
  const isHomeWinner = item.winner_name === homeTeamName;

  for (let i = 1; i <= 5; i++) {
    const homeScore = item[`home_set_${i}`];
    const awayScore = item[`away_set_${i}`];
    if (homeScore !== null && awayScore !== null) {
      // Skip 0-0 scores
      if (homeScore === 0 && awayScore === 0) continue;

      sets.push({
        away: awayScore,
        home: homeScore,
        awayWon: awayScore > homeScore,
        homeWon: homeScore > awayScore,
      });
    }
  }

  return {
    sets,
    isAwayWinner,
    isHomeWinner,
    hasResult: sets.length > 0,
  };
};

// Get winner color class
const getWinnerClass = (item, teamName) => {
  const scoreInfo = getScoreInfo(item);
  if (!scoreInfo.winner) return "";

  return scoreInfo.winner === teamName ? "text-success" : "text-error";
};

const getWinnerImg = (item) => {
  if (!item.winner_name) return null;

  const homeTeam = getHomeTeam(item);
  const awayTeam = getAwayTeam(item);

  // Check if winner matches home team
  if (item.winner_name === homeTeam.name) {
    return homeTeam.img;
  }

  // Check if winner matches away team
  if (item.winner_name === awayTeam.name) {
    return awayTeam.img;
  }

  // If no match found, return null
  return null;
};

// Navigate to team page
const navigateToTeam = (teamId) => {
  if (teamId) {
    router.push(`/teams/${teamId}`);
  }
};

const loadMore = async () => {
  if (!hasMore.value || loading.value) return;

  loading.value = true;
  currentPage.value++;
  await fetchGames(true);
};

// Handle items per page change
const onItemsPerPageChange = () => {
  currentPage.value = 1;
  fetchGames();
};

// Table headers - updated layout
const headers = ref([
  {
    title: "Date",
    key: "date",
    sortable: true,
    width: "250",
    align: "start",
    sort: dateSort,
  },
  { title: "Home Team", key: "home_team", sortable: true, width: "auto" },
  { title: "Away Team", key: "away_team", sortable: true, width: "auto" },
  {
    title: "Score",
    key: "score",
    sortable: false,
    align: "start",
    width: "auto",
  },
]);

// Watch for filter changes - reset page when filters change
watch(
  () => props.filters,
  () => {
    currentPage.value = 1;
    fetchGames();
  },
  { deep: true }
);

// Watch for items per page
watch(itemsPerPage, onItemsPerPageChange);

onMounted(() => {
  fetchGames();
});
</script>

<template>
  <!-- Pagination Controls -->
  <div class="d-flex justify-space-between align-center mb-4">
    <div class="d-flex align-center">
      <span class="text-body-2 mr-3">Items per page:</span>
      <v-select
        v-model="itemsPerPage"
        :items="paginationOptions"
        variant="outlined"
        rounded
        density="compact"
        hide-details
        style="max-width: 100px"
      />
    </div>

    <div v-if="games.length > 0" class="text-body-2 text-grey">
      Showing {{ totalGames }} games
    </div>
  </div>

  <v-data-table
    :headers="headers"
    :items="games"
    :items-per-page="-1"
    :loading="loading"
    :sort-by="[{ key: 'date', order: 'desc' }]"
    class="rounded-lg"
    density="compact"
    hide-default-footer
  >
    <!-- Date column -->
    <template v-slot:item.date="{ item }">
      <span
        :class="smAndDown ? 'text-caption' : ''"
        class="font-weight-medium mr-2"
      >
        {{ smAndDown ? item.date : formatDate(item.date) }}
      </span>
      <v-chip v-if="item.time && !smAndDown" color="primary" size="small">
        {{ formatTime(item.time) }}
      </v-chip>
    </template>

    <!-- Home Team column -->
    <template v-slot:item.home_team="{ item }">
      <div class="d-flex align-center">
        <v-avatar size="32" class="mr-3" tile>
          <v-img
            v-if="getHomeTeam(item).img"
            :src="getHomeTeam(item).img"
            :alt="getHomeTeam(item).name"
            contain
          />
          <v-icon v-else>mdi-school</v-icon>
        </v-avatar>
        <div class="d-flex flex-column">
          <v-btn
            variant="text"
            density="compact"
            class="text-primary font-weight-regular justify-start text-left"
            :class="[
              smAndDown ? 'text-caption' : 'text-body-1',
              getWinnerClass(item, getHomeTeam(item).name),
            ]"
            @click="navigateToTeam(getHomeTeam(item).id)"
            :disabled="!getHomeTeam(item).id"
            style="
              min-width: 0;
              padding-left: 0 !important;
              padding-right: 0 !important;
            "
          >
            {{ getHomeTeam(item).name }}
          </v-btn>

          <span class="text-caption font-italic">{{
            getHomeTeam(item).conf
          }}</span>
        </div>
      </div>
    </template>

    <!-- Away Team column -->
    <template v-slot:item.away_team="{ item }">
      <div class="d-flex align-center">
        <v-avatar size="32" class="mr-3" tile>
          <v-img
            v-if="getAwayTeam(item).img"
            :src="getAwayTeam(item).img"
            :alt="getAwayTeam(item).name"
            contain
          />
          <v-icon v-else>mdi-school</v-icon>
        </v-avatar>
        <div class="d-flex flex-column">
          <v-btn
            variant="text"
            density="compact"
            class="text-primary font-weight-medium justify-start text-left"
            :class="[
              smAndDown ? 'text-caption' : 'text-body-2',
              getWinnerClass(item, getAwayTeam(item).name),
            ]"
            @click="navigateToTeam(getAwayTeam(item).id)"
            :disabled="!getAwayTeam(item).id"
            style="
              min-width: 0;
              padding-left: 0 !important;
              padding-right: 0 !important;
            "
          >
            {{ getAwayTeam(item).name }}
          </v-btn>
          <span class="text-caption font-italic">{{
            getHomeTeam(item).conf
          }}</span>
        </div>
      </div>
    </template>

    <!-- Score column (now in the middle) -->
    <template v-slot:item.score="{ item }">
      <v-btn
        class="text-body-1"
        variant="text"
        :href="item.box_score"
        target="_blank"
      >
        <template v-if="getFormattedScore(item).hasResult">
          <!-- Display winner icon if available -->
          <v-avatar v-if="getWinnerImg(item)" size="30" class="mr-2" tile>
            <v-img :src="getWinnerImg(item)" :alt="item.winner_name" contain />
          </v-avatar>

          <!-- Score display -->
          <span class="font-weight-thin">(</span>
          <template
            v-for="(set, index) in getFormattedScore(item).sets"
            :key="index"
          >
            <span v-if="index > 0" class="font-weight-thin">, </span>
            <span
              :class="set.awayWon ? 'font-weight-bold' : 'font-weight-thin'"
              >{{ set.away }}</span
            >
            <span class="font-weight-thin">-</span>
            <span
              :class="set.homeWon ? 'font-weight-bold' : 'font-weight-thin'"
              >{{ set.home }}</span
            >
          </template>
          <span class="font-weight-thin">)</span>
        </template>
        <span v-else class="text-grey">TBD</span>
      </v-btn>
    </template>

    <!-- Loading state -->
    <template v-slot:loading>
      <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
    </template>

    <!-- No data state -->
    <template v-slot:no-data>
      <div class="text-center pa-4">
        <v-icon size="48" color="grey">mdi-database-search</v-icon>
        <div class="text-h6 mt-2">No games found</div>
        <div class="text-body-2 text-grey">
          Try selecting a different season or school
        </div>
      </div>
    </template>
  </v-data-table>

  <!-- Load More Button -->
  <div v-if="games.length > 0 && hasMore" class="text-center pa-4">
    <v-btn
      @click="loadMore"
      :loading="loading"
      color="primary"
      variant="outlined"
    >
      Load More Games ({{ itemsPerPage }} at a time)
      <v-icon end>mdi-chevron-down</v-icon>
    </v-btn>
  </div>
</template>

<style>
.v-table__wrapper table tbody tr td,
.v-table__wrapper table thead tr th {
  padding: 0 !important;
}

/* Ensure buttons align text to the left */
.v-btn.text-left {
  text-align: left !important;
}
</style>
