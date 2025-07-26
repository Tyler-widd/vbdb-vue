<!-- App.vue -->
<script setup>
import NavBar from "./layouts/NavBar.vue";
</script>

<template>
  <v-app>
    <NavBar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
