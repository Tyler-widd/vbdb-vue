<!-- views/TeamDetail/Header.vue -->
<script setup>
import { computed } from "vue";
// Define props that the header component needs
const props = defineProps({
  teamWithSchoolInfo: {
    type: Object,
    required: true,
  },
  mostCurrentRecord: {
    type: Object,
    required: true,
  },
  selectedYear: {
    type: String,
    required: true,
  },
  availableYears: {
    type: Array,
    required: true,
  },
  teamRecord: {
    type: String,
    default: "",
  },
});

// Define emits for two-way binding with parent
const emit = defineEmits(["update:selectedYear"]);

// Computed property for v-model compatibility
const selectedYearModel = computed({
  get: () => props.selectedYear,
  set: (value) => emit("update:selectedYear", value),
});
</script>

<template>
  <!-- Team header -->
  <v-card class="mb-4 rounded-lg">
    <v-card-text>
      <div class="d-flex align-center">
        <v-avatar size="125" class="mx-4" tile>
          <v-img
            :src="teamWithSchoolInfo.logoUrl"
            :alt="teamWithSchoolInfo.name_official"
          >
            <!-- Fallback if image fails to load -->
            <template v-slot:error>
              <v-icon color="grey" size="40">mdi-school</v-icon>
            </template>
          </v-img>
        </v-avatar>
        <div class="flex-grow-1">
          <!-- Team Name Button -->
          <v-btn
            flat
            class="text-h6 pa-0"
            density="compact"
            :href="`https://${teamWithSchoolInfo.athletic_web_url}`"
            target="_blank"
          >
            {{ teamWithSchoolInfo.name_official }} |
            {{ mostCurrentRecord?.year }}
          </v-btn>

          <!-- Expansion Panel with History -->
          <v-expansion-panels class="mt-2" flat>
            <v-expansion-panel class="rounded-xl" height="70" width="300">
              <v-expansion-panel-title
                class="border"
                style="border-radius: 18px !important"
              >
                <div>
                  <div class="d-flex text-no-wrap mb-1">
                    Division
                    <div class="font-weight-thin">
                      : {{ mostCurrentRecord?.division }}
                    </div>
                  </div>
                  <div class="d-flex text-no-wrap mb-1">
                    Conference
                    <div class="font-weight-thin">
                      : {{ mostCurrentRecord?.conference }}
                    </div>
                  </div>
                  <div class="d-flex text-no-wrap">
                    Head Coach
                    <div class="font-weight-thin">
                      : {{ mostCurrentRecord?.head_coaches }}
                    </div>
                  </div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-row class="mt-4">
                  <v-col
                    v-for="record in teamWithSchoolInfo.allRecords"
                    :key="record.year"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                  >
                    <v-card flat class="bg-grey-darken-3">
                      <v-card-text class="text-center pa-0">
                        <div class="text-h6 text-primary font-weight-bold">
                          {{ record?.year }}
                        </div>
                        <v-divider class="mb-1"></v-divider>
                        <div class="text-body-2 mb-2">
                          Division:
                          <span class="font-weight-thin">{{
                            record?.division
                          }}</span>
                        </div>
                        <div class="text-body-2 mb-2">
                          Conference:
                          <span class="font-weight-thin">{{
                            record?.conference
                          }}</span>
                        </div>
                        <div class="text-body-2">
                          Head Coach:
                          <span class="font-weight-thin">{{
                            record?.head_coaches
                          }}</span>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>
    </v-card-text>
    <!-- Year Filter -->

    <v-col cols="2" class="py-0">
      <div class="d-flex align-center">
        <v-autocomplete
          class="mb-2"
          v-model="selectedYearModel"
          :items="availableYears"
          label="Filter by Year"
          density="compact"
          variant="outlined"
          hide-details
          rounded
        />
        <span class="pl-4">Record: {{ teamRecord }}</span>
      </div>
    </v-col>
  </v-card>
</template>
