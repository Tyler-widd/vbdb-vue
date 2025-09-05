<!-- views/Schedule/ScheduleTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();
const router = useRouter();

const props = defineProps({
  scheduleData: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  orgId: {
    type: String,
    default: null,
  },
  // Add filter props
  search: {
    type: String,
    default: "",
  },
  divisionFilter: {
    type: String,
    default: null,
  },
  conferenceFilter: {
    type: String,
    default: null,
  },
});

// Define table headers
const headers = computed(() => [
  {
    title: "Date",
    key: "date",
    sortable: true,
    width: smAndDown.value ? "80px" : "120px",
  },
  {
    title: "Teams",
    key: "team_1",
    sortable: true,
    width: smAndDown.value ? "180px" : "240px",
  },
  {
    title: "Time",
    key: "time",
    sortable: false,
    width: smAndDown.value ? "120px" : "160px",
  },
]);

const formatConference = (conference) => {
  if (conference && conference.includes(".0")) {
    return `Region ${conference.replace(".0", "")}`;
  }
  return conference;
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

// Helper function to format rank display
const formatRank = (rank) => {
  if (!rank || rank === null) return null;
  return `#${rank}`;
};

// Enhanced time formatting that handles both original API format and converted format
const formatTime = (item) => {
  // First try to use the original_time if available (for better display)
  if (item.original_time) {
    return formatOriginalTime(item.original_time);
  }

  // Fall back to converted time format
  if (item.time) {
    return formatConvertedTime(item.time);
  }

  return "Time TBD";
};

// Format original API time format ("06:00PM ET")
const formatOriginalTime = (timeString) => {
  if (!timeString || typeof timeString !== "string") {
    return "Time TBD";
  }

  try {
    // Remove timezone abbreviation and clean up
    const timeOnly = timeString
      .replace(/\s+(ET|CT|MT|PT|EST|CST|MST|PST)$/i, "")
      .trim();

    // Parse and format the time
    const timeRegex = /^(\d{1,2}):(\d{2})(AM|PM)$/i;
    const match = timeOnly.match(timeRegex);

    if (match) {
      const [, hours, minutes, ampm] = match;
      return `${hours}:${minutes} ${ampm.toUpperCase()}`;
    }

    return timeString; // Return original if parsing fails
  } catch (error) {
    console.warn("Error formatting original time:", timeString, error);
    return "Time TBD";
  }
};

// Format converted 24-hour time format ("18:00")
const formatConvertedTime = (timeString) => {
  if (!timeString || typeof timeString !== "string") {
    return "Time TBD";
  }

  try {
    const parts = timeString.split(":");
    if (parts.length < 2) {
      return "Invalid time";
    }

    const [hours, minutes] = parts;
    if (!hours || !minutes) {
      return "Invalid time";
    }

    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.warn("Error formatting converted time:", timeString, error);
    return "Time TBD";
  }
};

// Get rank badge color based on ranking
const getRankBadgeColor = (rank) => {
  if (!rank) return "grey";
  if (rank <= 5) return "warning"; // Top 5 - gold/yellow
  if (rank <= 10) return "primary"; // Top 10 - blue
  if (rank <= 25) return "success"; // Top 25 - green
  return "info"; // Others - light blue
};

// Filter the schedule data
const filteredScheduleData = computed(() => {
  let filtered = [...props.scheduleData];

  // Apply division filter
  if (props.divisionFilter) {
    filtered = filtered.filter((game) => {
      return (
        game.team_1_division === props.divisionFilter ||
        game.team_2_division === props.divisionFilter
      );
    });
  }

  // Apply conference filter
  if (props.conferenceFilter) {
    filtered = filtered.filter((game) => {
      return (
        game.team_1_conference === props.conferenceFilter ||
        game.team_2_conference === props.conferenceFilter
      );
    });
  }

  // Apply search filter
  if (props.search) {
    const searchLower = props.search.toLowerCase();
    filtered = filtered.filter((game) => {
      return (
        // Search in team names
        game.team_1_name?.toLowerCase().includes(searchLower) ||
        game.team_2_name?.toLowerCase().includes(searchLower) ||
        // Search in date
        game.date?.toLowerCase().includes(searchLower) ||
        formatDate(game.date).toLowerCase().includes(searchLower) ||
        // Search in time
        game.time?.toLowerCase().includes(searchLower) ||
        game.original_time?.toLowerCase().includes(searchLower) ||
        formatTime(game).toLowerCase().includes(searchLower) ||
        // Search in conferences
        game.team_1_conference?.toLowerCase().includes(searchLower) ||
        game.team_2_conference?.toLowerCase().includes(searchLower)
      );
    });
  }

  return filtered;
});

// Format schedule data for table
const formattedSchedule = computed(() => {
  if (!filteredScheduleData.value.length) return [];

  return filteredScheduleData.value
    .map((game) => {
      return {
        id: game.match_id || game.id,
        formattedDate: formatDate(game.date),
        date: game.date,
        team1Name: game.team_1_name,
        team1Img: game.team_1_logo,
        team1Conference: game.team_1_conference,
        team1Id: game.team_1_id,
        team1Division: game.team_1_division,
        team1Rank: game.team_1_rank,
        team1RankDisplay: formatRank(game.team_1_rank),
        team1IsRanked:
          game.team_1_rank !== null && game.team_1_rank !== undefined,
        team2Name: game.team_2_name,
        team2Img: game.team_2_logo,
        team2Conference: game.team_2_conference,
        team2Id: game.team_2_id,
        team2Division: game.team_2_division,
        team2Rank: game.team_2_rank,
        team2RankDisplay: formatRank(game.team_2_rank),
        team2IsRanked:
          game.team_2_rank !== null && game.team_2_rank !== undefined,
        hasRankedTeam:
          (game.team_1_rank !== null && game.team_1_rank !== undefined) ||
          (game.team_2_rank !== null && game.team_2_rank !== undefined),
        time: game.time,
        original_time: game.original_time,
        formattedTime: formatTime(game),
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
});
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="formattedSchedule"
      :loading="loading"
      :items-per-page="20"
      no-data-text="No games scheduled"
      loading-text="Loading schedule..."
    >
      <template v-slot:header.date>
        <span class="ml-2 pa-0">Date</span>
      </template>

      <!-- Date column -->
      <template v-slot:item.date="{ item }">
        <div class="text-body-2 ml-2">
          {{ item.formattedDate }}
          <!-- Add special indicator for ranked matchups -->
          <v-chip
            v-if="item.team1IsRanked && item.team2IsRanked"
            size="x-small"
            color="warning"
            class="ml-1"
            variant="tonal"
          >
            TOP
          </v-chip>
        </div>
      </template>

      <!-- Teams column -->
      <template v-slot:item.team_1="{ item }">
        <div class="d-flex align-center">
          <div class="w-100">
            <!-- Team 1 -->
            <div class="d-flex align-center">
              <v-avatar :size="smAndDown ? '24' : '32'" class="mr-2">
                <v-img
                  v-if="item.team1Img"
                  :src="item.team1Img"
                  :alt="item.team1Name"
                />
                <v-icon v-else :size="smAndDown ? '16' : '20'"
                  >mdi-school</v-icon
                >
              </v-avatar>

              <!-- Rank badge for team 1 -->
              <v-chip
                v-if="item.team1IsRanked"
                :color="getRankBadgeColor(item.team1Rank)"
                size="small"
                class="mr-2"
                variant="tonal"
              >
                {{ item.team1RankDisplay }}
              </v-chip>

              <span
                :class="[
                  smAndDown ? 'text-body-2' : 'text-subtitle-1',
                  item.team1Id ? 'button-like' : '',
                ]"
                @click="
                  item.team1Id
                    ? navigateToTeam(router, item.team1Id, orgId)
                    : null
                "
              >
                {{ item.team1Name }}
                <div class="text-caption text-grey">
                  {{ formatConference(item.team1Conference) }}
                </div>
              </span>
            </div>

            <!-- Team 2 -->
            <div class="d-flex align-center">
              <v-avatar :size="smAndDown ? '24' : '32'" class="mr-2">
                <v-img
                  v-if="item.team2Img"
                  :src="item.team2Img"
                  :alt="item.team2Name"
                />
                <v-icon v-else :size="smAndDown ? '16' : '20'"
                  >mdi-school</v-icon
                >
              </v-avatar>

              <!-- Rank badge for team 2 -->
              <v-chip
                v-if="item.team2IsRanked"
                :color="getRankBadgeColor(item.team2Rank)"
                size="small"
                class="mr-2"
                variant="tonal"
              >
                {{ item.team2RankDisplay }}
              </v-chip>

              <span
                :class="[
                  smAndDown ? 'text-body-2' : 'text-subtitle-1',
                  item.team2Id ? 'button-like' : '',
                ]"
                @click="
                  item.team2Id
                    ? navigateToTeam(router, item.team2Id, orgId)
                    : null
                "
              >
                {{ item.team2Name }}
                <div class="text-caption text-grey">
                  {{ formatConference(item.team2Conference) }}
                </div>
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- Time column -->
      <template v-slot:item.time="{ item }">
        <div class="text-body-2">
          {{ item.formattedTime }}
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
.button-like {
  cursor: pointer;
  transition: color 0.2s ease;
}

.button-like:hover {
  opacity: 0.8;
}
</style>
