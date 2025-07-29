<!-- views/TeamDetail/TeamDetailView.vue -->
<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import TeamDetailHeader from "./TeamDetailHeader.vue";
import TeamDetailScoreCard from "./TeamDetailScoreCard.vue";

const route = useRoute();
const selectedYear = ref("2024");
const record = ref("");

// Get the org_id from the route - this will be reactive
const orgId = computed(() => route.params.id);

// Watch for route changes to handle navigation between teams
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      // Reset the year when navigating to a new team
      selectedYear.value = "2024";
      record.value = "";
    }
  }
);

const handleYearUpdate = (year) => {
  selectedYear.value = year;
};

const handleRecordUpdate = (recordValue) => {
  record.value = recordValue;
};
</script>

<template>
  <!-- Use :key to force re-render when orgId changes -->
  <TeamDetailHeader
    :key="`header-${orgId}`"
    :record="record"
    @update:year="handleYearUpdate"
  />
  <TeamDetailScoreCard
    :key="`scorecard-${orgId}`"
    :org-id="orgId"
    :selected-year="selectedYear"
    @update:record="handleRecordUpdate"
  />
</template>
