<!-- LiveTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
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

// Filter the live data based on current filters
const filteredLive = computed(() => {
  return props.filterLive(
    props.liveData,
    props.search,
    props.divisionFilter,
    props.conferenceFilter
  );
});

// Define table headers for live matches
const headers = computed(() => [
  { title: "Team 1", key: "team_1", sortable: false, width: "25%" },
  { title: "Score", key: "score", sortable: false, width: "25%" },
  { title: "Team 2", key: "team_2", sortable: false, width: "25%" },
]);

// Get formatted score display
const getFormattedScore = (match) => {
  const sets = [
    { team1: match.set_1_team_1, team2: match.set_1_team_2 },
    { team1: match.set_2_team_1, team2: match.set_2_team_2 },
    { team1: match.set_3_team_1, team2: match.set_3_team_2 },
    { team1: match.set_4_team_1, team2: match.set_4_team_2 },
    { team1: match.set_5_team_1, team2: match.set_5_team_2 },
  ];

  // Helper function to check if a set is complete
  const isSetComplete = (set) => {
    if (set.team1 === null || set.team2 === null) return false;

    const score1 = set.team1;
    const score2 = set.team2;

    // Win by 2, minimum 25 points (or 15 for 5th set)
    const minPoints = sets.indexOf(set) === 4 ? 15 : 25;
    return (
      (score1 >= minPoints && score1 - score2 >= 2) ||
      (score2 >= minPoints && score2 - score1 >= 2)
    );
  };

  // Helper function to check if a set has any data
  const hasSetData = (set) => {
    return set.team1 !== null && set.team2 !== null;
  };

  // Get completed sets and sets with data
  const completedSets = sets.filter(isSetComplete);
  const setsWithData = sets.filter(hasSetData);

  // If no sets have any data, return default
  if (setsWithData.length === 0) {
    return "(0-0) [0-0]";
  }

  // Calculate set wins (only from completed sets)
  const team1SetWins = completedSets.filter(
    (set) => set.team1 > set.team2
  ).length;
  const team2SetWins = completedSets.filter(
    (set) => set.team2 > set.team1
  ).length;

  // Format scores for display
  const setScores = setsWithData.map((set, index) => {
    const isComplete = isSetComplete(set);

    if (isComplete) {
      // Bold the winner of completed sets
      if (set.team1 > set.team2) {
        return `<strong>${set.team1}</strong>-${set.team2}`;
      } else if (set.team2 > set.team1) {
        return `${set.team1}-<strong>${set.team2}</strong>`;
      } else {
        return `${set.team1}-${set.team2}`;
      }
    } else {
      // Don't bold anything for incomplete sets
      return `${set.team1}-${set.team2}`;
    }
  });

  // Bold the leader in set wins only
  const setTotalDisplay =
    team1SetWins > team2SetWins
      ? `(<strong>${team1SetWins}</strong>-${team2SetWins})`
      : team2SetWins > team1SetWins
      ? `(${team1SetWins}-<strong>${team2SetWins}</strong>)`
      : `(${team1SetWins}-${team2SetWins})`;

  return `${setTotalDisplay} [${setScores.join(", ")}]`;
};

// Open the boxscore
const openBoxScore = (item) => {
  if (item.live_stats_url) {
    window.open(item.live_stats_url, "_blank");
  }
};
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="filteredLive"
      :loading="loading"
      :items-per-page="10"
      no-data-text="No live games matching filters"
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
            class="text-body-1 font-weight-thin button-like"
            v-html="getFormattedScore(item)"
            @click="openBoxScore(item)"
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

<style scoped>
.button-like {
  cursor: pointer;
}

.button-like:hover {
  text-decoration: underline;
}
</style>
