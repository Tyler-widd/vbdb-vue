<!-- Scores/ScoresView.vue -->
<script setup>
import { ref } from "vue";
import ScoresHeader from "./ScoresHeader.vue";
import ScoresScoreCard from "./ScoresScoreCard.vue";
import ScoresTable from "./ScoresTable.vue";
import { useScoresData } from "@/composables/useScoresData";

const props = defineProps({
  orgId: {
    type: String,
    default: null,
  },
});

// State for table view toggle
const showTableView = ref(true);

// Use the scores data composable
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
      :show-table-view="showTableView"
      @update:division-filter="scoresData.setDivisionFilter"
      @update:conference-filter="scoresData.setConferenceFilter"
      @update:teams="scoresData.setTeamFilter"
      @update:search="scoresData.setSearch"
      @update:show-table-view="showTableView = $event"
    />

    <!-- Conditionally render either table or card view -->
    <ScoresTable
      v-if="showTableView"
      :scores="scoresData.filteredScores.value"
      :loading="scoresData.loading.value"
      :org-id="orgId"
    />
    <ScoresScoreCard
      v-else
      :scores="scoresData.filteredScores.value"
      :loading="scoresData.loading.value"
      :org-id="orgId"
    />
  </div>
</template>
