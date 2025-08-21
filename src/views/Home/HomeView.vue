<!-- views/Home/HomeView.vue -->
<script setup>
import { onMounted, ref } from "vue";
import NewsCard from "../../component/NewsCard.vue";
import RankingSection from "./SideContent/RankingSection.vue";
import { useAvcaData } from "../../composables/useAvcaData.js";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();
const fetchTeamData = () => {
  // Your existing fetchTeamData logic
};

onMounted(() => {
  fetchTeamData();
});

// Active tabs for each organization
const activeNcaaTab = ref("ncaa-d1");
const activeNaiaTab = ref("naia-d1");
const activeNjcaaTab = ref("njcaa-d1");
const activeCccaaTab = ref("cccaa-d1");
const panelAvca = ref();
const panelRpi = ref();

const activeTab = ref("ncaa");

// Use the AVCA data composable
const { loading, error, getRankingsByDivision } = useAvcaData();

const divisions = {
  ncaa: [
    {
      id: "ncaa-d1",
      division: "NCAA Division I",
      rssUrl: "https://www.ncaa.com/news/volleyball-women/d1/rss.xml",
      category: "NCAA Division I Women's Volleyball",
    },
    {
      id: "ncaa-d2",
      division: "NCAA Division II",
      rssUrl: "https://www.ncaa.com/news/volleyball-women/d2/rss.xml",
      category: "NCAA Division II Women's Volleyball",
    },
    {
      id: "ncaa-d3",
      division: "NCAA Division III",
      rssUrl: "https://www.ncaa.com/news/volleyball-women/d3/rss.xml",
      category: "NCAA Division III Women's Volleyball",
    },
  ],
  naia: [
    {
      id: "naia-d1",
      division: "NAIA",
      rssUrl:
        "https://www.naia.org/sports/wvball/headlines-featured?feed=rss_2.0",
      category: "NAIA Women's Volleyball",
    },
  ],
  njcaa: [
    {
      id: "njcaa-d1",
      division: "NJCAA Division I",
      rssUrl:
        "https://www.njcaa.org/sports/wvball/headlines-featured?feed=rss_2.0",
      category: "NJCAA Division I Women's Volleyball",
    },
  ],
  cccaa: [
    {
      id: "cccaa-d1",
      division: "CCCAA",
      rssUrl:
        "https://3c2asports.org/sports/wvball/headlines-featured?feed=rss_2.0",
      category: "3C2A Women's Volleyball",
    },
  ],
};

// Helper function to get division key for AVCA data
const getDivisionKey = (divisionName) => {
  // More specific matching - check for exact division patterns
  if (divisionName.includes("NCAA Division III")) return "iii";
  if (divisionName.includes("NCAA Division II")) return "ii";
  if (divisionName.includes("NCAA Division I")) return "i";

  // For non-NCAA divisions, you might want different keys
  if (divisionName.includes("NAIA")) return "naia";
  if (divisionName.includes("NJCAA")) return "njcaa";
  if (divisionName.includes("CCCAA")) return "cccaa";

  // Default fallback
  return "i";
};
</script>

<template>
  <div>
    <!-- Main Organization Tabs -->
    <v-tabs v-model="activeTab" grow>
      <v-tab value="ncaa">
        <v-img
          :src="`https://content.sportslogos.net/logos/85/5463/full/national_collegiate_athletic_association_logo_secondary_2021_sportslogosnet-4441.png`"
          width="75"
        />
      </v-tab>
      <v-tab value="naia">
        <v-img
          :src="`https://naiastats.prestosports.com/assets/images/NAIA_Bridge_logo_whiteR.png`"
          width="75"
        />
      </v-tab>
      <v-tab value="njcaa">
        <v-img
          :src="`https://www.njcaa.org/images/setup/footer-logo-njcaa.png?max_width=auto&max_height=auto&crop=false`"
          width="75"
        />
      </v-tab>
      <v-tab value="cccaa">
        <v-img
          :src="`https://www.cccaasports.org/assets/Alternative_Logo.png`"
          width="75"
        />
      </v-tab>
    </v-tabs>
    <v-divider></v-divider>

    <v-tabs-window v-model="activeTab">
      <!-- NCAA Tab -->
      <v-tabs-window-item value="ncaa">
        <div class="mt-2">
          <!-- NCAA Division Tabs -->
          <v-tabs
            v-model="activeNcaaTab"
            grow
            class="bg-indigo-darken-2 rounded-lg mt-4"
          >
            <v-tab
              v-for="feed in divisions.ncaa"
              :key="feed.id"
              :value="feed.id"
            >
              <span :class="smAndDown ? 'text-body-2' : 'text-h6'">
                {{ feed.division }}
              </span>
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeNcaaTab">
            <v-tabs-window-item
              v-for="feed in divisions.ncaa"
              :key="feed.id"
              :value="feed.id"
            >
              <div class="mt-4">
                <v-row>
                  <v-col cols="12" md="4">
                    <NewsCard
                      :division="feed.division"
                      :rss-url="feed.rssUrl"
                      :category="feed.category"
                    />
                  </v-col>
                  <!-- AVCA Rankings -->
                  <v-col cols="12" md="3" :class="smAndDown ? 'pt-0' : ''">
                    <v-expansion-panels v-model="panelRpi">
                      <v-expansion-panel>
                        <v-expansion-panel-title class="text-h6">
                          <v-btn
                            :href="`https://www.avca.org/polls-awards/polls/?_divisions=division-${getDivisionKey(
                              feed.division
                            )}-women`"
                            variant="tonal"
                            target="_blank"
                            @click.stop
                          >
                            AVCA Rankings
                          </v-btn>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div v-if="loading" class="text-center">
                            <v-progress-circular
                              indeterminate
                              color="primary"
                            ></v-progress-circular>
                            <p class="mt-2">Loading rankings...</p>
                          </div>

                          <div v-else-if="error" class="text-center text-error">
                            <v-icon>mdi-alert-circle</v-icon>
                            <p>Error loading rankings: {{ error }}</p>
                          </div>

                          <div v-else>
                            <div
                              v-for="team in getRankingsByDivision(
                                getDivisionKey(feed.division),
                                10
                              )"
                              :key="team.id"
                              class="d-flex align-center justify-space-between py-1 border-b"
                            >
                              <div class="d-flex align-center">
                                <span class="text-h6 text-primary mr-3">{{
                                  team.rank
                                }}</span>
                                <div>
                                  {{ team.school }}
                                  <div class="text-caption text-grey">
                                    Points: {{ team.total_points }}
                                    <span v-if="team.first_place_votes > 0">
                                      • First Place Votes:
                                      {{ team.first_place_votes }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-tabs-window-item>

      <!-- NAIA Tab -->
      <v-tabs-window-item value="naia">
        <div class="mt-2">
          <v-tabs-window v-model="activeNaiaTab">
            <v-tabs-window-item
              v-for="feed in divisions.naia"
              :key="feed.id"
              :value="feed.id"
            >
              <div class="mt-4">
                <v-row>
                  <v-col cols="12" md="4">
                    <NewsCard
                      :division="feed.division"
                      :rss-url="feed.rssUrl"
                      :category="feed.category"
                    />
                  </v-col>
                  <!-- AVCA Rankings -->
                  <v-col cols="12" md="3" :class="smAndDown ? 'pt-0' : ''">
                    <v-expansion-panels v-model="panelRpi">
                      <v-expansion-panel>
                        <v-expansion-panel-title class="text-h6">
                          <v-btn
                            :href="`https://www.avca.org/polls-awards/polls/?_divisions=division-${getDivisionKey(
                              feed.division
                            )}-women`"
                            variant="tonal"
                            target="_blank"
                            @click.stop
                          >
                            AVCA Rankings
                          </v-btn>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div v-if="loading" class="text-center">
                            <v-progress-circular
                              indeterminate
                              color="primary"
                            ></v-progress-circular>
                            <p class="mt-2">Loading rankings...</p>
                          </div>

                          <div v-else-if="error" class="text-center text-error">
                            <v-icon>mdi-alert-circle</v-icon>
                            <p>Error loading rankings: {{ error }}</p>
                          </div>

                          <div v-else>
                            <div
                              v-for="team in getRankingsByDivision(
                                getDivisionKey(feed.division),
                                10
                              )"
                              :key="team.id"
                              class="d-flex align-center justify-space-between py-1 border-b"
                            >
                              <div class="d-flex align-center">
                                <span class="text-h6 text-primary mr-3">{{
                                  team.rank
                                }}</span>
                                <div>
                                  {{ team.school }}
                                  <div class="text-caption text-grey">
                                    Points: {{ team.total_points }}
                                    <span v-if="team.first_place_votes > 0">
                                      • First Place Votes:
                                      {{ team.first_place_votes }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-tabs-window-item>

      <!-- NJCAA Tab -->
      <v-tabs-window-item value="njcaa">
        <div class="mt-2">
          <v-tabs-window v-model="activeNjcaaTab">
            <v-tabs-window-item
              v-for="feed in divisions.njcaa"
              :key="feed.id"
              :value="feed.id"
            >
              <div class="mt-4">
                <v-row>
                  <v-col cols="12" md="4">
                    <NewsCard
                      :division="feed.division"
                      :rss-url="feed.rssUrl"
                      :category="feed.category"
                    />
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-card>
                      <v-card-title class="text-h6">Standings</v-card-title>
                      <v-card-text>
                        <RankingSection />
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-tabs-window-item>

      <!-- CCCAA Tab -->
      <v-tabs-window-item value="cccaa">
        <div class="mt-2">
          <v-tabs-window v-model="activeCccaaTab">
            <v-tabs-window-item
              v-for="feed in divisions.cccaa"
              :key="feed.id"
              :value="feed.id"
            >
              <div class="mt-4">
                <v-row>
                  <v-col cols="12" md="4">
                    <NewsCard
                      :division="feed.division"
                      :rss-url="feed.rssUrl"
                      :category="feed.category"
                    />
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-card>
                      <v-card-title class="text-h6">Rankings</v-card-title>
                      <v-card-text>
                        <RankingSection
                          :img="`https://www.cccaasports.org/assets/Alternative_Logo.png`"
                        />
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>
