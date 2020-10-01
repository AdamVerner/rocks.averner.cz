document.addEventListener("DOMContentLoaded", function(){
    Loader.async = true;
    Loader.load(null, null, createMap);
});

function createMap() {

    var center = SMap.Coords.fromWGS84(14.41790, 50.12655);
    var m = new SMap(JAK.gel("m"), center, 9);
    m.addDefaultLayer(SMap.DEF_SMART_BASE).enable();
    m.addDefaultControls();

    // Grow map to the size of it's parent element
    var sync = new SMap.Control.Sync();
    m.addControl(sync);

    // create marker layer we will later fill
    var layer = new SMap.Layer.Marker();
    m.addLayer(layer);
    layer.enable();

    loadHorosvaz(m, layer, 'https://cors-anywhere.herokuapp.com/https://www.horosvaz.cz/index.php?cmd=skaly-mapa&type=regiony');

    addListener(m);

}


function addListener(map) {

    var listener = function (e) {
        console.log('e.type = ' + e.type + ' e: ' + e);
        console.log(e.target._dom.body.innerText);

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var sector_link_parser = /(?<=href=").+?(?=")/;
                var loc = this.responseText.match(sector_link_parser);
                if (loc)
                    e.target._dom.body.innerHTML = this.responseText.replace(sector_link_parser, 'https://www.horosvaz.cz' + loc[0])
                else
                    e.target._dom.body.innerHTML = this.responseText;
                // card.sync();
            }
            if (this.readyState == 4 && this.status != 200) {
                console.log('failed loading resource');
            }

        };

        xmlhttp.open("GET", e.target._dom.body.innerText, true);
        xmlhttp.send();

    }

    var signals = map.getSignals();
    signals.addListener(window, "card-open", listener);
}

function fallBackHorosvaz(map, Layer) {

    console.log('falling back to local copy of horosvaz.cz');

    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            ProcessHorosvaz(this.responseText, map, Layer);
                        }
                    };

    xmlhttp.open("GET", '/data/horosvaz_copy.html', true);
    xmlhttp.send();

}

function loadHorosvaz(map, Layer, source){

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.timeout = 5000;

    xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
		    try {
                console.log('Loaded horosvaz.cz');
                ProcessHorosvaz(this.responseText, map, Layer);
            }
            catch (e) {
                alert("failed loading directly from horosvaz.cz");
                console.log("Error", e.stack);
                console.log("Error", e.name);
                console.log("Error", e.message);

                fallBackHorosvaz(map, Layer);

            }
        }

		else if (this.readyState == 4 && this.status != 200) {
            alert("Loading horosvaz.cz failed, falling back to local copy");
            console.log("Can't fetch horosvaz.cz server returned " + this.status);
            console.log("BODY " + this.responseText);

            fallBackHorosvaz(map, Layer);

		}
    };

    xmlhttp.open("GET", source, true);
    xmlhttp.send();



}

function ProcessHorosvaz(htmlSource, map, layer) {
    console.log(layer);

    let regexp = /\.add\({.+}\);/g
    let tag = htmlSource.match(regexp);

    console.log("processing " + tag.length + ' entries');

    tag.forEach(function (raw, idx) {

        let innerJson = raw.match(/{.*}/);
        let entry = JSON.parse(innerJson);
        /* Create card with location miniature */
        var card = new SMap.Card();
        card.getContainer().style.width = 'auto';
        card.getHeader().innerHTML = '<span class="cardHeader">'+ entry['title'] +'</span>';

        card.getBody().innerText = 'https://cors-anywhere.herokuapp.com/https://www.horosvaz.cz' + entry['events'][0]['url'];


        /* create marker with embedded card */
        var options = { title: entry['title'] };
        var coord = SMap.Coords.fromWGS84(entry['lng'], entry['lat']);
        var marker = new SMap.Marker(coord, "rockMarker" + idx, options);
        marker.decorate(SMap.Marker.Feature.Card, card);

        /* add marker to map */
        layer.addMarker(marker);
        console.log("Added " + entry['title'] + " index: " + idx);

    });

    var center = SMap.Coords.fromWGS84(14.41790, 50.12655);
    map.setCenter(center, false);

}

