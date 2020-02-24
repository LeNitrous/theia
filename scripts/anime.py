import json
import sys  
import subprocess
import importlib.util

try:
    from anime_downloader import get_anime_class, ALL_ANIME_SITES
except ImportError:
    pass

def create_json(key, message):
    data = {}
    data[key] = message
    return json.dumps(data)

def install_dependency():
    python = sys.executable
    subprocess.check_call([python, "-m", "pip", "install", "anime_downloader"], stdout = subprocess.DEVNULL)

def check_dependency():
    dependency = importlib.util.find_spec("anime_downloader")
    return dependency is not None

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

    return json.dumps(dictify_episode(anime(url), episode))

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
    print(create_json("error", "invalid syntax"), flush = True)
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
elif sys.argv[1] == "--install-deps":
    install_dependency()
    print(create_json("status", "installed dependencies"))
elif sys.argv[1] == "--check-deps":
    print(create_json("dependency", check_dependency()))

sys.stdout.flush()
