<!-- views/Scores/ScoresTable.vue -->
<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();
const router = useRouter();

const props = defineProps({
  scores: {
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

// Pagination state
const currentPage = ref(1);
const itemsPerColumn = 10; // Increased from 8 to show more scores

// Navigate to box score
const navigateToBoxScore = (event, item) => {
  if (item.boxScore) {
    event.stopPropagation();
    window.open(item.boxScore, "_blank");
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

// Helper function to format rank display
const formatRank = (rank) => {
  if (!rank || rank === null) return null;
  return `#${rank}`;
};

// Get rank badge color based on ranking
const getRankBadgeColor = (rank) => {
  if (!rank) return "grey";
  if (rank <= 5) return "warning"; // Top 5 - gold/yellow
  if (rank <= 10) return "primary"; // Top 10 - blue
  if (rank <= 25) return "success"; // Top 25 - green
  return "info"; // Others - light blue
};

// Format scores data for display
const formattedScores = computed(() => {
  if (!props.scores.length) return [];

  return props.scores
    .map((game) => {
      // Calculate sets won for each team
      let team1SetsWon = 0;
      let team2SetsWon = 0;
      const individualSets = [];

      for (let i = 1; i <= 5; i++) {
        const team1Score = game[`set_${i}_team_1`];
        const team2Score = game[`set_${i}_team_2`];

        if (
          team1Score !== "" &&
          team2Score !== "" &&
          team1Score !== null &&
          team2Score !== null &&
          team1Score !== undefined &&
          team2Score !== undefined
        ) {
          const team1ScoreNum = parseInt(team1Score);
          const team2ScoreNum = parseInt(team2Score);

          if (team1ScoreNum > team2ScoreNum) team1SetsWon++;
          else if (team2ScoreNum > team1ScoreNum) team2SetsWon++;

          individualSets.push({
            setNumber: i,
            team1Score: team1ScoreNum,
            team2Score: team2ScoreNum,
            team1Won: team1ScoreNum > team2ScoreNum,
          });
        }
      }

      return {
        id: game.match_id,
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
        team1SetsWon,
        team2SetsWon,
        individualSets,
        winnerId: game.winner_id,
        boxScore: game.box_score,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Get team name color based on winner
const getTeamNameColor = (teamId, match) => {
  if (match.winnerId === teamId) {
    return "text-success";
  } else if (match.winnerId && match.winnerId !== teamId) {
    return "text-error";
  }
  return "text-medium-emphasis";
};

// Get set score color
const getSetScoreColor = (teamScore, opponentScore) => {
  if (teamScore > opponentScore) {
    return "text-primary";
  }
  return "text-medium-emphasis";
};

// Calculate paginated matches
const paginatedMatches = computed(() => {
  const itemsPerPage = smAndDown.value ? itemsPerColumn : itemsPerColumn * 2;
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return formattedScores.value.slice(start, end);
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
  return Math.ceil(formattedScores.value.length / itemsPerPage);
});

// Handle page change
const handlePageChange = (page) => {
  currentPage.value = page;
};
</script>

<template>
  <div>
    <!-- Loading state -->
    <v-card v-if="loading" class="mt-4 pa-0">
      <v-card-text class="text-center py-8">
        <v-progress-circular indeterminate></v-progress-circular>
        <div class="mt-4">Loading scores...</div>
      </v-card-text>
    </v-card>

    <!-- No data state -->
    <v-card
      v-else-if="!formattedScores || formattedScores.length === 0"
      class="mt-4 pa-0"
    >
      <v-card-text class="text-center py-8 text-medium-emphasis">
        No scores found
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
            <span class="text-subtitle-1" style="flex: 0.8">Date</span>
            <span class="text-subtitle-1" style="flex: 1.5">Teams</span>
            <span class="text-subtitle-1 text-right" style="flex: 1"
              >Sets & Score</span
            >
          </v-card-title>

          <!-- Matches list -->
          <div v-for="(item, index) in column" :key="index">
            <div class="d-flex align-stretch pa-3">
              <!-- Date column -->
              <div class="d-flex align-center" style="flex: 0.8">
                <div>
                  <div class="text-body-2">
                    {{ item.formattedDate }}
                  </div>
                  <!-- Add special indicator for ranked matchups -->
                  <v-chip
                    v-if="item.team1IsRanked && item.team2IsRanked"
                    size="x-small"
                    color="warning"
                    class="mt-1"
                    variant="tonal"
                  >
                    TOP
                  </v-chip>
                </div>
              </div>
              <!-- Teams column -->
              <div class="d-flex align-center" style="flex: 1.5">
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
              </div>

              <!-- Score & Sets column -->
              <div class="d-flex align-center justify-end" style="flex: 1">
                <div class="text-right">
                  <div
                    :class="smAndDown ? 'text-body-2' : 'text-subtitle-1'"
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
  </div>
</template>

<style scoped>
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
