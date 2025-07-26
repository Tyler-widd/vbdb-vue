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
});

const emit = defineEmits([
  "update:search",
  "update:division",
  "update:conference",
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
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <v-card-title class="pt-0">Schedule</v-card-title>
    <v-row dense no-gutters class="pa-0">
      <v-autocomplete
        label="Division"
        :model-value="selectedDivision"
        :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
        :items="divisions"
        :disabled="loading"
        clearable
        @update:model-value="handleDivisionChange"
      />
      <v-autocomplete
        label="Conference"
        :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
        :items="conferences"
        :disabled="loading"
        clearable
        @update:model-value="handleConferenceChange"
      />
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
