<!-- src/components/NewsCard.vue -->
<script setup>
import { onMounted, ref, watch } from "vue";
import { useNewsCache } from "../composables/useNewsCache.js";
import { formatDate } from "../helpers/formatDate.js";

// Props
const props = defineProps({
  division: {
    type: String,
    required: true,
  },
  rssUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "",
  },
});

const loading = ref(false);
const error = ref(null);
const latestItem = ref(null);

// Use the news cache composable
const { getCachedNews, setCachedNews } = useNewsCache();

// CORS proxy for bypassing CORS restrictions
const CORS_PROXY =
  "https://ncaa-proxy.tylerperrywiddison.workers.dev/corsproxy/?apiurl=";

// Emit to determine the title of the news feed (used to remove duplicate news stories between D2-3)
const emit = defineEmits(["news-loaded"]);

const fetchRSSFeed = async (forceRefresh = false) => {
  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cachedData = getCachedNews(props.rssUrl);
    if (cachedData) {
      latestItem.value = cachedData;
      // IMPORTANT: Emit the cached data too!
      emit("news-loaded", cachedData);
      return;
    }
  }

  loading.value = true;
  error.value = null;

  try {
    // Using CORS proxy to bypass CORS restrictions
    const response = await fetch(
      `${CORS_PROXY}${encodeURIComponent(props.rssUrl)}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Failed to parse XML");
    }

    // Get all items
    const items = xmlDoc.querySelectorAll("item");

    if (items.length === 0) {
      throw new Error("No items found in RSS feed");
    }

    // Get the first (most recent) item
    const firstItem = items[0];

    // Extract data from the first item
    const newsData = {
      title: getTextContent(firstItem, "title"),
      link: getTextContent(firstItem, "link"),
      description: getTextContent(firstItem, "description"),
      pubDate: getTextContent(firstItem, "pubDate"),
      guid: getTextContent(firstItem, "guid"),
      // Get image from various sources
      image: getImageUrl(firstItem),
      category: props.category || getTextContent(firstItem, "category"),
    };

    latestItem.value = newsData;

    // Cache the data
    setCachedNews(props.rssUrl, newsData);

    // IMPORTANT: Emit the news data after successful fetch
    emit("news-loaded", newsData);
  } catch (err) {
    console.error("Error fetching RSS feed:", err);
    error.value = `Failed to fetch RSS feed: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Helper function to safely get text content from XML elements
const getTextContent = (parent, tagName) => {
  const element = parent.querySelector(tagName);
  return element ? element.textContent.trim() : "";
};

// Get image URL from various sources (enclosure, media:content, or description)
const getImageUrl = (item) => {
  let imageUrl = null;

  // Try to get from enclosure first
  const enclosure = item.querySelector("enclosure");
  if (enclosure && enclosure.getAttribute("url")) {
    imageUrl = enclosure.getAttribute("url");
  }

  // Try to get from media:content if enclosure didn't work
  if (!imageUrl) {
    const mediaContent = item.querySelector("media\\:content, content");
    if (mediaContent && mediaContent.getAttribute("url")) {
      imageUrl = mediaContent.getAttribute("url");
    }
  }

  // Try to extract from description HTML if other methods failed (for NCAA feeds)
  if (!imageUrl) {
    const description = getTextContent(item, "description");
    if (description) {
      const imgRegex = /<img[^>]+src="([^">]+)"/;
      const match = description.match(imgRegex);
      if (match) {
        imageUrl = match[1];
      }
    }
  }

  // If we found an image URL, modify the dimensions for NAIA/CCCAA feeds
  if (
    imageUrl &&
    (props.rssUrl.includes("naia.org") ||
      props.rssUrl.includes("njcaa.org") ||
      props.rssUrl.includes("3c2asports.org"))
  ) {
    try {
      const url = new URL(imageUrl);
      // Update the max_width and max_height parameters
      url.searchParams.set("max_width", "660");
      url.searchParams.set("max_height", "620");
      return url.toString();
    } catch (error) {
      // If URL parsing fails, return original URL
      console.warn("Failed to parse image URL:", error);
      return imageUrl;
    }
  }

  return imageUrl;
};

// Method to manually refresh the news
const refreshNews = () => {
  fetchRSSFeed(true);
};

// Watch for URL changes (if props change)
watch(
  () => props.rssUrl,
  () => {
    fetchRSSFeed();
  },
);

// Auto-fetch on component mount
onMounted(() => {
  fetchRSSFeed();
});

// Expose refresh method for parent components
defineExpose({
  refreshNews,
});
</script>

<template>
  <v-card>
    <v-card-title>
      <div class="d-flex align-center">
        <div class="mr-4">
          <v-img
            v-if="division === 'NAIA'"
            src="https://naiastats.prestosports.com/assets/images/NAIA_Bridge_logo_whiteR.png"
            width="80"
            height="40"
          />
          <v-img
            v-else-if="division.includes('NCAA')"
            src="https://content.sportslogos.net/logos/85/5463/full/national_collegiate_athletic_association_logo_secondary_2021_sportslogosnet-4441.png"
            min-width="74"
            min-height="32"
            max-width="80"
            max-height="40"
          />
          <v-img
            v-else-if="division === 'CCCAA'"
            src="https://www.cccaasports.org/assets/Alternative_Logo.png"
            min-width="74"
            min-height="32"
            max-width="80"
            max-height="40"
          />
          <v-img
            v-else-if="division.includes('NJCAA')"
            src="https://www.njcaa.org/images/setup/footer-logo-njcaa.png?max_width=auto&max_height=auto&crop=false"
            min-width="74"
            min-height="32"
            max-width="80"
            max-height="40"
          />
        </div>
        <span
          v-if="latestItem?.pubDate"
          class="text-caption text-start font-weight-thin"
        >
          {{ formatDate(latestItem.pubDate) }}
        </span>
        <v-btn
          v-if="latestItem?.link"
          :href="latestItem.link"
          target="_blank"
          color="primary"
          variant="text"
          density="compact"
          class="text-caption"
        >
          Read More
        </v-btn>
      </div>
    </v-card-title>

    <!-- Loading state -->
    <v-card-text v-if="loading && !latestItem">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </v-card-text>

    <!-- Error state -->
    <v-card-text v-else-if="error">
      <v-alert color="error" variant="text">
        {{ error }}
        <v-btn
          color="error"
          variant="text"
          size="small"
          @click="refreshNews"
          class="ml-2"
        >
          Retry
        </v-btn>
      </v-alert>
    </v-card-text>

    <!-- Content -->
    <v-card-text v-else-if="latestItem">
      <v-col v-if="latestItem.image" class="pa-0" cols="12">
        <v-img :src="latestItem.image" cover />
        <v-row dense no-gutters>
          <v-col cols="12" class="text-wrap">
            <v-card-title class="pa-0 text-body-1 text-wrap">
              {{ latestItem.title }}
            </v-card-title>
          </v-col>
        </v-row>
      </v-col>

      <!-- Fallback for items without images -->
      <div v-else>
        <v-card-title class="pa-0 text-body-1 text-wrap">
          {{ latestItem.title }}
          <v-btn
            v-if="latestItem.link"
            :href="latestItem.link"
            target="_blank"
            color="primary"
            variant="text"
            density="compact"
            class="text-body-1 font-weight-regular"
          >
            Read More
          </v-btn>
        </v-card-title>
        <v-card-subtitle>
          <span class="text-caption">
            Published: {{ formatDate(latestItem.pubDate) }}
          </span>
        </v-card-subtitle>
        <v-card-text v-if="latestItem.description" class="text-caption">
          {{ latestItem.description.substring(0, 150) }}...
        </v-card-text>
      </div>
    </v-card-text>

    <!-- No content state -->
    <v-card-text v-else>
      <v-alert color="info" variant="text">
        No news items available
        <v-btn
          color="info"
          variant="text"
          size="small"
          @click="refreshNews"
          class="ml-2"
        >
          Load News
        </v-btn>
      </v-alert>
    </v-card-text>
  </v-card>
</template>
