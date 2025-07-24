<!-- Teams/Header.vue -->
<script setup>
import { computed } from "vue";

// Define props to receive data from parent
const props = defineProps({
  schools: {
    type: Array,
    default: () => [],
  },
  selectedSchool: {
    type: String,
    default: null,
  },
  searchQuery: {
    type: String,
    default: "",
  },
  selectedDivision: {
    type: String,
    default: null,
  },
  selectedConference: {
    type: String,
    default: null,
  },
  filteredConferences: {
    type: Array,
    default: () => [],
  },
});

// Get unique divisions from schools data
const divisionItems = computed(() => {
  return [...new Set(props.schools.map((school) => school.division))]
    .filter(Boolean)
    .sort();
});

// Define emits to communicate with parent
const emit = defineEmits([
  "update:selectedSchool",
  "update:searchQuery",
  "update:selectedDivision",
  "update:selectedConference",
]);

// Handle autocomplete update
const onAutocompleteUpdate = (value) => {
  emit("update:selectedSchool", value);
};

// Handle search input update
const onSearchUpdate = (value) => {
  emit("update:searchQuery", value);
  if (!value) {
    emit("update:selectedSchool", null); // Clear selection when search is cleared
  }
};

// Handle division selection
const onDivisionUpdate = (value) => {
  emit("update:selectedDivision", value);
};

// Handle conference selection
const onConferenceUpdate = (value) => {
  emit("update:selectedConference", value);
};
</script>

<template>
  <v-card color="surface" class="pa-4">
    <v-card-title class="text-h5 pa-0 pl-2"> Schools </v-card-title>

    <!-- Division and Conference Filters -->
    <v-row dense no-gutters>
      <v-col cols="6" class="pa-0">
        <v-autocomplete
          :model-value="selectedDivision"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          :items="divisionItems"
          flat
          label="Division"
          hide-details
          clearable
          class="mb-2 mr-2"
          density="compact"
          @update:modelValue="onDivisionUpdate"
        />
      </v-col>
      <v-col cols="6" class="pa-0">
        <v-autocomplete
          :model-value="selectedConference"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded
          :items="filteredConferences"
          flat
          label="Conference"
          hide-details
          clearable
          class="mb-2 ml-2"
          density="compact"
          :disabled="filteredConferences.length === 0"
          @update:modelValue="onConferenceUpdate"
        />
      </v-col>
    </v-row>

    <!-- Search Bar with Autocomplete -->
    <v-autocomplete
      :model-value="selectedSchool"
      :search="searchQuery"
      prepend-inner-icon="mdi-magnify"
      label="Search schools"
      variant="outlined"
      rounded
      clearable
      flat
      hide-details
      density="compact"
      item-title="name_official"
      item-value="name_official"
      :items="schools"
      @update:modelValue="onAutocompleteUpdate"
      @update:search="onSearchUpdate"
    />
  </v-card>
</template>
