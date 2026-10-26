"""
Background activity tracking loop using QThread and Qt Signals.
Runs in a separate thread without blocking the UI and safely communicates with Qt widgets.
Tracks active foreground app/domain, measures intervals, monitors user idle state,
and records to SQLite.
"""

import time
from datetime import datetime
from typing import Optional
from PySide6.QtCore import QThread, Signal
from focus_companion.app.database.repository import Repository
from focus_companion.app.utils.win_api import get_foreground_window_info, get_idle_duration_sec
from focus_companion.app.core.browser_tracker import BrowserTracker


class ActivityTracker(QThread):
    # Safe cross-thread Qt signals
    activity_changed = Signal(str, str, int, bool) # app_name, domain, classification, is_idle
    tracker_ticked = Signal(str, str, int, bool)   # app_name, domain, classification, is_idle

    def __init__(self, repository: Repository, browser_tracker: Optional[BrowserTracker] = None, parent=None):
        super().__init__(parent)
        self.repo = repository
        self.browser_tracker = browser_tracker or BrowserTracker()

        self._running = False
        self._poll_interval = 1.0  # seconds

        # Current interval state
        self._current_app: str = ""
        self._current_process: str = ""
        self._current_title: str = ""
        self._current_domain: str = ""
        self._current_category: str = "Other"
        self._current_classification: int = 0
        self._interval_start: datetime = datetime.now()
        self._accumulated_sec: int = 0
        self._is_idle: bool = False

        # Session context
        self.in_focus_session: bool = False

    def start_tracking(self):
        if self.isRunning():
            return
        self._running = True
        self._interval_start = datetime.now()
        self.start()

    def stop_tracking(self):
        self._running = False
        self._flush_current_activity()
        self.quit()
        self.wait(1500)

    # Aliases
    def start(self, priority=QThread.Priority.InheritPriority):
        self._running = True
        super().start(priority)

    def stop(self):
        self.stop_tracking()

    def pause(self):
        self._flush_current_activity()
        self.repo.set_setting("tracking_enabled", "false")

    def resume(self):
        self._interval_start = datetime.now()
        self.repo.set_setting("tracking_enabled", "true")

    def is_enabled(self) -> bool:
        return self.repo.get_setting("tracking_enabled", "true").lower() == "true"

    def run(self):
        """Thread execution loop."""
        while self._running:
            try:
                if not self.is_enabled():
                    time.sleep(self._poll_interval)
                    continue

                # 1. Check user idle time
                idle_threshold = float(self.repo.get_setting("idle_threshold_sec", "180"))
                idle_sec = get_idle_duration_sec()
                now_idle = idle_sec >= idle_threshold

                # 2. Get foreground window
                hwnd, app_name, proc_name, title = get_foreground_window_info()

                # Check if app tracking is disabled
                track_apps = self.repo.get_setting("track_apps_enabled", "true").lower() == "true"
                browser_tracking = self.repo.get_setting("browser_tracking_enabled", "true").lower() == "true"

                # If idle or lock screen
                if now_idle:
                    app_name = "Idle"
                    proc_name = "idle"
                    title = "System Idle"
                    domain = ""
                else:
                    domain = (self.browser_tracker.detect_active_domain(hwnd, proc_name, title) or "") if browser_tracking else ""

                # Check site exclusions (Never Track list)
                if domain and self.repo.is_site_excluded(domain):
                    # Suppress recording excluded site
                    time.sleep(self._poll_interval)
                    continue

                if not track_apps and not domain:
                    # App tracking disabled and not on a tracked website
                    time.sleep(self._poll_interval)
                    continue

                # 3. Match rules
                category, classification, daily_lim, cont_lim, is_excluded = self.repo.match_rule(
                    proc_name if proc_name else app_name, domain
                )

                if is_excluded:
                    time.sleep(self._poll_interval)
                    continue

                # 4. Check if foreground app or domain changed or idle status changed
                target_key = f"{app_name}|{domain}|{now_idle}"
                current_key = f"{self._current_app}|{self._current_domain}|{self._is_idle}"

                if target_key != current_key:
                    # Flush old interval
                    self._flush_current_activity()

                    # Start new interval
                    self._current_app = app_name
                    self._current_process = proc_name
                    self._current_title = title
                    self._current_domain = domain
                    self._current_category = category
                    self._current_classification = classification
                    self._is_idle = now_idle
                    self._interval_start = datetime.now()
                    self._accumulated_sec = 0

                    self.activity_changed.emit(app_name, domain, classification, now_idle)

                # Increment accumulated time
                self._accumulated_sec += 1
                self.tracker_ticked.emit(self._current_app, self._current_domain, self._current_classification, self._is_idle)

                # Periodic flush to SQLite every 30 seconds so top application charts stay live
                if self._accumulated_sec >= 30:
                    self._flush_current_activity()

            except Exception:
                pass

            time.sleep(self._poll_interval)

    def _flush_current_activity(self):
        if not self._current_app or self._accumulated_sec <= 0:
            return

        end_time = datetime.now()
        try:
            self.repo.record_activity(
                app_name=self._current_app,
                process_name=self._current_process,
                window_title=self._current_title,
                domain=self._current_domain,
                category_name=self._current_category,
                classification=self._current_classification,
                start_time=self._interval_start,
                end_time=end_time,
                duration_sec=self._accumulated_sec,
                is_idle=self._is_idle,
                in_focus_session=self.in_focus_session
            )
        except Exception:
            pass
        self._accumulated_sec = 0
        self._interval_start = datetime.now()

    def get_current_status(self):
        return {
            "app": self._current_app or "None",
            "domain": self._current_domain,
            "category": self._current_category,
            "classification": self._current_classification,
            "is_idle": self._is_idle,
            "active_duration_sec": self._accumulated_sec
        }
