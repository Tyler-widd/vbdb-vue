<!-- views/Teams/TeamsView.vue -->
<script setup>
import { ref } from "vue";
import TeamsHeader from "./TeamsHeader.vue";
import TeamsTable from "./TeamsTable.vue";
import useSchoolData from "@/composables/useSchoolData";

// Use the composable
const { schools, loading, fetchSchools } = useSchoolData();

const divisionFilter = ref(null);
const conferenceFilter = ref(null);
const searchFilter = ref("");

// Handle filter updates
const handleDivisionUpdate = (value) => {
  divisionFilter.value = value;
};

const handleConferenceUpdate = (value) => {
  conferenceFilter.value = value;
};

const handleSearchUpdate = (value) => {
  searchFilter.value = value;
};

// Fetch data on component mount
fetchSchools();
</script>

<template>
  <div>
    <TeamsHeader
      :schools="schools"
      :loading="loading"
      @update:division="handleDivisionUpdate"
      @update:conference="handleConferenceUpdate"
      @update:search="handleSearchUpdate"
    />
    <TeamsTable
      :schools="schools"
      :loading="loading"
      :division-filter="divisionFilter"
      :conference-filter="conferenceFilter"
      :search="searchFilter"
    />
  </div>
</template>
