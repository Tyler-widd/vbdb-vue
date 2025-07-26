<script>
import NavBar from "./NavBar.vue";
import RankingSection from "../views/Home/SideContent/RankingSection.vue";
import Scores from "../views/Home/Scores.vue";
import NCAANews from "../views/Home/News/NCAANews.vue";
import NAIANews from "../views/Home/News/NAIANews.vue";
import CCCAANews from "../views/Home/News/CCCAANews.vue";

export default {
  components: {
    NavBar,
    NCAANews,
    NAIANews,
    CCCAANews,
    RankingSection,
    TodaysScores,
  },
};
</script>

<template>
  <!-- Page Content -->
  <v-container class="pa-0">
    <!-- Navigation Bar -->
    <NavBar />

    <!-- NCAA News Section - All 3 Divisions -->
    <v-row>
      <v-col cols="9">
        <v-row>
          <v-col cols="4">
            <NCAANews division="d1" />
          </v-col>
          <v-col cols="4">
            <NCAANews division="d2" />
          </v-col>
          <v-col cols="4">
            <NCAANews division="d3" />
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="3">
        <RankingSection />
      </v-col>
    </v-row>

    <!-- Other News Section -->
    <v-row>
      <v-col cols="4">
        <NAIANews />
      </v-col>
      <v-col cols="4">
        <CCCAANews />
      </v-col>
      <v-col cols="4"> </v-col>
    </v-row>

    <!-- Scores -->
    <div class="mt-4">
      <Scores />
    </div>
  </v-container>
</template>
