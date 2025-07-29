<script setup>
import { ref, computed, watch } from "vue";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();
</script>

<template>
  <v-card class="px-4 pb-4 pt-2">
    <v-card-title class="pt-0">Players</v-card-title>
    <v-row dense no-gutters class="pa-0">
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Division"
          :class="smAndDown ? 'mb-2' : 'mb-2 mr-2'"
          :items="divisions"
          :disabled="loading"
          clearable
        />
      </v-col>
      <v-col :cols="smAndDown ? 12 : 6">
        <v-autocomplete
          label="Conference"
          :class="smAndDown ? 'mb-2' : 'mb-2 ml-2'"
          :items="conferences"
          :disabled="loading"
          clearable
        />
      </v-col>
      <v-col cols="12">
        <v-text-field
          label="Search teams"
          v-model="searchText"
          prepend-inner-icon="mdi-magnify"
          :disabled="loading"
          clearable
        />
      </v-col>
    </v-row>
  </v-card>
</template>
