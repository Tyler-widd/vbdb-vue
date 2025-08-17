<!-- RankingSection.vue -->
<script>
export default {
  props: {
    img: {
      type: String,
    },
  },
};
</script>

<template>
  <v-card>
    <v-img :src="img" :width="180" />
    <v-divider class="mt-2" />
  </v-card>
</template>
