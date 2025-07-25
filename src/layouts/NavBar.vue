<!-- NavBar.vue -->
<script setup>
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const tabs = [
  { name: "Home", value: "Home", route: "/" },
  { name: "Scores", value: "Scores", route: "/scores" },
  { name: "Rankings", value: "Rankings", route: "/rankings" },
  { name: "Schedule", value: "Schedule", route: "/schedule" },
  { name: "Players", value: "Players", route: "/players" },
  { name: "Teams", value: "Teams", route: "/teams" },
];

const navigateTo = (routePath) => {
  router.push(routePath);
};

const isActiveRoute = (routePath) => {
  return route.path === routePath;
};
</script>

<template>
  <v-app-bar class="flat" color="surface">
    <v-spacer></v-spacer>
    <v-tabs center-active align-tabs="center">
      <div class="d-flex align-center">
        <v-img
          :src="`https://raw.githubusercontent.com/widbuntu/vbdb-info/a40c20dac184df3f495587843e59a83ad91cf5c8/assets/favicon.svg`"
          width="50"
          height="50"
          class="mr-8"
        />
        <div v-for="t in tabs" :key="t.value">
          <v-btn
            class="text-body-1 font-weight-regular ma-4"
            :variant="isActiveRoute(t.route) ? 'tonal' : 'text'"
            @click="navigateTo(t.route)"
          >
            {{ t.value }}
          </v-btn>
        </div>
      </div>
    </v-tabs>
    <v-spacer></v-spacer>
  </v-app-bar>
</template>
