<!-- Home/News/NCAANews.vue -->
<script setup>
import { ref, computed, onMounted } from "vue";

// Props
const props = defineProps({
  division: {
    type: String,
    required: true,
    // validator: (value) => ["d1", "d2", "d3"].includes(value),
    validator: (value) => ["d1"].includes(value),
  },
});

const loading = ref(false);
const error = ref(null);
const latestItem = ref(null);

// Computed RSS URL based on division prop
const RSS_URL = computed(() => {
  return `https://www.ncaa.com/news/volleyball-women/${props.division}/rss.xml`;
});

// Division display names
const divisionNames = {
  d1: "Division I",
  d2: "Division II",
  d3: "Division III",
};

const CORS_PROXY =
  "https://ncaa-proxy.tylerperrywiddison.workers.dev/corsproxy/?apiurl=";

const fetchRSSFeed = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(
      `${CORS_PROXY}${encodeURIComponent(RSS_URL.value)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Failed to parse XML");
    }

    const items = xmlDoc.querySelectorAll("item");

    if (items.length === 0) {
      throw new Error("No items found in RSS feed");
    }

    const firstItem = items[0];

    latestItem.value = {
      title: getTextContent(firstItem, "title"),
      link: getTextContent(firstItem, "link"),
      description: getTextContent(firstItem, "description"),
      pubDate: getTextContent(firstItem, "pubDate"),
      category: getTextContent(firstItem, "category"),
      image: extractImageFromDescription(
        getTextContent(firstItem, "description")
      ),
      enclosure: getTextContent(firstItem, "enclosure"),
    };
  } catch (err) {
    console.error("Error fetching RSS feed:", err);
    error.value = `Failed to fetch RSS feed: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const getTextContent = (parent, tagName) => {
  const element = parent.querySelector(tagName);
  return element ? element.textContent.trim() : "";
};

const extractImageFromDescription = (description) => {
  if (!description) return null;
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = description.match(imgRegex);
  return match ? match[1] : null;
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

// Auto-fetch on component mount
onMounted(() => {
  fetchRSSFeed();
});
</script>

<template>
  <v-card>
    <v-card-title class="text-h6 d-flex align-center">
      NCAA {{ divisionNames[division] }}
    </v-card-title>

    <v-card-text v-if="latestItem">
      <div v-if="latestItem.image">
        <v-img :src="latestItem.image" cover />
        <v-card-title class="pa-0 text-body-1 text-wrap">
          {{ latestItem.title }}
          <v-btn
            :href="latestItem.link"
            class="text-body-1 font-weight-regular"
            target="_blank"
            color="primary"
            variant="text"
            density="compact"
          >
            Read More
          </v-btn>
        </v-card-title>
        <v-card-subtitle>
          <span class="text-caption">
            Published: {{ formatDate(latestItem.pubDate) }}
          </span>
        </v-card-subtitle>
      </div>
    </v-card-text>
  </v-card>
</template>
