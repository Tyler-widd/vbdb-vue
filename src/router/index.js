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
    path: "/teams",
    name: "Teams",
    component: () =>
      import(/* webpackChunkName: "teams" */ "@/views/Teams/TeamsView.vue"),
    meta: {
      requiresSchoolsData: true,
      title: "Teams",
    },
  },
  {
    path: "/teams/:id",
    name: "TeamDetail",
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
      requiresSchoolsData: true,
      requiresGamesData: true, // Added since team details likely need games
      title: "Team Details",
    },
  },
  {
    path: "/scores",
    name: "Scores",
    component: () =>
      import(/* webpackChunkName: "scores" */ "@/views/Scores/ScoresView.vue"),
    meta: {
      requiresGamesData: true, // Scores likely need games data, not just schools
      title: "Scores",
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
      requiresSchoolsData: true,
      requiresGamesData: true, // Rankings likely need both
      title: "Rankings",
    },
  },
  {
    path: "/schedule",
    name: "Schedule",
    component: () =>
      import(
        /* webpackChunkName: "schedule" */ "@/views/Schedule/ScheduleView.vue"
      ),
    meta: {
      requiresScheduleData: true, // Different data requirement
      title: "Schedule",
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

export default router;
