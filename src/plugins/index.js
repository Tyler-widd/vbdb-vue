// plugins/index.js

import router from "../router/index.js";
import vuetify from "./vuetify";

export function registerPlugins(app) {
  app.use(vuetify);
  app.use(router);
}
