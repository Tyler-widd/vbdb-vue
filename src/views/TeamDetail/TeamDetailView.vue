<!-- views/TeamDetail/TeamDetailView.vue -->
<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import TeamDetailHeader from "./TeamDetailHeader.vue";
import TeamDetailScoreCard from "./TeamDetailScoreCard.vue";

const route = useRoute();

// Define props to accept the attributes being passed
const props = defineProps({
  id: {
    type: String,
    default: null,
  },
  season: {
    type: String,
    default: null,
  },
});

const selectedYear = ref("2024");
const record = ref("");

// Get the org_id from the route OR props - this will be reactive
const orgId = computed(() => props.id || route.params.id);

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

// Also watch for prop changes
watch(
  () => props.id,
  (newId) => {
    if (newId) {
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
  <div>
    <TeamDetailHeader
      class="mt-4"
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
  </div>
</template>
