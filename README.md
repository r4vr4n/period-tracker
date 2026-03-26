# Flo Cycle — Premium Period Tracker

> A modern, privacy-first menstrual cycle tracker with AI-powered predictions. **All data lives in your browser — no accounts, no servers, no cloud.**

**Live Demo:** [https://period-tracker.rjeevrnjn17.workers.dev/](https://period-tracker.rjeevrnjn17.workers.dev/)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Project Structure](#3-project-structure)
4. [Tech Stack](#4-tech-stack)
5. [Data Model](#5-data-model)
6. [Key Algorithms](#6-key-algorithms)
7. [Storage Architecture](#7-storage-architecture)
8. [P2P Sync (WebRTC)](#8-p2p-sync-webrtc)
9. [Getting Started](#9-getting-started)
10. [Environment Variables](#10-environment-variables)
11. [Deployment](#11-deployment)
12. [Privacy Model](#12-privacy-model)
13. [Known Limitations](#13-known-limitations)

---

## 1. Project Overview

**Flo Cycle** is a React + TypeScript single-page application (SPA) for tracking menstrual periods, predicting future cycles, and visualizing fertility windows — with zero cloud dependency.

### Core User Flows

| Flow | Entry Point | Description |
|------|-------------|-------------|
| Onboarding | `Onboarding.tsx` | First launch: user sets a display name, a local user profile is created |
| Log Period | `QuickLog.tsx` | User enters start + end date for a completed period |
| View Dashboard | `Dashboard.tsx` | Shows current cycle day, phase, metrics, and predictions |
| Calendar | `PredictionCalendar.tsx` | Month-view calendar with past, predicted, and fertile window highlights |
| History | `CycleHistory.tsx` | Reverse-chronological list of all logged periods with delete capability |
| Sync | `Settings.tsx` + `peerService.ts` | Peer-to-peer data transfer between two devices on the same Wi-Fi |
| Backup | `Settings.tsx` + `db.ts` | Export/import full cycle history as JSON |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React UI Layer                    │
│  Dashboard → CycleStatus, MetricsCards, QuickLog    │
│  Charts → PredictionCalendar, CycleLengthChart,      │
│            PeriodDurationChart                       │
│  History → CycleHistory                             │
│  Settings → Settings (sync + backup)                 │
└──────────────────────┬──────────────────────────────┘
                       │ reads/writes CycleEntry[]
                       ▼
┌─────────────────────────────────────────────────────┐
│              Storage Layer (IndexedDB)               │
│  db.ts: saveCycleEntry, getCycleHistory,             │
│         saveCompletePeriod, deleteCycleEntry,        │
│         exportData, importData, clearAllData         │
│  Stores: "cycles" (cycle entries) + "profile"        │
└──────────────────────┬──────────────────────────────┘
                       │ sends CycleEntry[] to worker
                       ▼
┌─────────────────────────────────────────────────────┐
│         Web Worker (cyclePredictor.worker.ts)        │
│  Runs off-thread: calculateMetrics()                 │
│  Returns: CycleMetrics (phases, predictions, etc.)  │
└─────────────────────────────────────────────────────┘
```

The UI never does heavy date arithmetic on the main thread — all prediction calculations run in a **Web Worker** so the UI remains responsive.

---

## 3. Project Structure

```
period-tracker/
├── src/
│   ├── App.tsx                    # Root component; just renders <Dashboard />
│   ├── main.tsx                   # Vite entry point; mounts <App /> to #root
│   ├── index.css                  # Full design system: tokens, components, animations
│   │
│   ├── types/
│   │   └── cycle.ts               # All TypeScript interfaces (see §5 Data Model)
│   │
│   ├── hooks/
│   │   └── useCyclePredictor.ts   # React hook that wraps the Web Worker
│   │
│   ├── workers/
│   │   └── cyclePredictor.worker.ts  # Off-thread prediction engine (see §6)
│   │
│   ├── storage/
│   │   ├── db.ts                  # IndexedDB abstraction (see §7)
│   │   └── peerService.ts         # WebRTC P2P sync via PeerJS (see §8)
│   │
│   └── components/
│       ├── dashboard/
│       │   ├── Dashboard.tsx      # Main container: loads data, manages state
│       │   ├── CycleStatus.tsx    # Animated SVG ring showing cycle day & phase
│       │   └── QuickLog.tsx       # Period logging form (start + end date)
│       │
│       ├── charts/
│       │   ├── PredictionCalendar.tsx  # Month-view calendar with status dots
│       │   ├── MetricsCards.tsx        # 6-card grid: avg cycle, regularity, etc.
│       │   ├── CycleLengthChart.tsx    # Recharts AreaChart of cycle lengths
│       │   └── PeriodDurationChart.tsx # Recharts BarChart of period durations
│       │
│       ├── history/
│       │   └── CycleHistory.tsx   # Sorted list of all past cycles with delete
│       │
│       ├── onboarding/
│       │   └── Onboarding.tsx     # Name-entry screen shown on first launch
│       │
│       └── settings/
│           └── Settings.tsx       # P2P sync panel + JSON export/import + clear
│
├── public/                        # Static assets served as-is
├── index.html                     # Vite HTML template
├── vite.config.ts                 # Vite config (workers inline, no plugins needed)
├── tsconfig.app.json              # TypeScript config for src/
├── .env.example                   # Firebase keys template (kept for reference only)
└── package.json
```

### Key File Responsibilities

| File | Responsibility |
|------|---------------|
| `Dashboard.tsx` | Single source of truth for `cycles` state; calls `getCycleHistory()` and triggers worker recalculation on every data mutation |
| `useCyclePredictor.ts` | Creates and manages the Web Worker lifecycle; exposes `metrics` and `isCalculating` |
| `cyclePredictor.worker.ts` | Pure computation: no React, no DOM — only date math and statistics |
| `db.ts` | All IndexedDB reads/writes; two stores: `cycles` (keyPath: `id`) and `profile` (keyPath: `id`) |
| `peerService.ts` | Singleton `P2PService` class; receiver generates a code → sender connects to that code and pushes `SyncPayload` |
| `index.css` | Canonical design tokens (CSS variables), all component styles, glassmorphism effects, keyframe animations |

---

## 4. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| UI Framework | React 18 + TypeScript | Component model, strict typing |
| Build Tool | Vite | Native ESM, fast HMR, first-class Worker support |
| Styling | Vanilla CSS | Zero-dependency design system; full control |
| Charts | Recharts | Composable React chart components |
| Date Utilities | date-fns | Tree-shakeable, immutable date helpers |
| P2P Sync | PeerJS (WebRTC) | Browser-to-browser data channel, no signalling server managed by us |
| Storage | IndexedDB (native) | Persistent, structured, large-capacity local storage |
| Worker | Web Worker API (native) | Off-thread computation, no UI jank |
| Deployment | Cloudflare Workers (static) | Edge CDN, free tier, simple wrangler deploy |

---

## 5. Data Model

All interfaces are in [`src/types/cycle.ts`](src/types/cycle.ts).

### `CycleEntry` — stored in IndexedDB

```typescript
interface CycleEntry {
  id: string;          // "${Date.now()}-${random}" — unique, stable
  userId: string;      // Always 'local' (no multi-user support)
  startDate: string;   // ISO date "YYYY-MM-DD" (local time)
  endDate: string | null; // null = currently ongoing
  createdAt: number;   // Unix ms timestamp for sort order
}
```

### `CycleMetrics` — computed by worker, never persisted

```typescript
interface CycleMetrics {
  averageCycleLength: number;     // Mean of gaps between consecutive startDates
  averagePeriodDuration: number;  // Mean of (endDate - startDate + 1) across entries
  shortestCycle: number;          // Min cycle length
  longestCycle: number;           // Max cycle length
  regularityScore: number;        // 0–100; 100 = zero std dev in cycle lengths
  totalCyclesTracked: number;     // Count of stored entries
  currentCycleDay: number;        // Days since last startDate + 1
  currentPhase: CyclePhase;       // 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  nextPredictedPeriod: string | null; // ISO date
  fertileWindow: FertileWindow | null;
  predictions: CyclePrediction[]; // Next 3 cycles
}
```

### `CyclePrediction`

```typescript
interface CyclePrediction {
  predictedStartDate: string; // ISO date
  predictedEndDate: string;   // = predictedStartDate + avgPeriodDuration - 1
  confidence: number;         // 0.0–1.0; decreases for later predictions and with < 3 data points
}
```

### `FertileWindow`

```typescript
interface FertileWindow {
  startDate: string;    // ovulationDate - 4 days
  endDate: string;      // ovulationDate + 1 day
  ovulationDate: string; // nextPredictedPeriodStart - 14 days
}
```

### Web Worker Message Protocol

```typescript
// UI → Worker
interface WorkerMessage {
  type: 'CALCULATE_PREDICTIONS';
  payload: { cycles: CycleEntry[]; today: string }; // today as "YYYY-MM-DD" local
}

// Worker → UI
interface WorkerResponse {
  type: 'PREDICTION_RESULT';
  payload: CycleMetrics;
}
```

---

## 6. Key Algorithms

All logic lives in `src/workers/cyclePredictor.worker.ts`.

### Date Helpers

> **Critical implementation note:** All date strings in this app are `"YYYY-MM-DD"` format. `new Date("YYYY-MM-DD")` parses as **UTC midnight** by spec. In timezones ahead of UTC (e.g. IST = UTC+5:30), this shifts to the previous local calendar day. All date helpers therefore append `'T00:00:00'` to force **local-time parsing**, and `addDays` returns local date parts (not `.toISOString()` which re-introduces the UTC offset).

```typescript
// Parse as local time
daysBetween("2024-02-28", "2024-03-05")  // → 6 days (correct, even across Feb boundary)
addDays("2024-02-26", 5)                  // → "2024-03-02" (correct)
```

### Cycle Length Calculation

Cycle lengths are computed as the number of days between **consecutive period start dates**. Entries with gaps outside `(0, 60)` days are discarded as data errors.

### Phase Detection

Based on `currentCycleDay` relative to `avgCycleLength`:

| Phase | Condition |
|-------|-----------|
| Menstrual | `currentCycleDay ≤ avgPeriodDuration` (or period still ongoing) |
| Follicular | `currentCycleDay ≤ round(avgCycleLength × 0.40)` |
| Ovulation | `currentCycleDay ≤ round(avgCycleLength × 0.55)` |
| Luteal | All remaining days |

### Regularity Score

```
stdDev   = sqrt( variance of all cycle lengths )
score    = clamp(0, 100,  round(100 - stdDev × 10) )
```
A score of 100 means every cycle was the same length. Below 2 data points → score stays 0.

### Predictions (next 3 cycles)

```
predictedStart[i+1] = predictedStart[i] + avgCycleLength
predictedEnd[i]     = predictedStart[i] + avgPeriodDuration - 1

confidence[i] = max(0.3,  1  - i×0.15  - (n < 3 ? 0.2 : 0) )
```
Where `n` = number of cycle lengths computed. Confidence decrements by 15% per future cycle and by a further 20% if fewer than 3 data points exist.

### Fertile Window

Ovulation is estimated at `nextPredictedPeriodStart - 14` days. The fertile window spans `[ovulation - 4, ovulation + 1]` (6 days total).

---

## 7. Storage Architecture

**`src/storage/db.ts`** — wraps the native `IndexedDB` API with promise-based helpers.

### Database Schema

- **DB Name:** `flo_cycle_db` (version 2)
- **Store `cycles`:** keyPath `id`; indexes on `startDate` (for calendar queries) and `createdAt` (for sort)
- **Store `profile`:** keyPath `id`; single record with key `'user'`

### Key Operations

| Function | Description |
|----------|-------------|
| `saveCompletePeriod(start, end)` | Primary write path from `QuickLog` |
| `getCycleHistory()` | Returns all entries sorted by `createdAt` descending |
| `deleteCycleEntry(id)` | Removes a single entry |
| `exportData()` | Serializes entire `cycles` store to JSON string |
| `importData(json)` | Bulk-inserts entries (skips entries missing `id` or `startDate`) |
| `clearAllData()` | Clears the `cycles` store only (profile preserved) |
| `prepareSyncPayload()` | Bundles `UserProfile` + `CycleEntry[]` + timestamp for P2P transfer |
| `applySyncPayload(payload)` | Clears then replaces both stores atomically in one transaction |

---

## 8. P2P Sync (WebRTC)

**`src/storage/peerService.ts`** — uses [PeerJS](https://peerjs.com/) to create a WebRTC data channel.

### Flow

```
Device A (has data)     Device B (wants data)
        │                       │
        │  User clicks          │  User clicks
        │  "Send Data"          │  "Receive Data"
        │                       │
        │               ← generates 5-char code "ABCDE"
        │               registers peer ID "flo-cycle-ABCDE"
        │                       │
        │  User types "ABCDE"   │
        │  connects to          │
        │  "flo-cycle-ABCDE" →  │
        │  sends SyncPayload    │
        │                       │  receives & applies payload
```

- Peer IDs are prefixed with `flo-cycle-` to avoid collisions with other PeerJS apps.
- Sender uses a random ephemeral peer ID.
- Connection times out after **15 seconds** if the receiver is not reachable.
- Both devices must be on a network that allows WebRTC (most Wi-Fi networks do).

### `SyncPayload` structure

```typescript
interface SyncPayload {
  profile: UserProfile;    // name, syncId, createdAt
  history: CycleEntry[];   // complete cycle history
  timestamp: number;       // Unix ms; can be used for conflict detection (not yet implemented)
}
```

---

## 9. Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
git clone https://github.com/r4vr4n/period-tracker.git
cd period-tracker
npm install
```

### Development

```bash
npm run dev
# → http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in ./dist/
```

### Type-check

```bash
npx tsc --noEmit
```

---

## 10. Environment Variables

The `.env.example` file lists Firebase keys — these are **legacy references** from an earlier iteration and are **not used** in the current codebase. The application runs entirely without any environment variables.

```env
# Not currently required — kept for historical reference
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 11. Deployment

The app is deployed as a **static site on Cloudflare Workers** (using [Cloudflare Pages](https://pages.cloudflare.com/) or Worker Sites).

```bash
# Build first
npm run build

# Deploy via Wrangler (ensure wrangler.toml or equivalent is configured)
npx wrangler pages deploy dist
```

The deployed URL is: **https://period-tracker.rjeevrnjn17.workers.dev/**

Since the app is entirely static (no server-side logic), it can alternatively be deployed to:
- GitHub Pages (`gh-pages` branch)
- Netlify / Vercel (drag-and-drop `dist/` folder)
- Any static file host (nginx, S3 + CloudFront, etc.)

---

## 12. Privacy Model

| Claim | Implementation |
|-------|---------------|
| No user accounts | `userId` field in `CycleEntry` is hardcoded to `'local'`; no auth layer exists |
| No cloud storage | All data written to browser's IndexedDB (`flo_cycle_db`) only |
| No analytics | No tracking scripts, no network calls except PeerJS signalling during sync |
| P2P only | `peerService.ts` uses a WebRTC data channel; PeerJS' public STUN/TURN is used only for connection negotiation, not to relay data |
| Export control | User can export full data as JSON and import it manually |

---

## 13. Known Limitations

| Limitation | Notes |
|----------|-------|
| Single device / browser | Data is stored per-browser-profile; incognito mode uses a separate store |
| No conflict resolution | P2P sync replaces the receiver's entire dataset; no merge logic |
| Cycle sanity check | Cycle lengths outside `(0, 60)` days are discarded; very short or very long cycles won't contribute to averages |
| Fertile window accuracy | Ovulation estimate assumes a textbook 14-day luteal phase; may not match individual variation |
| No offline PWA | No service worker; page requires initial network load |
| No multi-user | One profile per browser; no household / partner sharing |
| Feb/DST handling | Fixed in v2: all date strings are parsed as local time to avoid UTC offset bugs |

---

*Built with ❤️ by [r4vr4n](https://github.com/r4vr4n)*
