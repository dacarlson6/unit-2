// Initialize the map on the "mapid" div with a given center and zoom
var map = L.map('mapid').setView([51.505, -0.09], 13);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { // Changed http to https
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);