<!-- views/Home.vue -->
<script>
import { ref, onMounted } from "vue";
import RankingSection from "./Home/RankingSection.vue";
import TodaysScores from "./Home/TodaysScores.vue";
import NCAANews from "./Home/NCAANews.vue";
// import NAIANews from "./Home/NAIANews.vue";
import CCCAANews from "./Home/CCCAANews.vue";

export default {
  components: {
    NCAANews,
    // NAIANews,
    CCCAANews,
    RankingSection,
    TodaysScores,
  },
};

onMounted(() => {
  fetchTeamData();
});
</script>

<template>
  <!-- Page Content -->
  <v-container fluid class="pa-2 pa-md-4">
    <!-- NCAA News Section - All 3 Divisions -->
    <v-row class="mb-4">
      <!-- Main content area -->
      <v-col cols="12" lg="9">
        <!-- NCAA News Cards -->
        <div class="d-flex">
          <v-col cols="6">
            <NCAANews division="d1" />
          </v-col>
          <!-- <v-col cols="4">
            <NAIANews />
          </v-col> -->
          <v-col cols="6">
            <CCCAANews />
          </v-col>
        </div>
        <!-- <v-col cols="12" sm="6" md="4">
          <NCAANews division="d2" />
        </v-col>
        <v-col cols="12" sm="12" md="4">
          <NCAANews division="d3" />
        </v-col> -->
      </v-col>

      <!-- Rankings sidebar -->
      <v-col cols="12" lg="3">
        <RankingSection />
      </v-col>
    </v-row>

    <!-- Today's Scores -->
    <v-row>
      <v-col cols="12">
        <TodaysScores />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Custom styles for better mobile experience */
@media (max-width: 600px) {
  .v-container {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
}

/* Ensure cards have consistent height on larger screens */
@media (min-width: 960px) {
  .v-col .v-card {
    height: 100%;
  }
}
</style>
