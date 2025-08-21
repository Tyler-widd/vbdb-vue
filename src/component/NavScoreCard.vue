<!-- NavScoreCard.vue -->
<script setup>
import { useDisplay } from "vuetify";
import { computed } from "vue";

const { smAndDown } = useDisplay();

// Define props to receive game data
const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
  boxScore: {
    type: [String, Object],
    required: false,
    default: null,
  },
});

// Get current set scores
const currentScores = computed(() => {
  // Find the current set being played
  for (let i = 1; i <= 5; i++) {
    const team1Score = props.game[`set_${i}_team_1`];
    const team2Score = props.game[`set_${i}_team_2`];

    // If we find a set with scores but not complete, or if it's the current set
    if (team1Score !== null && team2Score !== null) {
      // Check if this set is complete
      const isComplete =
        (team1Score >= 25 && team1Score - team2Score >= 2) ||
        (team2Score >= 25 && team2Score - team1Score >= 2);

      // If not complete, this is the current set
      if (!isComplete) {
        return {
          team1: team1Score,
          team2: team2Score,
          setNumber: i,
        };
      }
    } else if (team1Score === null && team2Score === null && i > 1) {
      // If this set hasn't started but previous sets exist, show the last completed set
      const prevTeam1Score = props.game[`set_${i - 1}_team_1`];
      const prevTeam2Score = props.game[`set_${i - 1}_team_2`];
      if (prevTeam1Score !== null && prevTeam2Score !== null) {
        return {
          team1: prevTeam1Score,
          team2: prevTeam2Score,
          setNumber: i - 1,
          isCompleted: true,
        };
      }
    }
  }

  // If no current set found, check if match is complete
  for (let i = 5; i >= 1; i--) {
    const team1Score = props.game[`set_${i}_team_1`];
    const team2Score = props.game[`set_${i}_team_2`];
    if (team1Score !== null && team2Score !== null) {
      return {
        team1: team1Score,
        team2: team2Score,
        setNumber: i,
        isCompleted: true,
      };
    }
  }

  // Default if no scores
  return {
    team1: 0,
    team2: 0,
    setNumber: 1,
  };
});

// Count set wins for determining match winner
const setWins = computed(() => {
  let team1Wins = 0;
  let team2Wins = 0;

  for (let i = 1; i <= 5; i++) {
    const team1Score = props.game[`set_${i}_team_1`];
    const team2Score = props.game[`set_${i}_team_2`];

    if (team1Score !== null && team2Score !== null) {
      const isComplete =
        (team1Score >= 25 && team1Score - team2Score >= 2) ||
        (team2Score >= 25 && team2Score - team1Score >= 2);

      if (isComplete) {
        if (team1Score > team2Score) {
          team1Wins++;
        } else {
          team2Wins++;
        }
      }
    }
  }

  return { team1: team1Wins, team2: team2Wins };
});

// Check if match is complete
const isMatchComplete = computed(() => {
  return setWins.value.team1 >= 3 || setWins.value.team2 >= 3;
});

// Determine winning team for styling
const winningTeam = computed(() => {
  if (!isMatchComplete.value) return null;
  return setWins.value.team1 > setWins.value.team2 ? 1 : 2;
});

// Emit events for navigation
const emit = defineEmits(["card-click"]);

const navigateToBoxScore = (event) => {
  if (props.boxScore) {
    event.stopPropagation(); // Prevent card click event
    const url =
      typeof props.boxScore === "string" ? props.boxScore : props.boxScore.url;
    if (url) {
      window.open(url, "_blank");
    }
  }
};
</script>

<template>
  <v-card
    class="mt-3 ma-1"
    :width="smAndDown ? '250' : '300'"
    height="100"
    density="compact"
    @click="navigateToBoxScore"
  >
    <!-- Date header -->
    <v-card-subtitle class="text-center py-1 text-caption bg-teal-darken-4">
      {{ game.date }}
      <span v-if="!isMatchComplete" class="ml-2">
        • Set {{ currentScores.setNumber }}
      </span>
    </v-card-subtitle>

    <!-- Card content -->
    <div class="d-flex align-center justify-space-between pa-2">
      <!-- Team 1 -->
      <div class="d-flex align-center" :class="{ winner: winningTeam === 1 }">
        <v-img
          :src="game.team_1_img"
          width="25"
          height="25"
          :alt="game.team_1_name"
          class="team-logo"
        />
        <span class="ml-2 text-caption">
          {{ game.team_1_name }}
        </span>
      </div>

      <!-- Score in the middle (clickable) -->
      <div class="mx-3">
        <div>
          <span
            class="score"
            :class="{
              'text-success':
                !isMatchComplete && currentScores.team1 > currentScores.team2,
              'winner-score': winningTeam === 1,
            }"
          >
            {{ currentScores.team1 }}
          </span>
          <span class="mx-1">-</span>
          <span
            class="score"
            :class="{
              'text-success':
                !isMatchComplete && currentScores.team2 > currentScores.team1,
              'winner-score': winningTeam === 2,
            }"
          >
            {{ currentScores.team2 }}
          </span>
        </div>
        <v-divider></v-divider>
        <!-- Set wins indicator -->
        <div
          v-if="!currentScores.isCompleted && !isMatchComplete"
          class="text-caption text-center mt-1"
        >
          <span class="text-grey">{{ setWins.team1 }}-{{ setWins.team2 }}</span>
        </div>
      </div>

      <!-- Team 2 -->
      <div
        class="team-section d-flex align-center justify-end"
        :class="{ winner: winningTeam === 2 }"
      >
        <span class="team-name mr-2 text-caption text-right">
          {{ game.team_2_name }}
        </span>
        <v-img
          :src="game.team_2_img"
          width="25"
          height="25"
          :alt="game.team_2_name"
          class="team-logo"
        />
      </div>
    </div>
  </v-card>
</template>
