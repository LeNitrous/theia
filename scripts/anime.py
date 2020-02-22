from anime_downloader import get_anime_class
from anime_downloader.extractors import get_extractor
from anime_downloader.sites import ALL_ANIME_SITES
import json
import sys

error_json = "{ 'error': 'invalid syntax' }"

def get_supported_sites():
    return json.dumps(ALL_ANIME_SITES)

def search_anime(query, site):
    anime = get_anime_class(site)
    return json.dumps([dict(title=a.title, url=a.url, poster=a.poster) for a in anime.search(query)])

def get_anime(url, site):
    anime = get_anime_class(site)

    def dictify_anime(a):
        return dict(
            title = a.title,
            url = a.url,
            sitename = a.sitename,
            episode_count = len(a)
        )

    return json.dumps(dictify_anime(anime(url)))

def get_anime_episode(url, site, episode):
    anime = get_anime_class(site)

    return json.dumps(dictify_episode(anime(url)))

def get_anime_episode_2(query, site, episode):
    provider = get_anime_class(site)
    result = provider.search(query)[0]
    anime = provider(result.url)

    return json.dumps(dictify_episode(anime, episode))

def dictify_episode(a, episode):
    e = a[episode]
    return dict(
        title = a.title,
        number = e.ep_no,
        stream_url = e.source().stream_url
    )

if len(sys.argv) < 2:
    print(error_json)
    quit()

if sys.argv[1] == "--supported":
    print(get_supported_sites())
elif sys.argv[1] == "--search":
    print(search_anime(sys.argv[2], sys.argv[3]))
elif sys.argv[1] == "--get-anime":
    print(get_anime(sys.argv[2], sys.argv[3]))
elif sys.argv[1] == "--get-episode":
    print(get_anime_episode(sys.argv[2], sys.argv[3], int(sys.argv[4]) - 1))
elif sys.argv[1] == "--get-episode-smart":
    print(get_anime_episode_2(sys.argv[2], sys.argv[3], int(sys.argv[4]) - 1))

sys.stdout.flush()
