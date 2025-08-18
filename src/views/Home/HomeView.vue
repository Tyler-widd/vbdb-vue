<!-- views/Home/HomeView.vue -->
<script setup>
import { onMounted, ref } from "vue";
import NewsCard from "../../component/NewsCard.vue";
import RankingSection from "./SideContent/RankingSection.vue";

const fetchTeamData = () => {
  // Your existing fetchTeamData logic
};

onMounted(() => {
  fetchTeamData();
});

const activeTab = ref("ncaa");

const divisions = {
  ncaa: [
    {
      division: "NCAA Division I",
      rssUrl: "https://www.ncaa.com/news/volleyball-women/d1/rss.xml",
      category: "NCAA Division I Women's Volleyball",
    },
    {
      division: "NCAA Division II",
      rssUrl: "https://www.ncaa.com/news/volleyball-women/d2/rss.xml",
      category: "NCAA Division II Women's Volleyball",
    },
    {
      division: "NCAA Division III",
      rssUrl: "https://www.ncaa.com/news/volleyball-women/d3/rss.xml",
      category: "NCAA Division III Women's Volleyball",
    },
  ],
  naia: [
    {
      division: "NAIA",
      rssUrl:
        "https://www.naia.org/sports/wvball/headlines-featured?feed=rss_2.0",
      category: "NAIA Women's Volleyball",
    },
  ],
  njcaa: [
    {
      division: "NJCAA Division I",
      rssUrl:
        "https://www.njcaa.org/sports/wvball/headlines-featured?feed=rss_2.0",
      category: "NJCAA Division I Women's Volleyball",
    },
  ],
  cccaa: [
    {
      division: "CCCAA",
      rssUrl:
        "https://3c2asports.org/sports/wvball/headlines-featured?feed=rss_2.0",
      category: "3C2A Women's Volleyball",
    },
  ],
};
</script>

<template>
  <div>
    <v-tabs v-model="activeTab" grow>
      <v-tab value="ncaa">NCAA</v-tab>
      <v-tab value="naia">NAIA</v-tab>
      <v-tab value="njcaa">NJCAA</v-tab>
      <v-tab value="cccaa">CCCAA</v-tab>
    </v-tabs>
    <v-divider></v-divider>
    <v-tabs-window v-model="activeTab">
      <!-- NCAA Tab -->
      <v-tabs-window-item value="ncaa">
        <v-row dense class="mt-2">
          <v-col
            v-for="feed in divisions.ncaa"
            :key="feed.division"
            cols="12"
            md="4"
          >
            <NewsCard
              :division="feed.division"
              :rss-url="feed.rssUrl"
              :category="feed.category"
            />
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- NAIA Tab -->
      <v-tabs-window-item value="naia">
        <v-row dense class="mt-2">
          <v-col cols="12" md="6">
            <NewsCard
              :division="divisions.naia[0].division"
              :rss-url="divisions.naia[0].rssUrl"
              :category="divisions.naia[0].category"
            />
          </v-col>
          <v-col cols="12" md="6">
            <RankingSection
              :img="`https://naiastats.prestosports.com/assets/images/NAIA_Bridge_logo_whiteR.png`"
            />
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- NJCAA Tab -->
      <v-tabs-window-item value="njcaa">
        <v-row dense class="mt-2">
          <v-col
            v-for="feed in divisions.njcaa"
            :key="feed.division"
            cols="12"
            md="4"
          >
            <NewsCard
              :division="feed.division"
              :rss-url="feed.rssUrl"
              :category="feed.category"
            />
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- CCCAA Tab -->
      <v-tabs-window-item value="cccaa">
        <v-row dense class="mt-2">
          <v-col cols="12" md="6">
            <NewsCard
              :division="divisions.cccaa[0].division"
              :rss-url="divisions.cccaa[0].rssUrl"
              :category="divisions.cccaa[0].category"
            />
          </v-col>
          <v-col cols="12" md="6">
            <RankingSection
              :img="`https://www.cccaasports.org/assets/Alternative_Logo.png`"
            />
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- Rankings Tab -->
      <v-tabs-window-item value="rankings">
        <v-row dense class="mt-2">
          <v-col cols="12" md="3">
            <RankingSection
              :img="`https://content.sportslogos.net/logos/85/5463/full/national_collegiate_athletic_association_logo_secondary_2021_sportslogosnet-4441.png`"
            />
          </v-col>
          <!-- Add more ranking sections as needed -->
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>
