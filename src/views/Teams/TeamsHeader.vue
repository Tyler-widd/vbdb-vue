<!-- views/Teams/TeamsHeader.vue -->
<script setup>
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const emit = defineEmits([
  "update:division",
  "update:conference",
  "update:search",
]);

const props = defineProps({
  schools: {
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
const searchText = ref("");

// Get unique divisions
const divisions = computed(() => {
  const uniqueDivisions = [
    ...new Set([
      "NAIA",
      "D-I",
      "D-II",
      "D-III",
      "CCCAA",
      "NJCAA D-1",
      "NJCAA D-2",
      "NJCAA D-3",
    ]),
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
  let schoolsToFilter = props.schools;

  // If a division is selected, filter schools by that division
  if (selectedDivision.value) {
    schoolsToFilter = props.schools.filter(
      (school) => school.division === selectedDivision.value,
    );
  }

  const uniqueConferences = [
    ...new Set(
      schoolsToFilter.map((school) => formatConference(school.conference)),
    ),
  ];
  return uniqueConferences.sort();
});

// Watch for division changes to reset conference if needed
watch(selectedDivision, (newDivision) => {
  // Check if current conference exists in the filtered list
  if (
    selectedConference.value &&
    !conferences.value.includes(selectedConference.value)
  ) {
    selectedConference.value = null;
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

const handleSearchChange = (value) => {
  searchText.value = value;
  emit("update:search", value);
};
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <v-card-title class="pt-0">Teams</v-card-title>
    <v-row dense no-gutters class="pa-0">
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Division"
          v-model="selectedDivision"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="divisions"
          :disabled="loading"
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
          :disabled="loading"
          clearable
          @update:model-value="handleConferenceChange"
        />
      </v-col>
      <v-col cols="12">
        <v-text-field
          label="Search teams"
          v-model="searchText"
          prepend-inner-icon="mdi-magnify"
          :disabled="loading"
          clearable
          @update:model-value="handleSearchChange"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
