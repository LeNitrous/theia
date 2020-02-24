<template>
    <div class="container has-text-centered" id="main">
        <b-icon icon="spinner" custom-class="fa-spin" size="is-large" v-if="!loaded"/>
        <div class="container" v-else>
            <div class="container has-text-left" v-if="results.length < 1">
                <p>There were no results found.</p>
            </div>
            <div class="columns is-mobile is-multiline" v-else>
                <div class="column is-narrow" v-for="(item, index) in results" :key="index">
                    <anime-card :show="item"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Route } from "vue-router";
import { ipcRenderer } from "electron";
import animeCard from "@/components/AnimeCard.vue";

@Component({ components: { animeCard } })
export default class Search extends Vue {
    created() {
        ipcRenderer.on("fetched-search", (_, results) => this.results = results);
    }

    set results(value) {
        this.$store.commit("SET_SEARCH_RESULTS", value);
    }

    get results() {
        return this.$store.state.results;
    }

    get loaded() {
        return this.results !== undefined;
    }

    beforeRouteEnter(to: Route, from: Route, next: Function) {
        // "this" doesn't exist inside this method
        // but we can access it when calling "next"
        next(async (vm: Search) => {
            if (from.name != "Index")
                vm.$emit("show-leave");
        });
    }

    beforeRouteUpdate(to: Route, from: Route, next: Function) {
        this.results = undefined;
        next();
    }
}
</script>