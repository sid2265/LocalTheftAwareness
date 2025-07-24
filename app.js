const API_URL = 'http://localhost:3000';

// Form Submission
const form = document.getElementById('theft-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const station = document.getElementById('station').value;
    const datetimeRaw = document.getElementById('datetime').value;
    const description = document.getElementById('description').value;

    const datetime = datetimeRaw ? new Date(datetimeRaw).toISOString() : null;

    const response = await fetch(`${API_URL}/submit-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station, datetime, description }),
    });

    const result = await response.json();
    document.getElementById('form-message').textContent = result.error || result.message;
    form.reset();
  });
}

// Map Rendering
let map = L.map('map').setView([18.5204, 73.8567], 12); // Pune center
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);

async function loadHotspots() {
  const response = await fetch(`${API_URL}/hotspots`);
  const hotspots = await response.json();

  hotspots.forEach(hotspot => {
    if (hotspot.theftCount > 0 && hotspot.lat && hotspot.lng) {
      L.circle([hotspot.lat, hotspot.lng], {
        color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 200
      }).addTo(map)
        .bindPopup(`${hotspot.name}: ${hotspot.theftCount} thefts`);
    }
  });
}
loadHotspots();

// Load Theft Reports
async function loadReports() {
  const response = await fetch(`${API_URL}/reports`);
  const reports = await response.json();
  console.log(reports); // Display reports in the console or on the page
}
loadReports();