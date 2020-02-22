import { PythonShell } from "python-shell";
import * as path from "path";

export default abstract class AnimeDownloader {
    private static run<T> (...args: string[]): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const script = path.join(AnimeDownloader.base, "..", "scripts/anime.py");
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

    static base = "";

    static getSupportedSites(): Promise<[string, string, string][]> {
        return AnimeDownloader.run<[string, string, string][]>("--supported");
    }

    static getAnime(url: string, site: string): Promise<IAnimeResponse> {
        return AnimeDownloader.run<IAnimeResponse>("--get-anime", url, site);
    }

    static getEpisode(url: string, site: string, episode: number): Promise<IEpisodeResponse> {
        return AnimeDownloader.run<IEpisodeResponse>("--get-episode", url, site, episode.toString());
    }

    static getEpisodeQuick(site: string, term: string, episode: number): Promise<IEpisodeResponse> {
        return AnimeDownloader.run<IEpisodeResponse>("--get-episode-smart", term, site, episode.toString());
    }

    static search(site: string, term: string): Promise<ISearchResponse[]> {
        return AnimeDownloader.run<ISearchResponse[]>("--search", term, site);
    }
}

export interface IAnimeResponse {
    episode_count: number;
    title: string;
    url: string;
    sitename: string;
}

export interface IEpisodeResponse {
    title: string;
    episode: number;
    stream_url: string;
}

export interface ISearchResponse {
    title: string;
    poster: string;
    url: string;
}