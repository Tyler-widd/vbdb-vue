<!-- views/Live/LiveTable.vue -->
<script setup>
import { computed, ref } from "vue";
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
  showUpcoming: {
    type: Boolean,
    default: false,
  },
});

// Pagination state
const currentPage = ref(1);
const itemsPerColumn = 8;

// Helper function to format rank display
const formatRank = (rank) => {
  if (!rank || rank === null) return null;
  return `#${rank}`;
};

// Get team name color based on match status and winner
const getTeamNameColor = (teamId, match, currentSetScore = null) => {
  if (match.status === "not_started") {
    return "font-weight-light";
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

// Calculate paginated matches
const paginatedMatches = computed(() => {
  const itemsPerPage = smAndDown.value ? itemsPerColumn : itemsPerColumn * 2;
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return formattedMatchesForTable.value.slice(start, end);
});

// Split matches into two columns for desktop view
const matchColumns = computed(() => {
  if (smAndDown.value) {
    return [paginatedMatches.value];
  }

  const midPoint = Math.ceil(paginatedMatches.value.length / 2);
  return [
    paginatedMatches.value.slice(0, midPoint),
    paginatedMatches.value.slice(midPoint),
  ];
});

// Calculate total pages
const totalPages = computed(() => {
  const itemsPerPage = smAndDown.value ? itemsPerColumn : itemsPerColumn * 2;
  return Math.ceil(formattedMatchesForTable.value.length / itemsPerPage);
});

// Handle page change
const handlePageChange = (page) => {
  currentPage.value = page;
};
</script>

<template>
  <div>
    <!-- No data state -->
    <v-card
      v-if="!formattedMatchesForTable || formattedMatchesForTable.length === 0"
      class="mt-4 pa-0"
    >
      <v-card-text class="text-center py-8 text-medium-emphasis">
        No matches found
      </v-card-text>
    </v-card>

    <!-- Matches columns -->
    <v-row v-else dense class="mt-4" no-gutters>
      <v-col
        v-for="(column, colIndex) in matchColumns"
        :key="colIndex"
        :cols="smAndDown ? 12 : 6"
        :class="[
          !smAndDown && colIndex === 0 ? 'pr-1' : '',
          !smAndDown && colIndex === 1 ? 'pl-1' : '',
        ]"
      >
        <v-card>
          <!-- Header -->
          <v-card-title class="d-flex align-center pa-3 bg-grey-darken-3">
            <span class="text-subtitle-1" style="flex: 1">Teams</span>
            <span class="text-subtitle-1 text-right" style="flex: 1"
              >Sets & Score</span
            >
          </v-card-title>

          <!-- Matches list -->
          <div v-for="(item, index) in column" :key="index">
            <div class="d-flex align-stretch pa-3">
              <!-- Teams column with set indicator (left aligned, takes up available space) -->
              <div class="d-flex align-center" style="flex: 1">
                <div style="flex: 1">
                  <!-- Team 1 -->
                  <div class="d-flex align-center mb-2">
                    <v-avatar
                      :size="smAndDown ? 24 : 32"
                      class="mr-2 flex-shrink-0"
                    >
                      <v-img
                        v-if="item.team1Img"
                        :src="item.team1Img"
                        :alt="item.team1Name"
                      />
                      <v-icon v-else :size="smAndDown ? 16 : 20"
                        >mdi-school</v-icon
                      >
                    </v-avatar>

                    <!-- Rank badge for team 1 -->
                    <v-chip
                      v-if="item.team1IsRanked"
                      :color="getRankBadgeColor(item.team1Rank)"
                      size="small"
                      class="mr-2 flex-shrink-0"
                      variant="tonal"
                    >
                      {{ item.team1RankDisplay }}
                    </v-chip>

                    <span
                      :class="[
                        smAndDown ? 'text-body-2' : 'text-subtitle-1',
                        item.team1Id ? 'button-like' : '',
                        getTeamNameColor(item.team1Id, item),
                        'text-truncate',
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
                    <v-avatar
                      :size="smAndDown ? 24 : 32"
                      class="mr-2 flex-shrink-0"
                    >
                      <v-img
                        v-if="item.team2Img"
                        :src="item.team2Img"
                        :alt="item.team2Name"
                      />
                      <v-icon v-else :size="smAndDown ? 16 : 20"
                        >mdi-school</v-icon
                      >
                    </v-avatar>

                    <!-- Rank badge for team 2 -->
                    <v-chip
                      v-if="item.team2IsRanked"
                      :color="getRankBadgeColor(item.team2Rank)"
                      size="small"
                      class="mr-2 flex-shrink-0"
                      variant="tonal"
                    >
                      {{ item.team2RankDisplay }}
                    </v-chip>

                    <span
                      :class="[
                        smAndDown ? 'text-body-2' : 'text-subtitle-1',
                        item.team2Id ? 'button-like' : '',
                        getTeamNameColor(item.team2Id, item),
                        'text-truncate',
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

                <!-- Current set indicator (right side of teams) -->
                <div
                  v-if="item.status === 'in_progress' && item.currentSet"
                  class="flex-shrink-0 ml-3"
                >
                  <v-chip color="primary" size="small" variant="tonal">
                    Set {{ item.currentSet }}
                  </v-chip>
                </div>
              </div>

              <!-- Score & Sets column (right aligned, fixed width) -->
              <div class="d-flex align-center justify-end" style="flex: 1">
                <!-- Show scores for completed/in-progress matches -->
                <div v-if="item.status !== 'not_started'" class="text-right">
                  <div
                    class="button-like"
                    @click="navigateToBoxScore($event, item)"
                  >
                    <!-- Team 1 scores -->
                    <div class="d-flex align-center justify-end mb-1">
                      <div class="d-flex align-center">
                        <span class="mr-1">[</span>
                        <template
                          v-for="(set, setIndex) in item.individualSets"
                          :key="`team1-set-${setIndex}`"
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
                        <span class="ml-1 mr-2">]</span>
                        <span
                          :class="[
                            smAndDown ? 'text-body-2' : 'text-subtitle-1',
                            getTeamNameColor(item.team1Id, item),
                            'font-weight-medium',
                          ]"
                        >
                          ({{ item.team1SetsWon }})
                        </span>
                      </div>
                    </div>

                    <!-- Team 2 scores -->
                    <div class="d-flex align-center justify-end">
                      <div class="d-flex align-center">
                        <span class="mr-1">[</span>
                        <template
                          v-for="(set, setIndex) in item.individualSets"
                          :key="`team2-set-${setIndex}`"
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
                        <span class="ml-1 mr-2">]</span>
                        <span
                          :class="[
                            smAndDown ? 'text-body-2' : 'text-subtitle-1',
                            getTeamNameColor(item.team2Id, item),
                            'font-weight-medium',
                          ]"
                        >
                          ({{ item.team2SetsWon }})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Show time for upcoming matches -->
                <v-row
                  v-else-if="item.time"
                  justify="end"
                  no-gutters
                  class="align-center"
                >
                  <v-col cols="auto">
                    <!-- Same division scenario -->
                    <template v-if="item.team1Division === item.team2Division">
                      <v-chip variant="outlined" color="white" size="small">
                        {{ item.team1Division }}
                      </v-chip>
                    </template>

                    <!-- Different divisions scenario -->
                    <template v-else>
                      <v-chip variant="outlined" color="white" size="small">
                        {{ item.team1Division }}
                      </v-chip>
                      <v-chip variant="text" size="small"> vs </v-chip>
                      <v-chip variant="outlined" color="white" size="small">
                        {{ item.team2Division }}
                      </v-chip>
                    </template>
                  </v-col>

                  <v-col cols="auto" class="ml-3">
                    <v-chip
                      color="success"
                      variant="elevated"
                      prepend-icon="mdi-clock-outline"
                    >
                      {{ item.time }}
                    </v-chip>
                  </v-col>
                </v-row>

                <!-- Show placeholder for upcoming matches without live stats -->
                <div
                  v-else
                  class="text-caption text-medium-emphasis align-center d-flex"
                >
                  <v-col cols="auto">
                    <!-- Same division scenario -->
                    <template v-if="item.team1Division === item.team2Division">
                      <v-chip variant="outlined" color="white" size="small">
                        {{ item.team1Division }}
                      </v-chip>
                    </template>

                    <!-- Different divisions scenario -->
                    <template v-else>
                      <v-chip variant="outlined" color="white" size="small">
                        {{ item.team1Division }}
                      </v-chip>
                      <v-chip variant="text" size="small"> vs </v-chip>
                      <v-chip variant="outlined" color="white" size="small">
                        {{ item.team2Division }}
                      </v-chip>
                    </template>
                  </v-col>
                  Upcoming
                </div>
              </div>
            </div>

            <!-- Add divider between matches (not after the last one) -->
            <v-divider v-if="index < column.length - 1"></v-divider>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pagination (centered) -->
    <v-card v-if="totalPages > 1" class="mt-2">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="4"
        rounded="circle"
        @update:model-value="handlePageChange"
      ></v-pagination>
    </v-card>

    <!-- NCAA Times span - only show when showUpcoming is true -->
    <span v-if="showUpcoming" class="text-subtitle-2 font-weight-light">
      NCAA Times taken from
      https://stats.ncaa.org/contests/livestream_scoreboards?sport_code=WVB
    </span>
  </div>
</template>

<style scoped>
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
