---
layout: page
---

<script setup>
import './home.scss';
import pfp_url from '../assets/pfp.jpg';
</script>

<div id="content">
    <div id="main">
        <img class="pfp" :src="pfp_url" />
        <div class="main-text">
            <h1>Hi, I'm Jeremy Rifkin</h1>
            <p>
                I'm a software engineer. I enjoy C++, high-performance computing, and compilers.
            </p>
        </div>
    </div>
    <div id="projects">
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/cpptrace">Cpptrace <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Cpptrace is C++ stacktrace library supporting C++11 and newer with a focus on a simplicity,
                portability, and ease of use. The goal is to make stack traces simple for once. Cpptrace also
                has a C API.
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/libassert">Libassert <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Libassert is a C++ assertion library that aims to provide thorough diagnostic information on
                traces, including comparison operands and stack traces.
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/compiler-explorer/compiler-explorer">Compiler Explorer <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                I'm proud to be part of the Compiler Explorer development team.
            </p>
        </div>
        <a class="other" href="/experiments">Other stuff <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" /></a>
    </div>
    <!-- <a id="blog-button" href="/blog">
        Blog <i class="fa-solid fa-chevron-right"></i>
    </a> -->
</div>
<footer>
    <div class="github">
        <a href="https://github.com/jeremy-rifkin">
            <font-awesome-icon :icon="['fab', 'github']" /><span class="github-text">Github</span>
        </a>
    </div>
</footer>

