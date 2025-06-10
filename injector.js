(function () {
  if (window.hasInjectedGeoGuesserOverlayScript) {
    return;
  }
  window.hasInjectedGeoGuesserOverlayScript = true;

  const XHR = XMLHttpRequest.prototype;
  const originalOpen = XHR.open;
  const originalSend = XHR.send;

  XHR.open = function (method, url) {
    this._url = url;
    this._method = method;
    return originalOpen.apply(this, arguments);
  };

  XHR.send = function () {
    this.addEventListener('load', function () {
      const url = this._url;
      const method = this._method;

      // TARGETED INTERCEPTION for GetMetadata
      if (method === 'POST' && typeof url === 'string' && url.includes('/GetMetadata')) {
        let lat = NaN;
        let lng = NaN;
        let foundVia = 'none'; // Track how coordinates were found

        // --- Attempt 1: Parse JSON and use specific path ---
        try {
          const jsonData = JSON.parse(this.responseText);
          // The path derived from your example: response[1][0][5][0][1][0] contains [null, null, lat, lng]
          const locationArray = jsonData?.[1]?.[0]?.[5]?.[0]?.[1]?.[0];
          if (Array.isArray(locationArray) && locationArray.length >= 4) {
             const potentialLat = locationArray[2];
             const potentialLng = locationArray[3];
             // Basic type check - Google might use numbers or strings sometimes
             if (typeof potentialLat === 'number' && typeof potentialLng === 'number') {
                lat = potentialLat;
                lng = potentialLng;
                foundVia = 'json';
             } else if (typeof potentialLat === 'string' && typeof potentialLng === 'string') {
                 // Attempt to parse if they are strings
                 lat = parseFloat(potentialLat);
                 lng = parseFloat(potentialLng);
                 if (!isNaN(lat) && !isNaN(lng)) {
                    foundVia = 'json_parsed_string';
                 } else {
                     lat = NaN; // Reset if parsing failed
                     lng = NaN;
                 }
             }
          }
        } catch (parseError) {
          // JSON parsing failed or path was invalid, ignore error and proceed to regex
          foundVia = 'json_error';
        }

        // --- Attempt 2: Regex Fallback (if JSON failed) ---
        if (isNaN(lat) || isNaN(lng)) {
          try {
            const pattern = /-?\d+\.\d+,-?\d+\.\d+/g;
            const responseText = this.responseText;
            const matches = responseText.match(pattern);

            if (matches && matches.length > 0) {
              const coords = matches[0].split(',');
              const potentialLat = parseFloat(coords[0]);
              const potentialLng = parseFloat(coords[1]);

              if (!isNaN(potentialLat) && !isNaN(potentialLng)) {
                lat = potentialLat;
                lng = potentialLng;
                foundVia = 'regex';
              }
            }
          } catch (regexError) {
            // Regex itself failed unexpectedly
             console.error("GeoGuessr Overlay: Regex extraction failed.", regexError);
             foundVia = 'regex_error';
          }
        }

        // --- Send Coordinates if Found ---
        if (!isNaN(lat) && !isNaN(lng)) {
          // console.log(`GeoGuessr Overlay: Sending coords (${foundVia}): ${lat}, ${lng}`); // Optional debug log
          window.postMessage({ type: 'GEO_GUESSER_COORDS', lat: lat, lng: lng }, '*');
        } else {
          // Only log error if both methods failed substantially
          if (foundVia !== 'json_error' && foundVia !== 'regex_error') {
             console.warn(`GeoGuessr Overlay: Could not extract coordinates via JSON or Regex (Method: ${foundVia}).`);
          }
        }

      } // End of targeted interception block
    }); // End of event listener

    return originalSend.apply(this, arguments);
  }; // End of send override

})(); // End of IIFE