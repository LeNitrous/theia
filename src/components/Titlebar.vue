<template>
    <div class="titlebar" :class="{ 'is-transparent': transparent }">
        <div class="drag-box" :class="{ 'show-back-button': showBackButton }">
            <div class="controls start">
                <div class="control-button" @click="$router.push({ name: 'Search' })">
                    <span>&#xE71E;</span>
                </div>
            </div>
            <div v-if="showTitle" class="window-title">
                <span id="logo">theia</span> <span id="mode" class="debug" v-if="isDevelopment">debug</span>
            </div>
            <div class="controls end">
                <div class="control-button" id="minimize" @click="handleWindowControl('minimize')">
                    <span>&#xE921;</span>
                </div>
                <div class="control-button" id="maximize" @click="handleWindowControl('maximize')">
                    <span>&#xE922;</span>
                </div>
                <div class="control-button" id="restore" @click="handleWindowControl('restore')">
                    <span>&#xE923;</span>
                </div>
                <div class="control-button" id="close" @click="handleWindowControl('close')">
                    <span>&#xE8BB;</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { remote, BrowserWindow } from "electron";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

const win: BrowserWindow = remote.getCurrentWindow();

type WindowAction = "minimize" | "maximize" | "restore" | "close";

@Component
export default class Titlebar extends Vue {
    isDevelopment = false;

    @Prop(Boolean) transparent!: boolean;
    @Prop({ default: true, type: Boolean }) showTitle!: boolean;
    @Prop({ default: false, type: Boolean }) showBackButton!: boolean;

    beforeMount() {
        this.isDevelopment = process.env.NODE_ENV !== "production";
        win.on("maximize", this.toggleMaxRestoreButtons);
        win.on("unmaximize", this.toggleMaxRestoreButtons);
    }

    toggleMaxRestoreButtons() {
        (win.isMaximized()) ?
            document.body.classList.add("maximized") :
            document.body.classList.remove("maximized");
    }

    handleWindowControl(method: WindowAction) {
        this.toggleMaxRestoreButtons();

        switch(method) {
            case "minimize":
                win.minimize();
                break;
            case "maximize":
                win.maximize();
                this.toggleMaxRestoreButtons();
                break;
            case "restore":
                win.unmaximize();
                this.toggleMaxRestoreButtons();
                break;
            case "close":
                win.close();
                break;
        }
    }
}
</script>

<style lang="scss">
body {
    &.maximized {
        .titlebar {
            width: 100%;
            padding: 0;
        }

        #restore {
            display: flex !important;
        }

        #maximize {
            display: none;
        }
    }

}

.titlebar {
    position: fixed;
    width: 100%;
    height: 30px;
    z-index: 99999;
    background: rgb(40, 50, 60);
    padding: 4px;

    &.is-transparent {
        background: rgba(0, 0, 0, 0) !important;
    }

    .drag-box {
        display: grid;
        grid-template-columns: auto 138px;
        width: 100%;
        height: 100%;
        -webkit-app-region: drag;

        &.show-back-button {
            .controls {
                &.start {
                    display: grid !important;
                }
            }

            .window-title {
                margin-left: calc(46px + 8px);
            }
        }

        .window-title {
            grid-column: 1;
            display: flex;
            align-items: center;
            margin-left: 8px;
            overflow-x: hidden;
            font-size: 12px;
            color: white;
            transition: margin 0.5s ease;

            span {
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.5;

                &#logo {
                    font-family: "Creo Extra Bold";
                    height: 0.9rem;
                }

                &#mode {
                    margin-left: 3px;
                    font-family: "Segoe UI", sans-serif;
                    letter-spacing: 0;

                    &.debug {
                        padding: 0 5px;
                        background: rgb(255, 255, 100);
                        color: black;
                        border-radius: 3px;
                    }
                }
            }
        }

        .controls {
            display: grid;
            position: absolute;
            top: 0;
            height: 100%;
            -webkit-app-region: no-drag;

            &.end {
                right: 0;
                grid-template-columns: repeat(3, 46px);
            }

            &.start {
                left: 0;
                grid-template-columns: 46px;
                display: none !important;
            }

            .control-button {
                grid-row: 1 / span 1;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
                user-select: none;
                cursor: default;
                color: white;
                font-family: "Segoe MDL2 Assets";
                font-size: 10px;

                &:hover {
                    background: rgba(255,255,255,0.1);
                }

                &:active {
                    background: rgba(255,255,255,0.2);
                }

                &#minimize {
                    grid-column: 1;
                }

                &#maximize, &#restore {
                    grid-column: 2;
                }

                &#close {
                    grid-column: 3;

                    &:hover {
                        background: rgb(232, 17, 35) !important;
                    }

                    &:active {
                        background: rgba(232, 17, 35, 0.5) !important;
                    }
                }

                &#restore {
                    display: none;
                }
            }
        }
    }
}
</style>