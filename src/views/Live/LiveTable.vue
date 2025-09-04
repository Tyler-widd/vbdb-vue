<!-- views/Live/LiveTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();
const router = useRouter();

const props = defineProps({
  formattedMatches: {
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
});

// Define table headers matching ScoresTable structure
const headers = computed(() => [
  {
    title: "Date/Time",
    key: "datetime",
    sortable: false,
    width: smAndDown.value ? "100px" : "140px",
  },
  {
    title: "Teams",
    key: "team_1",
    sortable: false,
    width: smAndDown.value ? "180px" : "240px",
  },
  {
    title: "Sets & Score",
    key: "scoreAndSets",
    sortable: false,
    width: smAndDown.value ? "120px" : "280px",
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
  if (!timeStr) return "";
  return timeStr;
};

// Helper function to format rank display
const formatRank = (rank) => {
  if (!rank || rank === null) return null;
  return `#${rank}`;
};

// Get team name color based on match status and winner
const getTeamNameColor = (teamId, match, currentSetScore = null) => {
  if (match.status === "not_started") {
    return "text-primary";
  }

  if (match.status === "in_progress") {
    // If you have current set score data, you could use it here
    if (currentSetScore) {
      const teamScore =
        teamId === match.team1Id
          ? currentSetScore.team1
          : currentSetScore.team2;
      const opponentScore =
        teamId === match.team1Id
          ? currentSetScore.team2
          : currentSetScore.team1;

      if (teamScore > opponentScore) {
        return "text-success";
      }
      return "text-medium-emphasis";
    }

    // Otherwise, fall back to sets won
    if (match.team1SetsWon > match.team2SetsWon && teamId === match.team1Id) {
      return "text-success";
    } else if (
      match.team2SetsWon > match.team1SetsWon &&
      teamId === match.team2Id
    ) {
      return "text-success";
    }
    return "text-medium-emphasis";
  }

  if (match.winnerId === teamId) {
    return "text-success";
  } else if (match.winnerId && match.winnerId !== teamId) {
    return "text-error";
  }

  return "text-success";
};

// Get set score color
const getSetScoreColor = (teamScore, opponentScore) => {
  if (teamScore > opponentScore) {
    return "text-primary";
  }
  return "text-medium-emphasis";
};

// Get rank badge color based on ranking
const getRankBadgeColor = (rank) => {
  if (!rank) return "grey";
  if (rank <= 5) return "warning"; // Top 5 - gold/yellow
  if (rank <= 10) return "primary"; // Top 10 - blue
  if (rank <= 25) return "success"; // Top 25 - green
  return "info"; // Others - light blue
};

// Navigate to box score (if available)
const navigateToBoxScore = (event, item) => {
  if (item.live_stats_url) {
    event.stopPropagation();
    window.open(item.live_stats_url, "_blank");
  }
};

// Get status chip for live matches
const getStatusChip = (match) => {
  if (match.status === "in_progress") {
    return {
      text: "LIVE",
      color: "error",
      showIcon: true,
    };
  }
  return null;
};

// Format matches data for table
const formattedMatchesForTable = computed(() => {
  return props.formattedMatches.map((match) => ({
    ...match,
    // Add rank display fields
    team1RankDisplay: formatRank(match.team1Rank),
    team2RankDisplay: formatRank(match.team2Rank),
    team1IsRanked: match.team1Rank !== null && match.team1Rank !== undefined,
    team2IsRanked: match.team2Rank !== null && match.team2Rank !== undefined,
    hasRankedTeam:
      (match.team1Rank !== null && match.team1Rank !== undefined) ||
      (match.team2Rank !== null && match.team2Rank !== undefined),
  }));
});
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="formattedMatchesForTable"
      :loading="loading"
      :items-per-page="20"
      no-data-text="No matches found"
      loading-text="Loading live matches..."
    >
      <template v-slot:header.datetime>
        <span class="ml-2 pa-0">Date/Time</span>
      </template>

      <!-- Date/Time column -->
      <template v-slot:item.datetime="{ item }">
        <div class="ml-2">
          <div class="text-body-2">
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
          <div v-if="item.time" class="text-caption text-medium-emphasis">
            {{ formatTime(item.time) }}
          </div>
          <!-- Live status chip -->
          <v-chip
            v-if="item.status === 'in_progress'"
            size="x-small"
            color="error"
            class="mt-1"
            variant="flat"
          >
            <v-icon size="10" class="mr-1">mdi-circle</v-icon>
            LIVE
          </v-chip>
        </div>
      </template>

      <!-- Teams column -->
      <template v-slot:item.team_1="{ item }">
        <div class="d-flex align-center my-2">
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
                  getTeamNameColor(item.team1Id, item),
                ]"
                @click="
                  item.team1Id
                    ? navigateToTeam(router, item.team1Id, orgId)
                    : null
                "
              >
                {{ item.team1Name }}
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
                  getTeamNameColor(item.team2Id, item),
                ]"
                @click="
                  item.team2Id
                    ? navigateToTeam(router, item.team2Id, orgId)
                    : null
                "
              >
                {{ item.team2Name }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- Combined Score & Sets column -->
      <template v-slot:item.scoreAndSets="{ item }">
        <div class="d-flex align-center">
          <div class="d-flex flex-column align-center">
            <!-- Team 1 score and sets -->
            <div class="button-like" @click="navigateToBoxScore($event, item)">
              <div class="d-flex align-center">
                <span
                  :class="[
                    'mr-2',
                    smAndDown ? 'text-body-2' : 'text-subtitle-1',
                    getTeamNameColor(item.team1Id, item),
                  ]"
                >
                  ({{ item.team1SetsWon }})
                </span>
                <div class="d-flex">
                  <span class="mr-1">[</span>
                  <template
                    v-for="(set, index) in item.individualSets"
                    :key="`team1-set-${index}`"
                  >
                    <span
                      :class="[
                        'text-caption mx-1',
                        getSetScoreColor(set.team1Score, set.team2Score),
                      ]"
                    >
                      {{ set.team1Score }}
                    </span>
                  </template>
                  <span class="ml-1">]</span>
                </div>
              </div>

              <!-- Team 2 score and sets -->
              <div class="d-flex align-center">
                <span
                  :class="[
                    'mr-2',
                    smAndDown ? 'text-body-2' : 'text-subtitle-1',
                    getTeamNameColor(item.team2Id, item),
                  ]"
                >
                  ({{ item.team2SetsWon }})
                </span>
                <div class="d-flex">
                  <span class="mr-1">[</span>
                  <template
                    v-for="(set, index) in item.individualSets"
                    :key="`team2-set-${index}`"
                  >
                    <span
                      :class="[
                        'text-caption mx-1',
                        getSetScoreColor(set.team2Score, set.team1Score),
                      ]"
                    >
                      {{ set.team2Score }}
                    </span>
                  </template>
                  <span class="ml-1">]</span>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="item.status === 'in_progress' && item.currentSet"
            class="text-caption text-medium-emphasis ml-4"
          >
            Set {{ item.currentSet }}
          </div>
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
