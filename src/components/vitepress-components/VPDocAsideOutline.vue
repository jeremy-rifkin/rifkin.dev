<script setup lang="ts">
import { onContentUpdated, useData } from "vitepress";
import { ref, shallowRef } from "vue";
import { getHeaders, resolveTitle, useActiveAnchor, type MenuItem } from "./outline";
import VPDocOutlineItem from "./VPDocOutlineItem.vue";

const { frontmatter, theme } = useData();

const headers = shallowRef<MenuItem[]>([]);

onContentUpdated(() => {
    headers.value = getHeaders(frontmatter.value.outline ?? theme.value.outline);
    console.log(headers.value);
});

const container = ref();
const marker = ref();

useActiveAnchor(container, marker);
</script>

<template>
    <nav
        aria-labelledby="doc-outline-aria-label"
        class="VPDocAsideOutline"
        :class="{ 'has-outline': headers.length > 0 }"
        ref="container"
    >
        <div class="content">
            <div class="outline-marker" ref="marker" />

            <div aria-level="2" class="outline-title" id="doc-outline-aria-label" role="heading">
                {{ resolveTitle(theme) }}
            </div>

            <VPDocOutlineItem :headers="headers" :root="true" />
        </div>
    </nav>
</template>

<style scoped>
.VPDocAsideOutline {
    position: fixed;
    left: calc(50vw + var(--post-width) / 2 + 20px);
    top: 30px;
    display: none;
    float: right;
}

.VPDocAsideOutline.has-outline {
    display: inline-block;
}

@media (max-width: calc(840px + 2 * (16px + 150px + 20px))) {
    .VPDocAsideOutline {
        display: none !important;
    }
}

.content {
    position: relative;
    border-left: 1px solid #e2e2e3; /* var(--vp-c-divider); */
    padding-left: 16px;
    font-size: 13px;
    font-weight: 500;
    width: 150px;
}

.outline-marker {
    position: absolute;
    top: 32px;
    left: -1px;
    z-index: 0;
    opacity: 0;
    width: 2px;
    border-radius: 2px;
    height: 32px;
    background-color: #3451b2; /* var(--vp-c-brand-1); */
    transition:
        top 0.25s cubic-bezier(0, 1, 0.5, 1),
        background-color 0.5s,
        opacity 0.25s;
}

.outline-title {
    line-height: 32px;
    font-size: 14px;
    font-weight: 600;
}
</style>
