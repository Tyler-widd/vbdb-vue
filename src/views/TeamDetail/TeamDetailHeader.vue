<!-- views/TeamDetail/TeamDetailHeader.vue -->
<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { vbdbApi } from "@/services/vbdbApi";

const { smAndDown } = useDisplay();
const route = useRoute();

const emit = defineEmits(["update:year"]);

const loading = ref(false);
const school = ref(null);
const selectedYear = ref("2025");

// Get the team_id from the route
const teamId = computed(() => route.params.id);

const props = defineProps({
  record: {
    type: String,
    default: "",
  },
});

// Fetch school data
const fetchSchoolData = async () => {
  loading.value = true;
  try {
    const response = await vbdbApi.getTeams();
    const data = response.data;
    school.value = data.find((s) => s.team_id === teamId.value);
  } catch (error) {
    console.error("Error fetching school data:", error);
  } finally {
    loading.value = false;
  }
};

const formatConference = (conference) => {
  if (conference && conference.includes(".0")) {
    return `Region ${conference.replace(".0", "")}`;
  }
  return conference;
};

// Watch for route changes to reload data when navigating between teams
watch(teamId, (newteamId) => {
  if (newteamId) {
    // Reset state
    school.value = null;
    // Fetch new data
    fetchSchoolData();
    emit("update:year", selectedYear.value);
  }
});

onMounted(() => {
  fetchSchoolData();
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
  <v-row v-else dense no-gutters>
    <v-col cols="12">
      <!-- Header Card with School Info -->
      <v-card class="mb-4 pa-2">
        <v-row class="align-center">
          <v-col cols="auto">
            <v-avatar :size="smAndDown ? '80' : '120'">
              <v-img :src="school.logo" :alt="school.name_official" cover />
            </v-avatar>
          </v-col>
          <v-col>
            <div
              :class="
                smAndDown ? 'pa-0 text-h5 text-wrap pb-1' : 'pa-0 text-h4 pb-1'
              "
            >
              {{ school.name }}
            </div>
            <div class="text-body-1">
              {{ school.division }} |
              {{ formatConference(school.conference) }}
            </div>
            <div class="text-body-1">Record: {{ record }}</div>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>
