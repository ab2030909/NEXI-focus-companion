"""
Compact Floating Desktop Companion Widget.
Stays on desktop or topmost (configurable), animated mascot face, drag to reposition,
and right-click context menu (Open App, Start Focus, Pause Tracking, Quit).
"""

from PySide6.QtWidgets import QWidget, QVBoxLayout, QMenu
from PySide6.QtCore import Qt, QPoint, Signal
from PySide6.QtGui import QAction
from focus_companion.app.ui.mascot import MascotWidget
from focus_companion.app.ui.components.theme import ThemeManager


class FloatingCompanionWindow(QWidget):
    open_app_requested = Signal()
    toggle_focus_requested = Signal()
    toggle_tracking_requested = Signal()
    quit_requested = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.Tool |
            Qt.WindowType.WindowStaysOnTopHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedSize(90, 90)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        self.mascot = MascotWidget(size=80)
        layout.addWidget(self.mascot, alignment=Qt.AlignmentFlag.AlignCenter)

        self._drag_pos = QPoint()

    def set_mood(self, mood: str):
        self.mascot.set_mood(mood)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self._drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag_pos)
            event.accept()

    def mouseDoubleClickEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.open_app_requested.emit()

    def contextMenuEvent(self, event):
        menu = QMenu(self)
        c = ThemeManager.get_instance().colors
        cr = ThemeManager.get_instance().corner_radius
        menu.setStyleSheet(f"""
            QMenu {{
                background-color: {c["bg_panel"]};
                color: {c["text_primary"]};
                border: 1px solid {c["border"]};
                border-radius: {cr}px;
                padding: 4px;
            }}
            QMenu::item {{
                padding: 6px 18px 6px 12px;
                border-radius: 4px;
            }}
            QMenu::item:selected {{
                background-color: {c["accent"]};
                color: #FFFFFF;
            }}
        """)

        act_open = menu.addAction("Open NEXI Dashboard")
        act_open.triggered.connect(self.open_app_requested.emit)

        act_focus = menu.addAction("Start Focus Session")
        act_focus.triggered.connect(self.toggle_focus_requested.emit)

        act_track = menu.addAction("Pause/Resume Tracking")
        act_track.triggered.connect(self.toggle_tracking_requested.emit)

        menu.addSeparator()

        act_hide = menu.addAction("Hide NEXI")
        act_hide.triggered.connect(self.hide)

        act_quit = menu.addAction("Quit NEXI")
        act_quit.triggered.connect(self.quit_requested.emit)

        menu.exec(event.globalPos())
