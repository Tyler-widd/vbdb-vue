<!-- src/views/Rankings/RankingsTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const props = defineProps({
  schools: {
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
});

// Define table headers
const headers = [
  { title: "School", key: "school", sortable: true },
  { title: "Record", key: "record", sortable: true },
];
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :loading="loading"
      :items-per-page="10"
      no-data-text="No teams found"
      loading-text="Loading teams..."
    >
      <template v-slot:header.school>
        <span class="ml-2">School</span></template
      >
    </v-data-table>
  </v-card>
</template>
