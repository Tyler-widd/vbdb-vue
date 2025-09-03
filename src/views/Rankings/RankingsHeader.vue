<!-- views/Rankings/RankingsHeader.vue -->
<script setup>
import { useDisplay } from "vuetify";

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
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:divisionFilter", "update:conferenceFilter"]);
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <v-card-title class="pt-0">Standings</v-card-title>
    <v-row dense no-gutters class="pa-0">
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Division"
          :model-value="divisionFilter"
          @update:model-value="emit('update:divisionFilter', $event)"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="[
            'CCCAA',
            'D-I',
            'D-II',
            'D-III',
            'NAIA',
            'NJCAA D-1',
            'NJCAA D-2',
            'NJCAA D-3',
          ]"
          :disabled="loading"
          clearable
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Conference"
          :model-value="conferenceFilter"
          @update:model-value="emit('update:conferenceFilter', $event)"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :items="conferences"
          :disabled="loading"
          multiple
          chips
          closable-chips
          clearable
        />
      </v-col>
    </v-row>
  </v-card>
</template>
