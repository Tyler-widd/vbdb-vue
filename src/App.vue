<!-- App.vue -->
<script setup>
import NavBar from "./layouts/NavBar.vue";
</script>

<template>
  <v-app>
    <NavBar />
    <v-main>
      <v-row class="pa-0 justify-center" dense no-gutters>
        <v-col class="pa-0" md="10">
          <router-view />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>
