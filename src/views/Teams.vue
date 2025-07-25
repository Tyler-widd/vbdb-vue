<!-- views/Teams.vue - Fixed -->
<script setup>
import { ref, onMounted, computed } from "vue";
import Header from "./Teams/Header.vue";
import TeamsTable from "./Teams/TeamsTable.vue";

import { useSchoolsStore } from "@/composables/useSchoolsStore";

// Get schools store
const { schools, loading, error, fetchSchools, getConferences } =
  useSchoolsStore();

// Local filter states
const selectedSchool = ref(null);
const searchQuery = ref("");
const selectedDivision = ref(null);
const selectedConference = ref(null);

onMounted(() => {
  fetchSchools();
});

// Fix: Use selectedDivision.value instead of props.selectedDivision
const filteredConferences = computed(() => {
  const conferences = getConferences(selectedDivision.value);
  return conferences.map((conf) => ({ title: conf, value: conf }));
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

// Also simplify this function to use the store method
const handleDivisionChange = (newDivision) => {
  selectedDivision.value = newDivision;

  // Use store method instead of manual calculation
  if (selectedConference.value && newDivision) {
    const availableConferences = getConferences(newDivision); // ← Simplified this
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
