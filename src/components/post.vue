<script setup lang="ts">
import { useData } from "vitepress";
import { onMounted } from "vue";
import mermaid from "mermaid";

import VPDocAsideOutline from "./vitepress-components/VPDocAsideOutline.vue";
import "./post.scss";
import pfp_url from "../../assets/pfp.jpg";
import { date_to_string, estimate_minutes_to_read } from "./utils/utils";
import { cpp_re_global } from "./markdown/nobr-plugin";

const { page, frontmatter } = useData();

mermaid.initialize({ startOnLoad: false });
onMounted(() => {
    mermaid.run();
});

function apply_nobr_title(title: string) {
    return title.replaceAll(cpp_re_global, "<nobr>$&</nobr>");
}
</script>

<template>
    <VPDocAsideOutline />
    <div id="post-content">
        <div id="header">
            <h1><img class="pfp" :src="pfp_url" /> <a href="/blog">Jeremy Rifkin's Blog</a></h1>
        </div>
        <h1 id="post-title">
            {{ frontmatter.draft || page.filePath.startsWith("blog/drafts/") ? "[DRAFT]" : "" }}
            <span v-html="apply_nobr_title(frontmatter.title)"></span>
        </h1>
        <div id="dateline">
            {{ date_to_string(new Date(frontmatter.date)) }}
            | {{ estimate_minutes_to_read(frontmatter.word_count) }} minute read |
            <a :href="`https://github.com/jeremy-rifkin/rifkin.dev/tree/main/src/${page.filePath}`"> Source </a>
            <template v-if="frontmatter.updated">
                <br />
                Last updated on {{ date_to_string(new Date(frontmatter.updated)) }}
            </template>
        </div>
        <Content />
    </div>
</template>
