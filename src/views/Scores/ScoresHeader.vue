<!-- views/Scores/ScoresHeader.vue -->
<script setup>
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const props = defineProps({
  divisions: {
    type: Array,
    default: () => [],
  },
  conferences: {
    type: Array,
    default: () => [],
  },
  teams: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  divisionFilter: {
    type: String,
    default: null,
  },
  conferenceFilter: {
    type: Array, // Changed to Array for multi-select
    default: () => [],
  },
  selectedTeams: {
    type: Array,
    default: () => [],
  },
  searchText: {
    type: String,
    default: "",
  },
  showTableView: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "update:division-filter",
  "update:conference-filter",
  "update:teams",
  "update:search",
  "update:show-table-view",
]);

const handleDivisionChange = (value) => {
  emit("update:division-filter", value);
};

const handleConferenceChange = (value) => {
  emit("update:conference-filter", value);
};

const handleTeamChange = (value) => {
  emit("update:teams", value);
};

const handleSearchChange = (value) => {
  emit("update:search", value);
};

// const handleShowTableViewChange = (value) => {
// emit("update:show-table-view", value);
// };
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-card-title class="pt-0">Scores</v-card-title>
        <v-card-subtitle class="text-caption font-weight-light font-italic"
          >Click Scores for boxscore</v-card-subtitle
        >
      </div>
    </div>
    <v-row dense no-gutters class="pa-0">
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          :model-value="divisionFilter"
          @update:model-value="handleDivisionChange"
          label="Division"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="divisions"
          :disabled="loading"
          clearable
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          :model-value="conferenceFilter"
          @update:model-value="handleConferenceChange"
          label="Conference"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :items="conferences"
          :disabled="loading || !conferences.length"
          clearable
          multiple
          chips
          closable-chips
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          :model-value="selectedTeams"
          @update:model-value="handleTeamChange"
          label="Teams"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="teams"
          :disabled="loading || !teams.length"
          clearable
          multiple
          chips
          closable-chips
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-text-field
          label="Search"
          :model-value="searchText"
          @update:model-value="handleSearchChange"
          prepend-inner-icon="mdi-magnify"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :disabled="loading"
          clearable
        />
      </v-col>
    </v-row>
  </v-card>
</template>
