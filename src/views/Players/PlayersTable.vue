<!-- src/views/Players/PlayersTable.vue -->
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
  { title: "Player", key: "player", sortable: true },
  { title: "Jersey", key: "jersey_number", sortable: true },
  { title: "Class", key: "class", sortable: true },
  { title: "Position", key: "position", sortable: true },
  { title: "Height", key: "height", sortable: true },
  { title: "Hometown", key: "hometown", sortable: true },
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
