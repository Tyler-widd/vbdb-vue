<!-- src/views/Home/News/NewsCard.vue -->
<script>
import { ref, onMounted, computed, watch } from "vue";
import { vbdbApi } from "@/services/vbdbApi";

export default {
  name: "NewsCard",
  props: {
    activeTab: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const newsItems = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Division mapping - map tab values to API division values
    const tabToDivisionMapping = {
      ncaa: ["1", "2", "3"], // NCAA includes D-I, D-II, D-III
      naia: ["naia"],
      njcaa: ["njcaa"],
      cccaa: ["3c2asports"],
    };

    // Display names for divisions
    const divisionMapping = {
      1: "NCAA D-I",
      2: "NCAA D-II",
      3: "NCAA D-III",
      naia: "NAIA",
      njcaa: "NJCAA",
      "3c2asports": "CCCAA",
    };

    // Filter news items based on active tab
    const filteredNewsItems = computed(() => {
      const allowedDivisions = tabToDivisionMapping[props.activeTab] || [];
      return newsItems.value.filter((item) =>
        allowedDivisions.includes(item.division.toString())
      );
    });

    const getDivisionName = (division) => {
      return divisionMapping[division] || division;
    };

    const getImageUrl = (imageUrl) => {
      if (!imageUrl) return null;

      try {
        const url = new URL(imageUrl);
        url.searchParams.set("max_width", "660");
        url.searchParams.set("max_height", "620");
        return url.toString();
      } catch (error) {
        console.warn("Failed to parse image URL:", error);
        return imageUrl;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (err) {
        return dateString;
      }
    };

    const fetchNews = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await vbdbApi.getNews();
        newsItems.value = response.data;
      } catch (err) {
        error.value = `Failed to fetch news: ${err.message || err.response?.data?.message || "Unknown error"}`;
        console.error("Error fetching news:", err);
      } finally {
        loading.value = false;
      }
    };

    // Watch for tab changes to potentially refetch or update data
    watch(
      () => props.activeTab,
      () => {
        // You could add specific logic here if needed
        console.log("Active tab changed to:", props.activeTab);
      }
    );

    onMounted(() => {
      fetchNews();
    });

    return {
      filteredNewsItems,
      loading,
      error,
      getDivisionName,
      getImageUrl,
      formatDate,
      fetchNews,
    };
  },
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col
        v-for="item in filteredNewsItems"
        :key="item.title + item.pub_date"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card height="100%">
          <v-card-title class="text-h6 d-flex align-center">
            {{ getDivisionName(item.division) }}
          </v-card-title>

          <v-card-text>
            <div v-if="item.img">
              <v-img
                :src="getImageUrl(item.img)"
                cover
                height="200"
                class="mb-3"
              />
              <v-card-title class="pa-0 text-body-1 text-wrap mb-2">
                {{ item.title }}
              </v-card-title>
              <v-btn
                :href="item.link"
                class="text-body-1 font-weight-regular mb-2"
                target="_blank"
                color="primary"
                variant="text"
                density="compact"
              >
                Read More
              </v-btn>
              <v-card-subtitle class="pa-0">
                <span class="text-caption">
                  Published: {{ formatDate(item.pub_date) }}
                </span>
              </v-card-subtitle>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mt-4">
      {{ error }}
    </v-alert>

    <v-progress-circular v-if="loading" indeterminate class="mt-4" />

    <!-- Show message when no news items for selected tab -->
    <v-alert
      v-if="!loading && filteredNewsItems.length === 0 && !error"
      type="info"
      class="mt-4"
    >
      No news items available for the selected organization.
    </v-alert>
  </v-container>
</template>
