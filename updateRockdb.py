import json
import re


def generate_thumbnails(rockdb: dict):
    for image in [item for rock in rockdb['rocks'] for item in rock['Pictures']]:
        if not image['Thumbnail']:
            if image['Source'].find('zonerama.com') != -1:
                x, y = re.findall(r'_(\d+)x(\d+)_', image['Source'])[0]
                x, y = int(x), int(y)
                scale = max([x, y]) / 150
                x = int(x / scale)
                y = int(y / scale)
                image['Thumbnail'] = re.sub(r'_(\d+)x(\d+)_', f'_{x}x{y}_', image['Source'])
            else:

                image['Thumbnail'] = image['Source']


def loadRockdb():
    return json.load(open('data/rockdb.json', 'rb'))


def saveRockdb(rockdb):
    json.dump(rockdb, open('data/rockdb.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)


if __name__ == '__main__':
    db = loadRockdb()
    generate_thumbnails(db)
    print(json.dumps(db, indent=2, ensure_ascii=False))
    saveRockdb(rockdb=db)

