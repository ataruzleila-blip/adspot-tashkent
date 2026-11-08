# AdSpot Tashkent — Outdoor Advertising & Billboard Booking Marketplace

**Founders & Leadership:**
- **Laylo Atajanova** — Founder · Backend Architect
- **Nizamatdinova Jasmina** — CEO · UX/UI Lead

---

## 1. Quick Start in VS Code (Zero Setup Needed!)

1. Open **VS Code**.
2. Go to **File → Open Folder...** and open:
   ```text
   C:\Users\B&T USER\.gemini\antigravity\scratch\adspot-tashkent
   ```
3. Open the VS Code Terminal (`Ctrl + ~` or **Terminal → New Terminal**) and run:
   ```bash
   python server.py
   ```
4. Open your browser at:
   - **Main Website**: [http://localhost:8000](http://localhost:8000)
   - **Backend API & SQLite Database Console**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

---

## 2. Project Architecture

- `server.py` — Full-stack Python 3 backend server (`ThreadingHTTPServer` + `sqlite3` + Haversine GPS distance engine for school/mosque zones). Requires **zero paid API keys** and **zero external pip packages**.
- `adspot.db` — Auto-generated SQLite relational database with 4 tables:
  - `ad_spaces` (Verified Tashkent billboards, 4K LED screens, and smart bus shelters with real GPS `lat`/`lng`)
  - `bookings` (Campaign bookings via `Payme`, `Click Up`, and `Didox`)
  - `chat_messages` (Direct Space Owner chat & 24/7 Python AI Concierge history)
  - `advisory_logs` (Audit log of Smart Advisory pre-flight checks)
- `index.html` — Responsive UI in **UZ / RU / EN** with both a **Vector Map** and **Live Tashkent OpenStreetMap/Leaflet GPS Street Map** (100% free, no API key required).
- `styles.css` — Harmonious **Medium-Deep Sapphire Blue (`#284B63`) + Oxford Slate (`#1B3249`) + Warm Cashmere Beige (`#EBE2D3` / `#D4B895`)** design system & 3D spatial animations.
- `data.js` — Trilingual (`UZ`, `RU`, `EN`) dictionary and fallback catalog data.
- `app.js` — Frontend state & REST API client (`fetch('/api/spots')`, `fetch('/api/bookings')`, `fetch('/api/chat')`, `fetch('/api/advisory-check')`).
