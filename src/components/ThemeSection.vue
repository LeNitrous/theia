<template>
    <div class="theme">
        <p class="theme-type">{{ header }}</p>
        <span v-for="(t, i) in formatted" :key="`${header.toLowerCase()}_` + i">
            <p class="theme-item">{{ t[0] }}</p>
            <p class="theme-item artist"> by {{ t[1] }}</p>
        </span>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component
export default class ThemeSection extends Vue {
    @Prop(String) header!: string;
    @Prop(Array) themes!: string[];

    get formatted(): string[][] {
        return this.themes.map((s) => {
            const [title, artist] = s.slice(0, s.indexOf("(", s.indexOf("by"))).trim().split("by").map((s) => s.trim());
            return [title.replace(/"/g, ""), artist];
        });
    }
}
</script>

<style lang="scss" scoped>
.theme {
    margin-bottom: 1rem;
}

p {
    color: white;

    &.theme-type {
        font-size: 12px;
    }

    &.theme-item {
        padding-left: 1rem;
    }

    &.artist {
        font-size: 12px;
        padding-left: 1.5rem;
    }
}
</style>