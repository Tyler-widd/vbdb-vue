<!-- Home/News/NAIANews.vue -->
<script setup>
import { ref } from "vue";

const loading = ref(false);
const error = ref(null);
const latestItem = ref(null);

const RSS_URL =
  "https://www.naia.org/sports/wvball/headlines-featured?feed=rss_2.0";

// CORS proxy
const CORS_PROXY =
  "https://ncaa-proxy.tylerperrywiddison.workers.dev/corsproxy/?apiurl=";

const fetchRSSFeed = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Using CORS proxy to bypass CORS restrictions
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(RSS_URL)}`);

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
    latestItem.value = {
      title: getTextContent(firstItem, "title"),
      link: getTextContent(firstItem, "link"),
      description: getTextContent(firstItem, "description"),
      pubDate: getTextContent(firstItem, "pubDate"),
      guid: getTextContent(firstItem, "guid"),
      // Get image from enclosure or media:content
      image: getImageUrl(firstItem),
      category: "Women's Volleyball", // Default since this RSS doesn't have category per item
    };
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

// Get image URL from enclosure or media:content elements
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

  // If we found an image URL, modify the dimensions
  if (imageUrl) {
    // Create URL object to easily manipulate query parameters
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

  return null;
};

// Format date for display
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
fetchRSSFeed();
</script>

<template>
  <v-card>
    <v-card-title class="text-h6 d-flex align-center"> NAIA </v-card-title>
    <v-card-text v-if="latestItem">
      <div v-if="latestItem.image">
        <v-img :src="latestItem.image" cover height="250" />
        <v-card-title class="pa-0 text-wrap">
          {{ latestItem.title }}
          <v-btn
            :href="latestItem.link"
            class="text-body-1 font-weight-regular"
            rounded
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
