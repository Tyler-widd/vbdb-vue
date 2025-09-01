<!-- views/Live/LiveTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();

const props = defineProps({
  formattedMatches: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Define table headers
const headers = computed(() => [
  {
    title: "Date",
    key: "date",
    sortable: true,
    width: smAndDown.value ? "60px" : "100px",
  },
  {
    title: "Time",
    key: "time",
    sortable: true,
    width: smAndDown.value ? "50px" : "80px",
  },
  {
    title: "Team 1",
    key: "team_1",
    sortable: true,
    width: smAndDown.value ? "120px" : "180px",
  },
  {
    title: "Score",
    key: "score",
    sortable: true,
    width: smAndDown.value ? "80px" : "120px",
  },
  {
    title: "Team 2",
    key: "team_2",
    sortable: true,
    width: smAndDown.value ? "120px" : "180px",
  },
  {
    title: "Status",
    key: "status",
    sortable: true,
    width: smAndDown.value ? "60px" : "100px",
  },
]);

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format time for display
const formatTime = (timeStr) => {
  if (!timeStr) return "TBD";
  return timeStr;
};

// Get team name color based on match status
const getTeamNameColor = (teamId, match) => {
  if (match.status === "in_progress") {
    // For in-progress matches, highlight the team leading in the current set
    const currentSet = match.individualSets?.find(
      (set) =>
        set.team1Score !== null &&
        set.team2Score !== null &&
        !(
          (set.team1Score >= 25 && set.team1Score - set.team2Score >= 2) ||
          (set.team2Score >= 25 && set.team2Score - set.team1Score >= 2)
        )
    );

    if (currentSet) {
      if (
        currentSet.team1Score > currentSet.team2Score &&
        teamId === match.team1Id
      ) {
        return "text-success";
      } else if (
        currentSet.team2Score > currentSet.team1Score &&
        teamId === match.team2Id
      ) {
        return "text-success";
      } else {
        return "";
      }
    }
  }

  if (match.status === "not_started") {
    return "text-success";
  }

  if (match.status === "completed" && match.winnerId) {
    if (match.winnerId === teamId) {
      return "text-success";
    } else {
      return "text-error";
    }
  }

  return "text-primary";
};

// Format score display
const formatScore = (match) => {
  if (!match.individualSets || match.individualSets.length === 0) {
    return "vs";
  }

  return `${match.team1SetsWon}-${match.team2SetsWon}`;
};

// Get status display
const getStatusDisplay = (match) => {
  switch (match.status) {
    case "in_progress":
      return "LIVE";
    case "completed":
      return "Final";
    case "not_started":
      return "Upcoming";
    default:
      return "";
  }
};

// Get status color
const getStatusColor = (match) => {
  switch (match.status) {
    case "in_progress":
      return "error";
    case "completed":
      return "success";
    case "not_started":
      return "primary";
    default:
      return "primary";
  }
};

// Use the formatted matches passed from parent
const filteredMatches = computed(() => props.formattedMatches);
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="filteredMatches"
      :loading="loading"
      :items-per-page="20"
      no-data-text="No matches found"
      loading-text="Loading live matches..."
    >
      <!-- Date column -->
      <template v-slot:item.date="{ item }">
        <div class="text-body-2 font-weight-light">
          {{ item.formattedDate }}
        </div>
      </template>

      <!-- Time column -->
      <template v-slot:item.time="{ item }">
        <div class="text-body-2 font-weight-light">
          {{ formatTime(item.time) }}
        </div>
      </template>

      <!-- Team 1 column -->
      <template v-slot:item.team_1="{ item }">
        <div class="d-flex align-center">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-2">
            <v-img
              v-if="item.team1Img"
              :src="item.team1Img"
              :alt="item.team1Name"
            />
            <v-icon v-else :size="smAndDown ? '16' : '20'">mdi-school</v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span
              :class="[
                smAndDown ? 'text-body-2' : 'text-subtitle-1',
                'button-like',
                getTeamNameColor(item.team1Id, item),
              ]"
              @click="
                item.team1Id
                  ? navigateToTeam($router, item.team1Id, null)
                  : null
              "
            >
              {{ item.team1Name }}
            </span>
            <div class="text-caption text-medium-emphasis">
              {{ item.team1Conference }}
            </div>
          </div>
        </div>
      </template>

      <!-- Score column -->
      <template v-slot:item.score="{ item }">
        <div class="text-center">
          <div
            :class="[
              smAndDown ? 'text-body-1' : 'text-h6',
              'font-weight-bold',
              item.status === 'in_progress' ? 'text-error' : 'text-primary',
            ]"
          >
            {{ formatScore(item) }}
          </div>
          <div
            v-if="item.status === 'in_progress' && item.currentSet"
            class="text-caption text-medium-emphasis"
          >
            Set {{ item.currentSet }}
          </div>
        </div>
      </template>

      <!-- Team 2 column -->
      <template v-slot:item.team_2="{ item }">
        <div class="d-flex align-center">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-2">
            <v-img
              v-if="item.team2Img"
              :src="item.team2Img"
              :alt="item.team2Name"
            />
            <v-icon v-else :size="smAndDown ? '16' : '20'">mdi-school</v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span
              :class="[
                smAndDown ? 'text-body-2' : 'text-subtitle-1',
                'button-like',
                getTeamNameColor(item.team2Id, item),
              ]"
              @click="
                item.team2Id
                  ? navigateToTeam($router, item.team2Id, null)
                  : null
              "
            >
              {{ item.team2Name }}
            </span>
            <div class="text-caption text-medium-emphasis">
              {{ item.team2Conference }}
            </div>
          </div>
        </div>
      </template>

      <!-- Status column -->
      <template v-slot:item.status="{ item }">
        <div class="d-flex align-center">
          <v-chip
            :color="getStatusColor(item)"
            :size="smAndDown ? 'x-small' : 'small'"
            variant="flat"
            class="font-weight-bold"
          >
            <v-icon v-if="item.status === 'in_progress'" size="12" class="mr-1"
              >mdi-circle</v-icon
            >
            {{ getStatusDisplay(item) }}
          </v-chip>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
