<!-- views/Scores/ScoresTable.vue -->
<script setup>
import { computed } from "vue";
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
    width: smAndDown.value ? "180px" : "240px", // Increased width for rankings
  },
  {
    title: "Sets & Score",
    key: "scoreAndSets",
    sortable: false,
    width: smAndDown.value ? "120px" : "280px",
  },
]);

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

// Format scores data for table
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
  return "text-primary";
};

// Get set score color
const getSetScoreColor = (teamScore, opponentScore) => {
  if (teamScore > opponentScore) {
    return "text-primary font-weight-bold";
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
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="formattedScores"
      :loading="loading"
      :items-per-page="20"
      no-data-text="No scores found"
      loading-text="Loading scores..."
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
        <div class="d-flex align-center my-2">
          <!-- Team 1 -->
          <div class="w-100">
            <div class="d-flex align-center mb-1">
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
                    'font-weight-bold',
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
                    'font-weight-bold',
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
