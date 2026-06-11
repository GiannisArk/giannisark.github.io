// Create map
const map = L.map("map").setView([0, 0], 2);

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const status = document.getElementById("status");

// Success callback
function onLocationSuccess(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    map.setView([lat, lng], 16);

    L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`You are here<br>Lat: ${lat}<br>Lng: ${lng}`)
        .openPopup();

    status.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
}

// Error callback
function onLocationError(error) {
    status.textContent = `Location error: ${error.message}`;
    console.error(error);
}

// Request location permission and coordinates
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        onLocationError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
} else {
    status.textContent = "Geolocation is not supported by this browser.";
}