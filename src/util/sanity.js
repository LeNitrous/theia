/* eslint-disable @typescript-eslint/no-var-requires */
const { parentPort, workerData } = require("worker_threads");
const { PythonShell } = require("python-shell");
const path = require("path");

const titles = workerData.titles.filter((t) => !!t);

// This worker script is completely disconnected from the main and renderer process.
// Hence we have to rewrite the script to fit this worker's needs.

function run(...args) {
    return new Promise((resolve, reject) => {
        const script = path.join(workerData.appPath, "..", "scripts/anime.py");
        const python = PythonShell.run(script, { mode: "json", args: args }, (error) => {
            if (error)
                reject(error);
        });

        python.on("message", (data) => {
            if (data.error)
                reject(data.error);

            resolve(data);
        });

        python.on("error", (error) => {
            reject(error);
        });
    });
}

function search(title) {
    return run("--search", title, "animefreak");
}

function getAnime(url) {
    return run("--get-anime", url, "animefreak");
}

function clean(s) {
    return s.replace(/-/g, " ").replace(/[^\w\s]/g, "").toLowerCase();
}

(async function() {
    let episodeCount = 0;
    let results = [];
    let used = null;

    try {
        // Try out all titles to see if we have a pass.
        // This is a very slow and expensive method but it guarantees that we're getting the right show and episodes from the streamer.
        // This only happens as streamers title anime differently from one another. Fortunately MAL gives us enough context for that.
        for (const title of titles) {
            used = title;
            console.log(`Searching with "${title}".`);

            const response = await search(title);
            results = [...results, ...response];

            const matches = response.filter((item) => clean(item.title) == clean(title));

            if (matches.length > 0) {
                console.log("Found a show.");
                episodeCount = (await getAnime(matches[0].url)).episode_count;
                break;
            }
        }
    } catch(e) {
        console.error(e);
    }

    if (episodeCount == 0) {
        console.log(`Last resort check. There are ${results.length} results found.`);

        for (const title of titles) {
            used = title;
            const matches = results.filter((r) => clean(r.title) == clean(title));

            if (matches.length > 0) {
                console.log("Found a show.");
                episodeCount = (await getAnime(matches[0].url)).episode_count;
                break;
            }
        }

        if (episodeCount == 0)
            console.log("The show has no episodes.");
    }

    parentPort.postMessage([episodeCount, used]);
})();