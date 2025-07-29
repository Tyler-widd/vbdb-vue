<!-- src/views/Teams/TeamsTable.vue -->
<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const props = defineProps({
  schools: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  search: {
    type: String,
    default: "",
  },
  divisionFilter: {
    type: String,
    default: null,
  },
  conferenceFilter: {
    type: String,
    default: null,
  },
});

// Define table headers
const headers = [{ title: "School", key: "name_official", sortable: true }];

// Format conference name
const formatConference = (conference) => {
  if (conference && conference.includes(".0")) {
    return `Region ${conference.replace(".0", "")}`;
  }
  return conference;
};

// Filter schools based on current filters
const filteredSchools = computed(() => {
  let filtered = props.schools;

  // Filter by division
  if (props.divisionFilter) {
    filtered = filtered.filter(
      (school) => school.division === props.divisionFilter
    );
  }

  // Filter by conference - need to compare formatted conference names
  if (props.conferenceFilter) {
    filtered = filtered.filter(
      (school) => formatConference(school.conference) === props.conferenceFilter
    );
  }

  // Filter by search text
  if (props.search) {
    const searchLower = props.search.toLowerCase();
    filtered = filtered.filter(
      (school) =>
        (school.name_official &&
          school.name_official.toLowerCase().includes(searchLower)) ||
        (school.school_short &&
          school.school_short.toLowerCase().includes(searchLower)) ||
        (school.division &&
          school.division.toLowerCase().includes(searchLower)) ||
        (school.conference &&
          school.conference.toLowerCase().includes(searchLower)) ||
        (school.conference &&
          formatConference(school.conference)
            .toLowerCase()
            .includes(searchLower))
    );
  }

  // Sort by school name
  return filtered.sort((a, b) =>
    a.name_official.localeCompare(b.name_official)
  );
});
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="filteredSchools"
      :loading="loading"
      :items-per-page="10"
      no-data-text="No teams found"
      loading-text="Loading teams..."
    >
      <template v-slot:header.name_official>
        <span class="ml-2">School</span></template
      >
      <!-- School name with logo -->
      <template v-slot:item.name_official="{ item }">
        <div class="d-flex align-center py-2 ml-2">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-3">
            <v-img :src="item.img" :alt="item.name_official" cover />
          </v-avatar>
          <div class="d-flex flex-column text-truncate">
            <v-btn
              class="justify-start pa-0"
              variant="text"
              :size="smAndDown ? 'small' : 'default'"
              :to="`/teams/${item.org_id}`"
            >
              {{ item.name_official }}
            </v-btn>
            <span class="text-caption text-grey">
              {{ formatConference(item.conference) }} |
              {{ item.division }}
            </span>
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
