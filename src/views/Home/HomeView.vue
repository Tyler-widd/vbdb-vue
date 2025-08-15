<!-- views/Home/HomeView.vue -->
<script setup>
import { ref, onMounted, computed } from "vue";
import RankingSection from "./SideContent/RankingSection.vue";
import NewsCard from "../../component/NewsCard.vue";

// You can add any additional logic here if needed
const fetchTeamData = () => {
  // Your existing fetchTeamData logic
};

onMounted(() => {
  fetchTeamData();
});

const d2LatestItem = ref(null);
const d3LatestItem = ref(null);

// Computed property to determine if cards should be merged
const shouldMergeCards = computed(() => {
  if (!d2LatestItem.value || !d3LatestItem.value) {
    return false;
  }

  // Compare by GUID (most reliable) or title + pubDate
  return (
    d2LatestItem.value.guid === d3LatestItem.value.guid ||
    (d2LatestItem.value.title === d3LatestItem.value.title &&
      d2LatestItem.value.pubDate === d3LatestItem.value.pubDate)
  );
});

// Event handlers to receive latest items from NewsCard components
const onD2NewsLoaded = (newsData) => {
  d2LatestItem.value = newsData;
};

const onD3NewsLoaded = (newsData) => {
  d3LatestItem.value = newsData;
};
</script>

<template>
  <v-card-title class="pa-0 mb-2 text-center">VolleyballDatabased</v-card-title>
  <v-row dense>
    <!-- News Cards -->
    <!-- NCAA D1 -->
    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="NCAA Division I"
        :rss-url="'https://www.ncaa.com/news/volleyball-women/d1/rss.xml'"
        category="NCAA Division I Women's Volleyball"
      />
    </v-col>

    <!-- NAIA -->
    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="NAIA"
        :rss-url="'https://www.naia.org/sports/wvball/headlines-featured?feed=rss_2.0'"
        category="NAIA Women's Volleyball"
      />
    </v-col>
  </v-row>
  <v-row dense>
    <!-- CCCAA -->
    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="CCCAA"
        :rss-url="'https://3c2asports.org/sports/wvball/headlines-featured?feed=rss_2.0'"
        category="3C2A Women's Volleyball"
      />
    </v-col>

    <!-- Show merged card if stories are the same -->
    <v-col v-if="shouldMergeCards" cols="12" md="6" lg="4">
      <NewsCard
        ref="d2Card"
        division="NCAA Division II & III"
        :rss-url="'https://www.ncaa.com/news/volleyball-women/d2/rss.xml'"
        category="NCAA Division II & III Women's Volleyball"
        @news-loaded="onD2NewsLoaded"
      />
    </v-col>

    <!-- Show separate cards if stories are different -->
    <template v-else>
      <!-- NCAA D2 -->
      <v-col cols="12" md="6" lg="4">
        <NewsCard
          ref="d2Card"
          division="NCAA Division II"
          :rss-url="'https://www.ncaa.com/news/volleyball-women/d2/rss.xml'"
          category="NCAA Division II Women's Volleyball"
          @news-loaded="onD2NewsLoaded"
        />
      </v-col>

      <!-- NCAA D3 -->
      <v-col cols="12" md="6" lg="4">
        <NewsCard
          ref="d3Card"
          division="NCAA Division III"
          :rss-url="'https://www.ncaa.com/news/volleyball-women/d3/rss.xml'"
          category="NCAA Division III Women's Volleyball"
          @news-loaded="onD3NewsLoaded"
        />
      </v-col>
    </template>

    <!-- Hidden D3 card for comparison when merged -->
    <div v-if="shouldMergeCards" style="display: none">
      <NewsCard
        ref="d3Card"
        division="NCAA Division III"
        :rss-url="'https://www.ncaa.com/news/volleyball-women/d3/rss.xml'"
        category="NCAA Division III Women's Volleyball"
        @news-loaded="onD3NewsLoaded"
      />
    </div>
  </v-row>
  <v-row dense>
    <!-- NJCAA -->
    <v-col cols="12" md="6" lg="4">
      <NewsCard
        division="NJCAA"
        :rss-url="'https://www.njcaa.org/sports/wvball/headlines-featured?feed=rss_2.0'"
        category="NJCAA Women's Volleyball"
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
