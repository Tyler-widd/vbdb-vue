// router/index.js
import { createRouter, createWebHistory } from "vue-router";

// Views
import Home from "@/views/Home.vue";
import Teams from "@/views/Teams.vue";
import TeamDetail from "@/views/TeamDetail.vue";
import Scores from "@/views/Scores.vue";
import Rankings from "@/views/Rankings.vue";
import Schedule from "@/views/Schedule.vue";
import Players from "@/views/Players.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/teams",
    name: "Teams",
    component: Teams,
    meta: {
      requiresSchoolsData: true,
    },
  },
  {
    path: "/teams/:id",
    name: "TeamDetail",
    component: () =>
      import(/* webpackChunkName: "team-detail" */ "@/views/TeamDetail.vue"),
    props: true,
    meta: {
      requiresSchoolsData: true,
    },
  },
  {
    path: "/scores",
    name: "Scores",
    component: Scores,
    meta: {
      requiresSchoolsData: true,
    },
  },
  {
    path: "/rankings",
    name: "Rankings",
    component: Rankings,
    meta: {
      requiresSchoolsData: true,
    },
  },
  {
    path: "/schedule",
    name: "Schedule",
    component: Schedule,
    meta: {
      requiresSchoolsData: true,
    },
  },
  {
    path: "/players",
    name: "Players",
    component: Players,
    meta: {
      requiresSchoolsData: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});

// Global navigation guard to pre-load schools data
router.beforeEach(async (to, from, next) => {
  // Check if the route requires schools data
  if (to.meta.requiresSchoolsData) {
    // Dynamically import the composable to avoid circular dependencies
    const { useSchoolsStore } = await import("@/composables/useSchoolsStore");
    const { fetchSchools, loading, getSchoolById } = useSchoolsStore();

    try {
      // Load schools data if not already loaded
      await fetchSchools();

      // For TeamDetail route, validate that the school exists
      if (to.name === "TeamDetail" && to.params.id) {
        const school = getSchoolById(to.params.id);
        if (!school) {
          // School not found, redirect to teams page
          next({ name: "Teams" });
          return;
        }
      }

      next();
    } catch (error) {
      console.error("Failed to load schools data:", error);
      // Continue to route but with error state
      next();
    }
  } else {
    next();
  }
});

export default router;
