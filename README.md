# NEXI — Your Focus Companion

A local-first, distraction-limiting Windows desktop productivity companion.

---

## Brand & Visual Identity
- **Brand**: **NEXI**
- **Tagline**: *"Your Focus Companion"*
- **Color Palette**: `#111111` background, `#191919` panels, `#222222` cards, `#F5F5F5` primary text, `#929292` secondary text, `#FF6B35` vibrant orange accent.
- **Original Companion ('NEXI')**: A futuristic floating companion with:
  - Smooth aerodynamic white shell (`#F4F4F6`)
  - Glossy dark oval visor (`#121214`) with glass reflection
  - Glowing neon-orange digital expressive eyes (`#FF8B5E`)
  - Floating lower hover pod with warm thruster glow
  - Distinctive levitating glowing orange halo (`#FF6B35`)
  - Smooth 30fps anti-aliased floating oscillation across 9 expressive states:
    - **Idle**: Calm breathing hover with blinking oval eyes.
    - **Focused**: Cyber pupils with intense focus gaze during Pomodoro sessions.
    - **Distracted / Warning**: Wide alert eyes with red halo pulses upon distraction rule triggers.
    - **Happy / Celebrating**: Sparkling arc eyes and confetti particles upon goal or session completion.
    - **Sleepy**: Peaceful eyelids and floating 'z' indicator when the system is idle.
    - **Confused**: Inquisitive asymmetrical expressions.

---

## Features

1. **System Tray & Floating Companion**:
   - Runs in the Windows notification tray with quick focus/pause controls.
   - Floating desktop NEXI widget (draggable anywhere, double-click to open dashboard).
2. **Real-Time Foreground Activity Tracking**:
   - Windows native `ctypes` foreground process detection (`GetForegroundWindow`, `QueryFullProcessImageNameW`).
   - Windows user idle detection (`GetLastInputInfo`) prevents idle time from polluting productivity metrics.
   - Categorizes apps into Coding, Productivity, Communication, Entertainment, Social Media, Gaming, etc.
3. **Browser Website Hostname Detection**:
   - Real website detection for Chrome, Edge, and Brave via Windows UI Automation & Window Title heuristics.
   - Includes an optional local Manifest V3 Chromium extension for 100% accurate hostname detection via local loopback `127.0.0.1:19876`.
   - Never records full URLs, query params, passwords, keystrokes, screenshots, or private/incognito browsing.
4. **Focus Engine & Profiles**:
   - Focus session timer with presets (Deep Work, Coding, Study, Relax, Custom).
   - Pomodoro intervals, countdown display, and break states.
5. **Distraction Detection & Interventions**:
   - Rule-based alerts when daily or continuous limits are exceeded.
   - Supportive intervention dialogs offering: *Return to Focus*, *Take 5m Break*, *Snooze 5m*, and *Continue*.
   - Never closes tabs or kills applications without explicit user configuration.
6. **Intent Mode (Bounded Browsing)**:
   - Grant yourself a temporary time budget (e.g., 10 minutes) with an explicit goal before visiting potentially distracting websites like YouTube or Reddit.
7. **Focus Radar & Analytics**:
   - 7-day usage trend chart (Productive vs. Distracting).
   - 24-hour daily distribution strip.
   - Chronological Activity Timeline with category filtering.
8. **NEXI AI Habit Coach (Groq)**:
   - Grounded entirely in local aggregated numerical totals.
   - Configurable model (`openai/gpt-oss-120b`).
   - 100% optional: the desktop app works fully offline without any API key.
9. **Theme Studio & Appearance Controls**:
   - Centralized live theme customization across all tabs, cards, tables, charts, dialogs, and the floating mascot.
   - Curated presets: *NEXI Dark*, *Midnight Orange*, *OLED Black*, *Warm Light*, and *Custom*.
   - Color picker dialogs and HEX inputs for: Main Background, Panels, Cards, Primary Text, Secondary Text, Accent Brand, Borders, Warnings, and Success.
   - Layout density options (*Comfortable* vs. *Compact*), corner styling (*Rounded* vs. *Subtle*), reduced motion animation toggle, and mascot visibility toggle.
   - Configurable attention thresholds, intervention cooldowns, grace lockdown duration, and strict mode.
10. **Local SQLite Storage & Privacy**:
   - Stored in `%APPDATA%\FocusCompanion\focus_companion.db`.
   - One-click "Clear History" and "Reset Factory Defaults" in Settings.

---

## Installation & Running

### 1. Requirements
- Windows 10 or Windows 11
- Python 3.11, 3.12, or 3.13

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch the Application
```bash
python main.py
```

---

## Optional Browser Extension (Chromium)
1. Open your browser extension manager:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `focus_companion/browser_extension` folder.

---

## Optional Groq AI Configuration
1. Obtain an API key from [Groq Console](https://console.groq.com/).
2. Open NEXI > **Settings** > **NEXI AI Coach**.
3. Paste your key into `GROQ_API_KEY` (saved locally in your SQLite database).

---

---

## Releases & Standalone Executable
You can download the pre-compiled, standalone portable executable from [GitHub Releases](https://github.com/ab2030909/NEXI-focus-companion/releases). No Python installation is required to run the release package.

1. Download `NEXI-v1.0.0-windows-x64.zip`.
2. Extract the archive and double-click `NEXI.exe`.
3. (Optional) Load the bundled `browser_extension` folder in your Chromium browser to enable deep hostname tracking.

---

## Building from Source (Reproducible Build)
To compile a fresh standalone Windows executable:
```cmd
build.bat
```
This clean-compiles the application using PyInstaller with bundled Qt dependencies, embeds `focus_companion/assets/icon.ico`, calculates SHA256 checksums, and outputs the release bundle into `release/NEXI-v1.0.0/` and `release/NEXI-v1.0.0-windows-x64.zip`.
