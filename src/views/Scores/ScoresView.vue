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

// Search is now handled directly in the composable

const scoresData = useScoresData();
</script>

<template>
  <div>
    <ScoresHeader
      class="mt-3"
      :divisions="scoresData.divisions.value"
      :conferences="scoresData.conferences.value"
      :teams="scoresData.teams.value"
      :loading="scoresData.loading.value"
      :division-filter="scoresData.divisionFilter.value"
      :conference-filter="scoresData.conferenceFilter.value"
      :selected-teams="scoresData.teamFilter.value"
      @update:division-filter="scoresData.setDivisionFilter"
      @update:conference-filter="scoresData.setConferenceFilter"
      @update:teams="scoresData.setTeamFilter"
      @update:search="scoresData.setSearch"
    />
    <ScoresScoreCard
      :scores="scoresData.filteredScores.value"
      :loading="scoresData.loading.value"
      :org-id="orgId"
    />
  </div>
</template>
