<script setup lang="ts">
import { useData } from "vitepress";
const { site } = useData();
</script>
<template>
    <footer>
        <a :href="site.base">Jeremy Rifkin</a> |
        <a href="https://github.com/jeremy-rifkin">
            <font-awesome-icon :icon="['fab', 'github']" /><span class="github-text">GitHub</span>
        </a>
    </footer>
</template>
