// router/index.js
import { createRouter, createWebHistory } from "vue-router";

// Views - Mix of direct imports and lazy loading
import Home from "../views/Home/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/live",
    name: "Live",
    component: () =>
      import(/* webpackChunkName: "live" */ "@/views/Live/LiveView.vue"),
    meta: {
      title: "Live",
      requiresLiveData: true,
    },
  },
  {
    path: "/teams",
    name: "Teams",
    component: () =>
      import(/* webpackChunkName: "teams" */ "@/views/Teams/TeamsView.vue"),
    meta: {
      title: "Teams",
      requiresSchoolsData: true,
    },
  },
  {
    path: "/teams/:id",
    name: "TeamDetailView",
    component: () =>
      import(
        /* webpackChunkName: "team-detail" */ "@/views/TeamDetail/TeamDetailView.vue"
      ),
    props: (route) => ({
      id: route.params.id,
      // Pass query params as props if needed
      season: route.query.season,
    }),
    meta: {
      title: "Team Details",
      requiresSchoolsData: true,
      requiresGamesData: true, // Added since team details likely need games
    },
  },
  {
    path: "/scores",
    name: "Scores",
    component: () =>
      import(/* webpackChunkName: "scores" */ "@/views/Scores/ScoresView.vue"),
    meta: {
      title: "Scores",
      requiresGamesData: true, // Scores likely need games data, not just schools
    },
  },
  {
    path: "/rankings",
    name: "Rankings",
    component: () =>
      import(
        /* webpackChunkName: "rankings" */ "@/views/Rankings/RankingsView.vue"
      ),
    meta: {
      title: "Rankings",
      requiresSchoolsData: true,
      requiresGamesData: true,
    },
  },
  {
    path: "/schedule",
    name: "Schedule",
    component: () =>
      import(
        /* webpackChunkName: "schedule" */ "../views/Schedule/ScheduleView.vue"
      ),
    meta: {
      title: "Schedule",
      requiresScheduleData: true, // Added to match the error message
    },
  },
  {
    path: "/players",
    name: "Players",
    component: () =>
      import(
        /* webpackChunkName: "players" */ "@/views/Players/PlayersView.vue"
      ),
    meta: {
      title: "Players",
      requiresPlayersData: true, // Different data requirement
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

export default router;
