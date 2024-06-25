var map;
var averages = {};

function createMap() {
    map = L.map('mapid', {
        center: [44.5, -85.0],
        zoom: 6
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
        maxZoom: 13
    }).addTo(map);

    getData(map);
}

function calculateAverages(data) {
    data.features.forEach(function(feature) {
        var total = 0;
        var count = 0;

        for (var property in feature.properties) {
            if (!isNaN(feature.properties[property]) && (property.startsWith("2023") || property.startsWith("2024"))) {
                total += feature.properties[property];
                count++;
            }
        }

        var average = total / count;
        averages[feature.properties.StationName] = average;
    });
}

function calcPropRadius(attValue, avgValue) {
    var minRadius = 5;
    var scaleFactor = 10; // Adjust this factor as needed to make changes more visible
    var radius = 1.0083 * Math.pow(Math.abs(attValue - avgValue) * scaleFactor, 0.5715) * minRadius;
    return radius;
}

function pointToLayer(feature, latlng, attributes) {
    var attribute = attributes[0];
    var avgValue = averages[feature.properties.StationName];
    var attValue = Number(feature.properties[attribute]);

    var options = {
        fillColor: "#0077be",
        color: "#005a9c",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7,
        radius: 8
    };

    options.radius = calcPropRadius(attValue, avgValue);

    var layer = L.circleMarker(latlng, options);

    var popupContent = "<p><b>Station:</b> " + feature.properties.StationName + "</p>";
    popupContent += "<p><b>Water Level on " + attribute + ":</b> " + attValue + " ft</p>";
    popupContent += "<p><b>Change from Average:</b> " + (attValue - avgValue).toFixed(2) + " ft</p>";

    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });

    return layer;
}

function createPropSymbols(data, attributes) {
    L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
}

function createSequenceControls(attributes) {

    var slider = "<input class='range-slider' type='range' min='0' max='" + (attributes.length - 1) + "' value='0' step='1'></input>";
    // var reverseButton = "<button class='step' id='reverse'>Reverse</button>";
    // var forwardButton = "<button class='step' id='forward'>Forward</button>";
    var reverseButtonImg = "<img src='img/reverse.png' class='step' id='reverse' style='cursor:pointer;'>";
    var forwardButtonImg = "<img src='img/forward.png' class='step' id='forward' style='cursor:pointer;'>";

    document.querySelector("#panel").insertAdjacentHTML('beforeend', reverseButtonImg);

    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    document.querySelector(".range-slider").max = attributes.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
   
    document.querySelector("#panel").insertAdjacentHTML('beforeend', forwardButtonImg);

     // document.querySelector("#panel").insertAdjacentHTML('beforeend', reverseButton);
    // document.querySelector("#panel").insertAdjacentHTML('beforeend', forwardButton);

    setupEventListeners(attributes);
}

function setupEventListeners(attributes) {
    document.querySelector('.range-slider').addEventListener('input', function () {
        updatePropSymbols(attributes[this.value]);
    });

    document.querySelectorAll('.step').forEach(function (step) {
        step.addEventListener("click", function () {
            var index = document.querySelector('.range-slider').value;

            if (this.id === 'forward') {
                index++;
                index = index > attributes.length - 1 ? 0 : index;
            } else if (this.id == 'reverse') {
                index--;
                index = index < 0 ? attributes.length - 1 : index;
            }

            document.querySelector('.range-slider').value = index;
            updatePropSymbols(attributes[index]);
        });
    });
}

function updatePropSymbols(attribute) {
    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            var props = layer.feature.properties;
            var avgValue = averages[props.StationName];
            var radius = calcPropRadius(props[attribute], avgValue);
            layer.setRadius(radius);

            var popupContent = "<p><b>Station:</b> " + props.StationName + "</p>";
            popupContent += "<p><b>Water Level on " + attribute + ":</b> " + props[attribute] + " ft</p>";
            popupContent += "<p><b>Change from Average:</b> " + (props[attribute] - avgValue).toFixed(2) + " ft</p>";

            var popup = layer.getPopup();
            popup.setContent(popupContent).update();
        }
    });
}

function processData(data) {
    var attributes = [];
    var properties = data.features[0].properties;

    for (var attribute in properties) {
        if (attribute.startsWith("2023") || attribute.startsWith("2024")) {
            attributes.push(attribute);
        }
    }
    console.log(attributes);
    return attributes;
}

function getData(map) {
    fetch("data/WaterLevels.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            var attributes = processData(json);
            calculateAverages(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        });
}

document.addEventListener('DOMContentLoaded', createMap);
