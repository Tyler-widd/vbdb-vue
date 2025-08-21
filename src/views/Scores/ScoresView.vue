<!-- Scores/ScoresView.vue -->
<script setup>
import { ref } from "vue";
import ScoresHeader from "./ScoresHeader.vue";
import ScoresScoreCard from "./ScoresScoreCard.vue";
import { useScoresData } from "@/composables/useScoresData";

const props = defineProps({
  orgId: {
    type: String,
    default: null,
  },
});

// Create reactive reference for search text
const searchText = ref("");

const handleSearchUpdate = (value) => {
  searchText.value = value;
};

const scoresData = useScoresData();
</script>

<template>
  <div>
    <ScoresHeader
      class="mt-3"
      :divisions="scoresData.divisions.value"
      :conferences="scoresData.conferences.value"
      :loading="scoresData.loading.value"
      :division-filter="scoresData.divisionFilter.value"
      :conference-filter="scoresData.conferenceFilter.value"
      :search-text="searchText"
      @update:division-filter="scoresData.setDivisionFilter"
      @update:conference-filter="scoresData.setConferenceFilter"
      @update:search="handleSearchUpdate"
    />
    <ScoresScoreCard
      :scores="scoresData.scores.value"
      :loading="scoresData.loading.value"
      :org-id="orgId"
      :search-text="searchText"
    />
  </div>
</template>
