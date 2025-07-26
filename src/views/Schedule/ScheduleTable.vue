<!-- views/Schedule/ScheduleTable.vue -->
<script setup>
import { computed, ref } from "vue";
import { formatDate } from "@/helpers/formatDate";
import { useDisplay } from "vuetify";

const { smAndDown, xs } = useDisplay();

const props = defineProps({
  scheduleData: {
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
  filterSchedule: {
    type: Function,
    required: true,
  },
});

// Define table headers
const headers = [
  { title: "Date", key: "date", sortable: true },
  { title: "Team 1", key: "team_1", sortable: false, maxWidth: "140px" },
  { title: "Team 2", key: "team_2", sortable: false, maxWidth: "140px" },
];

// Filter the schedule data based on current filters and sort by date
const filteredSchedule = computed(() => {
  const filtered = props.filterSchedule(
    props.scheduleData,
    props.search,
    props.divisionFilter,
    props.conferenceFilter
  );

  // Sort by date in ascending order
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });
});

// Format time for better display
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return "Invalid time";
  }

  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="filteredSchedule"
      :loading="loading"
      :items-per-page="10"
      no-data-text="No games scheduled"
      loading-text="Loading schedule..."
    >
      <!-- Custom date column name -->
      <template v-slot:header.date> <span class="ml-2">Date</span></template>

      <!-- Custom date column -->
      <template v-slot:item.date="{ item }">
        <div class="text-body-2 d-flex flex-column ml-2">
          <div>{{ formatDate(item.date) }}</div>
          <div class="text-caption text-grey">{{ formatTime(item.time) }}</div>
        </div>
      </template>

      <!-- Team 1 - Centered version -->
      <template v-slot:item.team_1="{ item }">
        <div class="d-flex align-center">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-3">
            <v-img :src="item.team_1_img" :alt="item.team_1_name" />
          </v-avatar>
          <div class="d-flex flex-column text-truncate">
            <v-btn
              class="justify-start pa-0"
              variant="text"
              :size="smAndDown ? 'small' : 'default'"
            >
              {{ item.team_1_name }}
            </v-btn>
            <div class="text-caption text-grey justify-start">
              {{ item.team_1_conference }}
            </div>
          </div>
        </div>
      </template>

      <!-- Team 2 - Centered version -->
      <template v-slot:item.team_2="{ item }">
        <div class="d-flex align-center">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-3">
            <v-img :src="item.team_2_img" :alt="item.team_2_name" />
          </v-avatar>
          <div class="d-flex flex-column text-truncate">
            <v-btn
              class="justify-start pa-0"
              variant="text"
              :size="smAndDown ? 'small' : 'default'"
            >
              {{ item.team_2_name }}
            </v-btn>
            <div class="text-caption text-grey justify-start">
              {{ item.team_2_conference }}
            </div>
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
