<!-- views/Players/PlayersHeader.vue -->
<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { usePlayersData } from "../composables/usePlayersData";

const { smAndDown } = useDisplay();
const { loading, error, getAllPlayers } = usePlayersData();

const emit = defineEmits([
  "update:divisions",
  "update:conference",
  "update:school",
  "update:search",
]);

const props = defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  divisions: {
    type: Array,
    default: () => ["D-I", "D-II", "D-III"], // Array of selected divisions
  },
});

const selectedDivisions = ref([...props.divisions]); // Array of selected divisions
const selectedConference = ref(null);
const selectedSchool = ref(null);
const searchText = ref("");
const allPlayers = ref([]);

// Fetch all players from all divisions on component mount
onMounted(async () => {
  try {
    // Fetch players from all divisions to populate dropdowns
    const divisions = ["D-I", "D-II", "D-III"];
    const promises = divisions.map(async (division) => {
      try {
        const response = await fetch(
          `https://api.volleyballdatabased.com/players?division=${division}&per_page=1000`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.players || [];
      } catch (err) {
        console.error(`Error loading ${division} players:`, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    allPlayers.value = results.flat();
  } catch (err) {
    console.error("Error loading players:", err);
  }
});

// Watch for divisions prop changes
watch(
  () => props.divisions,
  (newVal) => {
    selectedDivisions.value = [...newVal];
  }
);

// Available divisions for selection
const availableDivisions = computed(() => {
  return ["D-I", "D-II", "D-III"];
});

// Format conference name
const formatConference = (conference) => {
  if (conference && conference.includes(".0")) {
    return `Region ${conference.replace(".0", "")}`;
  }
  return conference;
};

// Get conferences filtered by selected divisions
const conferences = computed(() => {
  let playersToFilter = allPlayers.value;

  // Filter by selected divisions
  if (
    selectedDivisions.value.length > 0 &&
    selectedDivisions.value.length < 3
  ) {
    playersToFilter = playersToFilter.filter(
      (player) =>
        selectedDivisions.value.includes(player.division) ||
        selectedDivisions.value.includes(player.school?.division)
    );
  }

  const uniqueConferences = [
    ...new Set(
      playersToFilter
        .map((player) =>
          formatConference(player.conference || player.school?.conference)
        )
        .filter(Boolean)
    ),
  ];
  return uniqueConferences.sort();
});

// Get schools filtered by selected divisions and conference
const schools = computed(() => {
  let playersToFilter = allPlayers.value;

  // Filter by selected divisions
  if (
    selectedDivisions.value.length > 0 &&
    selectedDivisions.value.length < 3
  ) {
    playersToFilter = playersToFilter.filter(
      (player) =>
        selectedDivisions.value.includes(player.division) ||
        selectedDivisions.value.includes(player.school?.division)
    );
  }

  // Filter by conference if selected
  if (selectedConference.value) {
    playersToFilter = playersToFilter.filter((player) => {
      const playerConference = formatConference(
        player.conference || player.school?.conference
      );
      return playerConference === selectedConference.value;
    });
  }

  const uniqueSchools = [
    ...new Set(
      playersToFilter
        .map((player) => player.school?.name || player.school)
        .filter(Boolean)
    ),
  ];
  return uniqueSchools.sort();
});

// Watch for divisions changes to reset conference and school if needed
watch(
  selectedDivisions,
  (newDivisions) => {
    // Reset conference if it's not available in the new divisions
    if (
      selectedConference.value &&
      !conferences.value.includes(selectedConference.value)
    ) {
      selectedConference.value = null;
    }

    // Reset school if it's not available in the new divisions
    if (selectedSchool.value && !schools.value.includes(selectedSchool.value)) {
      selectedSchool.value = null;
    }
  },
  { deep: true }
);

// Watch for conference changes to reset school if needed
watch(selectedConference, (newConference) => {
  // Reset school if it's not available in the new conference
  if (selectedSchool.value && !schools.value.includes(selectedSchool.value)) {
    selectedSchool.value = null;
  }
});

// Remove the all divisions toggle watcher
// (No longer needed)

const handleDivisionsChange = (value) => {
  selectedDivisions.value = value;
  emit("update:divisions", value);
};

const handleConferenceChange = (value) => {
  selectedConference.value = value;
  emit("update:conference", value);
};

const handleSchoolChange = (value) => {
  selectedSchool.value = value;
  emit("update:school", value);
};

const handleSearchChange = (value) => {
  searchText.value = value;
  emit("update:search", value);
};
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <v-card-title class="pt-0">Players</v-card-title>
    <v-row dense no-gutters class="pa-0">
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Divisions"
          v-model="selectedDivisions"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="availableDivisions"
          :disabled="props.loading || loading"
          multiple
          clearable
          @update:model-value="handleDivisionsChange"
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Conference"
          v-model="selectedConference"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :items="conferences"
          :disabled="props.loading || loading"
          clearable
          @update:model-value="handleConferenceChange"
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="School"
          v-model="selectedSchool"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="schools"
          :disabled="props.loading || loading"
          clearable
          @update:model-value="handleSchoolChange"
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-text-field
          label="Search players by name..."
          v-model="searchText"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          prepend-inner-icon="mdi-magnify"
          :disabled="props.loading || loading"
          clearable
          @update:model-value="handleSearchChange"
        />
      </v-col>
    </v-row>

    <!-- Error display -->
    <v-alert v-if="error" type="error" class="mt-2" dismissible>
      {{ error }}
    </v-alert>
  </v-card>
</template>
