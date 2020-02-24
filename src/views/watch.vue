<template>
    <section class="hero is-fullheight-with-titlebar">
        <div class="has-text-centered" v-if="isLoading">
            <b-icon icon="spinner" custom-class="fa-spin" size="is-large"/>
        </div>
        <div class="player hero-body is-paddingless" v-else>
            <div class="overlay controls">
                <div class="columns has-text-left">
                    <div class="column is-narrow">
                        <anime-card :show="show.data" is-static/>
                    </div>
                    <div class="column">
                        <h1 @click="$router.push({ name: 'Show', params: { id: $route.params.id } })">{{ show.data.title }}</h1>
                        <p>Episode {{ $route.params.episode }}</p>
                    </div>
                </div>
                <div class="system">
                    <b-icon icon="play" size="is-large"/>
                    <div>
                        <div class="seek">
                            <div class="progress"></div>
                            <div class="loaded"></div>
                        </div>
                        <div class="other-controls">
                            <b-icon icon="step-backward"/>
                            <b-icon icon="step-forward"/>
                            <span class="timestamp">00:00 / 00:00</span>
                            <div></div>
                            <b-icon icon="expand" @click="$('.player').requestFullscreen()"/>
                        </div>
                    </div>
                </div>
            </div>
            <video class="video" ref="video" :class="{ 'non-fullscreen': !isFullscreen }" width="640" height="360" :src="source"/>
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
    isFullscreen = false;
    isLoading = false;
    player: HTMLVideoElement | null = null;
    source = "";

    get show() {
        return this.$store.state.selectedShow;
    }

    created() {
        ipcRenderer
            .on("fetched-episode", (_, episode) => this.source = episode.stream_url);

        document.addEventListener("fullscreenchange", () => {
            this.isFullscreen = !this.isFullscreen;
        });
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

    &.non-fullscreen {
        height: calc(100vh - 30px);
    }
}

.player {
    position: relative;
    background-color: black !important;

    .overlay {
        position: absolute;
        z-index: 1000;
        top: 0;
        left: 0;
        opacity: 0;
        width: 100%;
        height: 100%;

        &.controls {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: linear-gradient(to top,
                rgba(0, 0, 0, 0) 25%,
                rgba(0, 0, 0, 0.7) 0%
                rgba(0, 0, 0, 0) 75%,
                rgba(0, 0, 0, 0.7) 100%);
            transition: opacity .5s ease;
            padding: 1rem;

            .system {
                display: grid;
                grid-template-columns: 60px auto;

                .seek {
                    height: 5px;
                    width: 100%;
                    background: darkgray;
                    opacity: 0.1;
                }

                .other-controls {
                    padding-top: 10px;
                    display: grid;
                    grid-template-columns: 30px 30px 200px auto 30px;
                }
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