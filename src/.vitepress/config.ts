import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Jeremy Rifkin's Site",
    description: "Jeremy Rifkin's Site",
    outDir: "../dist",
    head: [['link', { rel: 'icon', href: "favicon.ico" }]]
})
