<!-- views/Schedule/Header.vue -->
<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();
const props = defineProps({
  scheduleData: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["filter-change"]);

// Filter refs
const selectedSchool = ref(null);
const selectedDivision = ref(null);
const selectedConference = ref(null);
const selectedSeason = ref("2024-25");
const searchQuery = ref("");

// Extract unique teams from schedule data
const teams = computed(() => {
  const teamMap = new Map();

  props.scheduleData.forEach((game) => {
    // Add team 1 (fixing the data structure issues)
    if (!teamMap.has(game.team_1_id)) {
      teamMap.set(game.team_1_id, {
        id: game.team_1_id,
        name: game.team_1_name,
        longname: game.team_1_longname || game.team_1_name, // fallback
        division: game.team_1_division,
        conference: game.team_1_conference,
        img: game.team_1_img,
        coach: game.team_1_coach,
      });
    }

    // Add team 2
    if (!teamMap.has(game.team_2_id)) {
      teamMap.set(game.team_2_id, {
        id: game.team_2_id,
        name: game.team_2_name,
        longname: game.team_2_longname || game.team_2_name, // fallback
        division: game.team_2_division,
        conference: game.team_2_conference,
        img: game.team_2_img,
        coach: game.team_2_coach,
      });
    }
  });

  return Array.from(teamMap.values()).filter((team) => team.id && team.name);
});

// All divisions
const allDivisions = computed(() => {
  const divs = ["D-I", "CCCAA"];
  return divs.map((div) => ({ title: div, value: div }));
});

// Conferences filtered by selected division
const availableConferences = computed(() => {
  let filteredTeams = teams.value;

  // If division is selected, filter teams by division first
  if (selectedDivision.value) {
    filteredTeams = teams.value.filter(
      (team) => team.division === selectedDivision.value
    );
  }

  const confs = [
    ...new Set(filteredTeams.map((team) => team.conference).filter(Boolean)),
  ];
  return confs.map((conf) => ({ title: conf, value: conf }));
});

// Teams filtered by division and conference
const availableTeams = computed(() => {
  let filteredTeams = teams.value;

  // Filter by division
  if (selectedDivision.value) {
    filteredTeams = filteredTeams.filter(
      (team) => team.division === selectedDivision.value
    );
  }

  // Filter by conference
  if (selectedConference.value) {
    filteredTeams = filteredTeams.filter(
      (team) => team.conference === selectedConference.value
    );
  }

  return filteredTeams.map((team) => ({
    title: team.longname,
    value: team.id,
    subtitle: team.name,
    img: team.img,
  }));
});

// Handle division change - reset dependent filters
const onDivisionChange = () => {
  selectedConference.value = null;
  selectedSchool.value = null;
  emitFilterChange();
};

// Handle conference change - reset school filter
const onConferenceChange = () => {
  selectedSchool.value = null;
  emitFilterChange();
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
</script>

<template>
  <v-card color="surface" class="pa-4">
    <v-card-title class="text-h5 pa-0 pl-2"> Schedule </v-card-title>

    <!-- First row: Division and Conference -->
    <v-row dense no-gutters>
      <v-col cols="12" md="6" class="pa-0">
        <v-autocomplete
          v-model="selectedDivision"
          :items="allDivisions"
          :loading="loading"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Division"
          hide-details
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          density="compact"
          clearable
          @update:model-value="onDivisionChange"
        />
      </v-col>
      <v-col cols="12" md="6" class="pa-0">
        <v-autocomplete
          v-model="selectedConference"
          :items="availableConferences"
          :loading="loading"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Conference"
          hide-details
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          density="compact"
          clearable
          @update:model-value="onConferenceChange"
        />
      </v-col>
    </v-row>

    <!-- Second row: School and Search -->
    <v-row dense no-gutters>
      <v-col cols="12" md="6" class="pa-0">
        <v-autocomplete
          v-model="selectedSchool"
          :items="availableTeams"
          :loading="loading"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Teams"
          hide-details
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          density="compact"
          clearable
          @update:model-value="emitFilterChange"
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
      <v-col cols="12" md="6" class="pa-0">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          flat
          label="Search Teams"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          hide-details
          density="compact"
          clearable
          @update:model-value="emitFilterChange"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
