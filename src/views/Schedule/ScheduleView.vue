<!-- views/Schedule/ScheduleView.vue -->
<script setup>
import { ref, onMounted, computed, watch } from "vue";
import ScheduleHeader from "./ScheduleHeader.vue";
import ScheduleTable from "./ScheduleTable.vue";
import { useScheduleData } from "@/composables/useScheduleData";

// Use the schedule data composable
const {
  scheduleData,
  loading,
  error,
  divisions,
  getConferencesForDivision,
  fetchSchedule,
  filterSchedule,
} = useScheduleData();

// Filter states - Default division to "D-I"
const search = ref("");
const divisionFilter = ref("D-I"); // Changed from null to "D-I"
const conferenceFilter = ref(null);

// Computed conferences based on selected division
const availableConferences = computed(() => {
  return getConferencesForDivision(divisionFilter.value);
});

// Filter update handlers
const updateSearch = (value) => {
  search.value = value;
};

const updateDivision = (value) => {
  divisionFilter.value = value;
  // Clear conference filter when division changes
  if (conferenceFilter.value) {
    conferenceFilter.value = null;
  }
};

const updateConference = (value) => {
  conferenceFilter.value = value;
};

// Fetch schedule data when component mounts
onMounted(async () => {
  await fetchSchedule();
});

// Handle error display
const handleRetry = () => {
  fetchSchedule();
};
</script>

<template>
  <div>
    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="error = null"
    >
      <template v-slot:title>Failed to load schedule</template>
      {{ error }}
      <template v-slot:append>
        <v-btn
          color="error"
          variant="outlined"
          size="small"
          @click="handleRetry"
        >
          Retry
        </v-btn>
      </template>
    </v-alert>

    <!-- Schedule Header with Filters -->
    <ScheduleHeader
      :divisions="divisions"
      :conferences="availableConferences"
      :selected-division="divisionFilter"
      :loading="loading"
      @update:search="updateSearch"
      @update:division="updateDivision"
      @update:conference="updateConference"
    />

    <!-- Schedule Table -->
    <ScheduleTable
      :schedule-data="scheduleData"
      :loading="loading"
      :search="search"
      :division-filter="divisionFilter"
      :conference-filter="conferenceFilter"
      :filter-schedule="filterSchedule"
    />
  </div>
</template>
