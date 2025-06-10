<p align="center">
  <img src="https://github.com/LeonardSEO/geoguessr/raw/main/icon128.png" width="100" alt="GeoGuessr Overlay Logo" />
</p>

# GeoGuessr Location Overlay 🗺️

**A stealthy, open-source Chrome extension that reveals your real in-game coordinates on GeoGuessr — safely, instantly, and undetectably.**  
Use it to learn. Or use it to win. Your call.

---

## ⚡ What It Does

This extension intercepts GeoGuessr’s internal map data and extracts the exact coordinates (latitude and longitude) during gameplay. It displays a small Leaflet-powered map in the corner of your screen that updates every time a new round loads.

**Features:**
- ✅ Live interactive map with zoom and drag
- ✅ Marker updates every round (no reload needed)
- ✅ Smooth +/− toggle to collapse the overlay
- ✅ 100% local: no trackers, no API keys, no external calls
- ✅ Uses Shadow DOM for styling isolation

---

## 🧠 Is It Safe?

Yes. It’s:
- 📦 **Fully client-side** — runs in your browser only
- 🔒 **Open-source** — no obfuscation or weird calls
- 🕵️ **Undetectable by GeoGuessr** — does not click, inject, or tamper
- 🛡️ **0% ban risk** if used smart (just don’t stream it visibly)

**This is not an autoclicker or bot.**  
You're still the one making the guess — just a lot better informed.

---

## 🚀 Install in 15 Seconds

> Not on the Chrome Web Store — install manually:

1. **Download ZIP**  
   👉 [Click here to download](https://github.com/LeonardSEO/geoguessr/archive/refs/heads/main.zip)

2. **Extract the ZIP**

3. Open Chrome and go to `chrome://extensions`

4. Enable **Developer Mode** (top right)

5. Click **Load Unpacked** and select the folder you just unzipped

Done. Start any GeoGuessr game — the overlay appears automatically.

---

## 📁 Folder Structure

```bash
geoguessr/
├── content.js               # Map overlay and Leaflet logic
├── injector.js             # Intercepts internal GeoGuessr metadata
├── manifest.json           # Chrome extension config
├── leaflet/                # Full Leaflet library (JS, CSS, marker icons)
├── icon48.png / icon128.png
└── README.md
````

---

## 🧪 Stack

* 🗺️ [Leaflet.js](https://leafletjs.com) for maps
* 💻 Vanilla JavaScript
* 👻 Shadow DOM for CSS isolation
* 🔌 No dependencies or frameworks

---

## ⚖️ Legal & Use Disclaimer

This extension is for **educational and experimental purposes** only.
It does not break GeoGuessr’s platform, but it gives you an informational edge. Use at your own discretion.

You **cannot get banned** just for using it — unless you blatantly cheat on stream or in competitions. Be smart.

---

## 🛡 License

MIT License — free to use, modify, or distribute.
See `LICENSE` for full terms.

---

## 💡 Roadmap Ideas

* Show country/city via reverse geocoding
* Add option to hide coordinates unless toggled
* Save previous markers across rounds
* Dark mode support

---

## 👨‍💻 Built By

[@LeonardSEO](https://github.com/LeonardSEO)
If it helps you win, star the repo ⭐
Not affiliated with GeoGuessr.
