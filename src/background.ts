"use strict";

import { app, protocol, BrowserWindow, ipcMain, dialog } from "electron";
import {
    createProtocol,
    /* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";
import log from "electron-log";
import Mal from "node-myanimelist";
import AnimeDownloader from "./util/anime";
import { Worker } from "worker_threads";
import { spawn } from "child_process";

Object.assign(console, log.functions);
AnimeDownloader.base = app.getAppPath();
const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: "app", privileges: { secure: true, standard: true } }]);

function createWindow() {
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
    
    console.log("Initializing...");

    const pythonCheck = spawn("python", ["-V"]);
    pythonCheck.stdout.on("data", async (data: Buffer) => {
        const version = data.toString().split(" ")[1].trim();
        const major = parseInt(version.split(".")[0]);

        console.log(`Python ${version} found.`);

        if (major > 3) {
            dialog.showMessageBox({
                title: "theia",
                type: "error",
                message: `Python version is too low. Python ${version} was found.`
            });
        }
        else {
            const { dependency } = (await AnimeDownloader.checkDependency());

            if (!dependency) {
                console.log("Script dependencies were not installed. Installing...");
                await AnimeDownloader.installDependency();
            }
        
            createWindow();
        }
    });

    pythonCheck.stderr.on("data", () => {
        console.error("Python is not installed or is not found.");
        dialog.showMessageBox({
            title: "theia",
            type: "error",
            message: "Python is not installed or is not found."
        });
    });
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

ipcMain.on("fetch-search", async (e, q) => {
    console.log(`Searching shows with the query "${q}".`);

    let response = null;

    try {
        const { results } = (await Mal.search().anime({ q, limit: 30 })).data;
        console.log("Search results found.");
        response = results;
    } catch (e) {
        console.error(e);
    }

    e.sender.send("fetched-search", response);
});

ipcMain.on("fetch-show", async (e, id) => {
    console.log(`Fetching show (ID: ${id}).`);

    let response = null;

    try {
        const show = (await Mal.anime(id).info()).data;
        const { pictures } = (await Mal.anime(id).pictures()).data;
        show.pictures = pictures;
        response = show;
        console.log("Show found.");
    } catch (e) {
        console.error(e);
    }
    
    e.sender.send("fetched-show", response);
});

ipcMain.on("fetch-shows", async (e, ids: number[]) => {
    function reflect<T>(promise: Promise<T>): Promise<{data: T; fulfilled: boolean}> {
        return promise
            .then((resolved) => ({data: resolved, fulfilled: true}))
            .catch((error) => ({data: error, fulfilled: false}));
    }

    console.log(`Fetching ${ids.length} shows.`);
    const shows = await Promise.all(ids.map((id) => reflect(Mal.anime(id).info())));
    const success = shows.filter(s => s.fulfilled);
    console.log(`Fetched ${success.length} shows (${ids.length - success.length} failed).`);

    e.sender.send("fetched-shows", success.map((entry) => entry.data.data));
});

ipcMain.on("fetch-show-episodes", async (e, titles) => {
    console.log(`Fetching show's episodes with ${titles.length} possible titles.`);
    const worker = new Worker("./src/util/sanity.js", { workerData: { titles, appPath: app.getAppPath() }, stdout: true, stderr: true });
    worker.on("message", ([episodeCount, term]) => {
        console.log(`Fetched ${episodeCount} episodes from show.`);
        e.sender.send("fetched-show-episodes", episodeCount, term);
        worker.terminate();
    });
    worker.stdout.on("data", (log) => console.log("[SANITY] " + log.toString("utf8")));
    worker.stderr.on("data", (err) => {
        console.error("[SANITY] " + err.toString("utf8"));
        e.sender.send("fetched-show-episodes", null, null);
    });
});

ipcMain.on("fetch-episode", async (e, title, episodeNo) => {
    let response = null;

    try {
        response = await AnimeDownloader.getEpisodeQuick("animefreak", title, episodeNo);
    } catch(e) {
        console.error(e);
    }

    e.sender.send("fetched-episode", response);
});