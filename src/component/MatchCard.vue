<!-- components/MatchCard.vue (Updated) -->
<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { navigateToTeam } from "../helpers/navigateToTeam.js";
import { formatConference } from "../helpers/formatConference.js";

const { smAndDown } = useDisplay();
const router = useRouter();

const props = defineProps({
  // Card data
  id: {
    type: [String, Number],
    required: true,
  },
  formattedDate: {
    type: String,
    required: true,
  },

  // Team 1 data
  team1Name: {
    type: String,
    required: true,
  },
  team1Img: {
    type: String,
    default: null,
  },
  team1Conference: {
    type: String,
    default: "",
  },
  team1Division: {
    type: String,
    default: "",
  },
  team1Id: {
    type: String,
    default: null,
  },

  // Team 2 data
  team2Name: {
    type: String,
    required: true,
  },
  team2Img: {
    type: String,
    default: null,
  },
  team2Conference: {
    type: String,
    default: "",
  },
  team2Division: {
    type: String,
    default: "",
  },
  team2Id: {
    type: String,
    default: null,
  },

  // Score data (optional - for completed games)
  team1SetsWon: {
    type: Number,
    default: null,
  },
  team2SetsWon: {
    type: Number,
    default: null,
  },
  individualSets: {
    type: Array,
    default: () => [],
  },

  // Winner information (optional)
  winnerId: {
    type: String,
    default: null,
  },

  // Additional data
  boxScore: {
    type: String,
    default: null,
  },
  time: {
    type: String,
    default: null,
  },

  // Configuration
  orgId: {
    type: String,
    default: null,
  },
  showVsForNoScore: {
    type: Boolean,
    default: false, // Set to true for schedule view
  },
  matchStatus: {
    type: String,
    default: null, // 'in_progress', 'not_started', 'completed'
  },
});

// Determine if this is a completed game with scores
const hasScore = computed(() => {
  return props.team1SetsWon !== null && props.team2SetsWon !== null;
});

// Determine if we have individual set scores to display
const hasIndividualSets = computed(() => {
  return props.individualSets && props.individualSets.length > 0;
});

// Format conference/division helper
const getFormattedConference = (conference, division) => {
  if (smAndDown.value && division) {
    return division;
  }
  return formatConference(conference);
};

// Determine team name color based on match status
const getTeamNameColor = (teamId) => {
  // If match is not over (in_progress or not_started), use primary color
  if (
    props.matchStatus === "in_progress" ||
    props.matchStatus === "not_started"
  ) {
    return "text-success";
  }

  // For completed matches, show winner in success and loser in error
  if (hasScore.value && props.winnerId) {
    if (props.winnerId === teamId) {
      return "text-success";
    } else {
      return "text-error";
    }
  }

  // Default fallback
  return "text-primary";
};

// Get set score color based on winner
const getSetScoreColor = (teamScore, opponentScore, teamId) => {
  if (teamScore === null || opponentScore === null) return "";

  if (teamScore > opponentScore) {
    return props.winnerId === teamId
      ? "text-primary font-weight-bold"
      : "text-primary font-weight-bold";
  } else {
    return "text-medium-emphasis";
  }
};

// Get the maximum number of sets to display (up to 5)
const maxSetsToShow = computed(() => {
  if (!hasIndividualSets.value) return 0;
  return Math.min(props.individualSets.length, 5);
});
</script>

<template>
  <div class="mb-6">
    <!-- Main card -->
    <v-card variant="outlined" rounded="lg" class="pa-1">
      <!-- Team 1 Row -->
      <div class="d-flex align-center">
        <!-- Team 1 Avatar and Info -->
        <div
          class="d-flex align-center"
          :class="smAndDown ? 'flex-grow-0' : 'flex-grow-1'"
        >
          <v-avatar
            :size="smAndDown ? 32 : 42"
            :class="smAndDown ? 'mr-2' : 'mr-3'"
          >
            <v-img v-if="team1Img" :src="team1Img" :alt="team1Name" />
            <v-icon v-else :size="smAndDown ? 16 : 20">mdi-school</v-icon>
          </v-avatar>

          <div
            class="d-flex flex-column"
            :style="smAndDown ? 'min-width: 120px;' : 'min-width: 180px;'"
          >
            <span
              :class="[
                smAndDown ? 'text-body-2' : 'text-subtitle-1',
                team1Id ? 'button-like' : '',
                getTeamNameColor(team1Id),
              ]"
              @click="team1Id ? navigateToTeam(router, team1Id, orgId) : null"
            >
              {{ team1Name }}
            </span>
            <div
              class="text-caption font-italic text-medium-emphasis text-wrap"
            >
              {{ getFormattedConference(team1Conference, team1Division) }}
            </div>
          </div>
        </div>

        <!-- Set Scores for Team 1 -->
        <div v-if="hasIndividualSets" class="d-flex align-center">
          <div
            v-for="(set, index) in individualSets"
            :key="`team1-set-${index}`"
            class="text-center mx-1"
            :style="smAndDown ? 'min-width: 28px;' : 'min-width: 35px;'"
          >
            <div
              :class="[
                smAndDown ? 'text-body-2' : 'text-subtitle-1',
                getSetScoreColor(set.team1Score, set.team2Score, team1Id),
              ]"
            >
              {{ set.team1Score }}
            </div>
          </div>

          <!-- Sets Won Display -->
          <div
            class="ml-3 text-center"
            :style="smAndDown ? 'min-width: 24px;' : 'min-width: 32px;'"
          >
            <div
              :class="[
                smAndDown ? 'text-body-1' : 'text-h6',
                'font-weight-bold',
                getTeamNameColor(team1Id),
              ]"
            >
              {{ team1SetsWon || 0 }}
            </div>
          </div>
        </div>

        <!-- VS or Time display when no scores -->
        <div
          v-else-if="showVsForNoScore || matchStatus === 'not_started'"
          class="ml-auto mr-4"
        >
          <div class="text-center">
            <div v-if="time" class="text-caption text-medium-emphasis">
              {{ time }}
            </div>
            <div class="text-body-1 text-medium-emphasis font-weight-bold">
              VS
            </div>
          </div>
        </div>
      </div>

      <v-divider class="my-1" />

      <!-- Team 2 Row -->
      <div class="d-flex align-center">
        <!-- Team 2 Avatar and Info -->
        <div
          class="d-flex align-center"
          :class="smAndDown ? 'flex-grow-0' : 'flex-grow-1'"
        >
          <v-avatar
            :size="smAndDown ? 32 : 42"
            :class="smAndDown ? 'mr-2' : 'mr-3'"
          >
            <v-img v-if="team2Img" :src="team2Img" :alt="team2Name" />
            <v-icon v-else :size="smAndDown ? 16 : 20">mdi-school</v-icon>
          </v-avatar>

          <div
            class="d-flex flex-column"
            :style="smAndDown ? 'min-width: 120px;' : 'min-width: 180px;'"
          >
            <span
              :class="[
                smAndDown ? 'text-body-2' : 'text-subtitle-1',
                team2Id ? 'button-like' : '',
                getTeamNameColor(team2Id),
              ]"
              @click="team2Id ? navigateToTeam(router, team2Id, orgId) : null"
            >
              {{ team2Name }}
            </span>
            <div
              class="text-caption font-italic text-medium-emphasis text-wrap"
            >
              {{ getFormattedConference(team2Conference, team2Division) }}
            </div>
          </div>
        </div>

        <!-- Set Scores for Team 2 -->
        <div v-if="hasIndividualSets" class="d-flex align-center">
          <div
            v-for="(set, index) in individualSets"
            :key="`team2-set-${index}`"
            class="text-center mx-1"
            :style="smAndDown ? 'min-width: 28px;' : 'min-width: 35px;'"
          >
            <div
              :class="[
                smAndDown ? 'text-body-2' : 'text-subtitle-1',
                getSetScoreColor(set.team2Score, set.team1Score, team2Id),
              ]"
            >
              {{ set.team2Score }}
            </div>
          </div>

          <!-- Sets Won Display -->
          <div
            class="ml-3 text-center"
            :style="smAndDown ? 'min-width: 24px;' : 'min-width: 32px;'"
          >
            <div
              :class="[
                smAndDown ? 'text-body-1' : 'text-h6',
                'font-weight-bold',
                getTeamNameColor(team2Id),
              ]"
            >
              {{ team2SetsWon || 0 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Box Score Link with Time (if available) -->
      <div v-if="boxScore || time" class="d-flex justify-center align-center">
        <v-btn
          v-if="boxScore"
          :href="boxScore"
          target="_blank"
          variant="text"
          size="small"
          color="primary"
          prepend-icon="mdi-chart-box-outline"
        >
          {{ matchStatus === "completed" ? "Box Score" : "Live Stats" }}
        </v-btn>
        <span
          v-if="time && boxScore"
          class="mx-2 text-caption text-medium-emphasis"
          >•</span
        >
        <span v-if="time" class="text-caption text-medium-emphasis">{{
          time
        }}</span>
      </div>
    </v-card>
  </div>
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
