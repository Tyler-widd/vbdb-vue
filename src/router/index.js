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
  },
  {
    path: "/teams/:id",
    name: "TeamDetail",
    component: TeamDetail,
    props: true,
  },
  {
    path: "/scores",
    name: "Scores",
    component: Scores,
  },
  {
    path: "/rankings",
    name: "Rankings",
    component: Rankings,
  },
  {
    path: "/schedule",
    name: "Schedule",
    component: Schedule,
  },
  {
    path: "/players",
    name: "Players",
    component: Players,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
