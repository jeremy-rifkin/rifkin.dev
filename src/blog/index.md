---
title: Jeremy Rifkin's Blog
layout: page
---

<script setup>
import { computed, ref } from 'vue';
import '../components/home.scss';
import '../components/posts.scss';
import pfp_url from '../../assets/pfp.jpg';
import usePosts from "../components/utils/posts";
import { date_to_string } from "../components/utils/utils";

const {posts} = usePosts();
</script>

<div id="content">
    <div id="small-header">
        <h1><img class="pfp" :src="pfp_url" /> <a href="/"><font-awesome-icon :icon="['fas', 'chevron-left']" /> Home</a></h1>
    </div>
    <h1 id="posts-header">Blog Posts:</h1>
    <div id="posts">
        <div v-for="post of posts">
            <div class="post">
                <a :href="post.path">
                    <h2>{{post.title}}</h2>
                    <span class="date">{{date_to_string(new Date(post.date))}}</span>
                </a>
            </div>
        </div>
    </div>
</div>
