// https://vitepress.dev/guide/custom-theme
import Layout from "./Layout.vue";

import type { Theme } from "vitepress";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faFaucet, faChevronLeft, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faFaucet, faChevronLeft, faGithub, faArrowUpRightFromSquare);

export default {
    Layout,
    enhanceApp({ app, router, siteData }) {
        app.component("font-awesome-icon", FontAwesomeIcon);
    },
} satisfies Theme;
