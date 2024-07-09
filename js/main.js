var map;
var minValue;
var dataStats = {};

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

function calcStats(data){
    //create empty array to store all data values
    var allValues = [];
    for(var feature of data.features){
        for(var property in feature.properties) {
            var value = feature.properties[property];
            if(!isNaN(value)) {
                allValues.push(value);
            }
        }
    }
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);

    //minValue = Math.min(...allValues);
    //maxValue = Math.max(...allValues);

    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/ allValues.length;
    //meanValue = allValues.reduce((sum, current) => sum + current, 0) / allValues.length;
}

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
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            //create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            L.DomEvent.disableClickPropagation(container);

            //create range input element (slider)
            var slider = L.DomUtil.create('input', 'range-slider', container);
            slider.type = 'range';
            slider.min = 0;
            slider.max = attributes.length - 1;
            slider.value = 0;
            slider.step = 1;

            slider.addEventListener('input', function () {
                updatePropSymbols(attributes[this.value]);
            });

            //buttons
            var reverseButton = L.DomUtil.create('button', 'step', container);
            reverseButton.id = 'reverse';
            reverseButton.textContent = 'Reverse';

            var forwardButton = L.DomUtil.create('button', 'step', container);
            forwardButton.id = 'forward';
            forwardButton.textContent = 'Forward';

            reverseButton.addEventListener('click', function () {
                var index = parseInt(slider.value);
                index = index > 0 ? index - 1 : attributes.length - 1;
                slider.value = index;
                updatePropSymbols(attributes[index]);
            });
    
            forwardButton.addEventListener('click', function () {
                var index = parseInt(slider.value);
                index = index < attributes.length - 1 ? index + 1 : 0;
                slider.value = index;
                updatePropSymbols(attributes[index]);
            });
            return container;
        }
    });

    map.addControl(new SequenceControl());
}

    function setupEventListeners(attributes, container){
    var slider = container.querySelector('.range-slider');
    var reverseButton = container.querySelector('#reverse');
    var forwardButton = container.querySelector('#forward');

    slider.addEventListener('input', function(){
        updatePropSymbols(attributes[this.value]);
    });

    reverseButton.addEventListener('click', function(){
        var index = parseInt(slider.value);
        index = index > 0 ? index - 1 : attributes.length - 1;
        slider.value = index;
        updatePropSymbols(attributes[index]);
    });

    forwardButton.addEventListener('click', function(){
        var index = parseInt(slider.value);
        index = index < attributes.length - 1 ? index + 1 : 0;
        slider.value = index;
        updatePropSymbols(attributes[index]);
    });
}

//function to format date from YYYYMMDD to "Month YYYY"
function formatDate(dateStr) {
    var year = dateStr.substring(0,4);
    var month = dateStr.substring(4,6);
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
    return monthNames[parseInt(month) - 1] + " " + year;
}

//update legend with correct date
function updateLegend(date) {
    var legend = document.getElementById('temporal-legend');
    if (legend) {
        legend.innerHTML = 'Date: ' + formatDate(date);
    }
}

//create legend
function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: "bottomright"
        },

        onAdd: function() {
            //create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            container.style.padding = "10px";
            container.innerHTML = '<h3>Water Levels</h3>';

            //start attribute legend svg string
            var svg = '<svg width="130px" height="130px">';

            //array of circle names to base loop on
            //var circles = ["max", "mean", "min"];

            //loop to add each circle and text to svg string
            /* for (var i = 0; i < circles.length; i++) {
                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 130 - radius;

                // Circle string
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#0077be" fill-opacity="0.7" stroke="#005a9c" cx="65"/>';
            }; */

            //add circle svg
            svg += '<circle cx="30" cy="50" r="15" fill="#0077be" stroke="#005a9c" stroke-width="1" fill-opacity="0.7"></circle>';
            //text next to circle svg
            svg += '<text x="60" y="55" font-size="12" alignment-baseline="middle">Water Station</text>';
            //close svg string
            svg += '</svg>';

            //add svg to container
            container.innerHTML += svg;
            //container.insertAdjacentHTML('beforeend', svg);

            return container;
        }
    });
    map.addControl(new LegendControl());
}

document.addEventListener('DOMContentLoaded', function() {
    createMap();
    createLegend(attributes);
});

function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //update popup content
            var popupContent = "<p><b>Station:</b> " + props.StationName + "</p>";
            popupContent += "<p><b>Water Level on " + attribute + ":</b> " + props[attribute] + " ft</p>";

            popup = layer.getPopup();
            popup.setContent(popupContent).update();

            updateLegend(attribute);
        }
    });
}

//build an attributes array
function processData(data){
    //empty array to hold attributes
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for(var attribute in properties){
        if (attribute.startsWith("2023") || attribute.startsWith("2024")){
            attributes.push(attribute);
        }
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
            createLegend(attributes);
            calcStats(response);
        });
};

document.addEventListener('DOMContentLoaded', createMap);