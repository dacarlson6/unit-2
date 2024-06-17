/*map of geojson data from MegaCities.geojson*/

document.addEventListener('DOMContentLoaded',function() {
    createMap();
});

function createMap(){
    var map = L.map('mapid', {
        center: [20,0],
        zoom: 2
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    getData(map);
}

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/MegaCities.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json){
            //create marker options
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            L.geoJSON(json, {
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: function(feature, layer) {
                    var popupContent = "";
                    if(feature.properties) {
                        //loop to add feature property names and values to html string
                        for (var property in feature.properties) {
                            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
                        }
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);
        });
}