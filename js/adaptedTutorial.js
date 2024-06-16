/*map of geojson data from MegaCities.geojson*/

var map;

function createMap(){
    map = L.map('map', {
        center: [20,0],
        zoom: 2
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    GamepadHapticActuator();
};

//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/MegaCities.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            L.geoJSON(json).addTo(map);
        })
};

document.addEventListener('DOMContentLoaded',createMap)