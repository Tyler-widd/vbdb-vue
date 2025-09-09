<!-- src/views/Rankings/RankingsTable.vue -->
<script setup>
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const router = useRouter();
const { smAndDown } = useDisplay();

const props = defineProps({
  standings: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Define table headers
const headers = [
  { title: "Team", key: "team_name", sortable: true },
  { title: "W", key: "wins", sortable: true, align: "start" },
  {
    title: "L",
    key: "losses",
    sortable: true,
    align: "start",
  },
];

// Format win percentage for display
const formatWinPercentage = (percentage) => {
  return (percentage * 100).toFixed(1) + "%";
};
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="standings"
      :loading="loading"
      :items-per-page="25"
      no-data-text="No teams found for selected filters"
      loading-text="Loading standings..."
      class="standings-table"
    >
      <template v-slot:header.team_name>
        <span class="ml-2 pa-0">Team</span>
      </template>

      <!-- Team column with location -->
      <template v-slot:item.team_name="{ item }">
        <div class="text-body-2 ml-2">
          <div class="d-flex align-center">
            <v-avatar :size="smAndDown ? '24' : '32'" class="mr-2">
              <v-img :src="item.img" :alt="item.team_name" />
            </v-avatar>

            <span
              :class="[smAndDown ? 'text-body-2' : 'text-subtitle-1']"
              class="button-like"
              @click="
                item.team_id ? navigateToTeam(router, item.team_id) : null
              "
            >
              {{ item.team_name }}
              <div class="text-caption text-grey">
                {{ item.conference }}
              </div>
            </span>
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
