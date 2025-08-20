<!-- Scores/ScoresView.vue -->
<script setup>
import ScoresHeader from "./ScoresHeader.vue";
import ScoresTable from "./ScoresTable.vue";
import { useScoresData } from "@/composables/useScoresData";

const props = defineProps({
  orgId: {
    type: String,
    default: null,
  },
});

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
      @update:division-filter="scoresData.setDivisionFilter"
      @update:conference-filter="scoresData.setConferenceFilter"
    />
    <ScoresTable
      :scores="scoresData.filteredScores.value"
      :loading="scoresData.loading.value"
      :org-id="orgId"
    />
  </div>
</template>
