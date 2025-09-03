<!-- views/Scores/ScoresScoreCard.vue -->
<script setup>
import { computed, ref } from "vue";
import MatchCard from "../../component/MatchCard.vue";

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

const currentPage = ref(1);
const itemsPerPage = 10;

// Format date
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Parse scores data to match the expected format

const formattedScores = computed(() => {
  if (!props.scores.length) return [];

  let filteredScores = props.scores
    .map((game) => {
      // Calculate sets won for each team
      let team1SetsWon = 0;
      let team2SetsWon = 0;
      const individualSets = [];

      for (let i = 1; i <= 5; i++) {
        const team1Score = game[`set_${i}_team_1`];
        const team2Score = game[`set_${i}_team_2`];

        // Check if both scores exist and are not empty strings
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
        team2Name: game.team_2_name,
        team2Img: game.team_2_logo,
        team2Conference: game.team_2_conference,
        team2Id: game.team_2_id,
        team2Division: game.team_2_division,
        team1SetsWon,
        team2SetsWon,
        individualSets,
        winnerId: game.winner_id,
        boxScore: game.box_score,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  return filteredScores;
});

// Pagination - reset to page 1 when search changes
const paginatedData = computed(() => {
  // Reset current page when search results change
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = 1;
  }

  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return formattedScores.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(formattedScores.value.length / itemsPerPage);
});
</script>

<template>
  <!-- Match Cards -->
  <v-card
    v-if="!loading && formattedScores.length > 0"
    class="pa-2 pt-4 mt-4"
    rounded-lg
  >
    <MatchCard
      v-for="item in paginatedData"
      :key="item.id"
      :id="item.id"
      :formatted-date="item.formattedDate"
      :team1-name="item.team1Name"
      :team1-img="item.team1Img"
      :team1-conference="item.team1Conference"
      :team1-id="item.team1Id"
      :team1-division="item.team1Division"
      :team2-name="item.team2Name"
      :team2-img="item.team2Img"
      :team2-conference="item.team2Conference"
      :team2-id="item.team2Id"
      :team2-division="item.team2Division"
      :team1-sets-won="item.team1SetsWon"
      :team2-sets-won="item.team2SetsWon"
      :individual-sets="item.individualSets"
      :winner-id="item.winnerId"
      :box-score="item.boxScore"
      :org-id="orgId"
    />
  </v-card>

  <!-- Pagination Controls -->
  <v-card
    v-if="!loading && formattedScores.length > itemsPerPage"
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

  <!-- Loading state -->
  <v-card v-if="loading" class="pa-4 text-center">
    <v-progress-circular indeterminate color="primary" />
    <p class="mt-2">Loading scores...</p>
  </v-card>

  <!-- No records message -->
  <v-row v-if="!loading && formattedScores.length === 0" class="justify-center">
    <v-col cols="12" class="text-center pa-4">
      <v-icon size="48" color="medium-emphasis">mdi-volleyball</v-icon>
      <p class="text-h6 mt-2 text-medium-emphasis">No scores found</p>
      <p class="text-body-2 text-medium-emphasis">Try adjusting your filters</p>
    </v-col>
  </v-row>
</template>
