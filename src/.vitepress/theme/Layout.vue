<script setup lang="ts">
import { useData } from 'vitepress';

// https://vitepress.dev/reference/runtime-api#usedata
const { site, page, frontmatter } = useData();
</script>

<template>
    <div v-if="page.isNotFound">
        404
    </div>
    <div v-else-if="frontmatter.layout == 'page'">
        <Content />
    </div>
    <div v-else>
        Internal error: frontmatter.layout = "{{ frontmatter.layout }}"
    </div>
</template>
