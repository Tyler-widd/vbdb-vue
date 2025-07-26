<!-- Teams/TeamsTable.vue -->
<script setup>
import { useRouter } from "vue-router";

import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();

// Define props to receive data from parent
const props = defineProps({
  filteredSchools: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Table headers
const headers = [
  {
    title: "School",
    key: "name_official",
    sortable: true,
  },
  {
    title: smAndDown ? "Div" : "Division",
    key: "division",
    sortable: true,
  },
  {
    title: smAndDown ? "Conf" : "Conference",
    key: "conference",
    sortable: true,
  },
];

// Define emits for two-way binding
const emit = defineEmits(["update:page"]);

// Router instance for navigation
const router = useRouter();

// Handle page updates
const updatePage = (newPage) => {
  emit("update:page", newPage);
};

// Handle team click - navigate to team detail page
const goToTeam = (team) => {
  // You can use team.id or another unique identifier
  // Assuming your team object has an 'id' field
  router.push({
    name: "TeamDetail",
    params: {
      id: team.org_id || team.name_official.toLowerCase().replace(/\s+/g, "-"),
    },
  });
};
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="filteredSchools"
    :hide-default-footer="false"
    :loading="loading"
    @update:page="updatePage"
    density="compact"
    class="mt-4 rounded-lg"
    no-data-text="No schools found"
  >
    <template v-slot:header.name_official="{ column }">
      <span class="px-6 font-weight-medium">
        {{ column.title }}
      </span>
    </template>
    <!-- Custom school name column -->
    <template v-slot:item.name_official="{ item }">
      <div class="d-flex align-center">
        <v-avatar :size="smAndDown ? '40' : '50'" class="ma-1" tile>
          <v-img :src="item.img" :alt="item.name_official">
            <!-- Fallback if image fails to load -->
            <template v-slot:error>
              <v-icon color="grey">mdi-school</v-icon>
            </template>
          </v-img>
        </v-avatar>
        <div
          :class="smAndDown ? '' : 'mx-4'"
          class="d-flex flex-column text-wrap"
        >
          <v-btn
            variant="text"
            :class="smAndDown ? 'text-body-2' : 'text-body-1 font-weight-light'"
            @click="goToTeam(item)"
          >
            {{ smAndDown ? item.school_short : item.name_official }}
          </v-btn>
        </div>
      </div>
    </template>

    <!-- Loading state -->
    <template v-slot:loading>
      <v-skeleton-loader type="table-row@10" />
    </template>
  </v-data-table>
</template>

<style>
.v-table__wrapper table tbody tr td,
.v-table__wrapper table thead tr th {
  padding: 0px 0px !important;
}
</style>
