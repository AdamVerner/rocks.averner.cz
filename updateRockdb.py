import json
import re

import requests

ZONERAMA_PARSE = r'https:\/\/www\.zonerama\.com\/photos\/(\d+)_(\d+)x(\d+)\.jpg'


def get_thumb_size(x, y):
    x, y = int(x), int(y)
    scale = max([x, y]) / 150
    x = int(x / scale)
    y = int(y / scale)
    return x, y


def zonerama_get(zonerama_url: str) -> (str, str):
    r = requests.get(zonerama_url)
    id, x, y = re.findall(ZONERAMA_PARSE, r.text)[0]
    tx, ty = get_thumb_size(x, y)

    base = 'https://www.zonerama.com/photos/' + id
    src = base + f'_{x}x{y}.jpg'
    thumb = base + f'_{tx}x{ty}.jpg'

    return thumb, src


def generate_thumbnails(rockdb: dict):
    for image in [item for rock in rockdb['rocks'] for item in rock['Pictures']]:
        if 'Zonerama' in image.keys():
            if 'Thumbnail' in image.keys() and 'Source' in image.keys():
                continue
            thumb, source = zonerama_get(image['Zonerama'])
            image['Thumbnail'] = thumb
            image['Source'] = source


def loadRockdb():
    return json.load(open('data/rockdb.json', 'rb'))


def saveRockdb(rockdb):
    json.dump(rockdb, open('data/rockdb.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)


if __name__ == '__main__':
    db = loadRockdb()
    generate_thumbnails(db)
    print(json.dumps(db, indent=2, ensure_ascii=False))
    saveRockdb(rockdb=db)

