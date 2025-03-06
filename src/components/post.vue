<script setup lang="ts">
import { useData } from "vitepress";
import { onMounted } from "vue";
import mermaid from "mermaid";

import VPDocAsideOutline from "./vitepress-components/VPDocAsideOutline.vue";
import "./post.scss";
import pfp_url from "../../assets/pfp.jpg";
import { date_to_string } from "./utils/utils";

const { page, frontmatter } = useData();

mermaid.initialize({ startOnLoad: false });
onMounted(() => {
    mermaid.run();
});
</script>

<template>
    <VPDocAsideOutline />
    <div id="post-content">
        <div id="header">
            <h1><img class="pfp" :src="pfp_url" /> <a href="/posts">Jeremy Rifkin's Blog</a></h1>
        </div>
        <h1 id="post-title">{{ frontmatter.draft ? "[DRAFT] " : "" }}{{ frontmatter.title }}</h1>
        <div id="dateline">
            {{ date_to_string(new Date(frontmatter.date)) }} |
            <a :href="`https://github.com/jeremy-rifkin/rifkin.dev/tree/main/src/${page.filePath}`"> Source </a>
        </div>
        <Content />
    </div>
</template>
