<!-- src/views/Players/PlayersTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { usePlayersData } from "@/composables/usePlayersData";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();
const { formatConference } = usePlayersData();

const props = defineProps({
  players: {
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
  schoolFilter: {
    type: String,
    default: null,
  },
});

// Define table headers
const headers = computed(() => {
  const baseHeaders = [
    {
      title: "Player",
      key: "player",
      sortable: true,
      width: smAndDown.value ? "140" : "auto",
    },
    {
      title: "School",
      key: "school",
      sortable: true,
      width: smAndDown.value ? "120" : "auto",
    },
    {
      title: smAndDown.value ? "Cls" : "Class",
      key: "class",
      sortable: true,
      width: "10",
      align: "start",
    },
    {
      title: smAndDown.value ? "Pos" : "Position",
      key: "position",
      sortable: true,
      width: "10",
      align: "start",
    },
    {
      title: smAndDown.value ? "Hgt" : "Height",
      key: "height",
      sortable: true,
      width: "10",
      align: "start",
    },
    { title: "Hometown", key: "hometown", sortable: true, width: "140" },
  ];

  // Hide hometown column on small screens to save space
  if (smAndDown.value) {
    return baseHeaders.filter((header) => header.key !== "hometown");
  }

  return baseHeaders;
});

// Filter players based on search and filters
// Note: players are now expected to be pre-formatted from the composable
const filteredPlayers = computed(() => {
  let filtered = props.players;

  // Apply division filter
  if (props.divisionFilter) {
    filtered = filtered.filter(
      (player) => player.division === props.divisionFilter
    );
  }

  // Apply conference filter
  if (props.conferenceFilter) {
    filtered = filtered.filter(
      (player) => player.conference === props.conferenceFilter
    );
  }

  // Apply school filter
  if (props.schoolFilter) {
    filtered = filtered.filter(
      (player) => player.school === props.schoolFilter
    );
  }

  // Apply search filter
  if (props.search) {
    const searchLower = props.search.toLowerCase();
    filtered = filtered.filter((player) => {
      return (
        player.player.toLowerCase().includes(searchLower) ||
        player.school.toLowerCase().includes(searchLower) ||
        player.position.toLowerCase().includes(searchLower) ||
        player.hometown.toLowerCase().includes(searchLower) ||
        (player.jersey_number &&
          player.jersey_number.toString().includes(searchLower)) ||
        player.class.toLowerCase().includes(searchLower)
      );
    });
  }

  return filtered;
});
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="filteredPlayers"
      :loading="loading"
      :items-per-page="10"
      no-data-text="No players found"
      loading-text="Loading players..."
    >
      <template v-slot:header.player>
        <span class="ml-2">Player</span>
      </template>

      <!-- Custom rendering for player names -->
      <!-- Template for small screens -->
      <template v-slot:item.player="{ item }" v-if="smAndDown">
        <div class="d-flex align-center ml-2">
          <div class="d-flex flex-column">
            <span
              class="text-body-2 button-like mt-1"
              :class="[
                'text-body-2',
                item.isWinner !== undefined
                  ? item.isWinner
                    ? 'text-error'
                    : 'text-success'
                  : '',
              ]"
              :style="{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.2',
                display: 'inline-block',
              }"
              :href="item.player_url"
              target="_blank"
            >
              {{ item.player }}
            </span>
            <span class="text-caption text-grey">
              #{{ item.jersey_number }}
            </span>
          </div>
        </div>
      </template>

      <!-- Template for larger screens -->
      <template v-slot:item.player="{ item }" v-else>
        <div class="d-flex align-center py-2 ml-2">
          <v-avatar size="32" class="mr-3">
            <v-img :src="item.img" :alt="item.name_official" cover />
          </v-avatar>
          <div class="d-flex flex-column text-truncate">
            <v-btn
              class="justify-start pa-0"
              variant="text"
              size="default"
              :href="item.player_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item.player }}
            </v-btn>
            <span class="text-caption text-grey">
              #{{ item.jersey_number }}
            </span>
          </div>
        </div>
      </template>

      <!-- Custom column for school -->
      <template v-slot:item.school="{ item }">
        <div class="mx-1">
          <span
            class="button-like"
            :class="smAndDown ? 'text-body-2 mt-1' : 'text-body-1'"
            :style="{
              lineHeight: '1.2',
              display: 'inline-block',
            }"
            @click="navigateToTeam($router, item.org_id, orgId)"
          >
            {{ item.school }}
          </span>
          <div class="text-caption text-grey">
            {{ formatConference(item.conference) }} | {{ item.division }}
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<style>
.button-like {
  cursor: pointer;
  border-radius: 12px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
}

.button-like:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.button-like:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

.button-like:active {
  background-color: rgba(var(--v-theme-primary), 0.12);
}
</style>
