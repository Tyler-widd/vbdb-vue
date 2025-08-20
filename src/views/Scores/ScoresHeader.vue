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
  loading: {
    type: Boolean,
    default: false,
  },
  divisionFilter: {
    type: String,
    default: null,
  },
  conferenceFilter: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "update:division-filter",
  "update:conference-filter",
]);

const handleDivisionChange = (value) => {
  emit("update:division-filter", value);
};

const handleConferenceChange = (value) => {
  emit("update:conference-filter", value);
};
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <v-card-title class="pt-0">Scores</v-card-title>
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
          :disabled="loading"
          clearable
        />
      </v-col>
    </v-row>
  </v-card>
</template>
