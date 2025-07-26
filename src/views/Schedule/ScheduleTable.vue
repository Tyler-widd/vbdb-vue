<!-- views/Schedule/ScheduleTable.vue -->
<script setup>
import { computed, ref } from "vue";
import { formatDate } from "@/helpers/formatDate";
import { useDisplay } from "vuetify";

const { smAndDown, xs } = useDisplay();

const props = defineProps({
  scheduleData: {
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
  filterSchedule: {
    type: Function,
    required: true,
  },
});

// Define table headers
const headers = [
  { title: "Date", key: "date", sortable: true },
  { title: "Team 1", key: "team_1", sortable: false, maxWidth: "140px" },
  { title: "Team 2", key: "team_2", sortable: false, maxWidth: "140px" },
];

// Pagination state
const page = ref(1);
const itemsPerPage = ref(10);

// Filter the schedule data based on current filters and sort by date
const filteredSchedule = computed(() => {
  const filtered = props.filterSchedule(
    props.scheduleData,
    props.search,
    props.divisionFilter,
    props.conferenceFilter
  );

  // Sort by date in ascending order
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });
});

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(filteredSchedule.value.length / itemsPerPage.value);
});

// Get current page items
const paginatedSchedule = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSchedule.value.slice(start, end);
});

// Pagination info text
const paginationInfo = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    page.value * itemsPerPage.value,
    filteredSchedule.value.length
  );
  const total = filteredSchedule.value.length;

  if (total === 0) return "No items";
  return `${start}-${end} of ${total}`;
});

// Format time for better display
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return "Invalid time";
  }

  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Pagination methods
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++;
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value--;
  }
};

const goToPage = (pageNum) => {
  page.value = pageNum;
};

// Items per page options
const itemsPerPageOptions = xs.value ? [5, 10, 25] : [10, 25, 50, 100];

// Watch for filter changes and reset to page 1
const resetPage = () => {
  page.value = 1;
};
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="headers"
      :items="paginatedSchedule"
      :loading="loading"
      :items-per-page="-1"
      hide-default-footer
      no-data-text="No games scheduled"
      loading-text="Loading schedule..."
      @update:sort-by="resetPage"
    >
      <!-- Custom date column name -->
      <template v-slot:header.date> <span class="ml-2">Date</span></template>

      <!-- Custom date column -->
      <template v-slot:item.date="{ item }">
        <div class="text-body-2 d-flex flex-column ml-2">
          <div>{{ formatDate(item.date) }}</div>
          <div class="text-caption text-grey">{{ formatTime(item.time) }}</div>
        </div>
      </template>

      <!-- Team 1 - Centered version -->
      <template v-slot:item.team_1="{ item }">
        <div class="d-flex align-center">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-3">
            <v-img :src="item.team_1_img" :alt="item.team_1_name" />
          </v-avatar>
          <div class="d-flex flex-column text-truncate">
            <v-btn
              class="justify-start pa-0"
              variant="text"
              :size="smAndDown ? 'small' : 'default'"
            >
              {{ item.team_1_name }}
            </v-btn>
            <div class="text-caption text-grey justify-start">
              {{ item.team_1_conference }}
            </div>
          </div>
        </div>
      </template>

      <!-- Team 2 - Centered version -->
      <template v-slot:item.team_2="{ item }">
        <div class="d-flex align-center">
          <v-avatar :size="smAndDown ? '24' : '32'" class="mr-3">
            <v-img :src="item.team_2_img" :alt="item.team_2_name" />
          </v-avatar>
          <div class="d-flex flex-column text-truncate">
            <v-btn
              class="justify-start pa-0"
              variant="text"
              :size="smAndDown ? 'small' : 'default'"
            >
              {{ item.team_2_name }}
            </v-btn>
            <div class="text-caption text-grey justify-start">
              {{ item.team_2_conference }}
            </div>
          </div>
        </div>
      </template>
    </v-data-table>

    <!-- Custom Pagination -->
    <v-divider />

    <!-- Mobile pagination (xs screens) -->
    <div v-if="xs" class="custom-pagination-mobile pa-3">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-caption">{{ paginationInfo }}</span>
        <v-select
          v-model="itemsPerPage"
          :items="itemsPerPageOptions"
          density="compact"
          :prepend-inner-icon="false"
          variant="outlined"
          hide-details
          class="items-per-page-select"
          @update:model-value="resetPage"
        />
      </div>
      <div class="d-flex align-center justify-center">
        <v-btn
          icon="mdi-chevron-double-left"
          size="small"
          variant="text"
          :disabled="page === 1"
          @click="goToPage(1)"
        />
        <v-btn
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          :disabled="page === 1"
          @click="prevPage"
        />
        <span class="mx-3 text-body-2">{{ page }} / {{ totalPages }}</span>
        <v-btn
          icon="mdi-chevron-right"
          size="small"
          variant="text"
          :disabled="page === totalPages"
          @click="nextPage"
        />
        <v-btn
          icon="mdi-chevron-double-right"
          size="small"
          variant="text"
          :disabled="page === totalPages"
          @click="goToPage(totalPages)"
        />
      </div>
    </div>

    <!-- Desktop/Tablet pagination -->
    <div
      v-else
      class="custom-pagination pa-3 d-flex align-center justify-space-between"
    >
      <div class="d-flex align-center">
        <span class="text-body-2 mr-2">Items per page:</span>
        <v-select
          v-model="itemsPerPage"
          :items="itemsPerPageOptions"
          density="compact"
          variant="outlined"
          :prepend-inner-icon="false"
          hide-details
          class="items-per-page-select mr-4"
          @update:model-value="resetPage"
        />
        <span class="text-body-2">{{ paginationInfo }}</span>
      </div>

      <div class="d-flex align-center">
        <v-btn
          icon
          size="small"
          variant="text"
          :disabled="page === 1"
          @click="goToPage(1)"
        >
          <v-icon>mdi-page-first</v-icon>
          <v-tooltip activator="parent" location="top">First page</v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          :disabled="page === 1"
          @click="prevPage"
        >
          <v-icon>mdi-chevron-left</v-icon>
          <v-tooltip activator="parent" location="top">Previous page</v-tooltip>
        </v-btn>

        <!-- Page numbers -->
        <div class="mx-2">
          <v-btn
            v-for="pageNum in totalPages"
            v-show="
              pageNum === 1 ||
              pageNum === totalPages ||
              Math.abs(pageNum - page) <= 2
            "
            :key="pageNum"
            size="small"
            :variant="pageNum === page ? 'tonal' : 'text'"
            class="mx-1"
            min-width="36"
            @click="goToPage(pageNum)"
          >
            {{ pageNum }}
          </v-btn>
        </div>

        <v-btn
          icon
          size="small"
          variant="text"
          :disabled="page === totalPages"
          @click="nextPage"
        >
          <v-icon>mdi-chevron-right</v-icon>
          <v-tooltip activator="parent" location="top">Next page</v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          :disabled="page === totalPages"
          @click="goToPage(totalPages)"
        >
          <v-icon>mdi-page-last</v-icon>
          <v-tooltip activator="parent" location="top">Last page</v-tooltip>
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.items-per-page-select {
  max-width: 80px;
}

.custom-pagination-mobile .items-per-page-select {
  max-width: 70px;
}

/* Ensure pagination doesn't break on small screens */
@media (max-width: 600px) {
  .custom-pagination {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
