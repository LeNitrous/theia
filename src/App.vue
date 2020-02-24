<template>
    <div id="app">
        <titlebar :transparent="true" :showTitle="started" :showBackButton="isFullView"/>
        <section 
            class="hero main is-fullheight" 
            :class="{ 'show-router': started, 'hide': isFullView, 'peeking': peeking }">
            <div class="hero-body" :class="{ 'hide-search': isFullView }">
                <div class="container">
                    <p class="logo">
                        <span class="title">theia</span> <span class="subtitle">watch</span> 
                    </p>
                    <b-field addons>
                        <b-input
                            placeholder="search for titles..."
                            icon="search"
                            icon-clickable
                            :expanded="true"
                            v-model="search.query"
                            @keyup.enter.native="handleSearch()"/>
                    </b-field>
                </div>
            </div>
        </section>
        <div class="router-view" :class="{ 'show-router': started, 'hide-search': isFullView }">
            <vue-scroll>
                <router-view
                    @show-enter="isFullView = true"
                    @show-leave="isFullView = false"
                    @watch-enter="peeking = true"
                    @watch-leave="peeking = false"/>
            </vue-scroll>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { ipcRenderer, shell } from "electron";
import titlebar from "@/components/Titlebar.vue";
import $ from "jquery";

@Component({ components: { titlebar } })
export default class App extends Vue {
    isFullView = false;
    peeking = false;
    search = {
        query: "",
        last: "",
    }

    get started() {
        return this.search.query.length > 0;
    }

    handleSearch() {
        if (this.search.query.length < 1 || this.search.last == this.search.query)
            return;

        ipcRenderer.send("fetch-search", this.search.query);
        this.search.last = this.search.query;
        
        this.$router.push({ 
            name: "Search", 
            query: { q: this.search.query } 
        });
    }

    created() {
        //open links externally by default
        $(document).on("click", "a[href^=\"http\"]", function(event: Event) {
            event.preventDefault();
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            shell.openExternal(this.href);
        });
    }
}
</script>

<style lang="scss" scoped>
.router-view {
    display: none;
    overflow: hidden auto;

    &.show-router {
        display: block !important;
        height: calc(100vh - 7rem);

        &.hide-search {
            height: 100vh;
        }
    }
}

.hero {
    &.main {
        background: $base-color;
        overflow: hidden;

        .logo {
            visibility: visible;
            transition: visibility 0s, opacity 0.5s linear;

            .title {
                font-family: "Creo Extra Bold";
                font-size: 64px;
                height: 80px;
                color: white;
                transition: all 0.5 ease;
            }

            .subtitle {
                color: white;
            }
        }

        &.show-router {
            .logo {
                display: none;
                visibility: hidden;
            }

            transition: all 0.5s ease;
            min-height: 0;
            height: 7rem;
        }

        &.hide {
            height: 0;
        }

        &.peeking {
            height: 30px !important;
        }
    }

    .hero-body {
        &.hide-search {
            visibility: hidden;
        }
    }
}
</style>