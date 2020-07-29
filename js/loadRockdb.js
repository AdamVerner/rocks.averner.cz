function loadRockdb(callback, source = '/data/rockdb.json'){

    const xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
		    /* Request was successful, parse data and pass them to coord handler*/
            try {
                let RockDB = JSON.parse(this.responseText);
                callback(RockDB)
            }
            catch (e) {
                alert("parsing Rockdb failed");
                console.log("Error", e.stack);
                console.log("Error", e.name);
                console.log("Error", e.message);
            }
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
