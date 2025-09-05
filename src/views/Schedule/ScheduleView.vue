<!-- views/Schedule/ScheduleView.vue -->
<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useScheduleData } from "@/composables/useScheduleData";
import ScheduleHeader from "./ScheduleHeader.vue";
import ScheduleTable from "./ScheduleTable.vue";

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

// Helper function to get date after specified days
const getDateAfterDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

// Helper function to get today's date
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

// Filter states - Default division to "D-I" and set default date range to next 7 days
const search = ref("");
const divisionFilter = ref("D-I");
const conferenceFilter = ref(null);
const dateFrom = ref(getTodayDate());
const dateTo = ref(getDateAfterDays(7));

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

const updateDateFrom = (value) => {
  dateFrom.value = value;
};

const updateDateTo = (value) => {
  dateTo.value = value;
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
      class="mt-3"
      :divisions="divisions"
      :conferences="availableConferences"
      :selected-division="divisionFilter"
      :loading="loading"
      :date-from="dateFrom"
      :date-to="dateTo"
      @update:search="updateSearch"
      @update:division="updateDivision"
      @update:conference="updateConference"
      @update:date-from="updateDateFrom"
      @update:date-to="updateDateTo"
    />

    <!-- Schedule Table -->
    <ScheduleTable
      :schedule-data="scheduleData"
      :loading="loading"
      :search="search"
      :division-filter="divisionFilter"
      :conference-filter="conferenceFilter"
      :date-from="dateFrom"
      :date-to="dateTo"
      :filter-schedule="filterSchedule"
    />
  </div>
</template>
