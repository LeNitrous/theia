"use strict";

import { app, protocol, BrowserWindow, ipcMain } from "electron";
import {
    createProtocol,
    /* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";
const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: "app", privileges: { secure: true, standard: true } }]);

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({ minWidth: 800, minHeight: 600,
        frame: false,
        title: "Theia",
        webPreferences: {
            nodeIntegration: true,
        }
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
        if (!process.env.IS_TEST) win.webContents.openDevTools();
    } else {
        createProtocol("app");
        // Load the index.html when not in development
        win.loadURL("app://./index.html");
    }

    win.on("closed", () => {
        win = null;
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

    }
    createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === "win32") {
        process.on("message", data => {
            if (data === "graceful-exit") {
                app.quit();
            }
        });
    } else {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}

import log from "electron-log";
import Mal from "node-myanimelist";
import AnimeDownloader from "./util/anime";
import { Worker } from "worker_threads";

Object.assign(console, log.functions);
AnimeDownloader.base = app.getAppPath();


ipcMain.on("fetch-search", async (e, q) => {
    console.log(`Searching shows with the query "${q}".`);
    const { results } = (await Mal.search().anime({ q, limit: 30 })).data;
    console.log("Search results found.");
    e.sender.send("fetched-search", results);
});

ipcMain.on("fetch-show", async (e, id) => {
    console.log(`Fetching show (ID: ${id}).`);
    const show = (await Mal.anime(id).info()).data;
    const { pictures } = (await Mal.anime(id).pictures()).data;
    console.log("Show found.");
    e.sender.send("fetched-show", show, pictures);
});

ipcMain.on("fetch-show-episodes", async (e, titles) => {
    console.log(`Fetching show's episodes with ${titles.length} possible titles.`);
    const worker = new Worker("./src/util/sanity.js", { workerData: { titles, appPath: app.getAppPath() }, stdout: true, stderr: true });
    worker.on("message", ([episodeCount, term]) => {
        e.sender.send("fetched-show-episodes", episodeCount, term);
        worker.terminate();
    });
    worker.stdout.on("data", (log) => console.log("[SANITY] " + log.toString("utf8")));
    worker.stderr.on("data", (err) => {
        console.error("[SANITY] " + err.toString("utf8"));
        e.sender.send("fetched-show-episodes", null);
    });
});

ipcMain.on("fetch-episode", async (e, title, episodeNo) => {
    try {
        const episode = await AnimeDownloader.getEpisodeQuick("animefreak", title, episodeNo);
        e.sender.send("fetched-episode", episode);
    } catch(e) {
        console.error(e);
        e.sender.send("fetched-episode", null);
    }
});