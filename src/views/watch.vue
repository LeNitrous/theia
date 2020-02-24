<template>
    <!----
    <figure class="image is-16by9">
        <div class="player has-ratio">
            <div class="overlay controls">
                <div class="module">
                    <div class="columns has-text-left">
                        <div class="column is-narrow">
                            <anime-card :show="show.data" is-static/>
                        </div>
                        <div class="column">
                            <h1 @click="$router.push({ name: 'Show', params: { id: $route.params.id } })">{{ show.data.title }}</h1>
                            <p>Episode {{ $route.params.episode }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <video controls class="has-ratio" width="640" height="360" :src="source"/>
        </div>
    </figure>
    ---->
    <section class="hero is-fullheight-with-titlebar">
        <div class="hero-body is-paddingless">
            <video controls class="video" width="640" height="360" :src="source"/>
        </div>
    </section>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { ipcRenderer } from "electron";
import { Route } from "vue-router";
import animeCard from "@/components/AnimeCard.vue";

@Component({ components: { animeCard } })
export default class Watch extends Vue {
    player: HTMLVideoElement | null = null;
    source = "";

    get show() {
        return this.$store.state.selectedShow;
    }

    created() {
        ipcRenderer
            .on("fetched-episode", (_, episode) => this.source = episode.stream_url);
    }

    beforeRouteEnter(to: Route, from: Route, next: Function) {
        next(async (vm: Watch) => {
            vm.$emit("watch-enter");
            const { term, episode } = vm.$route.params;
            ipcRenderer.send("fetch-episode", term, episode);
        });
    }

    beforeRouteLeave(to: Route, from: Route, next: Function) {
        this.$emit("watch-leave");
        ipcRenderer.removeAllListeners("fetched-episode");
        next();
    }
}

interface IUnknownObject {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any | [];
}
</script>

<style lang="scss" scoped>
.hero {
    &.is-fullheight-with-titlebar {
        min-height: calc(100vh - 30px);
    }
}

.icon {
    color: white;
}

.video {
    object-fit: contain;
    width: 100%;
    height: calc(100vh - 30px);
}

.player {
    position: relative;

    .overlay {
        position: absolute;
        z-index: 1000;
        top: 0;
        left: 0;
        opacity: 0;
        width: 100%;
        height: auto;

        &.controls {
            background: linear-gradient(to top,
                rgba(0, 0, 0, 0) 50%,
                rgba(0, 0, 0, 0.7) 100%);
            transition: opacity .5s ease;

            .module {
                padding: 1rem;
            }

            &:hover {
                opacity: 1;
            }
        }
    }

    h1, p {
        color: white;
    }

    h1 {
        font-size: 24px;
        cursor: pointer;
    }
}
</style>