document.addEventListener("DOMContentLoaded", function(){

    let columns = [
        {height: 0, div: document.getElementById('col-0')},
        {height: 0, div: document.getElementById('col-1')},
        {height: 0, div: document.getElementById('col-2')},
        {height: 0, div: document.getElementById('col-3')}
    ];


    loadRockdb(function (RockDB) {
        console.log(document.getElementById('col-0').clientHeight, document.getElementById('col-0').clientWidth, document.getElementById('col-0'));

        RockDB.rocks.forEach(function (itm, idx) {

            itm.Pictures.forEach(function (itm, idx) {
                const img = document.createElement('img');
                img.style.width = '100%';

                img.onload = function () {
                    let col = columns.reduce((acc, cur) => {
                        return cur.height < acc.height ? cur : acc
                    }, columns[0]);
                    col.div.appendChild(img);

                    console.log(columns[0].height, columns[1].height, columns[2].height, columns[3].height);
                    col.height += img.height;
                }

                img.src = itm;

                img.onclick = function () {
                    console.log('Image selected');
                    document.getElementById('modal').style.display = 'block';;
                    document.getElementById('modal-content').src = this.src;
                }


            })

        })

    });


});