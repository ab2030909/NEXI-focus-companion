"""
Focus Companion - Main Application Entry Point
A local-first, distraction-limiting Windows desktop companion inspired by PHI.
"""

import sys
import os

# Ensure focus_companion is in Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

from focus_companion.app.database.db import Database
from focus_companion.app.database.repository import Repository
from focus_companion.app.core.browser_tracker import BrowserTracker
from focus_companion.app.core.tracker import ActivityTracker
from focus_companion.app.core.focus_engine import FocusEngine
from focus_companion.app.core.intervention import InterventionManager
from focus_companion.app.core.notifications import ReminderScheduler
from focus_companion.app.ui.main_window import MainWindow


def main():
    # Enable high-DPI scaling
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )

    app = QApplication(sys.argv)
    app.setApplicationName("NEXI - Your Focus Companion")
    app.setOrganizationName("NEXI")

    # Set Application Icon
    from PySide6.QtGui import QIcon
    icon_path = os.path.join(os.path.dirname(__file__), "focus_companion", "assets", "icon.png")
    if not os.path.exists(icon_path) and hasattr(sys, "_MEIPASS"):
        icon_path = os.path.join(sys._MEIPASS, "focus_companion", "assets", "icon.png")
    if os.path.exists(icon_path):
        app.setWindowIcon(QIcon(icon_path))

    # Ensure app keeps running in system tray even if window is closed
    app.setQuitOnLastWindowClosed(False)

    # 1. Initialize local SQLite Database & Repository
    db = Database.get_instance()
    repo = Repository(db)

    # 2. Initialize Core Engines
    browser_tracker = BrowserTracker(port=int(repo.get_setting("extension_port", "19876")))
    activity_tracker = ActivityTracker(repository=repo, browser_tracker=browser_tracker)
    focus_engine = FocusEngine(repository=repo)
    intervention_manager = InterventionManager(repository=repo, focus_engine=focus_engine)
    reminder_scheduler = ReminderScheduler(repository=repo)

    # 3. Start background activity tracking thread
    activity_tracker.start()

    # 4. Create and launch Main Window
    window = MainWindow(
        repository=repo,
        tracker=activity_tracker,
        focus_engine=focus_engine,
        intervention_mgr=intervention_manager,
        reminder_scheduler=reminder_scheduler
    )
    screen_geom = app.primaryScreen().availableGeometry()
    win_w, win_h = 1080, 720
    x = max(0, (screen_geom.width() - win_w) // 2)
    y = max(0, (screen_geom.height() - win_h) // 2)
    window.setGeometry(x, y, win_w, win_h)
    window.show()
    window.raise_()
    window.activateWindow()

    # 5. Run application event loop
    exit_code = app.exec()

    # Cleanup upon exit
    activity_tracker.stop()
    browser_tracker.ext_server.stop()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
