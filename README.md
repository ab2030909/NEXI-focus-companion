# NEXI — Your Focus Companion built with AdaL.

<div align="center">

<img src="focus_companion/assets/icon.png" alt="NEXI Logo" width="108" />

### An intelligent, local-first Windows productivity companion crafted with AdaL.

[![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=flat-square)](#system-requirements)
[![Python](https://img.shields.io/badge/python-3.11%20%7C%203.12%20%7C%203.13-3776AB?style=flat-square)](#system-requirements)
[![UI Framework](https://img.shields.io/badge/GUI-PySide6%20(Qt%206)-41CD52?style=flat-square)](https://doc.qt.io/qtforpython-6/)
[![Built with](https://img.shields.io/badge/built%20with-AdaL-FF6B35?style=flat-square)](#about-nexi)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Storage](https://img.shields.io/badge/storage-local%20SQLite-003B57?style=flat-square)](#privacy--data-ownership)

[Get Started](#quick-start) • [Key Workflows](#core-workflows) • [Architecture](#architecture--design) • [Building](#building-a-release-binary) • [Privacy](#privacy--data-ownership)

</div>

---

## About NEXI

**NEXI** is a local-first Windows desktop productivity companion built using **AdaL**. It bridges system-level activity tracking with non-intrusive focus coaching: rather than forcefully blocking software or closing browser tabs, NEXI brings mindfulness to how you spend your workday.

When attention wanders into designated distraction areas or exceeds continuous limits, NEXI steps in with supportive interventions, bounded-browsing sessions (*Intent Mode*), and clear visual analytics.

---

## Core Workflows

### 1. Focus Center & Intent Mode
- **Sprint Timer**: Launch Pomodoro-style sprints (Deep Work, Coding, Reading, Custom) with custom break intervals and real-time circular progress visualization.
- **Intent Mode (Bounded Browsing)**: Need to check YouTube for a programming tutorial or Reddit for a technical solution? Lock in an explicit intention and a strict time budget (e.g. 15 minutes). When the budget expires, NEXI gently directs your attention back to your core task.

### 2. High-Precision Local Activity Tracking
- **Windows Win32 Native Hooks**: Detects active foreground application processes (`GetForegroundWindow`, `QueryFullProcessImageNameW`) with sub-second responsiveness.
- **True Idle Detection**: Uses `GetLastInputInfo` so away-from-keyboard time never corrupts your productive ratios.
- **Browser Hostname Attribution**: Identifies active domains across Chrome, Edge, and Brave with window-title heuristics, or via an optional local loopback Manifest V3 extension (`127.0.0.1:19876`).

### 3. Visual Analytics (Focus Radar)
- **24-Hour Segmented Timeline**: Interactive hourly distribution bar chart with hover tooltips detailing productive, neutral, and distraction durations across the day.
- **Multi-Period Aggregation**: Toggle between Today, 7-Day, and 30-Day scopes with ranked application breakdowns, proportional segmented bars, and category tagging.

### 4. Interactive Floating Mascot
- A custom-rendered, floating desktop companion that oscillates and reflects your focus state across 9 emotional reactions (focused, idle, celebrating milestones, sleepy on idle, and alert on distractions).

### 5. Live Theme Studio
- Tailor your visual experience with live theme switching: NEXI Dark, Midnight Orange, OLED Black, Warm Light, or define custom HEX palettes.

---

## System Requirements

| Specification | Details |
| :--- | :--- |
| **Operating System** | Windows 10 / Windows 11 (64-bit) |
| **Runtime Environment** | Standalone Executable (No Python needed) **OR** Python 3.11 – 3.13 |
| **Core Libraries** | `PySide6 >= 6.6.0`, `pywin32 >= 306`, `groq >= 0.9.0` |

---

## Quick Start & How to Run

### Option A: Portable Standalone Executable (Recommended)

[![Download Release](https://img.shields.io/badge/Download-NEXI%20v1.0.0%20(Windows%20x64)-FF6B35?style=for-the-badge&logo=windows)](https://github.com/ab2030909/NEXI-focus-companion/releases/latest)

No installation or Python setup is required.

1. Head to [**GitHub Releases**](https://github.com/ab2030909/NEXI-focus-companion/releases/latest) and download `NEXI-v1.0.0-windows-x64.zip`.
2. Right-click the `.zip` file and select **Extract All...**.
3. Double-click **`NEXI.exe`** to run.
4. **Where to find NEXI**:
   - The main window opens immediately with the **Focus Center** dashboard.
   - A floating, animated **NEXI companion** appears on your desktop (drag anywhere, or double-click to toggle the dashboard).
   - An orange tray icon appears in your **Windows Taskbar System Tray** (right-click for quick session controls or to reopen the window at any time).

> **Note**: Because the executable is freshly built, Windows SmartScreen may show a prompt on first launch. Click **More info → Run anyway**.

---

### Option B: Running from Source (Developers)

If you prefer running or modifying the Python source code directly:

```cmd
# 1. Clone the repository
git clone https://github.com/ab2030909/NEXI-focus-companion.git
cd NEXI-focus-companion

# 2. (Optional) Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate

# 3. Install required packages
pip install -r requirements.txt

# 4. Launch the application
python main.py
```

Alternatively, on Windows you can simply double-click **`run_app.bat`** in the project folder to start NEXI instantly.

---

## Optional Companion Browser Extension

For exact hostname detection that bypasses browser window title truncations:

1. Open your browser extension manager:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the [`focus_companion/browser_extension`](focus_companion/browser_extension) folder.

> **Privacy Guarantee**: The extension communicates exclusively with `http://127.0.0.1:19876` on your local loopback. Full URLs, queries, page text, form submissions, and keystrokes are never inspected or recorded. For incognito windows, only an anonymous indicator is passed.

---

## Optional AI Habit Coach

NEXI operates completely offline. If you choose to enable the AI Habit Coach:
1. Generate an API key via [Groq Console](https://console.groq.com/).
2. Open NEXI **Settings → NEXI AI Coach** and save your key.
3. The coach receives only high-level summary totals (e.g. total focus minutes and top category names) to construct personalized weekly habit recommendations. Raw titles and window history are never transmitted.

---

## Architecture & Design

NEXI is engineered around an event-driven Qt architecture decoupled from system polling:

```
┌────────────────────────────────┐       ┌──────────────────────────────────┐
│  Win32 API (Foreground/Idle)   │       │ Chromium Extension (Local HTTP)  │
└───────────────┬────────────────┘       └────────────────┬─────────────────┘
                │                                         │
                ▼                                         ▼
       ┌─────────────────────────────────────────────────────────┐
       │     ActivityTracker (Background QThread, 1s Poll)       │
       └────────────────────────┬────────────────────────────────┘
                                │ Qt Signals
                                ▼
       ┌─────────────────────────────────────────────────────────┐
       │                       MainWindow                        │
       │   ├── FocusEngine (Sprint Timers & Intent Mode)         │
       │   ├── InterventionManager (Rules & Lockdowns)           │
       │   └── ReminderScheduler (Micro-breaks & Posture)        │
       └────────────────────────┬────────────────────────────────┘
                                │
                                ▼
       ┌─────────────────────────────────────────────────────────┐
       │       Repository & Local SQLite Database Engine         │
       │        (%APPDATA%\FocusCompanion\focus_companion.db)    │
       └─────────────────────────────────────────────────────────┘
```


```

---

## Privacy & Data Ownership

- **100% Local Storage**: All activity logs, durations, and category rules are stored in `%APPDATA%\FocusCompanion\focus_companion.db`.
- **Zero Telemetry**: NEXI does not send telemetry, analytics, or user behavior to external servers.
- **You are in Control**: Features like *Clear History* and *Reset Database* are accessible directly from Settings.
- **Non-Destructive**: NEXI will never close your software or terminate applications without explicit user intent.

---

## Building a Release Binary

To reproduce the production Windows standalone executable:

```cmd
build.bat
```

The script cleans previous artifacts, invokes PyInstaller with all Qt dependencies and assets, calculates the SHA256 verification hash, and produces:
- `release/NEXI-v1.0.0/NEXI.exe` (Single-file standalone binary)
- `release/NEXI-v1.0.0-windows-x64.zip` (Complete distribution package)

---

## Troubleshooting

- **Missing Application Usage**: If your application rows appear empty or short on small displays, the dashboard cards include smooth vertical scrolling—simply scroll down or resize the window.
- **Extension Disconnected**: Ensure your browser extension is loaded from `focus_companion/browser_extension` and that port `19876` is not blocked by local security software.
- **Auto-Start on Boot**: If auto-start is enabled, NEXI registers a standard per-user registry key under `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`, which requires no administrative privileges.

---

## License

This project is open source and available under the [MIT License](LICENSE).

Copyright (c) 2026 Abdullah Haroon (ab2030909).

---

<div align="center">
<sub>Crafted with passion using <b>AdaL</b> and PySide6.</sub>
</div>
