String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length === 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

let rdb;

function loadRockdb(callback, source = '/data/rockdb.json'){

    const xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
		    /* Request was successful, parse data and pass them to coord handler*/
                let RockDB = JSON.parse(this.responseText);

                RockDB.images = [];
                RockDB['rocks'].forEach(function (rock, idx) {
                    rock['Pictures'].forEach(function (itm, idx) {
                        RockDB.images.push(
                            {
                                src: itm['Source'],
                                hash: itm['Source'].hashCode(),
                                thumb: itm['Thumbnail'],
                                rockName: rock['Name'],
                                rockPage: rock['Page'],
                            }
                        )
                    });
                });

                rdb = RockDB;
                callback(RockDB)
        }

		else if (this.readyState === 4 && this.status !== 200) {
            alert("Fetching Rockdb failed, contact support");
            console.log("Can't fetch file " + source + 'server returned ' + this.status);
            console.log("BODY " + this.responseText);
		}
    };

    xmlhttp.open("GET", source, true);
    xmlhttp.send();
}
