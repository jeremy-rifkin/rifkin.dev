// https://vitepress.dev/guide/custom-theme
import Layout from "../../components/layout.vue";

import type { Theme } from "vitepress";

import "../../components/fontawesome";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
    Layout,
    enhanceApp({ app, router, siteData }) {
        app.component("font-awesome-icon", FontAwesomeIcon);
    },
} satisfies Theme;
