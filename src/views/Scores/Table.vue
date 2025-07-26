<!-- views/Scores/Table.vue -->
<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useGamesStore } from "@/composables/useGamesStore";

// Router and display composables
const router = useRouter();
const { smAndDown } = useDisplay();

// Use the games store for filtering
const {
  searchGames,
  getGamesByDivision,
  getGamesByConference,
  getGamesByTeam,
} = useGamesStore();

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
});

// API base URL
const API_BASE = "https://api.volleyballdatabased.com/";

// Data refs
const games = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(25);
const hasMore = ref(true);
const totalGames = ref(0);

// Pagination
const paginationOptions = [10, 25, 50, 100, 200, 500];

// Updated fetchGames function to use your /games endpoint
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

    // Build query parameters based on filters
    if (props.filters.season) {
      params.append("season", props.filters.season);
    }

    if (props.filters.division) {
      params.append("division", props.filters.division);
    }

    if (props.filters.conference) {
      params.append("conference", props.filters.conference);
    }

    // For team filtering, we'll need to use a different approach since your endpoint
    // expects team_id in the URL path. We'll filter client-side for now.

    let url = `${API_BASE}/games`;

    // If a specific team is selected, use the team-specific endpoint
    if (props.filters.school) {
      url = `${API_BASE}/games/${props.filters.school}`;
      // Add season parameter if specified
      if (props.filters.season) {
        params.append("season", props.filters.season);
      }
    }

    // Add query parameters if any
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (response.ok) {
      let fetchedGames = await response.json();

      // Deduplicate games
      fetchedGames = deduplicateGames(fetchedGames);

      // Client-side filtering
      if (props.filters.division && !props.filters.school) {
        fetchedGames = fetchedGames.filter(
          (game) =>
            game.team_1_division === props.filters.division ||
            game.team_2_division === props.filters.division
        );
      }

      if (props.filters.conference && !props.filters.school) {
        fetchedGames = fetchedGames.filter(
          (game) =>
            game.team_1_conference === props.filters.conference ||
            game.team_2_conference === props.filters.conference
        );
      }

      // Client-side search filter
      if (props.filters.search) {
        fetchedGames = fetchedGames.filter((game) => {
          const searchTerm = props.filters.search.toLowerCase();
          return (
            (game.team_1_name &&
              game.team_1_name.toLowerCase().includes(searchTerm)) ||
            (game.team_2_name &&
              game.team_2_name.toLowerCase().includes(searchTerm)) ||
            (game.location && game.location.toLowerCase().includes(searchTerm))
          );
        });
      }

      // Sort by date (newest first)
      fetchedGames.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply pagination client-side
      const startIndex = (currentPage.value - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      const paginatedGames = fetchedGames.slice(startIndex, endIndex);

      if (loadingMore) {
        games.value = [...games.value, ...paginatedGames];
      } else {
        games.value = paginatedGames;
      }

      // Check if we have more data
      hasMore.value = endIndex < fetchedGames.length;
      totalGames.value = fetchedGames.length;
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
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  return `${formattedDate}, ${weekday}`;
};

// Get score display with winner information
const getScoreInfo = (item) => {
  if (!item.winner_id && !item.set_1_team_1)
    return { score: "TBD", winner: null };

  const sets = [];
  for (let i = 1; i <= 5; i++) {
    const team1Score = item[`set_${i}_team_1`];
    const team2Score = item[`set_${i}_team_2`];
    if (team1Score !== null && team2Score !== null) {
      if (team1Score === 0 && team2Score === 0) continue;
      sets.push(`${team2Score}-${team1Score}`); // team2-team1 format
    }
  }

  return {
    score: sets.length > 0 ? sets.join(", ") : item.winner_id ? "Final" : "TBD",
    winner: item.winner_id,
  };
};

// Determine team names and images
const getTeam1 = (item) => {
  return {
    name: item.team_1_name || "TBD",
    img: item.team_1_img || null,
    id: item.team_1_id || null,
    conf: item.team_1_conference || null,
  };
};

const getTeam2 = (item) => {
  return {
    name: item.team_2_name || "TBD",
    img: item.team_2_img || null,
    id: item.team_2_id || null,
    conf: item.team_2_conference || null,
  };
};

const getFormattedScore = (item) => {
  if (!item.winner_id && !item.set_1_team_1)
    return { text: "TBD", isColorized: false };

  const sets = [];
  const team1Name = item.team_1_name;
  const team2Name = item.team_2_name;
  const isTeam1Winner = item.winner_id === item.team_1_id;
  const isTeam2Winner = item.winner_id === item.team_2_id;

  for (let i = 1; i <= 5; i++) {
    const team1Score = item[`set_${i}_team_1`];
    const team2Score = item[`set_${i}_team_2`];
    if (team1Score !== null && team2Score !== null) {
      if (team1Score === 0 && team2Score === 0) continue;

      sets.push({
        team1: team1Score,
        team2: team2Score,
        team1Won: team1Score > team2Score,
        team2Won: team2Score > team1Score,
      });
    }
  }

  return {
    sets,
    isTeam1Winner,
    isTeam2Winner,
    hasResult: sets.length > 0,
  };
};

// Get winner color class
const getWinnerClass = (item, teamId) => {
  if (!item.winner_id) return "";
  return item.winner_id === teamId
    ? "text-success font-weight-bold"
    : "text-error";
};

const getWinnerImg = (item) => {
  if (!item.winner_id) return null;

  const team1 = getTeam1(item);
  const team2 = getTeam2(item);

  if (item.winner_id === team1.id) {
    return team1.img;
  }

  if (item.winner_id === team2.id) {
    return team2.img;
  }

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

// Table headers
const headers = ref([
  {
    title: "Date",
    key: "date",
    sortable: true,
    width: "250",
    align: "start",
    sort: dateSort,
  },
  { title: "Team 1", key: "team_1", sortable: true, width: "auto" },
  { title: "Team 2", key: "team_2", sortable: true, width: "auto" },
  {
    title: "Score",
    key: "score",
    sortable: false,
    align: "start",
    width: "auto",
  },
]);

// Watch for filter changes
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
        density="compact"
        style="width: 100px"
      />
    </div>

    <div v-if="games.length > 0" class="text-body-2 text-grey">
      Showing {{ games.length }} of {{ totalGames }} games
    </div>
  </div>

  <v-data-table
    :headers="headers"
    :items="games"
    :items-per-page="-1"
    :loading="loading"
    :sort-by="[{ key: 'date', order: 'desc' }]"
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

    <!-- Team 1 column -->
    <template v-slot:item.team_1="{ item }">
      <div class="d-flex align-center">
        <v-avatar size="32" class="mr-3" tile>
          <v-img
            v-if="getTeam1(item).img"
            :src="getTeam1(item).img"
            :alt="getTeam1(item).name"
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
              getWinnerClass(item, getTeam1(item).id),
            ]"
            @click="navigateToTeam(getTeam1(item).id)"
            :disabled="!getTeam1(item).id"
            style="
              min-width: 0;
              padding-left: 0 !important;
              padding-right: 0 !important;
            "
          >
            {{ getTeam1(item).name }}
          </v-btn>
          <span class="text-caption font-italic">{{
            getTeam1(item).conf
          }}</span>
        </div>
      </div>
    </template>

    <!-- Team 2 column -->
    <template v-slot:item.team_2="{ item }">
      <div class="d-flex align-center">
        <v-avatar size="32" class="mr-3" tile>
          <v-img
            v-if="getTeam2(item).img"
            :src="getTeam2(item).img"
            :alt="getTeam2(item).name"
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
              getWinnerClass(item, getTeam2(item).id),
            ]"
            @click="navigateToTeam(getTeam2(item).id)"
            :disabled="!getTeam2(item).id"
            style="
              min-width: 0;
              padding-left: 0 !important;
              padding-right: 0 !important;
            "
          >
            {{ getTeam2(item).name }}
          </v-btn>
          <span class="text-caption font-italic">{{
            getTeam2(item).conf
          }}</span>
        </div>
      </div>
    </template>

    <!-- Score column -->
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
            <v-img :src="getWinnerImg(item)" :alt="'Winner'" contain />
          </v-avatar>

          <!-- Score display -->
          <span class="font-weight-thin">(</span>
          <template
            v-for="(set, index) in getFormattedScore(item).sets"
            :key="index"
          >
            <span v-if="index > 0" class="font-weight-thin">, </span>
            <span
              :class="set.team1Won ? 'font-weight-bold' : 'font-weight-thin'"
              >{{ set.team1 }}</span
            >
            <span class="font-weight-thin">-</span>
            <span
              :class="set.team2Won ? 'font-weight-bold' : 'font-weight-thin'"
              >{{ set.team2 }}</span
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
        <div class="text-body-2 text-grey">Try adjusting your filters</div>
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
  padding: 8px 16px !important;
}

/* Ensure buttons align text to the left */
.v-btn.text-left {
  text-align: left !important;
}
</style>
