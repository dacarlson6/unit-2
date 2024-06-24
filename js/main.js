
var map;
var minValue;

function createMap(){
    map = L.map('mapid', {
        center: [44.5, -85.0],
        zoom: 6
    });

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

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {
    //determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //check
    console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#0077be",
        color: "#005a9c",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7,
        radius: 8
    };

    //for each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>Station:</b> " + feature.properties.StationName + "</p>";
    popupContent += "<p><b>Water Level on " + attribute + ":</b> " + attValue + " ft</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });

    //return the circle marker to the L.geojson pointToLayer option
    return layer;
};

//add circle markers for point features to the map
function createPropSymbols(data, attributes) {
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJSON(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//create new sequence controls
function createSequenceControls(attributes) {    
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    //add step buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="reverse">Reverse</button>');
    // document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>");
    // document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>");
};

//build an attributes array
function processData(data){
    //empty array to hold attributes
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for(var attribute in properties){
        if(attribute.startsWith("2023")) {
            attributes.push(attribute);
        };
    };
    console.log(attributes);
    return attributes;
}

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/WaterLevels.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json){
            //create an attributes array
            var attributes = processData(json);
            //calculate minimum data value
            minValue = calculateMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        });
}

document.addEventListener('DOMContentLoaded', createMap);