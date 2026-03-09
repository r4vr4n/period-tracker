# Flo Cycle — Premium Period Tracker

A modern, privacy-focused menstrual cycle tracker built with a premium dark-mode aesthetic. **Your data never leaves your browser.**

**Live Demo:** [https://period-tracker.rjeevrnjn17.workers.dev/](https://period-tracker.rjeevrnjn17.workers.dev/)

![Flo Cycle Dashboard](https://raw.githubusercontent.com/r4vr4n/period-tracker/main/public/preview.png) *(Note: Add your own preview image here or check the screenshots in the brain folder)*

## ✨ Key Features

- 🔒 **Privacy First**: No accounts, no clouds. All data is stored locally in your browser's **IndexedDB**.
- 📊 **Smart Predictions**: Uses a dedicated **Web Worker** to calculate cycle regularity, average lengths, and predict future periods without slowing down the UI.
- 📅 **Interactive Calendar**: Visualize past periods, fertile windows, and ovulation days at a glance.
- 📈 **Data Visualization**: Beautiful Recharts-powered Area and Bar charts showing cycle length trends and period durations.
- 📤 **P2P Sync**: Directly transfer your data between devices via WebRTC. **No cloud servers involved.**
- 🩸 **Quick Log**: One-tap logging for period start and end dates.
- 🎨 **Premium UI**: Glassmorphism design with smooth micro-animations and a sleek dark theme.

## 🛠️ Tech Stack

- **Core**: React 18 + TypeScript + Vite
- **Storage**: IndexedDB (Native Browser DB)
- **Performance**: Web Workers (for heavy cycle calculations)
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Styling**: Vanilla CSS (Custom Design System)

## 📂 Project Structure

```text
src/
├── components/
│   ├── charts/       # Calendar, Metrics Cards, and Recharts components
│   ├── dashboard/    # Main Status Ring and Quick Log
│   ├── history/      # Timeline of past cycles
│   ├── settings/     # Import/Export/Clear data tools
│   └── ui/           # Reusable UI elements
├── hooks/            # useCyclePredictor (Web Worker interface)
├── storage/          # db.ts (IndexedDB) & peerService.ts (WebRTC Sync)
├── types/            # TypeScript interfaces
├── workers/          # cyclePredictor.worker.ts (Prediction logic)
├── App.tsx           # Main component (No-Auth Single Page)
├── main.tsx          # Entry point
└── index.css         # Custom Design System & Global Styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/r4vr4n/period-tracker.git
   cd period-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🛡️ Privacy & Security

Flo Cycle is 100% "Local-Only". 
- **No Cloud**: We don't have a database or a server.
- **P2P Transfers**: When you sync between devices, the data moves directly from browser to browser.
- **No Analytics**: We don't track you. Period.

---
Built with ❤️ by [r4vr4n](https://github.com/r4vr4n)
