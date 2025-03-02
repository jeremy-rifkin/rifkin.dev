import { defineConfig } from "vitepress";
import footnote from "markdown-it-footnote";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Jeremy Rifkin's Site",
    description: "Jeremy Rifkin's Site",
    outDir: "../dist",
    head: [["link", { rel: "icon", href: "favicon.ico" }]],
    markdown: {
        lineNumbers: true,
        math: true,
        toc: { level: [1, 2, 3] },
        config: md => {
            md.use(footnote);
        },
    },
    cleanUrls: true,
});
