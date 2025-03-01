---
layout: page
---

<script setup>
import './home.scss';
import pfp_url from '../assets/pfp.jpg';
</script>

<div id="content">
    <div id="small-header">
        <h1><img class="pfp" :src="pfp_url" /> <a href="index.html"><font-awesome-icon :icon="['fas', 'chevron-left']" /> Home</a></h1>
    </div>
    <div id="projects">
        <h1>Smaller projects and experiments:</h1>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/mandelbrot-orbits">Mandelbrot Orbits <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Looking at periodic cycles / orbits in the mandelbrot set.
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/mandelbrot-trajectories">Mandelbrot Trajectories <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Looking at shapes generated from tracing escape trajectories of points in the Mandelbrot set.
            </p>
            <a class="button" href="https://rifkin.dev/projects/mandelbrot-trajectories/">Interactive <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" /></a>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/mandelbrot-trajectory-infima">Mandelbrot Trajectory Infima <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                A unique rendering of the inside of the mandelbrot set.
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/c-cpp-trivia">C & C++ Trivia <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                A collection of neat C and C++ trivia and oddities.
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/microfmt">Microfmt <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Very small (~300 line) C++ text formatting library
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/wyrm">Wyrm <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                An experimental GCC GIMPLE to LLVM IR transpiler
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/build-blame">Build Blame <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                A C++ builld time analyzer
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/Markov-Huffman-Coding">Markov-Huffman Coding <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Proof of concept for compressing data with conditionally-weighted huffman trees.
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/strawberry-cheesecake">Data compression for PI <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Lorem Ipsum
            </p>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/MinecraftMobTools">Minecraft Mob Tools <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Lorem Ipsum
            </p>
            <a class="button" href="https://www.spigotmc.org/resources/mobtools.86929/">Spigot <font-awesome-icon :icon="['fas', 'faucet']" /></a>
        </div>
        <div class="project-card">
            <h1><a href="https://github.com/jeremy-rifkin/floating-pointers">Floating pointers <font-awesome-icon :icon="['fab', 'github']" /></a></h1>
            <p>
                Lorem Ipsum
            </p>
        </div>
    </div>
</div>
<footer>
    <div class="github">
        <a href="https://github.com/jeremy-rifkin">
            <font-awesome-icon :icon="['fab', 'github']" /><span class="github-text">Github</span>
        </a>
    </div>
</footer>
