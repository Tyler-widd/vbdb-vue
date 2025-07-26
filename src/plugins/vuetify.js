// vuetify.js
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

import { createVuetify } from "vuetify";

const vbdb = {
  dark: true,
  colors: {
    background: "#282726",
    surface: "#4D4D4D",
    primary: "#82AAFF",
  },
};

export default createVuetify({
  theme: {
    defaultTheme: "vbdb",
    themes: {
      vbdb,
    },
  },
  defaults: {
    VCard: {
      rounded: "lg",
      density: "compact",
      class: "bg-surface",
      variant: "flat",
    },
    VBtn: {
      rounded: "xl",
      class: "text-body-1 font-weight-regular",
      density: "compact",
      variant: "text",
    },
    VDataTable: {
      density: "compact",
      class: "rounded-lg",
    },
    VAutocomplete: {
      variant: "outlined",
      flat: true,
      hideDetails: true,
      density: "compact",
      rounded: true,
      prependInnerIcon: "mdi-magnify",
    },
    VTextField: {
      variant: "outlined",
      flat: true,
      hideDetails: true,
      density: "compact",
      rounded: true,
      prependInnerIcon: "mdi-magnify",
    },
    VSelect: {
      variant: "outlined",
      hideDetails: true,
      density: "compact",
      rounded: true,
    },
    VCardTitle: {
      flat: true,
      color: "red",
    },
    VAvatar: {
      tile: true,
    },
  },
});
