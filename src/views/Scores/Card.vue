<!-- views/Scores/Card.vue -->
<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useGamesStore } from "@/composables/useGamesStore";

const router = useRouter();
const { smAndDown, xs } = useDisplay();

const {
  games, // Get the games directly from the store
  fetchGames, // Get the fetch function
  loading, // Get loading state from store
} = useGamesStore();

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
});

// Limit to 10 games max
const displayedGames = computed(() => {
  let filteredGames = games.value;

  // Apply filters if needed
  if (props.filters.search) {
    const searchTerm = props.filters.search.toLowerCase();
    filteredGames = filteredGames.filter(
      (game) =>
        game.team_1_name?.toLowerCase().includes(searchTerm) ||
        game.team_2_name?.toLowerCase().includes(searchTerm) ||
        game.location?.toLowerCase().includes(searchTerm)
    );
  }

  if (props.filters.division) {
    filteredGames = filteredGames.filter(
      (game) =>
        game.team_1_division === props.filters.division ||
        game.team_2_division === props.filters.division
    );
  }

  if (props.filters.conference) {
    filteredGames = filteredGames.filter(
      (game) =>
        game.team_1_conference === props.filters.conference ||
        game.team_2_conference === props.filters.conference
    );
  }

  // Sort by date (newest first) and limit to 10
  return filteredGames
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
});

// Format each game for display
const formattedGames = computed(() => {
  return displayedGames.value.map((game) => {
    // Get team information
    const team1 = {
      id: game.team_1_id,
      name: game.team_1_name || "TBD",
      short_name: game.team_1_school || game.team_1_name || "TBD",
      img: game.team_1_img,
      division: game.team_1_division,
      conference: game.team_1_conference,
    };

    const team2 = {
      id: game.team_2_id,
      name: game.team_2_name || "TBD",
      short_name: game.team_2_school || game.team_2_name || "TBD",
      img: game.team_2_img,
      division: game.team_2_division,
      conference: game.team_2_conference,
    };

    let team1SetsWon = 0;
    let team2SetsWon = 0;

    // Calculate individual set scores and count sets won
    const individualSets = [];
    for (let i = 1; i <= 5; i++) {
      const team1Score = game[`set_${i}_team_1`];
      const team2Score = game[`set_${i}_team_2`];

      if (team1Score !== null && team2Score !== null) {
        // Skip 0-0 scores
        if (team1Score === 0 && team2Score === 0) continue;

        individualSets.push({
          team1Score,
          team2Score,
          team1Won: team1Score > team2Score,
          team2Won: team2Score > team1Score,
          setNumber: i,
        });

        // Count sets won
        if (team1Score > team2Score) {
          team1SetsWon++;
        } else if (team2Score > team1Score) {
          team2SetsWon++;
        }
      }
    }

    // If we have a winner but no set scores calculated, use default 3-0 or 3-1 etc.
    if (game.winner_id && individualSets.length === 0) {
      if (isTeam1Winner) {
        team1SetsWon = 3;
        team2SetsWon = 0;
      } else if (isTeam2Winner) {
        team1SetsWon = 0;
        team2SetsWon = 3;
      }
    }

    const isTeam1Winner = team1SetsWon > team2SetsWon;
    const isTeam2Winner = team1SetsWon < team2SetsWon;

    // Format date
    const dateObj = new Date(game.date);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    return {
      ...game,
      team1,
      team2,
      team1SetsWon,
      team2SetsWon,
      isTeam1Winner,
      isTeam2Winner,
      individualSets,
      formattedDate,
      hasResult: individualSets.length > 0 || game.winner_id,
    };
  });
});

// Navigate to team page
const navigateToTeam = (teamId) => {
  if (teamId) {
    router.push(`/teams/${teamId}`);
  }
};

// Fetch games when component mounts
onMounted(async () => {
  await fetchGames();
});
</script>

<template>
  <!-- Loading state -->
  <v-card v-if="loading" class="" rounded-lg>
    <v-skeleton-loader
      v-for="i in 5"
      :key="i"
      type="list-item-three-line"
      class="mb-4"
    ></v-skeleton-loader>
  </v-card>

  <!-- Games Cards -->
  <v-card v-else class="pa-2 pt-4" rounded-lg>
    <div v-for="game in formattedGames" :key="game.match_id" class="mb-6">
      <!-- Date chip centered at top -->
      <v-row
        class="justify-center mb-n3"
        style="z-index: 2; position: relative"
      >
        <v-chip
          variant="elevated"
          size="small"
          class="bg-surface"
          style="border: 2px solid rgb(var(--v-theme-surface-variant))"
        >
          {{ game.formattedDate }}
          <v-chip v-if="game.time" size="x-small" class="ml-2" color="primary">
            {{ game.time }}
          </v-chip>
        </v-chip>
      </v-row>

      <!-- Main card -->
      <v-card variant="outlined" rounded="xl" class="pa-1">
        <v-row class="ma-0 align-center" no-gutters>
          <!-- Team 1 -->
          <v-col
            :cols="xs ? 5 : smAndDown ? 4 : 4"
            class="d-flex align-center"
            :class="smAndDown ? 'pa-1' : 'px-2'"
          >
            <v-avatar
              :size="xs ? 28 : smAndDown ? 32 : 40"
              rounded="0"
              class="mx-2"
            >
              <v-img
                v-if="game.team1.img"
                :src="game.team1.img"
                :alt="game.team1.name"
              />
              <v-icon v-else :size="xs ? 20 : 24">mdi-school</v-icon>
            </v-avatar>
            <div
              :class="smAndDown ? '' : 'mx-4'"
              class="d-flex flex-column align-start text-wrap"
            >
              <v-btn
                variant="text"
                density="compact"
                class="text-primary justify-start pa-0 text-truncate"
                :class="
                  xs
                    ? 'text-caption'
                    : smAndDown
                    ? 'text-caption'
                    : 'text-body-2'
                "
                @click="navigateToTeam(game.team_1_id)"
                :disabled="!game.team1.id"
                style="
                  min-width: 0;
                  max-width: 100%;
                  text-align: left;
                  white-space: normal !important;
                "
              >
                {{ smAndDown ? game.team1.short_name : game.team1.name }}
              </v-btn>
              <span
                v-if="game.team1.conference && !xs"
                class="text-caption font-italic text-medium-emphasis text-truncate"
              >
                {{ game.team1.conference }}
              </span>
            </div>
          </v-col>

          <!-- Score section -->
          <v-col
            :cols="smAndDown ? 2 : 4"
            class="d-flex flex-column align-center mt-2"
          >
            <div v-if="game.hasResult" class="d-flex align-center">
              <span
                class="font-weight-bold text-center"
                :class="[game.isTeam1Winner ? 'text-success' : '']"
                style="min-width: 16px"
              >
                {{ game.team1SetsWon }}
              </span>
              <span class="mx-1 text-medium-emphasis">-</span>

              <span
                class="font-weight-bold text-center"
                :class="[game.isTeam2Winner ? 'text-success' : '']"
                style="min-width: 16px"
              >
                {{ game.team2SetsWon }}
              </span>
            </div>
            <div
              v-else
              class="text-medium-emphasis"
              :class="xs ? 'text-caption' : 'text-body-2'"
            >
              TBD
            </div>

            <!-- Individual set scores - hide on xs -->
            <div
              v-if="game.individualSets.length > 0 && !xs"
              class="d-flex flex-wrap justify-center mt-1"
              style="gap: 8px"
            >
              <span
                v-for="(set, index) in game.individualSets"
                :key="set.setNumber"
                class="text-body-1"
              >
                <span
                  v-if="set.team1Won"
                  :class="{
                    'text-success fong-weight-strong': set.team1Won,
                  }"
                  >{{ set.team1Score }}
                </span>
                <span v-else class="font-weight-thin"
                  >{{ set.team1Score }} </span
                >-<span
                  v-if="set.team2Won"
                  :class="{
                    'text-success fong-weight-strong': set.team2Won,
                  }"
                  >{{ set.team2Score }}
                </span>
                <span v-else class="font-weight-thin"
                  >{{ set.team2Score }} </span
                ><span v-if="index < game.individualSets.length - 1"> , </span>
              </span>
            </div>

            <!-- Location - hide on xs -->
            <div
              v-if="game.location && !xs"
              class="text-caption text-medium-emphasis text-center mt-1"
            >
              {{ game.location }}
            </div>
          </v-col>

          <!-- Team 2 -->
          <v-col
            :cols="xs ? 5 : smAndDown ? 4 : 4"
            class="d-flex align-center justify-end"
            :class="smAndDown ? 'my-2' : ''"
          >
            <div
              :class="smAndDown ? '' : 'mx-4'"
              class="d-flex flex-column align-end text-wrap"
            >
              <v-btn
                variant="text"
                density="compact"
                class="text-primary justify-end pa-0 text-wrap"
                :class="
                  xs
                    ? 'text-caption'
                    : smAndDown
                    ? 'text-caption'
                    : 'text-body-2'
                "
                @click="navigateToTeam(game.team2.id)"
                :disabled="!game.team2.id"
                style="
                  min-width: 0;
                  max-width: 100%;
                  text-align: right;
                  white-space: normal !important;
                "
              >
                {{ smAndDown ? game.team2.short_name : game.team2.name }}
              </v-btn>
              <span
                v-if="game.team2.conference && !xs"
                class="text-caption font-italic text-medium-emphasis text-truncate"
              >
                {{ game.team2.conference }}
              </span>
            </div>
            <v-avatar
              :size="xs ? 28 : smAndDown ? 32 : 40"
              rounded="0"
              class="mx-2"
            >
              <v-img
                v-if="game.team2.img"
                :src="game.team2.img"
                :alt="game.team2.name"
              />
              <v-icon v-else :size="xs ? 20 : 24">mdi-school</v-icon>
            </v-avatar>
          </v-col>
        </v-row>
        <!-- Box score link for mobile -->
        <v-row
          v-if="game.box_score && !smAndDown"
          class="text-center justify-center mt-2"
          dense
          no-gutters
        >
          <v-btn
            variant="tonal"
            :href="game.box_score"
            target="_blank"
            prepend-icon="mdi-open-in-new"
            class="d-flex w-25 mb-1"
          >
            Box Score
          </v-btn>
        </v-row>

        <!-- Mobile-only expandable section for extra details -->
        <v-expand-transition>
          <div
            v-if="
              smAndDown &&
              (game.location ||
                game.individualSets.length > 0 ||
                game.box_score)
            "
          >
            <v-divider />
            <v-row class="ma-0 pa-2" no-gutters>
              <v-col cols="12">
                <!-- Individual set scores for mobile -->
                <div
                  v-if="game.individualSets.length > 0"
                  class="d-flex flex-wrap justify-center mb-2"
                  style="gap: 4px"
                >
                  <span
                    v-for="(set, index) in game.individualSets"
                    :key="set.setNumber"
                    class="text-body-1"
                  >
                    <span
                      v-if="set.team1Won"
                      :class="{
                        'text-success fong-weight-strong': set.team1Won,
                      }"
                      >{{ set.team1Score }}
                    </span>
                    <span v-else class="font-weight-thin"
                      >{{ set.team1Score }} </span
                    >-<span
                      v-if="set.team2Won"
                      :class="{
                        'text-success fong-weight-strong': set.team2Won,
                      }"
                      >{{ set.team2Score }}
                    </span>
                    <span v-else class="font-weight-thin"
                      >{{ set.team2Score }} </span
                    ><span v-if="index < game.individualSets.length - 1">
                      ,
                    </span>
                  </span>
                </div>

                <!-- Location for mobile -->
                <div
                  v-if="game.location"
                  class="text-caption text-medium-emphasis text-center"
                >
                  <v-icon size="x-small" class="mr-1">mdi-map-marker</v-icon>
                  {{ game.location }}
                </div>

                <!-- Box score link for mobile -->
                <div v-if="game.box_score" class="text-center mt-2">
                  <v-btn
                    variant="tonal"
                    :href="game.box_score"
                    target="_blank"
                    prepend-icon="mdi-open-in-new"
                    class="d-flex"
                  >
                    Box Score
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card>
    </div>

    <!-- No games message -->
    <div v-if="formattedGames.length === 0" class="text-center pa-8">
      <v-icon size="48" color="medium-emphasis">mdi-volleyball</v-icon>
      <p class="text-h6 mt-2 text-medium-emphasis">No games found</p>
      <p class="text-body-2 text-medium-emphasis">Try adjusting your filters</p>
    </div>

    <!-- Show more games message if limited to 10 -->
    <div
      v-if="formattedGames.length === 10 && games.length > 10"
      class="text-center pa-4"
    >
      <v-chip color="primary" variant="outlined">
        Showing latest 10 games of {{ games.length }} total
      </v-chip>
    </div>
  </v-card>
</template>

<style>
.v-btn__content {
  grid-area: content;
  justify-content: center !important;
  white-space: wrap !important;
}
</style>
