/* // Initialize the map on the "mapid" div with a given center and zoom
var map = L.map('mapid').setView([51.505, -0.09], 13);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { // Changed http to https
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map); */

document.addEventListener('DOMContentLoaded',function() {
    createMap();
});

function createMap(){
    var map = L.map('mapid', {
        center: [44.5, -85.0],
        zoom: 6
    });

// var map = L.map('mapid').setView([20, 0], 3);

/* L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 18 */

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
        maxZoom: 13
    }).addTo(map);

    getData(map);
}

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/WaterLevels.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json){
            //create marker options
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#0077be",
                color: "#005a9c",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.7
            };

            L.geoJSON(json, {
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: function(feature, layer) {
                    var popupContent = "<h3>Highest Water Level Reported by Station per Month</h3>";
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