<!-- views/Live/LiveHeader.vue -->
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
  selectedConference: {
    type: String,
    default: null,
  },
  showOnlyLive: {
    type: Boolean,
    default: false,
  },
  showCompleted: {
    type: Boolean,
    default: false,
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
  "update:show-only-live",
  "update:show-completed",
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

const handleShowOnlyLiveChange = (value) => {
  emit("update:show-only-live", value);
};

const handleShowCompletedChange = (value) => {
  emit("update:show-completed", value);
};
</script>

<template>
  <v-card class="mb-4 px-4 pt-4 pb-2">
    <div class="d-flex align-center justify-space-between">
      <v-card-title class="pt-0">Live</v-card-title>
      <div class="d-flex align-center gap-3">
        <v-checkbox
          :model-value="showOnlyLive"
          label="Show only live"
          density="compact"
          hide-details
          @update:model-value="handleShowOnlyLiveChange"
        />
        <v-checkbox
          :model-value="showCompleted"
          label="Show completed"
          density="compact"
          hide-details
          @update:model-value="handleShowCompletedChange"
        />
      </div>
    </div>
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
          :model-value="selectedConference"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :items="conferences"
          :disabled="loading || !conferences.length"
          clearable
          @update:model-value="handleConferenceChange"
        />
      </v-col>
      <v-col cols="12">
        <v-text-field
          label="Search"
          prepend-inner-icon="mdi-magnify"
          :disabled="loading"
          clearable
          @update:model-value="handleSearchChange"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
