<!-- views/Teams/TeamsView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import TeamsHeader from "./TeamsHeader.vue";
import TeamsTable from "./TeamsTable.vue";

const schools = ref([]);
const loading = ref(false);
const divisionFilter = ref(null);
const conferenceFilter = ref(null);
const searchFilter = ref("");

// Fetch schools data
const fetchSchools = async () => {
  loading.value = true;
  try {
    const response = await fetch("https://api.volleyballdatabased.com/schools");
    const data = await response.json();
    schools.value = data;
  } catch (error) {
    console.error("Error fetching schools:", error);
  } finally {
    loading.value = false;
  }
};

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
onMounted(() => {
  fetchSchools();
});
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
