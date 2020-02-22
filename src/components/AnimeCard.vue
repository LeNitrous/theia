<template>
    <div class="anime-card" :class="{ 'is-static': isStatic }" @click="handleClick()">
        <div class="poster" v-lazy:background-image="show.image_url"></div>
        <div class="info has-text-left">
            <p>{{ show.title }}</p>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ipcRenderer } from "electron";

@Component
export default class AnimeCard extends Vue {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Prop(Object) show!: any;
    @Prop({ default: false, type: Boolean }) isStatic!: boolean;

    handleClick() {
        if (this.isStatic)
            return;

        this.$router.push({
            name: "Show",
            params: { id: this.show.mal_id },
        });
    }
}
</script>

<style lang="scss" scoped>
.anime-card {
    position: relative;
    width: 160px;
    height: 220px;
    background-color: lighten(rgb(40, 50, 60), 6%);
    overflow: hidden;
    cursor: pointer;

    &.is-static {
        cursor: default;

        .info {
            display: none;
        }
    }
    
    .poster {
        position: absolute;
        top: 0;
        left: 0;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        width: 100%;
        height: 100%;
        transition: all .5s;
    }

    .info {
        position: relative;
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
        transition: all .5s ease;

        p {
            position: absolute;
            bottom: 0;
            padding: 0 0 0.5rem 0.5rem;
            color: white;
        }
    }
    
    &:hover:not(.is-static) {
        .poster {
            transform: scale(1.2);
        }

        .info {
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%);
        }
    }
}
</style>