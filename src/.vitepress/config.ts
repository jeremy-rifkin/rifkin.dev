import { defineConfig } from "vitepress";
import footnote from "markdown-it-footnote";
import { Highlighter } from "shiki";
import yaml from "yaml";
import fs from "fs";

const llvm_textmate = yaml.parse(fs.readFileSync("vendor/ll.tmLanguage.yaml", "utf-8"));

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "",
    description: "Jeremy Rifkin's personal site",
    titleTemplate: ":title",
    outDir: "../dist",
    head: [
        ["link", { rel: "icon", href: "/favicon.ico" }],
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:locale", content: "en" }],
        ["meta", { property: "og:image", content: "https://rifkin.dev/pfp.jpg" }],
        ["meta", { property: "og:url", content: "https://rifkin.dev/" }],
        ["script", { async: "", src: "https://www.googletagmanager.com/gtag/js?id=G-98NC8HV2GZ" }],
        [
            "script",
            {},
            `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-98NC8HV2GZ');`,
        ],
    ],
    markdown: {
        lineNumbers: true,
        math: true,
        toc: { level: [1, 2, 3] },
        config: md => {
            md.use(footnote);
        },
        shikiSetup: async (shiki: Highlighter) => {
            await shiki.loadLanguage(llvm_textmate);
        },
    },
    cleanUrls: true,
    srcExclude: ["components", ...(process.env.MODE === "prod" ? ["blog/test.md"] : [])],
});
