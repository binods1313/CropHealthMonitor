🔧 URGENT FIX: Map Zoom Controls Not Working
Problem Summary

Search functionality: ✅ Working
Zoom +/- buttons: ❌ Not working
Mouse scroll zoom: ❌ Not working
Map dragging: ✅ Working


Fix 1: Enable Mouse Scroll Zoom
Add this to your map initialization:
javascript// If using Leaflet:
const map = L.map('map', {
  center: [20.5937, 78.9629],
  zoom: 5,
  scrollWheelZoom: true,        // ← ADD THIS
  doubleClickZoom: true,        // ← ADD THIS
  touchZoom: true,              // ← ADD THIS
  zoomControl: true             // ← ADD THIS
});

// If using Google Maps:
const map = new google.maps.Map(document.getElementById('map'), {
  zoom: 5,
  center: { lat: 20.5937, lng: 78.9629 },
  scrollwheel: true,            // ← ADD THIS
  zoomControl: true,
  gestureHandling: 'greedy'     // ← ADD THIS (allows scroll without Ctrl)
});

// If using Mapbox:
const map = new mapboxgl.Map({
  container: 'map',
  zoom: 5,
  center: [78.9629, 20.5937],
  scrollZoom: true,             // ← ADD THIS
  doubleClickZoom: true         // ← ADD THIS
});

Fix 2: Make Zoom Buttons Clickable
Problem: Buttons might be blocked by CSS or not have event listeners
CSS Fix - Add this:
css/* Ensure zoom controls are clickable */
.leaflet-control-zoom,
.leaflet-control-zoom a,
.mapboxgl-ctrl-zoom-in,
.mapboxgl-ctrl-zoom-out,
.gm-bundled-control {
  pointer-events: auto !important;
  cursor: pointer !important;
  z-index: 1000 !important;
}

/* Make sure buttons aren't covered */
.leaflet-control-zoom {
  position: relative;
  z-index: 1000;
}

.leaflet-control-zoom a {
  display: block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  text-decoration: none;
  color: #000;
  background: white;
  border: 2px solid rgba(0,0,0,0.2);
}

.leaflet-control-zoom a:hover {
  background: #f4f4f4;
}

Fix 3: Add Manual Zoom Button Event Listeners
If buttons still don't work, add explicit JavaScript:
javascript// For Leaflet - Manual zoom button implementation
document.querySelector('.leaflet-control-zoom-in')?.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  map.zoomIn();
  console.log('Zoom in clicked, new zoom:', map.getZoom());
});

document.querySelector('.leaflet-control-zoom-out')?.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  map.zoomOut();
  console.log('Zoom out clicked, new zoom:', map.getZoom());
});

// For Google Maps - Custom zoom buttons
document.getElementById('zoom-in-btn')?.addEventListener('click', function() {
  map.setZoom(map.getZoom() + 1);
});

document.getElementById('zoom-out-btn')?.addEventListener('click', function() {
  map.setZoom(map.getZoom() - 1);
});

// For Mapbox - Manual zoom
document.querySelector('.mapboxgl-ctrl-zoom-in')?.addEventListener('click', function(e) {
  e.preventDefault();
  map.zoomIn();
});

document.querySelector('.mapboxgl-ctrl-zoom-out')?.addEventListener('click', function(e) {
  e.preventDefault();
  map.zoomOut();
});

Fix 4: Check for Conflicting CSS
Look for and REMOVE any CSS that might be blocking interactions:
css/* BAD - Remove these if they exist: */
.map-container * {
  pointer-events: none;  /* ← REMOVE THIS */
}

.leaflet-container {
  pointer-events: none;  /* ← REMOVE THIS */
}

/* GOOD - Use this instead: */
.map-container,
.leaflet-container,
.mapboxgl-map {
  pointer-events: auto;
}

Fix 5: Re-initialize Map with All Options
Complete Leaflet initialization (copy-paste this):
javascript// Remove old map if exists
if (map) {
  map.remove();
}

// Create new map with ALL options enabled
const map = L.map('map', {
  center: [20.5937, 78.9629],
  zoom: 5,
  zoomControl: true,           // Show zoom buttons
  scrollWheelZoom: true,       // Mouse wheel zoom
  doubleClickZoom: true,       // Double click zoom
  touchZoom: true,             // Touch zoom
  boxZoom: true,               // Box zoom (shift + drag)
  keyboard: true,              // Keyboard navigation
  dragging: true,              // Drag to pan
  zoomSnap: 1,                 // Zoom level snap
  zoomDelta: 1,                // Zoom change amount
  trackResize: true,           // Auto-resize
  minZoom: 3,                  // Minimum zoom level
  maxZoom: 18                  // Maximum zoom level
});

// Add zoom control in specific position
L.control.zoom({
  position: 'topright'
}).addTo(map);

// Add tile layer
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri',
  maxZoom: 18
}).addTo(map);

// Test zoom functionality
console.log('Initial zoom:', map.getZoom());
map.on('zoomend', function() {
  console.log('Zoom changed to:', map.getZoom());
});

Fix 6: Debug Script
Add this temporarily to diagnose the issue:
javascript// Add to your map page to test zoom
console.log('=== MAP ZOOM DEBUG ===');

// Check if map exists
console.log('Map object:', map);

// Check zoom settings
console.log('Scroll wheel zoom enabled:', map.scrollWheelZoom.enabled());
console.log('Zoom control exists:', document.querySelector('.leaflet-control-zoom'));

// Test manual zoom
setTimeout(() => {
  console.log('Testing zoom in...');
  map.zoomIn();
}, 2000);

// Listen for zoom events
map.on('zoomstart', () => console.log('Zoom started'));
map.on('zoomend', () => console.log('Zoom ended, level:', map.getZoom()));

// Check for click events on zoom buttons
document.querySelector('.leaflet-control-zoom-in')?.addEventListener('click', (e) => {
  console.log('Zoom in button clicked!', e);
});

document.querySelector('.leaflet-control-zoom-out')?.addEventListener('click', (e) => {
  console.log('Zoom out button clicked!', e);
});

// Check mouse wheel
document.getElementById('map').addEventListener('wheel', (e) => {
  console.log('Mouse wheel event detected:', e.deltaY);
});

Quick Test Checklist
Ask your coder to verify:

Open browser console (F12)
Check for errors - Any red error messages?
Test mouse wheel - Does console show "Mouse wheel event detected"?
Click + button - Does console show "Zoom in button clicked"?
Try keyboard - Press + and - keys, do they zoom?
Check CSS - Inspect zoom buttons, is pointer-events: none anywhere?


Most Common Causes (Priority Order)

⚠️ scrollWheelZoom: false in map initialization
⚠️ pointer-events: none in CSS
⚠️ zoomControl: false removing the buttons
⚠️ Event listener conflict - another script blocking clicks
⚠️ Z-index issue - buttons covered by another element


Emergency Workaround
If nothing else works, add custom zoom buttons:
html<!-- Add these buttons above your map -->
<div class="custom-zoom-controls">
  <button id="custom-zoom-in" class="zoom-btn">+</button>
  <button id="custom-zoom-out" class="zoom-btn">−</button>
</div>

<style>
.custom-zoom-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: 2px solid rgba(0,0,0,0.2);
  border-radius: 4px;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.zoom-btn:hover {
  background: #f4f4f4;
}

.zoom-btn:active {
  background: #e8e8e8;
}
</style>

<script>
document.getElementById('custom-zoom-in').onclick = () => {
  map.setZoom(map.getZoom() + 1);
};

document.getElementById('custom-zoom-out').onclick = () => {
  map.setZoom(map.getZoom() - 1);
};
</script>

Verify:

✅ Add scrollWheelZoom: true to map initialization
✅ Check for pointer-events: none in CSS and remove it
✅ Run the debug script and share console output
✅ Test with the emergency workaround if needed

This should fix both the zoom buttons and mouse scroll zoom! 🎯