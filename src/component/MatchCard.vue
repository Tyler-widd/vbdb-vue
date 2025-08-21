<!-- components/MatchCard.vue -->
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
});

// Determine if this is a completed game with scores
const hasScore = computed(() => {
  return props.team1SetsWon !== null && props.team2SetsWon !== null;
});

// Format conference/division helper
const getFormattedConference = (conference, division) => {
  if (smAndDown.value && division) {
    return division;
  }
  return formatConference(conference);
};
</script>

<template>
  <div class="mb-6">
    <!-- Date chip centered at top -->
    <v-row class="justify-center mb-n3" style="z-index: 2; position: relative">
      <v-chip
        variant="elevated"
        size="small"
        class="bg-surface"
        style="border: 2px solid rgb(var(--v-theme-surface-variant))"
      >
        {{ formattedDate }}
        <span v-if="time" class="ml-1">• {{ time }}</span>
      </v-chip>
    </v-row>

    <!-- Main card -->
    <v-card variant="outlined" rounded="xl" class="pa-1">
      <v-row class="align-center" no-gutters>
        <!-- Left team (team 1) -->
        <v-col
          cols="4"
          class="d-flex align-center"
          :class="smAndDown ? 'pa-1' : 'px-2'"
        >
          <v-avatar
            :size="smAndDown ? 28 : 50"
            :class="smAndDown ? 'mr-2' : 'mr-4'"
          >
            <v-img v-if="team1Img" :src="team1Img" :alt="team1Name" />
            <v-icon v-else :size="smAndDown ? 20 : 24">mdi-school</v-icon>
          </v-avatar>
          <div class="d-flex flex-column flex-grow-1 text-wrap">
            <div class="text-wrap">
              <span
                class="text-primary d-block"
                :class="[
                  smAndDown ? 'text-body-2' : 'text-h6',
                  team1Id ? 'button-like' : '',
                  hasScore && winnerId === team1Id
                    ? 'text-success'
                    : hasScore && winnerId !== team1Id
                    ? 'text-error'
                    : '',
                ]"
                @click="team1Id ? navigateToTeam(router, team1Id, orgId) : null"
              >
                {{ team1Name }}
              </span>
            </div>
            <div
              class="text-caption font-italic text-medium-emphasis text-wrap"
            >
              {{ getFormattedConference(team1Conference, team1Division) }}
            </div>
            <div
              class="text-caption text-medium-emphasis text-wrap"
              v-if="!smAndDown"
            >
              {{ team1Division }}
            </div>
          </div>
        </v-col>

        <!-- Score section or VS -->
        <v-col cols="4" class="d-flex flex-column align-center py-3">
          <!-- Show scores for completed games -->
          <template v-if="hasScore">
            <div class="d-flex align-center mb-1">
              <span
                class="text-center"
                :class="[
                  smAndDown ? 'text-h6' : 'text-h5',
                  winnerId === team1Id
                    ? 'font-weight-bold text-success'
                    : 'font-weight-light',
                ]"
                style="min-width: 24px"
              >
                {{ team1SetsWon }}
              </span>
              <span
                class="text-medium-emphasis"
                :class="smAndDown ? 'text-h6' : 'text-h5 mx-2'"
                >-</span
              >
              <span
                class="text-center"
                :class="[
                  smAndDown ? 'text-h6' : 'text-h5',
                  winnerId === team2Id
                    ? 'font-weight-bold text-success'
                    : 'font-weight-light',
                ]"
                style="min-width: 24px"
              >
                {{ team2SetsWon }}
              </span>
            </div>

            <!-- Individual set scores -->
            <div
              class="d-flex flex-wrap justify-center"
              :style="smAndDown ? `column-gap: 12px` : `column-gap: 12px`"
            >
              <span
                v-for="(set, index) in individualSets"
                :key="set.setNumber || index"
                class="gap-4"
                :class="smAndDown ? 'text-body-2' : 'text-body-1'"
              >
                <span
                  :class="{
                    'text-success': set.team1Won || set.myWon,
                    'font-weight-thin': !(set.team1Won || set.myWon),
                  }"
                >
                  {{ set.team1Score || set.myScore }}
                </span>
                -
                <span
                  :class="{
                    'text-success': !(set.team1Won || set.myWon),
                    'font-weight-thin': set.team1Won || set.myWon,
                  }"
                >
                  {{ set.team2Score || set.opponentScore }}
                </span>
                <span v-if="index < individualSets.length - 1">,</span>
              </span>
            </div>
          </template>

          <!-- Show VS for future games -->
          <template v-else-if="showVsForNoScore">
            <span
              class="text-medium-emphasis font-weight-medium"
              :class="smAndDown ? 'text-h6' : 'text-h5'"
            >
              VS
            </span>
          </template>
        </v-col>

        <!-- Right team (team 2) -->
        <v-col
          cols="4"
          class="d-flex align-center"
          :class="smAndDown ? 'pa-1' : 'px-2'"
        >
          <div class="d-flex flex-column flex-grow-1 text-wrap text-right">
            <div class="text-wrap">
              <span
                class="text-primary"
                :class="[
                  smAndDown ? 'text-body-2' : 'text-h6 mb-2',
                  team2Id ? 'button-like' : '',
                  hasScore && winnerId === team2Id
                    ? 'text-success'
                    : hasScore && winnerId !== team2Id
                    ? 'text-error'
                    : '',
                ]"
                :style="{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.2',
                  display: 'inline-block',
                }"
                @click="team2Id ? navigateToTeam(router, team2Id, orgId) : null"
              >
                {{ team2Name }}
              </span>
            </div>
            <div
              class="text-caption font-italic text-medium-emphasis text-wrap"
              :style="{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.2',
              }"
            >
              {{ getFormattedConference(team2Conference, team2Division) }}
            </div>
          </div>
          <v-avatar
            :size="smAndDown ? 28 : 50"
            :class="smAndDown ? 'ml-2' : 'ml-4'"
          >
            <v-img v-if="team2Img" :src="team2Img" :alt="team2Name" />
            <v-icon v-else :size="smAndDown ? 20 : 24">mdi-school</v-icon>
          </v-avatar>
        </v-col>
      </v-row>

      <!-- Box score button -->
      <v-row
        v-if="boxScore"
        class="text-center justify-center"
        dense
        no-gutters
      >
        <v-btn
          variant="tonal"
          :href="boxScore"
          target="_blank"
          prepend-icon="mdi-open-in-new"
          :class="smAndDown ? 'w-75' : 'w-25'"
          class="mb-1"
        >
          Box Score
        </v-btn>
      </v-row>
    </v-card>
  </div>
</template>
