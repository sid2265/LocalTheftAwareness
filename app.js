
// Supabase imports and setup
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://xmgptkioejdkydoyyaik.supabase.co'; // <-- Replace with your Supabase project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ3B0a2lvZWpka3lkb3l5YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTE4OTUsImV4cCI6MjA2ODg2Nzg5NX0.wCFMaqRfIKbMgCWOVuUap5n3gM265wUPb0DwOLP_Cbk'; // <-- Replace with your Supabase anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Google Sign-In button and user status display removed



// Form Submission (Supabase)
const form = document.getElementById('theft-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const station = document.getElementById('station').value;
    const datetimeRaw = document.getElementById('datetime').value;
    const description = document.getElementById('description').value;

    // Convert datetime to ISO format for Supabase
    const datetime = datetimeRaw ? new Date(datetimeRaw).toISOString() : null;

    // Fetch lat/lng for the station from Supabase 'stations' table
    const { data: stationData } = await supabase
      .from('stations')
      .select('lat, lng')
      .eq('name', station)
      .single();

    const { error } = await supabase.from('theft_reports').insert([{
      station, datetime, description,
      lat: stationData?.lat || null,
      lng: stationData?.lng || null
    }]);
    document.getElementById('form-message').textContent = error ? error.message : 'Report submitted!';
    form.reset();
  });
}



// Map Rendering (Leaflet)
let map = L.map('map').setView([18.5204, 73.8567], 12); // Pune center
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);

async function loadHotspots() {
  const { data: stations } = await supabase.from('stations').select('*');
  const { data: theftReports } = await supabase.from('theft_reports').select('*');
  const theftCounts = {};
  (theftReports || []).forEach(report => {
    if (report.station) {
      theftCounts[report.station] = (theftCounts[report.station] || 0) + 1;
    }
  });
  (stations || []).forEach(station => {
    const count = theftCounts[station.name] || 0;
    if (count > 0 && station.lat && station.lng) {
      L.circle([station.lat, station.lng], {
        color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 200
      }).addTo(map)
        .bindPopup(`${station.name}: ${count} thefts`);
    }
  });
}
loadHotspots();



// Proximity Notifications
async function checkProximity() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(async (pos) => {
    const userLat = pos.coords.latitude, userLng = pos.coords.longitude;
    const { data: stations } = await supabase.from('stations').select('*');
    (stations || []).forEach(station => {
      if (station.lat && station.lng) {
        const dist = getDistance(userLat, userLng, station.lat, station.lng);
        if (dist < 200) {
          if (Notification.permission === 'granted') {
            new Notification(`Caution: High theft area near ${station.name}`);
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(`Caution: High theft area near ${station.name}`);
              }
            });
          }
        }
      }
    });
  });
}
function getDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
checkProximity();
