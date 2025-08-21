<!-- src/views/Players/PlayersTable.vue -->
<script setup>
import { computed, watch } from "vue";
import { useDisplay } from "vuetify";
import { usePlayersData } from "../../composables/usePlayersData.js";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();
const { formatConference } = usePlayersData();

const emit = defineEmits(["update:page"]);

const props = defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  totalPlayers: {
    type: Number,
    default: 0,
  },
});

// Define table headers
const headers = computed(() => {
  const baseHeaders = [
    {
      title: "Player",
      key: "player",
      sortable: false, // Sorting should be done server-side
      width: smAndDown.value ? "140" : "auto",
    },
    {
      title: "School",
      key: "school",
      sortable: false,
      width: smAndDown.value ? "120" : "auto",
    },
    {
      key: "class",
      sortable: false,
      width: "10",
      align: smAndDown.value ? "center" : "start",
    },
    {
      key: "position",
      sortable: false,
      width: "10",
      align: smAndDown.value ? "center" : "start",
    },
    {
      key: "height",
      sortable: false,
      width: "10",
      align: smAndDown.value ? "center" : "start",
    },
    { title: "Hometown", key: "hometown", sortable: false, width: "140" },
  ];

  // Hide hometown column on small screens to save space
  if (smAndDown.value) {
    return baseHeaders.filter((header) => header.key !== "hometown");
  }

  return baseHeaders;
});

// Create a local page model that syncs with the prop
const localPage = computed({
  get: () => props.currentPage,
  set: (value) => emit("update:page", value),
});
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="props.players"
      :loading="props.loading"
      :items-per-page="-1"
      hide-default-footer
      no-data-text="No players found"
      loading-text="Loading players..."
    >
      <template v-slot:header.player>
        <span class="ml-2">Player</span>
      </template>

      <template v-slot:header.class>
        <span :class="smAndDown ? 'mr-1' : 'ml-2'">
          {{ smAndDown ? "Cls" : "Class" }}
        </span>
      </template>

      <template v-slot:header.position>
        <span :class="smAndDown ? 'mr-1' : 'ml-2'">
          {{ smAndDown ? "Pos" : "Position" }}
        </span>
      </template>

      <template v-slot:header.height>
        <span :class="smAndDown ? 'mr-1' : 'ml-2'">
          {{ smAndDown ? "Hgt" : "Height" }}
        </span>
      </template>

      <template v-slot:header.hometown>
        <span :class="smAndDown ? 'mr-1' : 'ml-2'">
          {{ smAndDown ? "HTown" : "Hometown" }}
        </span>
      </template>

      <!-- Custom rendering for player names -->
      <!-- Template for small screens -->
      <template v-slot:item.player="{ item }" v-if="smAndDown">
        <div class="d-flex align-center ml-2">
          <div class="d-flex flex-column">
            <span
              class="text-body-2 button-like mt-1"
              :style="{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.2',
                display: 'inline-block',
              }"
              @click="item.player_url && window.open(item.player_url, '_blank')"
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
            <v-img :src="item.img" :alt="item.school" cover />
          </v-avatar>
          <div class="d-flex flex-column text-truncate">
            <v-btn
              class="justify-start pa-0"
              variant="text"
              size="default"
              :href="item.player_url"
              target="_blank"
              rel="noopener noreferrer"
              v-if="item.player_url"
            >
              {{ item.player }}
            </v-btn>
            <span v-else class="text-body-1">{{ item.player }}</span>
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
            @click="item.org_id && navigateToTeam($router, item.org_id)"
          >
            {{ item.school }}
          </span>
          <div class="text-caption text-grey">
            {{ item.conference }} | {{ item.division }}
          </div>
        </div>
      </template>

      <!-- Custom bottom slot for pagination -->
      <template v-slot:bottom>
        <div class="d-flex align-center justify-center pa-4">
          <v-pagination
            v-model="localPage"
            :length="props.totalPages"
            :total-visible="smAndDown ? 5 : 7"
          />
          <div class="ml-4 text-caption">
            {{ props.totalPlayers }} total players
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
