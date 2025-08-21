<!-- views/Live/LiveTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { formatDateMoblie, formatDateYear } from "@/helpers/formatDate";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();

const props = defineProps({
  liveData: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  search: {
    type: String,
    default: "",
  },
  divisionFilter: {
    type: String,
    default: null,
  },
  conferenceFilter: {
    type: String,
    default: null,
  },
  filterLive: {
    type: Function,
    required: true,
  },
});

// Define table headers for live matches
const headers = computed(() => [
  { title: "Team 1", key: "team_1", sortable: false, width: "25%" },
  { title: "Score", key: "score", sortable: false, width: "25%" },
  { title: "Team 2", key: "team_2", sortable: false, width: "25%" },
]);

// Filter the live data based on current filters
const filteredLive = computed(() => {
  return props.filterLive(
    props.liveData,
    props.search,
    props.divisionFilter,
    props.conferenceFilter
  );
});

// Get formatted score display
const getFormattedScore = (match) => {
  const sets = [
    { team1: match.set_1_team_1, team2: match.set_1_team_2 },
    { team1: match.set_2_team_1, team2: match.set_2_team_2 },
    { team1: match.set_3_team_1, team2: match.set_3_team_2 },
    { team1: match.set_4_team_1, team2: match.set_4_team_2 },
    { team1: match.set_5_team_1, team2: match.set_5_team_2 },
  ];

  // Filter out null sets
  const completedSets = sets.filter(
    (set) => set.team1 !== null && set.team2 !== null
  );

  if (completedSets.length === 0) {
    return "(0-0) [0-0]";
  }

  // Calculate set wins
  const team1SetWins = completedSets.filter(
    (set) => set.team1 > set.team2
  ).length;
  const team2SetWins = completedSets.filter(
    (set) => set.team2 > set.team1
  ).length;

  // Format individual set scores with bold for higher scores
  const setScores = completedSets.map((set) => {
    if (set.team1 > set.team2) {
      return `<strong>${set.team1}</strong>-${set.team2}`;
    } else if (set.team2 > set.team1) {
      return `${set.team1}-<strong>${set.team2}</strong>`;
    } else {
      // Tie case (though rare in volleyball)
      return `${set.team1}-${set.team2}`;
    }
  });

  // Check if there's a current set in progress (non-null but potentially incomplete)
  const currentSetIndex = completedSets.length;
  if (currentSetIndex < 5) {
    const currentSet = sets[currentSetIndex];
    if (currentSet.team1 !== null || currentSet.team2 !== null) {
      // Add current set if it has any data
      const score1 = currentSet.team1 !== null ? currentSet.team1 : 0;
      const score2 = currentSet.team2 !== null ? currentSet.team2 : 0;

      // Bold the higher score in current set too
      if (score1 > score2) {
        setScores.push(`<strong>${score1}</strong>-${score2}`);
      } else if (score2 > score1) {
        setScores.push(`${score1}-<strong>${score2}</strong>`);
      } else {
        setScores.push(`${score1}-${score2}`);
      }
    }
  }

  const setTotalDisplay =
    team1SetWins > team2SetWins
      ? `(<strong>${team1SetWins}</strong>-${team2SetWins})`
      : team2SetWins > team1SetWins
      ? `(${team1SetWins}-<strong>${team2SetWins}</strong>)`
      : `(${team1SetWins}-${team2SetWins})`;

  return `${setTotalDisplay} [${setScores.join(", ")}]`;
};
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="filteredLive"
      :loading="loading"
      :items-per-page="10"
      no-data-text="No live games"
      loading-text="Loading live matches..."
    >
      <template v-slot:header.team_1>
        <span class="ml-2 pa-0">Team 1</span>
      </template>
      <!-- Team 1 -->
      <template v-slot:item.team_1="{ item }">
        <div class="ml-2 d-flex align-center">
          <v-avatar
            :size="smAndDown ? '24' : '32'"
            :class="smAndDown ? 'mr-1' : 'mr-3'"
          >
            <v-img :src="item.team_1_img" :alt="item.team_1_name" />
          </v-avatar>
          <div class="d-flex flex-column">
            <span
              class="text-primary button-like"
              @click="navigateToTeam($router, item.team_1_id)"
            >
              {{ item.team_1_name }}
            </span>
            <div class="text-caption text-grey justify-start">
              {{ item.division }}
            </div>
          </div>
        </div>
      </template>

      <!-- Score Column -->
      <template v-slot:item.score="{ item }">
        <div class="d-flex align-center justify-start">
          <div
            class="text-body-1 font-weight-thin"
            v-html="getFormattedScore(item)"
          ></div>
        </div>
      </template>
      <!-- Team 2 -->
      <template v-slot:item.team_2="{ item }">
        <div class="d-flex align-center">
          <v-avatar
            :size="smAndDown ? '24' : '32'"
            :class="smAndDown ? 'mr-1' : 'mr-3'"
          >
            <v-img :src="item.team_2_img" :alt="item.team_2_name" />
          </v-avatar>
          <div class="d-flex flex-column">
            <span
              class="text-primary button-like"
              @click="navigateToTeam($router, item.team_2_id)"
            >
              {{ item.team_2_name }}
            </span>
            <div class="text-caption text-grey justify-start">
              {{ item.division }}
            </div>
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
