/* // Initialize the map on the "mapid" div with a given center and zoom
var map = L.map('mapid').setView([51.505, -0.09], 13);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { // Changed http to https
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map); */

var map;
var minValue;

/* document.addEventListener('DOMContentLoaded',function() {
    createMap();
}); */

function createMap(){
    map = L.map('mapid', {
        center: [44.5, -85.0],
        zoom: 6
    });

/* L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 18 */

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
        maxZoom: 13
    }).addTo(map);

    getData(map);
};

function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var feature of data.features) {
        //loop through each month
        for(var property in feature.properties) {
            if(!isNaN(feature.properties[property]) && property.startsWith("2023")) {
                //add water levels to array
                allValues.push(feature.properties[property]);
            }
        }
    }
    //get min value of our array
    minValue = Math.min(...allValues);
    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius;
    return radius;
}

//step 3: add circle markers for point features to the map
function createPropSymbols(data) {
    //step 4: determine which attribute to visualize with proportional symbols
    var attribute = "20231101";

    //create marker options
    var geojsonMarkerOptions = {
        fillColor: "#0077be",
        color: "#005a9c",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7,
        radius: 8
    };

    L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            //step 5: for each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            //step 6: give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/WaterLevels.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json){
            //calculate minimum data value
            minValue = calculateMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json);
        });
}

document.addEventListener('DOMContentLoaded', createMap);
            
            
            
            
            
            /* //create marker options
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
} */