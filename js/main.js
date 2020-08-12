// Not yet widely supported
//import { loadRockdb } from './loadRockdb';

let ContentBodyDefault;

document.addEventListener("DOMContentLoaded", function(){

    loadRockdb(function (RockDB) {

        InsertRocksIntoScroller(RockDB);
        InsertRocksIntoRockList(RockDB);
        if( window.location.href.toLowerCase().indexOf('map=false') === -1 && 'Loader' in window){
            console.log('creating map');
            createMap(RockDB);
        }
        else{
            document.getElementById('m').parentElement.remove();
        }
        RestorePage(RockDB);
    })
});

function createMap(RockDB) {

    Loader.async = true;
    console.log('calling Loader');
    Loader.load(null, null, function () {

        console.log('Loading stuff');

        const center = SMap.Coords.fromWGS84(14.41790, 50.12655);
        const m = new SMap(JAK.gel("m"), center, 9);
        m.addDefaultLayer(SMap.DEF_SMART_BASE).enable();
        m.addDefaultControls();

        // Grow map to the size of it's parent element
        const sync = new SMap.Control.Sync();
        m.addControl(sync);

        // create marker layer we will later fill
        const layer = new SMap.Layer.Marker();
        m.addLayer(layer);
        layer.enable();
        console.log('pasting coords into map');
        pasteCoordsIntoMap(layer, RockDB);
        console.log('setting map center coords into map');
        setMapCenter(m, RockDB);
        console.log('done');
    });
    console.log('calling Loader finished');

}

function InsertRocksIntoScroller(RockDB) {

    let scroll = document.getElementById('ImageScroll');

    RockDB.images.forEach(function (image) {

        let img = document.createElement('img');
        img.src = image.thumb;
        img.onclick = function () {
            window.location = '/gallery.html?img=' + image.hash;
        };
        scroll.appendChild(img)

    });
}

function pasteCoordsIntoMap(Layer, coords) {

    console.log('Loaded coords');

    coords['rocks'].forEach(function (rock, idx) {

        /* Create card with location miniature */
        var card = new SMap.Card();
        card.getContainer().style.width = 'auto';
        card.getHeader().innerHTML = '<span class="cardHeader">'+ rock['Name'] +'</span>';

        /* create link which will display selected page */
        var link = document.createElement('a')
        link.onclick = function(){visitPlace(rock['Page'], rock['Name'])};
        link.className = "cardView";
        link.href = '#' + rock['Name']
        link.innerText = 'Visit'
        card.getBody().appendChild(link);
        card.getBody().style['text-align'] = 'center'

        /* create marker with embedded card */
        var options = { title: rock['Name'] };
        var coord = SMap.Coords.fromWGS84(rock['Coords']['x'], rock['Coords']['y']);
        var marker = new SMap.Marker(coord, "rockMarker" + idx, options);
        marker.decorate(SMap.Marker.Feature.Card, card);

        /* add marker to map */
        Layer.addMarker(marker);
        console.log("Added " + rock['Name'] + " index: " + idx);

    });

}

function setMapCenter(map, data){

    var x_coords = data['rocks'].map(function(rock){ return rock['Coords']['x']; });
    var y_coords = data['rocks'].map(function(rock){ return rock['Coords']['y']; });

    var x_center = (Math.max(...x_coords) - Math.min(...x_coords)) / 2 + Math.min(...x_coords)
    var y_center = (Math.max(...y_coords) - Math.min(...y_coords)) / 2 + Math.min(...y_coords)

    var center = SMap.Coords.fromWGS84(x_center, y_center);
    map.setCenter(center, false);
    console.log('found center in ', center.toString());

}

function visitPlace( placeURL, name ) {

    console.log('visiting ' + name);
    let contentBody = document.getElementById('ContentBody');
    let x = document.getElementById("snackbar");

    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
                console.log('visiting place' + placeURL);

                /* update Default body, so we can restore it later*/
                ContentBodyDefault = contentBody.innerHTML;

                contentBody.innerHTML = this.responseText;
                x.className = "show";
                document.title = "Adam's rock database - " + name;
        }

		else if (this.readyState === 4 && this.status !== 200) {
            alert("visit failed");
            console.log("Can't fetch file " + placeURL + 'server returned ' + this.status);
            console.log("BODY " + this.responseText);
		}
    };

    xmlhttp.open("GET", placeURL, true);
    xmlhttp.send();
}

function LoadMain(){
    console.log('returing to main page')
    // var contentBody = document.getElementById('ContentBody');
    var x = document.getElementById("snackbar");
    x.className = x.className.replace("show", "");

    document.getElementById('ContentBody').innerHTML = ContentBodyDefault;
    document.title = "Adam's rock database";

    return false;
}

function RestorePage(RockDB){
    let sucess = false;
    RockDB['rocks'].forEach(function (rock, idx) {
        if( encodeURI('#' + rock['Name']) === location.hash) {
            visitPlace(rock['Page'], rock['Name']);
            sucess = true;
        }
    });

    if( ! sucess )
        location.hash = '';

}

function InsertRocksIntoRockList(RockDB) {
    var rocklList = document.getElementById('RockList');

    RockDB['rocks'].forEach(function (rock, idx) {
        var item = document.createElement('li')
        var link = document.createElement('a')

        link.innerText = rock['Name']
        link.setAttribute('onclick', "visitPlace('" + rock['Page'] + "', '" + rock['Name'] + "');")
        link.href = '#' + rock['Name']
        item.appendChild(link);

        rocklList.appendChild(item);

    });

}
//  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);