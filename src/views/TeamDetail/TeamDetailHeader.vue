<!-- views/TeamDetail/TeamDetailHeader.vue -->
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();
const route = useRoute();

const emit = defineEmits(["update:year"]);

const loading = ref(false);
const school = ref(null);
const selectedYear = ref("2024");
const gamesData = ref([]);

// Get the org_id from the route
const orgId = computed(() => route.params.id);

const props = defineProps({
  record: {
    type: String,
    default: "",
  },
});

// Generate year options from games data
const yearOptions = computed(() => {
  if (!gamesData.value.length) return ["2024", "2023", "2022"];

  const years = [
    ...new Set(
      gamesData.value.map((game) => {
        return game.date.split("/")[2];
      })
    ),
  ];

  return years.sort((a, b) => b - a); // Sort descending
});

// Fetch school data
const fetchSchoolData = async () => {
  loading.value = true;
  try {
    const response = await fetch("https://api.volleyballdatabased.com/schools");
    const data = await response.json();
    school.value = data.find((s) => s.org_id === orgId.value);
  } catch (error) {
    console.error("Error fetching school data:", error);
  } finally {
    loading.value = false;
  }
};

// Fetch games to get available years
const fetchGamesForYears = async () => {
  try {
    const response = await fetch(
      `https://api.volleyballdatabased.com/games/${orgId.value}`
    );
    if (response.ok) {
      const data = await response.json();
      gamesData.value = data;

      // Set default year to most recent year with data
      if (
        yearOptions.value.length > 0 &&
        !yearOptions.value.includes(selectedYear.value)
      ) {
        selectedYear.value = yearOptions.value[0];
      }
    }
  } catch (error) {
    console.error("Error fetching games for years:", error);
  }
};

const handleYearChange = (value) => {
  selectedYear.value = value;
  emit("update:year", value);
};

// Watch for route changes to reload data when navigating between teams
watch(orgId, (newOrgId) => {
  if (newOrgId) {
    // Reset state
    school.value = null;
    gamesData.value = [];
    selectedYear.value = "2024";

    // Fetch new data
    fetchSchoolData();
    fetchGamesForYears();
    emit("update:year", selectedYear.value);
  }
});

onMounted(() => {
  fetchSchoolData();
  fetchGamesForYears();
  emit("update:year", selectedYear.value);
});
</script>

<template>
  <!-- Loading state -->
  <v-row v-if="loading" justify="center" class="mt-8">
    <v-col cols="12" class="text-center">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-h6">Loading team information...</p>
    </v-col>
  </v-row>

  <!-- School not found -->
  <v-row v-else-if="!school" justify="center" class="mt-8">
    <v-col cols="12" sm="8" md="6">
      <v-card>
        <v-card-title class="text-h5 text-center">
          Team Not Found
        </v-card-title>
        <v-card-text class="text-center">
          <p>We couldn't find the team you're looking for.</p>
          <v-btn color="primary" to="/teams" class="mt-4">
            Back to Teams
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- School found - display content -->
  <v-row v-else>
    <v-col cols="12">
      <!-- Header Card with School Info -->
      <v-card class="mb-4 px-4 pt-4 pb-2">
        <v-row align="center">
          <v-col cols="auto">
            <v-avatar size="120">
              <v-img :src="school.img" :alt="school.name_official" cover />
            </v-avatar>
          </v-col>
          <v-col>
            <h1 class="text-h4 mb-2">{{ school.name_official }}</h1>
            <p class="text-body-1">
              {{ school.division }} | {{ school.conference }}
            </p>
          </v-col>
        </v-row>
        <v-col :cols="smAndDown ? 12 : 3">
          <v-select
            label="Season"
            v-model="selectedYear"
            :items="yearOptions"
            variant="outlined"
            density="comfortable"
            @update:model-value="handleYearChange"
          />
        </v-col>
        {{ selectedYear }} Record: {{ record }}
      </v-card>
    </v-col>
  </v-row>
</template>
