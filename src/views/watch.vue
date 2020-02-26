<template>
    <section class="hero is-fullheight-with-titlebar">
        <div class="player hero-body is-paddingless" ref="player">
            <div class="overlay controls" :class="{ 'hover': isControlsVisible || isControlsHovered }" @mousemove="handleControls()">
                <div class="columns has-text-left">
                    <div class="column is-narrow">
                        <anime-card :show="show" is-static/>
                    </div>
                    <div class="column">
                        <h1 @click="$router.push({ name: 'Show', params: { id: show.mal_id } })">{{ show.title }}</h1>
                        <p>Episode {{ $route.params.episode }}</p>
                    </div>
                </div>
                <div class="system"
                    @mouseover="isControlsHovered = true"
                    @mouseleave="isControlsHovered = false">
                    <div @click="handlePlayRequest()">
                        <b-icon icon="play" size="is-large" v-if="!isPlaying"/>
                        <b-icon icon="pause" size="is-large" v-if="isPlaying"/>
                    </div>
                    <div>
                        <div class="seek" ref="seek" 
                            @click="handleSeekRequest($event)"
                            @mousedown="handleSeekDragStartRequest($event)"
                            @mousemove="handleSeekDraggingRequest($event)"
                            @mouseup="handleSeekDragEndRequest($event)">
                            <div class="fill loaded" :style="{ width: `${(loaded / duration) * 100}%` }"></div>
                            <div class="fill progress" ref="progress" :style="{ width: `${(current / duration) * 100}%` }"></div>
                        </div>
                        <div class="other-controls">
                            <b-icon icon="step-backward"
                                :class="{ 'disabled': parseInt($route.params.episode) - 1 < 1 }"
                                @click.native="handleEpisodeRequest(-1)"/>
                            <b-icon icon="step-forward"
                                :class="{ 'disabled': parseInt($route.params.episode) + 1 > episodes.count }"
                                @click.native="handleEpisodeRequest(1)"/>
                            <span class="timestamp">
                                {{ formatSeconds(current) }} / {{ formatSeconds(duration) }}
                            </span>
                            <div></div>
                            <b-icon icon="expand" @click.native="handleFullscreenRequest()"/>
                        </div>
                    </div>
                </div>
            </div>
            <div class="buffer" v-if="buffering">
                <b-icon icon="spinner" custom-class="fa-spin" size="is-large"/>
            </div>
            <video class="video" ref="video" :class="{ 'non-fullscreen': !isFullscreen }" width="640" height="360" :src="source"/>
        </div>
    </section>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { ipcRenderer } from "electron";
import { Route } from "vue-router";
import animeCard from "@/components/AnimeCard.vue";

@Component({ components: { animeCard } })
export default class Player extends Vue {
    isFullscreen = false;
    isPlaying = false;
    isControlsVisible = true;
    isControlsHovered = false;
    video: HTMLVideoElement | null = null;
    seek: HTMLDivElement | null = null;
    source = "";

    duration = 0;
    current = 0;
    loaded = 0;
    buffering = false;

    seekbar = {
        dragging: false,
    }

    get show() {
        return this.$store.state.show;
    }

    get episodes() {
        return this.$store.state.episodes;
    }

    private formatSeconds(seconds: number) {
        const date = new Date(1000 * seconds);
        if (date.getHours() > 0)
            return date.toISOString().substr(11, 8);
        else
            return date.toISOString().substr(14, 5);
    }

    private requestEpisode(term: string, episode: number) {
        ipcRenderer.send("fetch-episode", term, episode);
    }

    @Watch("source")
    onSourceChanged() {
        this.handleControls();

        this.video = this.$refs.video as HTMLVideoElement;
        this.video.addEventListener("loadedmetadata", () => this.duration = this.video?.duration || 0);
        this.video.addEventListener("timeupdate", () => this.current = this.video?.currentTime || 0);
        this.video.addEventListener("progress", () => {
            let range = 0;
            const buffered = this.video?.buffered || new TimeRanges();
            const current = this.video?.currentTime || 0;

            while(!(buffered.start(range) <= current && current <= buffered.end(range)))
                if (range < buffered.length)
                    range += 1;

            this.loaded = buffered.end(range);
        });
    }

    handleControls() {
        const onStop = () => this.isControlsVisible = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
        let thread: any;

        this.isControlsVisible = true;
        clearTimeout(thread);
        thread = setTimeout(onStop, 5000);
    }

    handleEpisodeRequest(increment: number) {
        const current = parseInt(this.$route.params.episode);
        const count = this.episodes.count;
        const next = current + increment;

        if (next > count || next < 1)
            return;

        this.$router.push({ name: "Watch", params: { term: this.episodes.query, episode: next.toString() } });
    }

    handleSeekDragStartRequest(event: MouseEvent) {
        if (this.video === null || this.seek === null)
            return;

        this.seekbar.dragging = true;
        this.current = ((event.clientX - this.seek.offsetLeft) / this.seek.offsetWidth) * this.duration;
    }

    handleSeekDraggingRequest(event: MouseEvent) {
        if (this.video === null || this.seek === null || !this.seekbar.dragging)
            return;

        this.current = ((event.clientX - this.seek.offsetLeft) / this.seek.offsetWidth) * this.duration;
    }

    handleSeekDragEndRequest(event: MouseEvent) {
        if (this.video === null || this.seek === null)
            return;

        this.current = ((event.clientX - this.seek.offsetLeft) / this.seek.offsetWidth) * this.duration;
        this.seekbar.dragging = false;
        this.video.currentTime = this.current;
    }

    handleSeekRequest(event: MouseEvent) {
        if (this.video === null || this.seek === null)
            return;

        this.video.pause();
        this.video.currentTime = ((event.clientX - this.seek.offsetLeft) / this.seek.offsetWidth) * this.duration;

        if (this.isPlaying)
            this.video.play();
    }

    handlePlayRequest() {
        if (this.video === null)
            return;

        if (this.isPlaying)
            this.video.pause();
        else
            this.video.play();

        this.isPlaying = !this.isPlaying;
    }

    handleFullscreenRequest() {
        if (this.isFullscreen)
            document.exitFullscreen();
        else
            (this.$refs.player as HTMLElement).requestFullscreen();
    }

    created() {
        ipcRenderer.on("fetched-episode", (_, episode) => this.source = episode.stream_url);
        document.addEventListener("fullscreenchange", () => this.isFullscreen = !this.isFullscreen);
    }

    mounted() {
        this.seek = this.$refs.seek as HTMLDivElement;
    }

    beforeRouteEnter(to: Route, from: Route, next: Function) {
        next(async (vm: Player) => {
            vm.$emit("watch-enter");
            const { term, episode } = vm.$route.params;
            vm.requestEpisode(term, parseInt(episode));
        });
    }

    beforeRouteUpdate(to: Route, from: Route, next: Function) {
        this.source = "";
        const { term, episode } = to.params;
        this.requestEpisode(term, parseInt(episode));
        next();
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

.timestamp {
    color: white;
}

.icon {
    color: white;
    cursor: pointer;

    &.disabled {
        color: rgba(51, 51, 51, 0.2);
        cursor: default;
    }
}

.video {
    object-fit: contain;
    width: 100%;

    &.non-fullscreen {
        height: calc(100vh - 30px);
    }
}

.buffer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    z-index: 900;
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
                    position: relative;
                    height: 5px;
                    width: 100%;
                    background: rgba(169, 169, 169, 0.1);

                    .fill {
                        position: absolute;
                        height: 100%;

                        &.progress {
                            background: goldenrod;
                        }

                        &.loaded {
                            background: rgba(255, 255, 255, 0.5);
                            width: 50%;
                        }
                    }
                }

                .other-controls {
                    padding-top: 10px;
                    display: grid;
                    grid-template-columns: 30px 30px 200px auto 30px;
                }
            }

            &.hover {
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