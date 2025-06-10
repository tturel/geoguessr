// --- Configuration ---
const INITIAL_ZOOM_LEVEL = 6;
const COORD_UPDATE_THRESHOLD = 0.01;
const OVERLAY_EXPANDED_HEIGHT = '300px';
const OVERLAY_COLLAPSED_HEIGHT = '25px'; // Height just enough for the button

// --- State Variables ---
let shadowHost = null;
let shadowRoot = null;
let overlayContainer = null;
let mapElement = null;
let toggleButtonElement = null;
let leafletMap = null;
let leafletMarker = null;
let isMapVisible = true; // Tracks the VISUAL state of the map container
let displayedLat = null;
let displayedLng = null;

// --- Utility ---
function generateRandomId(prefix = 'el-') {
  return prefix + Math.random().toString(36).substring(2, 10);
}

const ids = {
    host: generateRandomId('host-'),
    overlay: generateRandomId('overlay-'),
    map: generateRandomId('map-'),
    toggle: generateRandomId('toggle-')
};

// --- Injector Script Logic ---
function injectScript(filePath) {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(filePath);
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.error("GeoGuessr Overlay: Error injecting script.", e);
  }
}

// --- Fix Leaflet default icon path ---
try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: chrome.runtime.getURL('leaflet/images/marker-icon-2x.png'),
        iconUrl: chrome.runtime.getURL('leaflet/images/marker-icon.png'),
        shadowUrl: chrome.runtime.getURL('leaflet/images/marker-shadow.png'),
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
} catch (e) {
    console.error("GeoGuessr Overlay: Error configuring Leaflet icons.", e);
}

// --- Toggle Map Visibility ---
function toggleMapDisplay() {
    isMapVisible = !isMapVisible;
    if (mapElement) {
        // Hide/show the map container itself
        mapElement.style.display = isMapVisible ? 'block' : 'none';
    }
    if (shadowHost) {
        // Adjust the HOST's height
        shadowHost.style.height = isMapVisible ? OVERLAY_EXPANDED_HEIGHT : OVERLAY_COLLAPSED_HEIGHT;
    }
    if (toggleButtonElement) {
        // Update button text
        toggleButtonElement.textContent = isMapVisible ? '−' : '+';
    }
    // console.log(`GeoGuessr Overlay: Map visibility toggled to ${isMapVisible}`);
}

// --- Create Shadow DOM and Overlay Structure ---
async function initializeShadowDOM() {
    if (shadowHost) return;

    try {
        // 1. Create Host Element
        shadowHost = document.createElement('div');
        shadowHost.id = ids.host;
        shadowHost.style.position = 'fixed';
        shadowHost.style.top = '10px';
        shadowHost.style.left = '10px';
        shadowHost.style.zIndex = '9999';
        shadowHost.style.width = '350px';
        shadowHost.style.height = OVERLAY_EXPANDED_HEIGHT; // Start expanded
        shadowHost.style.overflow = 'visible'; // Allow button to potentially overflow slightly if needed
        shadowHost.style.border = '1px solid #ccc';
        shadowHost.style.borderRadius = '5px';
        shadowHost.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        shadowHost.style.backgroundColor = 'white';
        shadowHost.style.transition = 'height 0.2s ease-in-out'; // Smooth height transition
        document.body.appendChild(shadowHost);

        // 2. Attach Shadow Root
        shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

        // 3. Load Leaflet CSS
        const cssUrl = chrome.runtime.getURL('leaflet/leaflet.css');
        const response = await fetch(cssUrl);
        if (!response.ok) throw new Error(`Failed to fetch leaflet.css: ${response.statusText}`);
        const cssText = await response.text();
        const styleElement = document.createElement('style');
        styleElement.textContent = cssText;
        shadowRoot.appendChild(styleElement);

        // 4. Create Overlay Container (fills the host)
        overlayContainer = document.createElement('div');
        overlayContainer.id = ids.overlay;
        overlayContainer.style.position = 'relative';
        overlayContainer.style.width = '100%';
        overlayContainer.style.height = '100%';
        overlayContainer.style.overflow = 'hidden'; // Hide map overflow within container
        shadowRoot.appendChild(overlayContainer);

        // 5. Create Map Element (inside overlay container)
        mapElement = document.createElement('div');
        mapElement.id = ids.map;
        mapElement.style.width = '100%';
        mapElement.style.height = '100%'; // Takes full height of overlayContainer
        overlayContainer.appendChild(mapElement); // Map added FIRST

        // 6. Create Toggle Button (inside overlay container, added AFTER map)
        toggleButtonElement = document.createElement('button');
        toggleButtonElement.id = ids.toggle;
        toggleButtonElement.textContent = '−'; // Start expanded
        toggleButtonElement.style.position = 'absolute';
        toggleButtonElement.style.top = '3px';
        toggleButtonElement.style.right = '3px';
        toggleButtonElement.style.zIndex = '1000'; // High z-index to be above map layers
        toggleButtonElement.style.backgroundColor = '#ffcc00';
        toggleButtonElement.style.border = '1px solid #cc9900';
        toggleButtonElement.style.borderRadius = '3px';
        toggleButtonElement.style.padding = '1px 5px';
        toggleButtonElement.style.fontSize = '14px';
        toggleButtonElement.style.fontWeight = 'bold';
        toggleButtonElement.style.lineHeight = '1';
        toggleButtonElement.style.cursor = 'pointer';
        toggleButtonElement.addEventListener('click', toggleMapDisplay);
        overlayContainer.appendChild(toggleButtonElement); // Button added LAST (helps stacking)

        isMapVisible = true; // Initial state

    } catch (error) {
        console.error("GeoGuessr Overlay: Failed to initialize Shadow DOM.", error);
        if (shadowHost) shadowHost.remove();
        shadowHost = null;
        shadowRoot = null;
    }
}

// --- Update Map Logic ---
async function updateMap(newLat, newLng) {
    if (!shadowRoot || !mapElement) {
        await initializeShadowDOM();
        if (!shadowRoot || !mapElement) return;
    }

    // Ensure host and map are expanded when updating
    if (!isMapVisible) {
        // If it was collapsed, expand it first
        toggleMapDisplay(); // This sets isMapVisible = true, expands host, shows mapElement
    } else {
        // Ensure styles are correct even if already visible
        shadowHost.style.height = OVERLAY_EXPANDED_HEIGHT;
        mapElement.style.display = 'block';
        if(toggleButtonElement) toggleButtonElement.textContent = '−';
    }
    shadowHost.style.display = 'block'; // Ensure host is visible

    // Initialize or update Leaflet map
    if (!leafletMap) {
        try {
            leafletMap = L.map(mapElement, {
                scrollWheelZoom: true,
                zoomControl: false,
                attributionControl: false
            }).setView([newLat, newLng], INITIAL_ZOOM_LEVEL);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(leafletMap);

            leafletMarker = L.marker([newLat, newLng]).addTo(leafletMap);

        } catch (mapError) {
            console.error("GeoGuessr Overlay: Error initializing Leaflet map.", mapError);
            mapElement.innerHTML = "Error loading map.";
        }
    } else {
        try {
            leafletMap.setView([newLat, newLng], leafletMap.getZoom());
            if (leafletMarker) {
                leafletMarker.setLatLng([newLat, newLng]);
            } else {
                leafletMarker = L.marker([newLat, newLng]).addTo(leafletMap);
            }
            // Invalidate size after potential host resize might affect map container
            // Use requestAnimationFrame to ensure resize has likely rendered
            requestAnimationFrame(() => {
                if (leafletMap) {
                    leafletMap.invalidateSize();
                }
            });
        } catch (updateError) {
            console.error("GeoGuessr Overlay: Error updating Leaflet map view.", updateError);
        }
    }
}


// --- Main Logic on Receiving Coordinates ---
function handleCoordinateUpdate(newLat, newLng) {
    const isSignificantChange =
        displayedLat === null ||
        Math.abs(newLat - displayedLat) > COORD_UPDATE_THRESHOLD ||
        Math.abs(newLng - displayedLng) > COORD_UPDATE_THRESHOLD;

    if (!isSignificantChange) {
        return;
    }

    displayedLat = newLat;
    displayedLng = newLng;

    updateMap(displayedLat, displayedLng);
}

// --- Event Listener for Coordinates from Injector ---
window.addEventListener('message', (event) => {
  if (event.source === window && event.data && event.data.type === 'GEO_GUESSER_COORDS') {
    if (typeof event.data.lat === 'number' && typeof event.data.lng === 'number') {
      handleCoordinateUpdate(event.data.lat, event.data.lng);
    }
  }
});

// --- Clean up on URL change ---
let currentHref = document.location.href;
const body = document.querySelector("body");
const observer = new MutationObserver(mutations => {
    mutations.forEach(() => {
        if (currentHref !== document.location.href) {
            currentHref = document.location.href;
            if (!currentHref.includes("/game/") &&
                !currentHref.includes("/challenge/") &&
                !currentHref.includes("/duels/") &&
                !currentHref.includes("/battle-royale/") &&
                !currentHref.includes("/live-challenge/") &&
                !currentHref.includes("/country-streak/") &&
                !currentHref.includes("/us-state-streak/") &&
                !currentHref.includes("/world-streak/"))
            {
                if (shadowHost) {
                    shadowHost.style.display = 'none'; // Hide the host
                    displayedLat = null;
                    displayedLng = null;
                    isMapVisible = true; // Reset state
                    // No need to reset button text if host is hidden
                }
            }
        }
    });
});
observer.observe(body, { childList: true, subtree: true });

// --- Initial Setup ---
injectScript('injector.js');