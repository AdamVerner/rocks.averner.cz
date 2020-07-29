document.addEventListener("DOMContentLoaded", function(){

    columns = [
        {height:0, div:document.getElementById('col-0')},
        {height:0, div:document.getElementById('col-1')},
        {height:0, div:document.getElementById('col-2')},
        {height:0, div:document.getElementById('col-3')}
    ];


    loadRockdb(function (RockDB) {
        console.log(RockDB);
        RockDB

        RockDB.rocks.forEach(function (itm, idx) {

            itm.Pictures.forEach(function (itm, idx) {
                const img = document.createElement('img');
                img.style.width = '100%';

                img.onload = function () {
                    col = columns.reduce((acc, cur) => {return cur.height < acc.height ? cur : acc}, columns[0]);
                    col.div.appendChild(img);

                    console.log(columns[0].height, columns[1].height, columns[2].height, columns[3].height);
                    console.log(col.div.id, col);
                    console.log(img.height, img.width, img);

                    col.height += img.height;
                }

                img.src = itm;

                img.onclick = function () {
                    console.log('Image selected');
                    modal = document.getElementById('modal');
                    modal.style.display = 'block';

                    modal_content = document.getElementById('modal-content');
                    modal_content.src = this.src;
                }


            })

        })

    });


});