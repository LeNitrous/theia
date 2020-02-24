<template>
    <div class="container">
        <b-icon icon="spinner" custom-class="fa-spin" size="is-large" v-if="!showLoaded"/>
        <template v-else>
            <section class="hero is-medium">
                <div class="hero-body cover" v-lazy:background-image="show.pictures[0].large"></div>
            </section>
            <section class="container" id="main">
                <div class="columns">
                    <div class="column is-narrow">
                        <anime-card :show="show" is-static class="main"/>
                        <b-button expanded tag="a" :href="`https://myanimelist.net/anime/${show.mal_id}`" >MyAnimeList</b-button>
                    </div>
                    <div class="column">
                        <section class="info-section">
                            <h1 class="title">{{ show.title }}</h1>
                            <p>{{ show.synopsis }}</p>
                        </section>
                        <section class="info-section">
                            <h3>Episodes</h3>
                            <div class="container info-content" v-if="show.status == 'Not yet aired'">
                                <p>This show hasn't aired yet.</p>
                            </div>
                            <div class="has-text-centered" v-else-if="!episodesLoaded">
                                <b-icon icon="spinner" custom-class="fa-spin" size="is-large"/>
                            </div>
                            <div class="container info-content" v-else>
                                <template v-if="episodes.query !== null">
                                    <template v-if="episodes.count > 0">
                                        <vue-scroll>
                                            <b-button
                                                class="episode-item"
                                                v-for="i in episodes.count"
                                                :key="'episode_' + i"
                                                @click="$router.push({ name: 'Watch', params: { term: episodes.query, episode: i } })">
                                                {{ i }}
                                            </b-button>
                                        </vue-scroll>
                                    </template>
                                    <template v-else>
                                        <p>This show has no viewable episodes.</p>
                                    </template>
                                </template>
                                <template v-else>
                                    <p>Unable to obtain this show's episodes.</p>
                                </template>
                            </div>
                        </section>
                        <section class="info-section" v-if="show.opening_themes.length > 0 || show.ending_themes.length > 0">
                            <h3>Themes</h3>
                            <section class="info-subsection">
                                <div class="columns">
                                    <div class="column info-content" v-if="show.opening_themes.length > 0">
                                        <vue-scroll>
                                            <theme-section header="Opening" :themes="show.opening_themes"/>
                                        </vue-scroll>
                                    </div>
                                    <div class="column info-content" v-if="show.ending_themes.length > 0">
                                        <vue-scroll>
                                            <theme-section header="Ending" :themes="show.ending_themes"/>
                                        </vue-scroll>
                                    </div>
                                </div>
                            </section>
                        </section>
                        <section class="info-section">
                            <h3>Related</h3>
                            <div class="has-text-centered" v-if="!relatedLoaded">
                                <b-icon icon="spinner" custom-class="fa-spin" size="is-large"/>
                            </div>
                            <template v-else>
                                <div class="columns is-multiline is-mobile" v-if="related.length > 0">
                                    <div class="column is-narrow" v-for="(e, i) in related" :key="'related_' + i">
                                        <anime-card :show="e"/>
                                    </div>
                                </div>
                                <p v-else>None</p>
                            </template>
                        </section>
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { ipcRenderer } from "electron";
import { Route } from "vue-router";
import animeCard from "@/components/AnimeCard.vue";
import themeSection from "@/components/ThemeSection.vue";

@Component({ components: { animeCard, themeSection } })
export default class Show extends Vue {
    related = null;

    set show(value) {
        this.$store.commit("SET_SELECTED_SHOW", value);
    }

    get show() {
        return this.$store.state.show;
    }

    set episodes(value) {
        this.$store.commit("SET_EPISODE_INFO", value);
    }

    get episodes() {
        return this.$store.state.episodes;
    }

    get showLoaded() {
        return this.show !== undefined;
    }

    get relatedLoaded() {
        return this.related !== null;
    }

    get episodesLoaded() {
        return this.episodes.query !== undefined;
    }

    requestShow(id: number | string) {
        if (this.showLoaded && this.show.mal_id == id)
            return;

        this.show = undefined;
        this.related = null;
        this.episodes = { count: undefined, query: undefined };
        ipcRenderer.send("fetch-show", id);
    }

    created() {
        ipcRenderer
            .on("fetched-shows", (_, shows) => this.related = shows)
            .on("fetched-show-episodes", (_, count, query) => this.episodes = { count, query })
            .on("fetched-show", (_, show) => {
                this.show = show;

                const possibles = [ show.title,  show.title_english, ...show.title_synonyms ];
                if (show.status != "Not yet aired")
                    ipcRenderer.send("fetch-show-episodes", possibles);

                const ids = Object
                    .values(show.related)
                    .flat()
                    .filter((t) => t.type == "anime")
                    .map((t) => t.mal_id);
                ipcRenderer.send("fetch-shows", ids);
            });
    }

    beforeRouteEnter(to: Route, from: Route, next: Function) {
        next(async (vm: Show) => {
            vm.$emit("show-enter");
            vm.requestShow(vm.$route.params.id);
        });
    }

    beforeRouteUpdate(to: Route, from: Route, next: Function) {
        this.requestShow(to.params.id);
        next();
    }

    beforeRouteLeave(to: Route, from: Route, next: Function) {
        ipcRenderer
            .removeAllListeners("fetched-show")
            .removeAllListeners("fetched-shows")
            .removeAllListeners("fetched-show-episodes");
        next();
    }
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