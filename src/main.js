// main.js
// Plugins

// Composables
import { createApp } from "vue";
import { registerPlugins } from "@/plugins";
// Components
import App from "./App.vue";

// Styles
import "unfonts.css";

const app = createApp(App);

registerPlugins(app);

app.mount("#app");
