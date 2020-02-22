<template>
    <div class="container" :class="{ 'main': isLoading }">
        <div class="has-text-centered" v-if="isLoading">
            <b-icon icon="spinner" custom-class="fa-spin" size="is-large"/>
        </div>
        <template v-else>
            <section class="hero is-medium">
                <div class="hero-body cover" v-lazy:background-image="show.pictures[0].large"></div>
            </section>
            <section class="container" id="main">
                <div class="columns">
                    <div class="column is-narrow">
                        <anime-card :show="show.data" is-static class="main"/>
                        <b-button expanded tag="a" :href="`https://myanimelist.net/anime/${show.data.mal_id}`" >MyAnimeList</b-button>
                    </div>
                    <div class="column">
                        <section class="info-section">
                            <h1 class="title">{{ show.data.title }}</h1>
                            <p>{{ show.data.synopsis }}</p>
                        </section>
                        <section class="info-section">
                            <h3>Episodes</h3>
                            <div class="has-text-centered" v-if="isLoadingEpisodes">
                                <b-icon icon="spinner" custom-class="fa-spin" size="is-large"/>
                            </div>
                            <div class="container info-content" v-if="!isLoadingEpisodes">
                                <template v-if="episodes !== null && episodes > 0">
                                    <vue-scroll>
                                        <b-button
                                            class="episode-item"
                                            v-for="i in episodes"
                                            :key="'episode_' + i"
                                            @click="$router.push({ name: 'Watch', params: { term: episodeSearchTerm, episode: i } })">
                                            {{ i }}
                                        </b-button>
                                    </vue-scroll>
                                </template>
                                <template v-else-if="show.data.status == 'Not yet aired'">
                                    <p>This show hasn't aired yet.</p>
                                </template>
                                <template v-else-if="episodes !== null && episodes == 0">
                                    <p>This show has no viewable episodes.</p>
                                </template>
                                <template v-else-if="episodes === null">
                                    <p>Unable to obtain this show's episodes.</p>
                                </template>
                            </div>
                        </section>
                        <section class="info-section" v-if="show.data.opening_themes.length > 0 || show.data.ending_themes.length > 0">
                            <h3>Themes</h3>
                            <section class="info-subsection">
                                <div class="columns">
                                    <div class="column info-content" v-if="show.data.opening_themes.length > 0">
                                        <vue-scroll>
                                            <theme-section header="Opening" :themes="show.data.opening_themes"/>
                                        </vue-scroll>
                                    </div>
                                    <div class="column info-content" v-if="show.data.ending_themes.length > 0">
                                        <vue-scroll>
                                            <theme-section header="Ending" :themes="show.data.ending_themes"/>
                                        </vue-scroll>
                                    </div>
                                </div>
                            </section>
                        </section>
                        <section class="info-section">
                            <h3>Related Shows</h3>
                            <div class="has-text-centered" v-if="isLoadingRelatedShows">
                                <b-icon icon="spinner" custom-class="fa-spin" size="is-large"/>
                            </div>
                            <div class="columns is-multiline is-mobile" v-if="!isLoadingRelatedShows && relatedShows.length > 0">
                                <div class="column is-narrow" v-for="(e, i) in relatedShows" :key="'related_' + i">
                                    <anime-card :show="e"/>
                                </div>
                            </div>
                            <p v-if="!isLoadingRelatedShows && relatedShows.length == 0">None</p>
                        </section>
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ipcRenderer } from "electron";
import { Route } from "vue-router";
import animeCard from "@/components/AnimeCard.vue";
import themeSection from "@/components/ThemeSection.vue";
import Mal from "node-myanimelist";

@Component({ components: { animeCard, themeSection } })
export default class Show extends Vue {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    relatedShows: any[] = [];
    isLoading = true;
    isLoadingEpisodes = true;
    isLoadingRelatedShows = true;
    episodes = 0;
    episodeSearchTerm = null;
    show: {
        data: IUnknownObject;
        pictures: [];
    } = { data: {}, pictures: [] };

    @Prop(String) source!: string;
    @Prop(String) slug!: string;

    private fetchShow(id: string) {
        ipcRenderer.send("fetch-show", id);
    }

    async fetchRelatedShows() {
        const ids = Object
            .values(this.show.data.related)
            .flat()
            .filter((t) => t.type == "anime")
            .map((t) => t.mal_id);

        const r = await Promise.all(ids.map((id) => Mal.anime(id).info()));
        return r.map((i) => i.data);
    }

    created() {
        console.log("created");
        ipcRenderer
            .on("fetched-show", async (_, show, pictures) => {
                this.show = { data: show, pictures };
                this.isLoading = false;

                if (this.show.data.status != "Not yet aired")
                    ipcRenderer.send("fetch-show-episodes", [
                        this.show.data.title, 
                        this.show.data.title_english, 
                        ...this.show.data.title_synonyms
                    ]);
                else
                    this.isLoadingEpisodes = false;

                try {
                    this.relatedShows = await this.fetchRelatedShows();
                } catch(e) {
                    console.error(e);
                } finally {
                    this.isLoadingRelatedShows = false;
                }
            })
            .on("fetched-show-episodes", (_, epCount, term) => {
                this.episodes = epCount;
                this.episodeSearchTerm = term;
                console.log(this.episodeSearchTerm);
                this.isLoadingEpisodes = false;
            });
    }

    beforeRouteEnter(to: Route, from: Route, next: Function) {
        // "this" doesn't exist inside this method
        // but we can access it when calling "next"
        next(async (vm: Show) => {
            vm.$emit("show-enter");
            vm.fetchShow(vm.$route.params.id);
        });
    }

    beforeRouteUpdate(to: Route, from: Route, next: Function) {
        this.isLoading = true;
        this.isLoadingEpisodes = true;
        this.isLoadingRelatedShows = true;
        this.fetchShow(to.params.id);
        next();
    }

    beforeRouteLeave(to: Route, from: Route, next: Function) {
        ipcRenderer
            .removeAllListeners("fetched-show-episodes")
            .removeAllListeners("fetched-show");
        next();
    }
}

interface IUnknownObject {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any | [];
}
</script>

<style lang="scss" scoped>
.hero-body {
    &.cover {
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        filter: blur(8px);
    }
}

.anime-card {
    &.main {
        margin: -10rem auto auto;
    }
}

.button {
    background-color: transparent;
    color: white;
    border-color: white;
    border-radius: 3px;
    margin-top: 1rem;
    opacity: 0.2;
}

.title {
    color: white;
    font-weight: 500;
}

.info-section {
    margin-bottom: 2rem;
}

.info-subsection {
    padding-left: 1rem;
}

.info-content {
    max-height: 400px;
    overflow-y: auto;
}

.episode-item {
    width: 3rem;
    height: 3rem;
    margin-bottom: 0.5rem;
    margin-left: 0.5rem;
}

h3 {
    color: white;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

p {
    color: white;
}
</style>