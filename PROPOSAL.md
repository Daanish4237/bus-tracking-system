# Project Proposal
## Real-Time Bus Tracking System

---

## 1. Executive Summary

This proposal outlines the development of a **Real-Time Bus Tracking System** — a web-based passenger application that enables users to track live bus locations, view route information, select drop-off stops, and receive automated voice announcements as the bus approaches each stop. The system is designed to improve the public transportation experience by providing passengers with accurate, real-time information directly on their mobile devices without requiring any app installation.

---

## 2. Problem Statement

Passengers using public bus services frequently face uncertainty regarding:

- The current location of the bus they are waiting for
- How long it will take for the bus to reach their stop
- Which stop the bus is currently at along the route

This lack of real-time information leads to frustration, missed buses, and reduced confidence in public transport. Existing solutions either require dedicated hardware on buses, proprietary apps, or expensive third-party integrations.

---

## 3. Proposed Solution

A lightweight, browser-based tracking system that:

- Uses the **passenger's own phone GPS** to determine their current location
- Matches their position against known bus stop coordinates along the selected route
- Displays a live map showing the passenger's position, route stops, and bus locations
- Announces upcoming stops via **voice** (e.g. "Next stop: Melody Kinrara")
- Allows passengers to **request a stop** directly from the app
- Shows **estimated arrival time (ETA)** for the bus to reach any selected stop

No dedicated GPS hardware on buses is required. The system works entirely through the passenger's device.

---

## 4. Key Features

| Feature | Description |
|---|---|
| Live Location Tracking | Blue dot on map showing passenger's real-time GPS position |
| Route Map | Interactive OpenStreetMap showing all stops and route line |
| Current Stop Detection | Automatically detects which stop the passenger is nearest to |
| Next Stop Banner | Prominent banner showing "Now at" and "Next stop" with distance |
| Voice Announcements | Browser speech synthesis announces upcoming stops |
| ETA Calculation | Estimates minutes until bus reaches selected stop |
| Request Stop | Button to notify the system of a stop request |
| Route Selection | Browse and select from available bus routes |
| Drop-off Selection | Choose a specific stop as the intended drop-off point |
| Reverse Geocoding | Shows real place name (e.g. "Asia Pacific University") before route is selected |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PASSENGER DEVICE                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  GPS Module  │  │  Map (OSM)   │  │ Voice (Speech │  │
│  │ (Geolocation │  │  + Leaflet   │  │  Synthesis)   │  │
│  │    API)      │  │              │  │               │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                   │          │
│  ┌──────▼─────────────────▼───────────────────▼───────┐  │
│  │              Browser Application (TypeScript)       │  │
│  │   MapManager │ GPSTracker │ NextStopBanner │ UI     │  │
│  └──────────────────────────┬────────────────────────┘  │
│                             │ HTTP (REST API)            │
└─────────────────────────────┼───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│                    VERCEL SERVERLESS                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  api/routes  │  │  api/stops   │  │  api/buses    │  │
│  │  (handlers)  │  │  (handlers)  │  │  (handlers)   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         └─────────────────┼───────────────────┘          │
│                    ┌──────▼───────┐                       │
│                    │  In-Memory   │                       │
│                    │  Data Store  │                       │
│                    └──────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Frontend | Vanilla TypeScript, Vite |
| Map | Leaflet.js + OpenStreetMap |
| Geocoding | Nominatim (OpenStreetMap) — free, no API key |
| Voice | Web Speech API (built into browser) |
| Backend | Node.js + Express |
| Deployment | Vercel (serverless) |
| Version Control | GitHub |
| Testing | Vitest + fast-check (property-based testing) |

---

## 7. Wireframes

### 7.1 Main Application — No Route Selected

```
┌─────────────────────────────────────────────────────────────┐
│              🚌  Bus Tracking System                         │
│                Track your bus in real-time                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ● Now at: Asia Pacific University    │  Select a route...  │
└─────────────────────────────────────────────────────────────┘

● GPS active · ±12m

┌──────────────────────┐  ┌──────────────────────────────────┐
│  Available Routes    │  │                                  │
│ ─────────────────    │  │  (Route stops appear here        │
│  🚌 route-541        │  │   after selecting a route)       │
│  Bus 541 — Kinrara   │  │                                  │
│  BK5 → Putra Permai  │  │                                  │
│                      │  │                                  │
│  🚌 route-101        │  │                                  │
│  Downtown Express    │  │                                  │
│                      │  │                                  │
│  🚌 route-202        │  │                                  │
│  Uptown Local        │  │                                  │
└──────────────────────┘  └──────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────────────────┐
│  Select Drop-off     │  │  Live Bus Tracking               │
│ ─────────────────    │  │ ─────────────────────────────    │
│  (Select a route     │  │  (Bus cards appear here          │
│   to see stops)      │  │   after selecting a route)       │
└──────────────────────┘  └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Route Map                                                   │
│ ─────────────────────────────────────────────────────────   │
│                                                             │
│   [OpenStreetMap centered on user's GPS location]           │
│                                                             │
│              ●  ← blue dot (you are here)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 7.2 Main Application — Route Selected

```
┌─────────────────────────────────────────────────────────────┐
│              🚌  Bus Tracking System                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  NOW AT                │  NEXT STOP                  🔊  │
│  Melody Kinrara (Barat)│  Melody Kinrara (Timur)         │
│                        │  298m away                      │
└──────────────────────────────────────────────────────────┘

● GPS active · ±71m

┌──────────────────────┐  ┌──────────────────────────────────┐
│  Available Routes    │  │  Stops for Route 541             │
│ ─────────────────    │  │ ─────────────────────────────    │
│  🚌 route-541  ◀ sel │  │  1. LRT Kinrara BK5              │
│  Bus 541 — Kinrara   │  │     LRT Kinrara BK5, Puchong     │
│                      │  │  2. Kinrara Cricket Academy      │
│  🚌 route-101        │  │  3. SMK Seksyen 4 Bandar Kinrara │
│  Downtown Express    │  │  4. Kinrara Golf Club (Tengah)   │
│                      │  │  5. Kinrara Golf Club (Timur)    │
└──────────────────────┘  │  ...                             │
                          └──────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────────────────┐
│  Select Drop-off     │  │  Live Bus Tracking               │
│ ─────────────────    │  │ ─────────────────────────────    │
│  Click on a stop to  │  │  🚌 Bus bus-541                  │
│  select drop-off:    │  │  Location: 3.03700, 101.65580    │
│                      │  │  Last updated: just now          │
│  1. LRT Kinrara BK5  │  │                                  │
│  2. Cricket Academy  │  │  Stop Progress:                  │
│  3. SMK Seksyen 4    │  │  ✓ LRT Kinrara BK5               │
│  ▶ 4. [SELECTED]     │  │  ✓ Cricket Academy               │
│     Kinrara Golf     │  │  ● Melody Kinrara (Barat) ◀ now  │
│     Club (Tengah)    │  │  ○ Melody Kinrara (Timur)        │
│                      │  │  ○ Simfoni Kinrara (Barat)       │
│  ┌─────────────────┐ │  └──────────────────────────────────┘
│  │ Your Drop-off:  │ │
│  │ Kinrara Golf    │ │
│  │ Club (Tengah)   │ │
│  │ ~4 min (bus-541)│ │
│  │                 │ │
│  │ 🔔 Request Stop │ │
│  └─────────────────┘ │
└──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Route Map                                                   │
│ ─────────────────────────────────────────────────────────   │
│                                                             │
│   1 ──── 2 ──── 3 ──── 4 ──── 5  ← route line (purple)    │
│                                                             │
│              🚌  ← bus marker (amber)                       │
│              ●   ← you (blue dot)                           │
│              📍  ← your selected stop (green)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 7.3 Driver Page (driver.html)

```
┌──────────────────────────────────┐
│  🚌 Driver GPS Tracker           │
│  Your location will be shared    │
│  with passengers in real-time    │
│                                  │
│  Bus ID                          │
│  ┌──────────────────────────┐    │
│  │ bus-541 — Bus 541        │    │
│  └──────────────────────────┘    │
│                                  │
│  Route                           │
│  ┌──────────────────────────┐    │
│  │ route-541 — Bus 541      │    │
│  └──────────────────────────┘    │
│                                  │
│  Speed (km/h) — optional         │
│  ┌──────────────────────────┐    │
│  │ Auto-detect from GPS     │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │  📍 Start Sharing        │    │
│  │     Location             │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │ Status:  ● Tracking...   │    │
│  │ Lat:     3.037000        │    │
│  │ Lon:     101.655800      │    │
│  │ Accuracy: ±8m            │    │
│  │ Last update: 14:32:05    │    │
│  └──────────────────────────┘    │
│                                  │
│  [14:32:05] ✓ Location sent      │
│  [14:32:00] ✓ Location sent      │
└──────────────────────────────────┘
```

---

## 8. Data Flow

```
Passenger opens app
        │
        ▼
GPS permission requested
        │
        ▼
Blue dot appears on map ──────────────────────────────────┐
        │                                                  │
        ▼                                                  │
Reverse geocode → "Now at: [Place Name]"                  │
        │                                                  │
        ▼                                                  │
Passenger selects route                                    │
        │                                                  │
        ▼                                                  │
Route stops loaded from API                               │
Map draws route line + numbered stop markers              │
        │                                                  │
        ▼                                                  │
GPS updates every 3 seconds ◀─────────────────────────────┘
        │
        ▼
Nearest stop calculated (Haversine formula)
        │
        ├──► Banner updates: "Now at X / Next stop Y"
        │
        ├──► Voice announces when within 300m of next stop
        │
        └──► ETA shown when stop is selected
```

---

## 9. Limitations & Future Improvements

| Current Limitation | Proposed Improvement |
|---|---|
| In-memory data store (resets on restart) | Integrate a persistent database (e.g. PostgreSQL) |
| GPS accuracy depends on device | Supplement with real transit API data (e.g. RapidKL GTFS feed) |
| Single passenger GPS as bus tracker | Dedicated driver app with background GPS tracking |
| No user authentication | Add passenger accounts for saved routes and preferences |
| No real-time multi-user sync | Upgrade to WebSocket for instant updates across all passengers |

---

## 10. Deployment

The system is deployed on **Vercel** at no cost:

- Frontend served as static files (HTML, CSS, JS)
- Backend runs as serverless functions
- Auto-deploys on every push to the GitHub repository
- HTTPS enabled by default
- Accessible from any device with a modern browser

---

*Prepared for: Bus Tracking System Project*
*Technology: TypeScript · Node.js · Express · Leaflet.js · OpenStreetMap · Vercel*
