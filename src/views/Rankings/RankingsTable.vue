<!-- src/views/Rankings/RankingsTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const props = defineProps({
  standings: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Define table headers
const headers = computed(() => {
  const baseHeaders = [
    { title: "Rank", key: "rank", sortable: false, width: "70px" },
    { title: "Team", key: "team_name", sortable: true },
    { title: "Conference", key: "conference", sortable: true },
    { title: "W", key: "wins", sortable: true, width: "60px", align: "center" },
    {
      title: "L",
      key: "losses",
      sortable: true,
      width: "60px",
      align: "center",
    },
    {
      title: "Win %",
      key: "winPercentage",
      sortable: true,
      width: "90px",
      align: "center",
    },
    {
      title: "Record",
      key: "overall_record",
      sortable: false,
      width: "100px",
      align: "center",
    },
  ];

  // Hide conference column on small screens
  if (smAndDown.value) {
    return baseHeaders.filter((h) => h.key !== "conference");
  }

  return baseHeaders;
});

// Format win percentage for display
const formatWinPercentage = (percentage) => {
  return (percentage * 100).toFixed(1) + "%";
};
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="standings"
      :loading="loading"
      :items-per-page="25"
      no-data-text="No teams found for selected filters"
      loading-text="Loading standings..."
      class="standings-table"
    >
      <!-- Rank column -->
      <template v-slot:item.rank="{ index }">
        <span class="font-weight-bold">{{ index + 1 }}</span>
      </template>

      <!-- Team column with location -->
      <template v-slot:item.team_name="{ item }">
        <div>
          <span class="font-weight-medium">{{ item.team_name }}</span>
          <div
            v-if="item.location && !smAndDown"
            class="text-caption text-grey"
          >
            {{ item.location }}
          </div>
        </div>
      </template>

      <!-- Conference column -->
      <template v-slot:item.conference="{ item }">
        <v-chip size="small" variant="tonal">
          {{ item.conference }}
        </v-chip>
      </template>

      <!-- Win percentage with color coding -->
      <template v-slot:item.winPercentage="{ item }">
        <v-chip
          :color="
            item.winPercentage >= 0.7
              ? 'success'
              : item.winPercentage >= 0.5
              ? 'info'
              : item.winPercentage >= 0.3
              ? 'warning'
              : 'error'
          "
          variant="tonal"
          size="small"
        >
          {{ formatWinPercentage(item.winPercentage) }}
        </v-chip>
      </template>

      <!-- Overall record -->
      <template v-slot:item.overall_record="{ item }">
        <span class="font-weight-medium">{{ item.overall_record }}</span>
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
.standings-table :deep(.v-data-table__td) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
