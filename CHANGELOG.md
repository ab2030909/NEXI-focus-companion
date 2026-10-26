# Changelog

All notable changes to **NEXI — Your Focus Companion** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-10-26

### Added
- **Focus Center Dashboard**:
  - Hero circular countdown timer with animated progress rings and session status feedback.
  - Quick action controls: *Start Focus*, *Take Break*, and *Set Intent*.
  - 4 Key Productivity Metric cards: Screen Time, Productive Time, Distractions, and Daily Goal.
  - Ranked **Most Used Applications** and **Top Websites & Domains** with initial-based icon badges, category labels, proportional horizontal segmented usage bars, active duration, and usage ratio percentages.
- **Visual Analytics (Focus Radar)**:
  - 24-Hour activity distribution timeline with hover inspection tooltips.
  - Multi-period analysis (Today, 7 Days, 30 Days).
  - Categorized bar charts comparing productive vs. distracting usage.
  - Analytics badges for top distraction site, peak productivity hour, and focus trend.
- **Intent Mode (Bounded Browsing)**:
  - Time-budgeted intent sessions with intention goals, live countdown timers, pause/resume, and cancellation controls.
  - Persistence across app restarts in local SQLite database.
- **Floating Companion (NEXI Mascot)**:
  - Draggable, interactive desktop pet with 9 animated emotional states (Idle, Focused, Warning, Celebrating, Sleepy, Confused, etc.).
  - Double-click to expand the main window; right-click context menu for quick controls.
- **Custom Frameless Window**:
  - Smooth rounded window corners with modern title bar, minimal branding, and hover-styled window control buttons.
- **Theme Studio**:
  - Live Theme Engine supporting Dark, OLED Black, Midnight Orange, Warm Light, and Custom hex colors.
  - Customizable accent colors, border styling, corner radii, and layout density.
- **Local-First Privacy Architecture**:
  - All metrics and session records stored locally in `%APPDATA%\FocusCompanion\focus_companion.db`.
  - Zero cloud dependencies for core tracking; optional Groq AI habit coaching.
- **Native Windows Integrations**:
  - High-precision window and idle detection via Win32 API.
  - Per-user auto-start with Windows registry support without requiring administrator privileges.
  - Windows System Tray integration with background tracking.
