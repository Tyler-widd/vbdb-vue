<!-- views/Home/HomeView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import RankingSection from "./SideContent/RankingSection.vue";
import NewsCard from "../../component/NewsCard.vue";

// You can add any additional logic here if needed
const fetchTeamData = () => {
  // Your existing fetchTeamData logic
};

onMounted(() => {
  fetchTeamData();
});
</script>

<template>
  <div class="d-flex flex-column mb-2">VolleyballDatabased</div>
  <v-row>
    <!-- News Cards -->
    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="NCAA Division I"
        :rss-url="'https://www.ncaa.com/news/volleyball-women/d1/rss.xml'"
        category="NCAA Division I Women's Volleyball"
      />
    </v-col>

    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="NAIA"
        :rss-url="'https://www.naia.org/sports/wvball/headlines-featured?feed=rss_2.0'"
        category="NAIA Women's Volleyball"
      />
    </v-col>

    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="CCCAA"
        :rss-url="'https://3c2asports.org/sports/wvball/headlines-featured?feed=rss_2.0'"
        category="3C2A Women's Volleyball"
      />
    </v-col>

    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="NCAA Division II"
        :rss-url="'https://www.ncaa.com/news/volleyball-women/d2/rss.xml'"
        category="NCAA Division II Women's Volleyball"
      />
    </v-col>

    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="NCAA Division III"
        :rss-url="'https://www.ncaa.com/news/volleyball-women/d3/rss.xml'"
        category="NCAA Division III Women's Volleyball"
      />
    </v-col>

    <v-col cols="12" lg="4">
      <RankingSection />
    </v-col>
  </v-row>
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
