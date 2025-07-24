<!-- views/Schedule/Table.vue -->
<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

// Router and display composables
const router = useRouter();
const { smAndDown } = useDisplay();

const props = defineProps({
  scheduleData: {
    type: Array,
    default: () => [],
  },
  filters: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const dateSort = (a, b) => {
  // Handle different date formats
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);

    // If it's MM/DD/YYYY format, convert to a standard format
    if (dateStr.includes("/")) {
      const [month, day, year] = dateStr.split("/");
      return new Date(year, month - 1, day);
    }

    // Otherwise, try standard parsing
    return new Date(dateStr);
  };

  const dateA = parseDate(a);
  const dateB = parseDate(b);

  return dateA - dateB;
};

// Table headers for schedule view
const headers = [
  {
    title: "Date",
    key: "date", // This matches the slot name below
    sortable: true,
    width: "250",
    align: "start",
    sort: dateSort,
  },
  { title: "Team 1", key: "team_1", sortable: true, width: "auto" },
  { title: "Team 2", key: "team_2", sortable: true, width: "auto" },
];

// Remove duplicates and filter games
const filteredGames = computed(() => {
  if (!props.scheduleData.length) return [];

  // First, remove duplicates based on a unique combination of fields
  const uniqueGamesMap = new Map();

  props.scheduleData.forEach((game) => {
    // Create a unique key based on date, time, and both teams
    const uniqueKey = `${game.date}-${game.time}-${game.team_1_id}-${game.team_2_id}`;

    // Only add if we haven't seen this combination before
    if (!uniqueGamesMap.has(uniqueKey)) {
      uniqueGamesMap.set(uniqueKey, game);
    }
  });

  // Convert back to array and apply filters
  const uniqueGames = Array.from(uniqueGamesMap.values());

  return uniqueGames.filter((game) => {
    let matches = true;

    // Filter by selected school
    if (props.filters.school) {
      matches =
        matches &&
        (game.team_1_id === props.filters.school ||
          game.team_2_id === props.filters.school);
    }

    // Filter by division
    if (props.filters.division) {
      matches =
        matches &&
        (game.team_1_division === props.filters.division ||
          game.team_2_division === props.filters.division);
    }

    // Filter by conference
    if (props.filters.conference) {
      matches =
        matches &&
        (game.team_1_conference === props.filters.conference ||
          game.team_2_conference === props.filters.conference);
    }

    // Filter by search query
    if (props.filters.search) {
      const searchTerm = props.filters.search.toLowerCase();
      matches =
        matches &&
        (game.team_1_name.toLowerCase().includes(searchTerm) ||
          (game.team_1_longname &&
            game.team_1_longname.toLowerCase().includes(searchTerm)) ||
          game.team_2_name.toLowerCase().includes(searchTerm) ||
          (game.team_2_longname &&
            game.team_2_longname.toLowerCase().includes(searchTerm)));
    }

    return matches;
  });
});

// Format time for display
const formatTime = (time) => {
  if (!time) return "";

  // Handle both "5:00 PM" and "17:00" formats
  if (time.includes("PM") || time.includes("AM")) {
    return time; // Already formatted
  }

  const [hours, minutes] = time.split(":");
  const hour24 = parseInt(hours);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${ampm}`;
};

// Format date for display
const formatDate = (date) => {
  if (!date) return "";

  // Handle MM/DD/YYYY format from API
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return date; // Return as-is if parsing fails
  }

  // Format: YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  // Get abbreviated weekday
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });

  return `${formattedDate}, ${weekday}`;
};

// Format datetime for display
const formatDateTime = (date, time) => {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  return { date: formattedDate, time: formattedTime };
};

// Get team info
const getTeam1Info = (item) => {
  return {
    name: item.team_1_name,
    longname: item.team_1_longname || item.team_1_name,
    img: item.team_1_img,
    id: item.team_1_id,
    division: item.team_1_division,
    conference: item.team_1_conference,
    coach: item.team_1_coach,
  };
};

const getTeam2Info = (item) => {
  return {
    name: item.team_2_name,
    longname: item.team_2_longname || item.team_2_name,
    img: item.team_2_img,
    id: item.team_2_id,
    division: item.team_2_division,
    conference: item.team_2_conference,
    coach: item.team_2_coach,
  };
};

// Navigate to team page
const navigateToTeam = (teamId) => {
  if (teamId) {
    router.push(`/teams/${teamId}`);
  }
};
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="filteredGames"
    :items-per-page="10"
    :loading="loading"
    class="rounded-lg"
    density="compact"
  >
    <!-- Date & Time column - Fixed slot name to match header key -->
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
            v-if="
              getTeam1Info(item).img &&
              getTeam1Info(item).img.startsWith('http')
            "
            :src="getTeam1Info(item).img"
            :alt="getTeam1Info(item).name"
            contain
          />
          <v-icon v-else>mdi-school</v-icon>
        </v-avatar>
        <div class="d-flex flex-column">
          <v-btn
            variant="text"
            density="compact"
            class="text-primary font-weight-regular justify-start text-left pa-0"
            :class="smAndDown ? 'text-caption' : 'text-body-1'"
            @click="navigateToTeam(getTeam1Info(item).id)"
            :disabled="!getTeam1Info(item).id"
            style="min-width: 0; height: auto"
          >
            {{ getTeam1Info(item).name }}
          </v-btn>
          <span class="text-caption font-italic">
            {{ getTeam1Info(item).conference }}
          </span>
        </div>
      </div>
    </template>

    <!-- Team 2 column -->
    <template v-slot:item.team_2="{ item }">
      <div class="d-flex align-center">
        <v-avatar size="32" class="mr-3" tile>
          <v-img
            v-if="
              getTeam2Info(item).img &&
              getTeam2Info(item).img.startsWith('http')
            "
            :src="getTeam2Info(item).img"
            :alt="getTeam2Info(item).name"
            contain
          />
          <v-icon v-else>mdi-school</v-icon>
        </v-avatar>
        <div class="d-flex flex-column">
          <v-btn
            variant="text"
            density="compact"
            class="text-primary font-weight-regular justify-start text-left pa-0"
            :class="smAndDown ? 'text-caption' : 'text-body-1'"
            @click="navigateToTeam(getTeam2Info(item).id)"
            :disabled="!getTeam2Info(item).id"
            style="min-width: 0; height: auto"
          >
            {{ getTeam2Info(item).name }}
          </v-btn>
          <span class="text-caption font-italic">
            {{ getTeam2Info(item).conference }}
          </span>
        </div>
      </div>
    </template>

    <!-- Loading state -->
    <template v-slot:loading>
      <v-skeleton-loader type="table-row@15"></v-skeleton-loader>
    </template>

    <!-- No data state -->
    <template v-slot:no-data>
      <div class="text-center pa-4">
        <v-icon size="48" color="grey">mdi-calendar-search</v-icon>
        <div class="text-h6 mt-2">No games scheduled</div>
        <div class="text-body-2 text-grey">
          Try adjusting your filters to see more games
        </div>
      </div>
    </template>
  </v-data-table>
</template>

<style>
.v-table__wrapper table tbody tr td,
.v-table__wrapper table thead tr th {
  padding: 0 !important;
}
</style>
