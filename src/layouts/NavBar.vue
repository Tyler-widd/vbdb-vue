<!-- NavBar.vue -->
<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ScoreScrollCard from "../component/ScoreScrollCard.vue";

const router = useRouter();
const route = useRoute();
const drawer = ref(false);

const tabs = [
  { name: "Home", value: "Home", route: "/" },
  { name: "Live", value: "Live", route: "/live" },
  { name: "Scores", value: "Scores", route: "/scores" },
  { name: "Rankings", value: "Standings", route: "/rankings" },
  { name: "Schedule", value: "Schedule", route: "/schedule" },
  { name: "Players", value: "Players", route: "/players" },
  { name: "Teams", value: "Teams", route: "/teams" },
];

const navigateTo = (routePath) => {
  router.push(routePath);
  drawer.value = false; // Close drawer after navigation on mobile
};

const isActiveRoute = (routePath) => {
  return route.path === routePath;
};
</script>

<template>
  <div>
    <!-- Top Scores Bar -->
    <v-app-bar color="background" height="40" density="prominent">
      <ScoreScrollCard />
    </v-app-bar>

    <!-- Main Navigation Bar -->
    <v-app-bar class="flat" color="surface">
      <!-- Mobile Menu Button -->
      <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer" />

      <!-- Desktop Navigation -->
      <div class="d-none d-md-flex w-100">
        <v-spacer></v-spacer>
        <v-tabs center-active align-tabs="center">
          <div class="d-flex align-center">
            <router-link to="/" class="inline-block">
              <v-img
                :src="`https://raw.githubusercontent.com/widbuntu/vbdb-info/a40c20dac184df3f495587843e59a83ad91cf5c8/assets/favicon.svg`"
                width="50"
                height="50"
                class="mr-8 cursor-pointer"
              />
            </router-link>
            <div v-for="t in tabs" :key="t.value">
              <v-btn
                class="text-body-1 font-weight-regular ga-4"
                density="default"
                :variant="isActiveRoute(t.route) ? 'tonal' : 'text'"
                @click="navigateTo(t.route)"
              >
                {{ t.value }}
              </v-btn>
            </div>
          </div>
        </v-tabs>
        <v-spacer></v-spacer>
      </div>

      <!-- Mobile Logo (centered) -->
      <div class="d-md-none w-75 d-flex justify-center">
        <router-link to="/" class="inline-block">
          <v-img
            :src="`https://raw.githubusercontent.com/widbuntu/vbdb-info/a40c20dac184df3f495587843e59a83ad91cf5c8/assets/favicon.svg`"
            width="50"
            height="50"
            class="mr-8 cursor-pointer"
          />
        </router-link>
      </div>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary location="left">
      <v-list>
        <v-list-item
          v-for="tab in tabs"
          :key="tab.value"
          :active="isActiveRoute(tab.route)"
          @click="navigateTo(tab.route)"
        >
          <v-list-item-title>{{ tab.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>
