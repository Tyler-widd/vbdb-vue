<!-- views/Scores/Header.vue -->
<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import { debounce } from "@/utils/debounce";

const emit = defineEmits(["filter-change"]);

const { smAndDown } = useDisplay();

// API base URL - adjust this to your API URL
const API_BASE = "https://api.volleyballdatabased.com";

// Data refs
const allGames = ref([]);
const availableSeasons = ref([]);
const selectedSchool = ref(null);
const selectedDivision = ref(null);
const selectedConference = ref(null);
const selectedSeason = ref("2024-25");
const searchQuery = ref("");

// Get unique divisions from all games
const divisions = computed(() => {
  const divs = new Set();

  allGames.value.forEach((game) => {
    if (game.home_division) divs.add(game.home_division);
    if (game.away_division) divs.add(game.away_division);
  });

  return Array.from(divs)
    .sort()
    .map((div) => ({ title: div, value: div }));
});

// Debounce the filter change
const debouncedEmitFilterChange = debounce(() => {
  emitFilterChange();
}, 300);

// Filter conferences based on selected division
const conferences = computed(() => {
  const confs = new Set();

  allGames.value.forEach((game) => {
    // If division is selected, only include conferences from that division
    if (selectedDivision.value) {
      if (
        game.home_division === selectedDivision.value &&
        game.home_conference
      ) {
        confs.add(game.home_conference);
      }
      if (
        game.away_division === selectedDivision.value &&
        game.away_conference
      ) {
        confs.add(game.away_conference);
      }
    } else {
      // If no division selected, include all conferences
      if (game.home_conference) confs.add(game.home_conference);
      if (game.away_conference) confs.add(game.away_conference);
    }
  });

  return Array.from(confs)
    .sort()
    .map((conf) => ({ title: conf, value: conf }));
});

// Season options from database
const seasons = computed(() => {
  const seasonOptions = [
    { title: "All Seasons", value: null }, // Keep "All" option
  ];

  // Add all seasons from database
  availableSeasons.value.forEach((season) => {
    seasonOptions.push({
      title: season,
      value: season,
    });
  });

  return seasonOptions;
});

// Filter schools based on selected division and conference
const schoolOptions = computed(() => {
  const teams = new Map(); // Use Map to avoid duplicates

  allGames.value.forEach((game) => {
    // Process home team
    const homeTeam = {
      name: game.home_team_name,
      id: game.home_team_id,
      img: game.home_team_img,
      division: game.home_division,
      conference: game.home_conference,
    };

    // Process away team
    const awayTeam = {
      name: game.away_team_name,
      id: game.away_team_id,
      img: game.away_team_img,
      division: game.away_division,
      conference: game.away_conference,
    };

    // Check if teams match filters
    [homeTeam, awayTeam].forEach((team) => {
      if (!team.name || !team.id) return;

      let includeTeam = true;

      // Filter by division if selected
      if (selectedDivision.value && team.division !== selectedDivision.value) {
        includeTeam = false;
      }

      // Filter by conference if selected
      if (
        selectedConference.value &&
        team.conference !== selectedConference.value
      ) {
        includeTeam = false;
      }

      if (includeTeam) {
        teams.set(team.id, {
          title: team.name,
          value: team.id,
          subtitle: `${team.division} - ${team.conference}`,
          img: team.img,
          division: team.division,
          conference: team.conference,
        });
      }
    });
  });

  return Array.from(teams.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
});

// Fetch all games data to build filter options
const fetchAllGames = async () => {
  try {
    const response = await fetch(`${API_BASE}/megagames`);
    if (response.ok) {
      allGames.value = await response.json();
    } else {
      console.error("Failed to fetch games:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching games:", error);
  }
};

// Fetch available seasons from API
const fetchSeasons = async () => {
  try {
    const response = await fetch(`${API_BASE}/seasons`);
    if (response.ok) {
      availableSeasons.value = await response.json();

      // Only set default season if no season is currently selected
      // This prevents overriding the "All Seasons" choice
      if (
        availableSeasons.value.length > 0 &&
        selectedSeason.value === undefined
      ) {
        // You can choose to default to current season or keep as null for "All Seasons"
        selectedSeason.value = "2024-25"; // Or set to null for All Seasons default
      }
    } else {
      console.error("Failed to fetch seasons:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching seasons:", error);
  }
};

// Emit filter changes to parent
const emitFilterChange = () => {
  emit("filter-change", {
    school: selectedSchool.value,
    division: selectedDivision.value,
    conference: selectedConference.value,
    season: selectedSeason.value,
    search: searchQuery.value,
  });
};

// Watch for filter changes
const watchFilters = () => {
  emitFilterChange();
};

// Watch for division changes to reset conference and school if no longer valid
watch(selectedDivision, (newDivision) => {
  // Reset conference if it's no longer valid for the selected division
  if (newDivision && selectedConference.value) {
    const validConferences = conferences.value.map((c) => c.value);
    if (!validConferences.includes(selectedConference.value)) {
      selectedConference.value = null;
    }
  }

  // Reset school if it's no longer valid for the selected division
  if (selectedSchool.value) {
    const validSchools = schoolOptions.value.map((s) => s.value);
    if (!validSchools.includes(selectedSchool.value)) {
      selectedSchool.value = null;
    }
  }
});

// Watch for conference changes to check if selected school is still valid
watch(selectedConference, (newConference) => {
  if (selectedSchool.value) {
    const validSchools = schoolOptions.value.map((s) => s.value);
    if (!validSchools.includes(selectedSchool.value)) {
      selectedSchool.value = null;
    }
  }
});

// Use in watchers
watch(searchQuery, () => {
  debouncedEmitFilterChange();
});

onMounted(async () => {
  await fetchAllGames(); // Fetch games data first to build filter options
  await fetchSeasons();

  // Emit initial filter state after data is loaded
  setTimeout(() => {
    emitFilterChange();
  }, 100);
});
</script>

<template>
  <v-card color="surface" class="pa-4">
    <v-card-title class="text-h5 pa-0 pl-2"> Scores </v-card-title>

    <!-- First row: Division and Conference -->
    <v-row dense no-gutters>
      <v-col cols="12" md="6" class="pa-0">
        <v-autocomplete
          v-model="selectedDivision"
          :items="divisions"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Division"
          hide-details
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          density="compact"
          clearable
          @update:model-value="watchFilters"
        />
      </v-col>
      <v-col cols="12" md="6" class="pa-0">
        <v-autocomplete
          v-model="selectedConference"
          :items="conferences"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Conference"
          hide-details
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          density="compact"
          clearable
          @update:model-value="watchFilters"
        />
      </v-col>
    </v-row>

    <!-- Second row: Season and School -->
    <v-row dense no-gutters>
      <v-col cols="12" md="6" class="pa-0">
        <v-autocomplete
          v-model="selectedSeason"
          :items="seasons"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Season"
          hide-details
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          density="compact"
          @update:model-value="watchFilters"
        />
      </v-col>
      <v-col cols="12" md="6" class="pa-0">
        <v-autocomplete
          v-model="selectedSchool"
          :items="schoolOptions"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Teams"
          hide-details
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          density="compact"
          clearable
          @update:model-value="watchFilters"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-avatar size="32" tile class="mr-3">
                  <v-img
                    v-if="item.raw.img"
                    :src="item.raw.img"
                    :alt="item.raw.title"
                    contain
                  />
                  <v-icon v-else>mdi-school</v-icon>
                </v-avatar>
              </template>
              <v-list-item-subtitle>{{
                item.raw.subtitle
              }}</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-autocomplete>
      </v-col>
    </v-row>

    <!-- Third row: Search -->
    <v-row dense no-gutters>
      <v-col cols="12">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Search Teams"
          hide-details
          density="compact"
          clearable
          @update:model-value="watchFilters"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
