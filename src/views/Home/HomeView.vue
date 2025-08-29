<!-- views/Home/HomeView.vue -->
<script setup>
import { ref } from "vue";
import NewsCard from "./NewsCard.vue";

const activeTab = ref("ncaa");

const tabData = [
  {
    value: "ncaa",
    logoUrl:
      "https://content.sportslogos.net/logos/85/5463/full/national_collegiate_athletic_association_logo_secondary_2021_sportslogosnet-4441.png",
    width: 75,
  },
  {
    value: "naia",
    logoUrl:
      "https://naiastats.prestosports.com/assets/images/NAIA_Bridge_logo_whiteR.png",
    width: 75,
  },
  {
    value: "njcaa",
    logoUrl:
      "https://www.njcaa.org/images/setup/footer-logo-njcaa.png?max_width=auto&max_height=auto&crop=false",
    width: 75,
  },
  {
    value: "cccaa",
    logoUrl: "https://www.cccaasports.org/assets/Alternative_Logo.png",
    width: 75,
  },
];
</script>

<template>
  <!-- Main Organization Tabs -->
  <v-tabs v-model="activeTab" grow>
    <v-tab v-for="tab in tabData" :key="tab.value" :value="tab.value">
      <v-img :src="tab.logoUrl" :width="tab.width" />
    </v-tab>
  </v-tabs>

  <v-divider></v-divider>

  <v-tabs-window v-model="activeTab">
    <v-tabs-window-item
      v-for="tab in tabData"
      :key="tab.value"
      :value="tab.value"
    >
      <div>
        <NewsCard :active-tab="activeTab" />
      </div>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
