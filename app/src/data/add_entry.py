import json
import re
from dataclasses import dataclass, asdict
from typing import List

import requests
from bs4 import BeautifulSoup

with open('./database.json', 'w'):
    pass

with open('./database.json', 'r') as data:
    db = json.loads(data.read() or '{}')


def get_data(link: str) -> str:
    # create cache if it does not exist
    with open('./cache.json', 'a'):
        pass

    # load and check cache
    with open('./cache.json', 'r') as cache_file:
        cache_data = json.loads(cache_file.read() or '{}')
        if link in cache_data:
            return cache_data[link]

    # load data from link
    r = requests.get(link, headers={'Accept': '*/*', 'User-Agent': 'curl/8.0.1'})
    assert r.status_code == 200

    # decode and save to cache
    cache_data[link] = raw_data = r.content.decode('utf-8')

    # save cache to disk
    with open('./cache.json', 'w') as cache_file:
        json.dump(cache_data, fp=cache_file)

    return raw_data


@dataclass
class EntryInformation:
    # name of the route
    name: str

    # Name of the tower, local-sector, ...
    rock: str

    # general area - e.g. Adr, Skalak, Prachov, Roviste, ...
    sector: str

    link: str
    # description from the original source

    description: str
    # grade as stated in the source
    grade: str

    # gps coords
    lat: float
    long: float

    # user notes
    user_tags: List[str]
    user_note: str


def add_skalnioblasti_entry(cesta_link: str, tags: List[str], note: str):
    # first find info about "rock" - "route" does not have a gps coordinate
    assert 'cesta_id' in cesta_link
    cesta_data = get_data(cesta_link)

    match_skala = re.search(r'href="(.*skala_id=\d+)"', cesta_data)
    assert match_skala, 'could not find skala_id in the page, maybe skalnioblasti changed their API...'
    skala_link = match_skala.group(1)
    skala_data = get_data(f'https://www.skalnioblasti.cz/{skala_link}')

    # I believe the id parameter corresponds to skala_id, but one more request will not hurt anyone...
    match_mapa = re.search(r'iframe src="(seznam\/mapa\.asp\?id=(\d*))"', skala_data)
    assert match_mapa, 'could not find link to map, maybe skalnioblasti changed their API...'
    mapa_link = match_mapa.group(1)
    mapa_data = get_data(f'https://www.skalnioblasti.cz/{mapa_link}')

    match_coords = re.search(r'fromWGS84\((\d+\.\d+), \n?(\d+\.\d+)\);', mapa_data)
    lat, long = float(match_coords.group(2)), float(match_coords.group(1))

    match_name = re.search(r'<font style="font-size: 2[20]px;">(.*)<\/font>', cesta_data)
    name = match_name.group(1).title()

    match_skala_name = re.search(r'<span class="db_nadpis(_\d)?">(.*)<\/span>', skala_data)
    skala_name = match_skala_name.group(2).title()

    match_sector_name = re.search(
        r'<a href="5_index\.asp\?cmd=6&sektor_id=\d+(&var=ps)?" class=lezec1>(?!<|sektor)(.*)</a>', skala_data
    )
    sector_name = match_sector_name.group(2).title()

    # parsing description is slightly more shitty...
    soup = BeautifulSoup(cesta_data, 'html.parser')
    desc = soup.find(string='popis:').parent.find_next_sibling()
    description = desc.decode_contents()
    # ideally we should parse the stuff in there, ...
    #

    match_grade = re.search(r'<strong>(.*)<\/strong>', cesta_data)
    grade = match_grade.group(1)

    return EntryInformation(
        name=name,
        rock=skala_name,
        sector=sector_name,
        link=cesta_link,
        lat=lat,
        long=long,
        description=description,
        grade=grade,
        user_note=note,
        user_tags=tags,
    )


def add_horosvaz_entry(cesta_link: str, tags: List[str], note: str) -> EntryInformation:
    cesta_data = get_data(cesta_link)
    cesta_soup = BeautifulSoup(cesta_data, 'html.parser')

    grade = cesta_soup.find(attrs={'class': 'classification'}).get_text()
    name = cesta_soup.find(attrs={'class': 'menu5 small-h1'}).get_text().replace(grade, '')
    grade = grade.replace('\xa0|\xa0', '')
    rock_name = cesta_soup.find(attrs={'class': 'skaly-parent'}).get_text()
    sector_name = (
        cesta_soup.find(attrs={'class': 'breadcrumb'})
        .find_all(attrs={'class': 'path-item path-item-page'})[2]
        .get_text()
    )

    authors = cesta_soup.find(attrs={'class': 'mountains-text'}).find('strong').get_text()
    description = cesta_soup.find(attrs={'class': 'mountains-text'}).get_text().replace(authors, '')
    description = f'{description} \n {authors}'

    mapa_link = f"https://www.horosvaz.cz{cesta_soup.find(attrs={'class': 'map'}).get('href')}"
    mapa_data = get_data(mapa_link)

    match_coords = re.search(r'lat":(\d+\.\d+),"lng":(\d+\.\d+),".*type=skala', mapa_data)
    lat, long = float(match_coords.group(1)), float(match_coords.group(2))

    # rock_link = f"https://www.horosvaz.cz{cesta_soup.find(attrs={'class': 'skaly-parent'}).get('href')}"

    return EntryInformation(
        name=name,
        rock=rock_name,
        sector=sector_name,
        link=cesta_link,
        lat=lat,
        long=long,
        description=description,
        grade=grade,
        user_note=note,
        user_tags=tags,
    )


def add_entry(link: str, tags: List[str], note: str):
    if 'www.skalnioblasti.cz' in link:
        entry = add_skalnioblasti_entry(link, tags, note)
    elif 'www.horosvaz.cz' in link:
        entry = add_horosvaz_entry(link, tags, note)
    else:
        raise NotImplementedError()

    print(f'{entry.name} ({entry.rock})', entry.lat, entry.long)

    db.setdefault('entries', [])
    if not len(list(filter(lambda x: x.get('link', None) == link, db['entries']))):
        db['entries'].append(asdict(entry))


add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=12581', ['crack'], note='')
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=13900', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=12712', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=12673', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=12276', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=13470', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=5742', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=5737', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=84855', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=10975', ['crack'], note='')
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=20401', ['crack'], note='')
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=20411', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=59874', ['crack'], note='')
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=22617', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-21127/', ['offwidth'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-36584/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-32059/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-35113/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-38927/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-59462/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-38936/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-11053/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-40798/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-38935/', ['wall'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-25837/', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-24737/', ['crack'], note='')
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=23345', ['crack'], note='')
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=23346', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=23121', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-21456/', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=23058', ['crack'], note='')
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=75778', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=75795', ['crack'], note='')
add_entry('http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=22758', ['crack'], note='')
add_entry('https://www.horosvaz.cz/skaly-cesta-24836/', ['crack'], note='')
add_entry(
    'http://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=12552',
    ['Wall'],
    note='Vzdušnej nástup nad dírou, ale pak to asi bude dobrý',
)
add_entry('https://www.skalnioblasti.cz/5_index.asp?cmd=6&cesta_id=11399', ['Wall'], '')
add_entry('https://www.horosvaz.cz/skaly-cesta-84424/', ['Wall'], '')
with open('database.json', 'w') as database:
    json.dump(db, database, indent=2)

with open('export.gpx', 'w') as export:
    export.write('<?xml version="1.0" encoding="utf-8"?>\n')
    export.write('<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="https://mapy.cz/">\n')
    for e in db['entries']:
        export.write(f'''    <wpt lat="{e['lat']}" lon="{e['long']}">\n''')
        export.write(f'''        <name>{e['grade']} - {e['name']} ({e['rock']})</name>\n''')
        export.write(f'''    </wpt>\n''')
    export.write('</gpx>\n')
