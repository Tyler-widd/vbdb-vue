<!-- views/Schedule/ScheduleHeader.vue -->
<script setup>
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

// Define props and emits for communication with parent
const props = defineProps({
  divisions: {
    type: Array,
    default: () => [],
  },
  conferences: {
    type: Array,
    default: () => [],
  },
  selectedDivision: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // Add date range props
  dateFrom: {
    type: String,
    default: null,
  },
  dateTo: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "update:search",
  "update:division",
  "update:conference",
  "update:dateFrom",
  "update:dateTo",
]);

// Handle filter changes
const handleSearchChange = (value) => {
  emit("update:search", value);
};

const handleDivisionChange = (value) => {
  emit("update:division", value);
};

const handleConferenceChange = (value) => {
  emit("update:conference", value);
};

const handleDateFromChange = (value) => {
  emit("update:dateFrom", value);
};

const handleDateToChange = (value) => {
  emit("update:dateTo", value);
};

// Helper functions for date presets
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

const getDateAfterDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const getDateAfterWeeks = (weeks) => {
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split("T")[0];
};

// Date range presets
const setDateRange = (fromDate, toDate) => {
  emit("update:dateFrom", fromDate);
  emit("update:dateTo", toDate);
};

const clearDateRange = () => {
  emit("update:dateFrom", null);
  emit("update:dateTo", null);
};

const setToday = () => {
  const today = getTodayDate();
  setDateRange(today, today);
};

const setThisWeek = () => {
  const today = getTodayDate();
  const nextWeek = getDateAfterDays(7);
  setDateRange(today, nextWeek);
};

const setNextTwoWeeks = () => {
  const today = getTodayDate();
  const twoWeeksFromNow = getDateAfterWeeks(2);
  setDateRange(today, twoWeeksFromNow);
};

const setThisMonth = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  setDateRange(firstDay, lastDay);
};
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <v-card-title class="pt-0">Schedule</v-card-title>
    <!-- First Row: Division and Conference -->
    <v-row dense no-gutters class="pa-0">
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Division"
          :model-value="selectedDivision"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="divisions"
          :disabled="loading"
          clearable
          @update:model-value="handleDivisionChange"
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Conference"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :items="conferences"
          :disabled="loading"
          clearable
          @update:model-value="handleConferenceChange"
        />
      </v-col>
    </v-row>

    <!-- Second Row: Date Range -->
    <v-row dense no-gutters class="pa-0">
      <v-col :cols="smAndDown ? 12 : 6">
        <v-text-field
          label="From Date"
          :model-value="dateFrom"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :disabled="loading"
          type="date"
          clearable
          prepend-inner-icon="mdi-calendar"
          :max="dateTo || undefined"
          @update:model-value="handleDateFromChange"
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-text-field
          label="To Date"
          :model-value="dateTo"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :disabled="loading"
          type="date"
          clearable
          prepend-inner-icon="mdi-calendar"
          :min="dateFrom || undefined"
          @update:model-value="handleDateToChange"
        />
      </v-col>
    </v-row>

    <!-- Third Row: Date Range Quick Buttons -->
    <v-row dense no-gutters class="pa-0 mb-2" v-if="!smAndDown">
      <v-col cols="12">
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="setToday"
            :disabled="loading"
          >
            Today
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="setThisWeek"
            :disabled="loading"
          >
            Next 7 Days
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="setNextTwoWeeks"
            :disabled="loading"
          >
            Next 2 Weeks
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="setThisMonth"
            :disabled="loading"
          >
            This Month
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            color="secondary"
            @click="clearDateRange"
            :disabled="loading"
          >
            Clear Dates
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Fourth Row: Search -->
    <v-row dense no-gutters class="pa-0">
      <v-col cols="12">
        <v-text-field
          label="Search teams, date, or time"
          prepend-inner-icon="mdi-magnify"
          :disabled="loading"
          clearable
          @update:model-value="handleSearchChange"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
