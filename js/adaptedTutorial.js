document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('mapid').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    fetch("data/MegaCities.geojson")
        .then(response => response.json())
        .then(json => {
            L.geoJSON(json, {
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: function(feature, layer) {
                    var popupContent = "<p><strong>City:</strong> " + feature.properties.City + "</p>";
                    popupContent += "<p><strong>Population 2015:</strong> " + feature.properties.Pop_2015 + " million</p>";
                    layer.bindPopup(popupContent);
                }
            }).addTo(map);
        });
});