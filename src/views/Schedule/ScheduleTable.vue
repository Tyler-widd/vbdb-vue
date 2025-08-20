<!-- views/Schedule/ScheduleTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { formatDateMoblie, formatDateYear } from "../../helpers/formatDate";
import { navigateToTeam } from "../../helpers/navigateToTeam.js";

const { smAndDown } = useDisplay();

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
  orgId: {
    type: String,
    default: null,
  },
});

// Define table headers
const headers = computed(() => [
  {
    title: "Date",
    key: "date",
    sortable: true,
    width: smAndDown.value ? "50px" : "100px",
  },
  { title: "Team 1", key: "team_1", sortable: false, maxWidth: "80px" },
  { title: "Team 2", key: "team_2", sortable: false, maxWidth: "80px" },
]);

const formatConference = (conference) => {
  if (conference && conference.includes(".0")) {
    return `Region ${conference.replace(".0", "")}`;
  }
  return conference;
};

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

// Enhanced time formatting that handles both original API format and converted format
const formatTime = (item) => {
  // First try to use the original_time if available (for better display)
  if (item.original_time) {
    return formatOriginalTime(item.original_time);
  }

  // Fall back to converted time format
  if (item.time) {
    return formatConvertedTime(item.time);
  }

  return "Time TBD";
};

// Format original API time format ("06:00PM ET")
const formatOriginalTime = (timeString) => {
  if (!timeString || typeof timeString !== "string") {
    return "Time TBD";
  }

  try {
    // Remove timezone abbreviation and clean up
    const timeOnly = timeString
      .replace(/\s+(ET|CT|MT|PT|EST|CST|MST|PST)$/i, "")
      .trim();

    // Parse and format the time
    const timeRegex = /^(\d{1,2}):(\d{2})(AM|PM)$/i;
    const match = timeOnly.match(timeRegex);

    if (match) {
      const [, hours, minutes, ampm] = match;
      return `${hours}:${minutes} ${ampm.toUpperCase()}`;
    }

    return timeString; // Return original if parsing fails
  } catch (error) {
    console.warn("Error formatting original time:", timeString, error);
    return "Time TBD";
  }
};

// Format converted 24-hour time format ("18:00")
const formatConvertedTime = (timeString) => {
  if (!timeString || typeof timeString !== "string") {
    return "Time TBD";
  }

  try {
    const parts = timeString.split(":");
    if (parts.length < 2) {
      return "Invalid time";
    }

    const [hours, minutes] = parts;
    if (!hours || !minutes) {
      return "Invalid time";
    }

    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.warn("Error formatting converted time:", timeString, error);
    return "Time TBD";
  }
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
      <template v-slot:header.date>
        <span class="ml-2 pa-0">Date</span></template
      >
      <!-- Custom date column -->
      <template v-slot:item.date="{ item }">
        <div class="text-body-2 d-flex flex-column mx-2 pa-0 font-weight-light">
          <div>
            {{
              smAndDown
                ? formatDateMoblie(item.date)
                : formatDateYear(item.date)
            }}
          </div>
          <div class="text-caption text-grey">
            {{ smAndDown ? "" : formatTime(item) }}
          </div>
        </div>
      </template>

      <!-- Team 1 - Centered version -->
      <template v-slot:item.team_1="{ item }">
        <div class="d-flex align-center">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-3">
            <v-img :src="item.team_1_img" :alt="item.team_1_name" />
          </v-avatar>
          <div class="d-flex flex-column">
            <span
              class="text-primary button-like my-1"
              :class="[
                smAndDown ? 'text-body-2' : 'text-h6',
                item.isWinner !== undefined
                  ? item.isWinner
                    ? 'text-error'
                    : 'text-success'
                  : '',
              ]"
              :style="{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1',
                display: 'inline-block',
              }"
              @click="navigateToTeam($router, item.team_1_id, orgId)"
            >
              <div class="d-flex align-center ga-1">
                {{ item.team_1_name }}
                <span
                  v-if="item.team_1_rank"
                  class="text-caption text-secondary"
                >
                  ({{ item.team_1_rank }})
                </span>
              </div>
            </span>
            <div class="text-caption text-grey justify-start">
              {{ formatConference(item.team_1_conference) }}
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
          <div class="d-flex flex-column">
            <span
              class="text-primary button-like my-1"
              :class="[
                smAndDown ? 'text-body-2' : 'text-h6',
                item.isWinner !== undefined
                  ? item.isWinner
                    ? 'text-error'
                    : 'text-success'
                  : '',
              ]"
              :style="{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1',
                display: 'inline-block',
              }"
              @click="navigateToTeam($router, item.team_2_id, orgId)"
            >
              <div class="d-flex align-center ga-1">
                {{ item.team_2_name }}
                <span
                  v-if="item.team_2_rank"
                  class="text-caption text-secondary"
                >
                  ({{ item.team_2_rank }})
                </span>
              </div>
            </span>
            <div class="text-caption text-grey justify-start">
              {{ formatConference(item.team_2_conference) }}
            </div>
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
