document.addEventListener("DOMContentLoaded", function () {
    loadRockdb(function (rockdb){
        DisplayGalleryScroll(rockdb);
        urlChange();
    });

});

function DisplayGalleryScroll(rockdb) {
    let columns = [
        {height: 0, div: document.getElementById('col-0')},
        {height: 0, div: document.getElementById('col-1')},
        {height: 0, div: document.getElementById('col-2')},
        {height: 0, div: document.getElementById('col-3')}
    ];

    rockdb.images.forEach(function (itm, idx) {

        const img = document.createElement('img');
        img.style.width = '100%';

        img.onload = function () {
            let col = columns.reduce((acc, cur) => {
                return cur.height < acc.height ? cur : acc
            }, columns[0]);
            col.div.appendChild(img);

            // econsole.log(columns[0].height, columns[1].height, columns[2].height, columns[3].height);
            col.height += img.height;
        }

        img.src = itm.src;
        img.onclick = function () {
            displayImage(itm);
        }

        if (window.location.search.indexOf('img=' + itm.hash) !== -1)
            displayImage(itm);
    })
}

function displayImage(image) {
    console.log('Image ' + image + ' selected');

    // check if the image is already in url
    if (window.location.search.indexOf('img=') === -1)
        history.pushState({}, null, window.location.pathname + '?img=' + image.hash);

    let modal_content = document.getElementById('modal-content');
    modal_content.src = image.src;

    let modal = document.getElementById('modal');
    modal.style.display = 'flex';

    modal.onclick = function () {
        // clear the search params
        history.pushState({}, null, window.location.pathname);
        modal.style.display = 'none';
    }
}

window.onpopstate = function (e) {
    console.log('pop state caught' + e)
    urlChange();
}

function urlChange() {
    let params = new URLSearchParams(window.location.search);

    const image = rdb.images.find(e => e.hash === params.get('img'));
    if (image)
        displayImage(image);
    else
        document.getElementById('modal').style.display = 'none';
}