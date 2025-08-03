<!-- views/Players/PlayersHeader.vue -->
<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { usePlayersData } from "@/composables/usePlayersData";

const { smAndDown } = useDisplay();
const { loading, error, getAllPlayers } = usePlayersData();

const emit = defineEmits([
  "update:division",
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
});

const selectedDivision = ref(null);
const selectedConference = ref(null);
const selectedSchool = ref(null);
const searchText = ref("");
const allPlayers = ref([]);

// Fetch all players on component mount
onMounted(async () => {
  try {
    allPlayers.value = await getAllPlayers();
  } catch (err) {
    console.error("Error loading players:", err);
  }
});

// Get unique divisions from players data
const divisions = computed(() => {
  const playersToFilter =
    props.players.length > 0 ? props.players : allPlayers.value;
  const uniqueDivisions = [
    ...new Set(
      playersToFilter
        .map((player) => player.division || player.school?.division)
        .filter(Boolean)
    ),
  ];
  return uniqueDivisions.sort();
});

// Format conference name
const formatConference = (conference) => {
  if (conference && conference.includes(".0")) {
    return `Region ${conference.replace(".0", "")}`;
  }
  return conference;
};

// Get conferences filtered by selected division
const conferences = computed(() => {
  let playersToFilter =
    props.players.length > 0 ? props.players : allPlayers.value;

  // If a division is selected, filter players by that division
  if (selectedDivision.value) {
    playersToFilter = playersToFilter.filter(
      (player) =>
        player.division === selectedDivision.value ||
        player.school?.division === selectedDivision.value
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

// Get schools filtered by selected division and conference
const schools = computed(() => {
  let playersToFilter =
    props.players.length > 0 ? props.players : allPlayers.value;

  // Filter by division if selected
  if (selectedDivision.value) {
    playersToFilter = playersToFilter.filter(
      (player) =>
        player.division === selectedDivision.value ||
        player.school?.division === selectedDivision.value
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

// Watch for division changes to reset conference and school if needed
watch(selectedDivision, (newDivision) => {
  // Reset conference if it's not available in the new division
  if (
    selectedConference.value &&
    !conferences.value.includes(selectedConference.value)
  ) {
    selectedConference.value = null;
  }

  // Reset school if it's not available in the new division
  if (selectedSchool.value && !schools.value.includes(selectedSchool.value)) {
    selectedSchool.value = null;
  }
});

// Watch for conference changes to reset school if needed
watch(selectedConference, (newConference) => {
  // Reset school if it's not available in the new conference
  if (selectedSchool.value && !schools.value.includes(selectedSchool.value)) {
    selectedSchool.value = null;
  }
});

const handleDivisionChange = (value) => {
  selectedDivision.value = value;
  emit("update:division", value);
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
          label="Division"
          v-model="selectedDivision"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="divisions"
          :disabled="props.loading || loading"
          clearable
          @update:model-value="handleDivisionChange"
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
          label="Search players"
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
