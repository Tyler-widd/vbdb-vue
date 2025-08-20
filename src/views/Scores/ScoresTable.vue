<!-- src/views/Scores/ScoresTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();

const props = defineProps({
  scores: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Define table headers - simplified to match live table structure
const headers = computed(() => [
  { title: "Date", key: "formattedDate", sortable: true, width: "15%" },
  { title: "Team 1", key: "team_1", sortable: false, width: "25%" },
  { title: "Score", key: "score", sortable: false, width: "20%" },
  { title: "Team 2", key: "team_2", sortable: false, width: "25%" },
  { title: "Location", key: "location", sortable: true, width: "15%" },
]);
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="scores"
      :loading="loading"
      :items-per-page="10"
      no-data-text="No scores found"
      loading-text="Loading scores..."
    >
      <!-- Team 1 -->
      <template v-slot:item.team_1="{ item }">
        <div class="ml-2 d-flex align-center">
          <v-avatar
            :size="smAndDown ? '24' : '32'"
            :class="smAndDown ? 'mr-1' : 'mr-3'"
          >
            <v-img :src="item.team_1_img" :alt="item.team_1" />
          </v-avatar>
          <div class="d-flex flex-column">
            <span
              class="text-primary button-like"
              :class="{ 'font-weight-bold': item.isWinner1 }"
              @click="navigateToTeam($router, item.team_1_id)"
            >
              {{ item.team_1 }}
            </span>
            <div
              class="text-caption text-grey justify-start"
              v-if="item.division"
            >
              {{ item.division }}
            </div>
          </div>
        </div>
      </template>

      <!-- Score Column -->
      <template v-slot:item.score="{ item }">
        <div class="d-flex align-center justify-center">
          <div class="text-center">
            <div class="text-body-1 font-family-monospace">
              {{ item.score }}
            </div>
            <v-chip
              :color="item.winner === item.team_1 ? 'success' : 'primary'"
              size="x-small"
              class="mt-1"
            >
              {{ item.winner }}
            </v-chip>
          </div>
        </div>
      </template>

      <!-- Team 2 -->
      <template v-slot:item.team_2="{ item }">
        <div class="d-flex align-center">
          <v-avatar
            :size="smAndDown ? '24' : '32'"
            :class="smAndDown ? 'mr-1' : 'mr-3'"
          >
            <v-img :src="item.team_2_img" :alt="item.team_2" />
          </v-avatar>
          <div class="d-flex flex-column">
            <span
              class="text-primary button-like"
              :class="{ 'font-weight-bold': item.isWinner2 }"
              @click="navigateToTeam($router, item.team_2_id)"
            >
              {{ item.team_2 }}
            </span>
            <div
              class="text-caption text-grey justify-start"
              v-if="item.division"
            >
              {{ item.division }}
            </div>
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
