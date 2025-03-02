<script setup lang="ts">
import { useData } from 'vitepress';

import Post from "../../posts/post.vue";
import Footer from "../../footer.vue";

import "../../style.scss";

// https://vitepress.dev/reference/runtime-api#usedata
const { site, page, frontmatter } = useData();
</script>

<template>
    <div id="content">
        <div v-if="page.isNotFound">404</div>
        <div v-else-if="frontmatter.layout == 'page'">
            <Content />
        </div>
        <div v-else-if="frontmatter.layout == 'post' || page.filePath.startsWith('posts/')">
            <Post />
        </div>
        <div v-else>Internal error: frontmatter.layout = "{{ frontmatter.layout }}"</div>
    </div>
    <Footer />
</template>
