<!-- views/Teams.vue -->
<script setup>
import { ref, onMounted, computed } from "vue";
import Header from "./Teams/Header.vue";
import TeamsTable from "./Teams/TeamsTable.vue";

// Reactive data
const schools = ref([]);
const loading = ref(false);
const selectedSchool = ref(null);
const searchQuery = ref("");
const selectedDivision = ref(null);
const selectedConference = ref(null);

// Computed unique conferences based on selected division
const filteredConferences = computed(() => {
  let conferences;

  if (!selectedDivision.value) {
    // If no division selected, return all unique conferences
    conferences = [
      ...new Set(schools.value.map((school) => school.conference)),
    ].filter(Boolean); // Remove null/undefined values
  } else {
    // Filter conferences by selected division
    conferences = [
      ...new Set(
        schools.value
          .filter((school) => school.division === selectedDivision.value)
          .map((school) => school.conference)
      ),
    ].filter(Boolean); // Remove null/undefined values
  }

  return conferences.sort().map((conf) => ({ title: conf, value: conf }));
});

// Computed filtered schools based on all filters
const filteredSchools = computed(() => {
  let filtered = schools.value;

  // Filter by division if selected
  if (selectedDivision.value) {
    filtered = filtered.filter(
      (school) => school.division === selectedDivision.value
    );
  }

  // Filter by conference if selected
  if (selectedConference.value) {
    filtered = filtered.filter(
      (school) => school.conference === selectedConference.value
    );
  }

  // Filter by selected school from autocomplete
  if (selectedSchool.value) {
    filtered = filtered.filter(
      (school) => school.name_official === selectedSchool.value
    );
  }

  // Filter by search query if no specific school selected
  if (!selectedSchool.value && searchQuery.value) {
    filtered = filtered.filter((school) =>
      school.name_official
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
});

// Watch for division changes to clear conference if it's no longer valid
const handleDivisionChange = (newDivision) => {
  selectedDivision.value = newDivision;

  // Clear conference if it's not available in the new division
  if (selectedConference.value && newDivision) {
    const availableConferences = [
      ...new Set(
        schools.value
          .filter((school) => school.division === newDivision)
          .map((school) => school.conference)
      ),
    ];

    if (!availableConferences.includes(selectedConference.value)) {
      selectedConference.value = null;
    }
  }
};
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Header Component -->
    <Header
      :schools="schools"
      :selected-school="selectedSchool"
      :search-query="searchQuery"
      :selected-division="selectedDivision"
      :selected-conference="selectedConference"
      :filtered-conferences="filteredConferences"
      @update:selected-school="selectedSchool = $event"
      @update:search-query="searchQuery = $event"
      @update:selected-division="handleDivisionChange"
      @update:selected-conference="selectedConference = $event"
    />

    <!-- Teams Table Component -->
    <TeamsTable :filtered-schools="filteredSchools" :loading="loading" />
  </v-container>
</template>
