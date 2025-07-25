<!-- views/TeamDetail.vue -->
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import Header from "./TeamDetail/Header.vue";
import ScoreCard from "./TeamDetail/ScoreCard.vue";

// Get route and router instances
const route = useRoute();

// Props from route params
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  teamWithSchoolInfo: {
    type: Object,
    required: true,
    default: () => ({
      name_official: "",
      athletic_web_url: "",
      allRecords: [],
    }),
  },
});

// Reactive data
const teamRecords = ref([]);
const loading = ref(false);
const error = ref(null);
const selectedYear = ref("All");
const teamRecord = ref("");

// Computed property to get unique years for dropdown
const availableYears = computed(() => {
  const years = [...new Set(teamRecords.value.map((record) => record.year))];
  // Sort years in descending order (most recent first)
  const sortedYears = years.sort((a, b) => b - a);
  return ["All", ...sortedYears];
});

// Computed property to get filtered records based on selected year
const filteredRecords = computed(() => {
  if (selectedYear.value === "All") {
    // Sort all records by year descending (most recent first)
    return [...teamRecords.value].sort((a, b) => b.year - a.year);
  }

  return teamRecords.value
    .filter((record) => record.year === selectedYear.value)
    .sort((a, b) => b.year - a.year);
});

// Computed property to get the most current record
const mostCurrentRecord = computed(() => {
  if (!teamRecords.value.length) return null;

  // Sort records by year descending and get the first (most recent)
  const sortedRecords = [...teamRecords.value].sort((a, b) => {
    // Handle year format like "2025-26" by taking the first year
    const yearA = parseInt(a.year.split("-")[0]);
    const yearB = parseInt(b.year.split("-")[0]);
    return yearB - yearA;
  });

  return sortedRecords[0];
});

// Computed property to get team info
const teamWithSchoolInfo = computed(() => {
  if (!teamRecords.value.length) return null;

  // Get the first team record (they all have the same org_id and basic info)
  const firstRecord = teamRecords.value[0];

  return {
    ...firstRecord,
    logoUrl: firstRecord.img || null,
    totalYears: teamRecords.value.length,
    allRecords: teamRecords.value,
  };
});

// Watch for route changes
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchTeamData(newId);
    }
  },
  { immediate: true }
);

// Load data on component mount
onMounted(async () => {
  if (props.id) {
    fetchTeamData(props.id);
  }
});
</script>

<template>
  <v-container fluid>
    <!-- Loading state -->
    <v-card v-if="loading" class="pa-4">
      <v-skeleton-loader type="article" />
    </v-card>

    <!-- Error state -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Team content -->
    <div v-else-if="teamWithSchoolInfo">
      <!-- Use the extracted header component -->
      <Header
        :team-with-school-info="teamWithSchoolInfo"
        :most-current-record="mostCurrentRecord"
        :selected-year="selectedYear"
        :available-years="availableYears"
        :team-record="teamRecord"
        @update:selectedYear="selectedYear = $event"
      />

      <!-- Match History Cards -->
      <ScoreCard
        :team-id="props.id"
        :selected-year="selectedYear"
        @update:selectedYear="selectedYear = $event"
        @update:teamRecord="teamRecord = $event"
      />
    </div>

    <!-- No team found -->
    <v-alert v-else type="warning" class="mb-4"> Team not found </v-alert>
  </v-container>
</template>
