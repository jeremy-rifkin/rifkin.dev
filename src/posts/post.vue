<script setup lang="ts">
import { useData } from "vitepress";

import VPDocAsideOutline from "../../vendor/vitepress/VPDocAsideOutline.vue";
import "./post.scss";
import pfp_url from "../../assets/pfp.jpg";

const { page, frontmatter } = useData();
</script>

<template>
    <VPDocAsideOutline />
    <div id="post-content">
        <div id="header">
            <h1><img class="pfp" :src="pfp_url" /> <a href="/posts">Jeremy Rifkin's Blog</a></h1>
        </div>
        <h1 id="post-title">{{ frontmatter.title }}</h1>
        <div id="dateline">
            {{ frontmatter.date }} |
            <a :href="`https://github.com/jeremy-rifkin/rifkin.dev/tree/main/src/${page.filePath}`"> Source </a>
        </div>
        <Content />
    </div>
</template>
