<!-- NavScoreCard.vue -->
<script setup>
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

// Define props to receive game data
const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
  boxScore: {
    type: [String, Object], // Allow both String (URL) and Object
    required: false, // Make it optional to handle undefined cases
    default: null, // Provide default value
  },
});

const navigateToBoxScore = () => {
  if (props.boxScore) {
    console.log("Opening URL:", props.boxScore);
    // Handle both string URLs and object with URL property
    const url =
      typeof props.boxScore === "string" ? props.boxScore : props.boxScore.url;
    if (url) {
      window.open(url, "_blank");
    }
  }
};

function countTeam1SetWins(matchData) {
  let team1Wins = 0;

  // Check each set (typically up to 5 sets in volleyball)
  for (let i = 1; i <= 5; i++) {
    const team1Score = matchData[`set_${i}_team_1`];
    const team2Score = matchData[`set_${i}_team_2`];

    // Only count if both scores exist (not null) and team_1 score is greater
    if (team1Score !== null && team2Score !== null && team1Score > team2Score) {
      team1Wins++;
    }
  }

  return team1Wins;
}

function countTeam2SetWins(matchData) {
  let team2Wins = 0;

  // Check each set (typically up to 5 sets in volleyball)
  for (let i = 1; i <= 5; i++) {
    const team1Score = matchData[`set_${i}_team_1`];
    const team2Score = matchData[`set_${i}_team_2`];

    // Only count if both scores exist (not null) and team_2 score is greater
    if (team2Score !== null && team1Score !== null && team2Score > team1Score) {
      team2Wins++;
    }
  }

  return team2Wins;
}
</script>

<template>
  <v-card
    class="mt-3 ma-1"
    style="cursor: pointer"
    @click="navigateToBoxScore"
    max-width="300"
  >
    <v-card-subtitle
      class="text-center py-1 text-caption"
      style="background-color: #018786"
    >
      {{ game.date }}
    </v-card-subtitle>

    <!-- Card content with fixed height -->
    <div class="d-flex align-center justify-space-around">
      <!-- Team 1 -->
      <div class="d-flex align-center justify-center flex-column">
        <div class="d-flex align-center">
          <v-img
            :src="game.team_1_img"
            width="25"
            height="25"
            :alt="game.team_1_name"
            class="ml-1 my-1"
          />
          <span
            class="ml-2"
            :class="
              countTeam1SetWins(game) == 3 ? 'text-success' : 'text-error'
            "
          >
            {{ countTeam1SetWins(game) }}
          </span>
          <!-- Team Name -->
          <span
            v-if="!smAndDown"
            class="text-caption text-left ml-2"
            style="
              line-height: 1.2;
              word-break: break-word;
              hyphens: auto;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            "
          >
            {{ game.team_1_name }}
          </span>
        </div>
      </div>

      <!-- VS separator (optional) -->
      <div class="text-caption text-grey px-1">VS</div>

      <!-- Team 2 -->
      <div class="d-flex align-center justify-center flex-column">
        <div class="d-flex align-center">
          <span
            v-if="!smAndDown"
            class="text-caption text-right mr-2"
            style="
              line-height: 1.2;
              word-break: break-word;
              hyphens: auto;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            "
          >
            {{ game.team_2_name }}
          </span>
          <span
            class="mr-2"
            :class="
              countTeam2SetWins(game) == 3 ? 'text-success' : 'text-error'
            "
          >
            {{ countTeam2SetWins(game) }}
          </span>
          <v-img
            :src="game.team_2_img"
            width="25"
            height="25"
            class="mr-1 my-1"
            :alt="game.team_2_name"
          />
        </div>
      </div>
    </div>
  </v-card>
</template>
