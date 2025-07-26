// router/index.js
import { createRouter, createWebHistory } from "vue-router";

// Views - Mix of direct imports and lazy loading
import Home from "@/views/Home.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/teams",
    name: "Teams",
    component: () =>
      import(/* webpackChunkName: "teams" */ "@/views/Teams.vue"),
    meta: {
      requiresSchoolsData: true,
      title: "Teams",
    },
  },
  {
    path: "/teams/:id",
    name: "TeamDetail",
    component: () =>
      import(/* webpackChunkName: "team-detail" */ "@/views/TeamDetail.vue"),
    props: (route) => ({
      id: route.params.id,
      // Pass query params as props if needed
      season: route.query.season,
    }),
    meta: {
      requiresSchoolsData: true,
      requiresGamesData: true, // Added since team details likely need games
      title: "Team Details",
    },
  },
  {
    path: "/scores",
    name: "Scores",
    component: () =>
      import(/* webpackChunkName: "scores" */ "@/views/Scores.vue"),
    meta: {
      requiresGamesData: true, // Scores likely need games data, not just schools
      title: "Scores",
    },
  },
  {
    path: "/rankings",
    name: "Rankings",
    component: () =>
      import(/* webpackChunkName: "rankings" */ "@/views/Rankings.vue"),
    meta: {
      requiresSchoolsData: true,
      requiresGamesData: true, // Rankings likely need both
      title: "Rankings",
    },
  },
  {
    path: "/schedule",
    name: "Schedule",
    component: () =>
      import(/* webpackChunkName: "schedule" */ "@/views/Schedule.vue"),
    meta: {
      requiresScheduleData: true, // Different data requirement
      title: "Schedule",
    },
  },
  {
    path: "/players",
    name: "Players",
    component: () =>
      import(/* webpackChunkName: "players" */ "@/views/Players.vue"),
    meta: {
      requiresPlayersData: true, // Different data requirement
      title: "Players",
    },
  },
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
  // Add scroll behavior
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Loading state management
let isLoadingData = false;

// Global navigation guard with improved data loading
router.beforeEach(async (to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Your App Name`;
  }

  // Example of auth guard (uncomment when needed):
  // if (to.meta.requiresAuth && !isAuthenticated()) {
  //   next({ name: "Login", query: { redirect: to.fullPath } });
  //   return;
  // }

  // Prevent multiple simultaneous data loads
  if (isLoadingData) {
    next();
    return;
  }

  try {
    isLoadingData = true;

    // Load different types of data based on meta requirements
    const dataPromises = [];

    if (to.meta.requiresSchoolsData) {
      const { useSchoolsStore } = await import("@/composables/useSchoolsStore");
      const { fetchSchools, getSchoolById } = useSchoolsStore();
      dataPromises.push(fetchSchools());

      // Validate school exists for TeamDetail route
      if (to.name === "TeamDetail" && to.params.id) {
        await fetchSchools(); // Ensure data is loaded before validation
        const school = getSchoolById(to.params.id);
        if (!school) {
          next({ name: "Teams", replace: true });
          return;
        }
      }
    }

    if (to.meta.requiresGamesData) {
      const { useGamesStore } = await import("@/composables/useGamesStore");
      const { fetchGames } = useGamesStore();
      dataPromises.push(fetchGames());
    }

    if (to.meta.requiresScheduleData) {
      // Add schedule data loading when you create this composable
      // const { useScheduleStore } = await import("@/composables/useScheduleStore");
      // const { fetchSchedule } = useScheduleStore();
      // dataPromises.push(fetchSchedule());
    }

    if (to.meta.requiresPlayersData) {
      // Add players data loading when you create this composable
      // const { usePlayersStore } = await import("@/composables/usePlayersStore");
      // const { fetchPlayers } = usePlayersStore();
      // dataPromises.push(fetchPlayers());
    }

    // Wait for all required data to load
    if (dataPromises.length > 0) {
      await Promise.all(dataPromises);
    }

    next();
  } catch (error) {
    console.error("Failed to load required data:", error);

    // You could redirect to an error page or continue with error state
    if (error.response?.status === 404) {
      next({ name: "NotFound", replace: true });
    } else {
      // Continue to route but log the error
      next();
    }
  } finally {
    isLoadingData = false;
  }
});

// Optional: Add after navigation hook for analytics, etc.
router.afterEach((to, from) => {
  // Analytics tracking
  // gtag('config', 'GA_MEASUREMENT_ID', {
  //   page_title: to.meta.title,
  //   page_location: window.location.href
  // });
});

export default router;
