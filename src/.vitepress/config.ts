import { defineConfig } from "vitepress";
import footnote from "markdown-it-footnote";
import { Highlighter } from "shiki";
import yaml from "yaml";
import fs from "fs";

const llvm_textmate = yaml.parse(fs.readFileSync("vendor/ll.tmLanguage.yaml", "utf-8"));

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Jeremy Rifkin's Site",
    description: "Jeremy Rifkin's Site",
    outDir: "../dist",
    head: [["link", { rel: "icon", href: "/favicon.ico" }]],
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
    srcExclude: process.env.MODE === "prod" ? ["posts/test.md"] : undefined,
});
