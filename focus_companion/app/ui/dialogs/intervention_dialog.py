"""
Distraction Intervention Dialog & Full-Screen Lockdown / Rest Screen Overlay for NEXI.
Supports:
- Standard floating modal or Full-Screen focus lockdown
- Rest & Recharge Mode (triggered by Taking a Break or clicking the Test action)
- Guided breathing animation / visual calm circle during break
- Configurable countdown timer before strict lock
- Working actions: Return to Focus, Take 5m Break, Snooze / Give me more, Important Activity Exemption, and Test Overlay
- Video pause status indicator and browser extension guidance
- ThemeManager token integration
"""

from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFrame, QWidget
)
from PySide6.QtCore import Qt, QTimer, Signal, QRectF
from PySide6.QtGui import QPainter, QColor, QBrush, QPen, QFont
from focus_companion.app.ui.mascot import MascotWidget
from focus_companion.app.ui.components.icons import draw_sidebar_icon
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class RestBreathingWidget(QWidget):
    """
    Soothing circular breathing guide for the Rest / Break overlay.
    Expands and contracts gently with a timer to guide eye & posture relaxation.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedSize(220, 220)
        self.phase: float = 0.0  # 0.0 to 1.0 (Inhale -> Hold -> Exhale)
        self.increasing: bool = True
        self.guide_text: str = "Breathe In..."
        self.theme_mgr = ThemeManager.get_instance()

        self._anim_timer = QTimer(self)
        self._anim_timer.timeout.connect(self._on_anim_step)
        self._anim_timer.start(50)

    def _on_anim_step(self):
        if self.increasing:
            self.phase += 0.015
            if self.phase >= 1.0:
                self.phase = 1.0
                self.increasing = False
                self.guide_text = "Hold & Stretch..."
            elif self.phase > 0.1:
                self.guide_text = "Breathe In..."
        else:
            self.phase -= 0.015
            if self.phase <= 0.0:
                self.phase = 0.0
                self.increasing = True
                self.guide_text = "Rest Your Eyes..."
            elif self.phase < 0.9:
                self.guide_text = "Breathe Out..."
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        c = self.theme_mgr.colors
        accent_col = QColor(c["accent"])
        success_col = QColor(c["success"])
        text_primary = QColor(c["text_primary"])
        text_sec = QColor(c["text_secondary"])

        center = self.width() / 2.0
        # Dynamic radius oscillating between 45 and 95
        r = 45.0 + (50.0 * self.phase)

        # 1. Subtle background glow halo
        halo_col = QColor(success_col)
        halo_col.setAlphaF(0.08 + 0.12 * self.phase)
        painter.setBrush(QBrush(halo_col))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(QRectF(center - r - 12, center - r - 12, (r + 12) * 2, (r + 12) * 2))

        # 2. Main breathing circle
        circle_col = QColor(success_col)
        circle_col.setAlphaF(0.25 + 0.35 * self.phase)
        painter.setBrush(QBrush(circle_col))
        pen = QPen(success_col, 2.5)
        painter.setPen(pen)
        painter.drawEllipse(QRectF(center - r, center - r, r * 2, r * 2))

        # 3. Center Guide Text
        painter.setPen(text_primary)
        painter.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        painter.drawText(QRectF(0, center - 12, self.width(), 24), Qt.AlignmentFlag.AlignCenter, self.guide_text)


class InterventionDialog(QDialog):
    action_selected = Signal(str, str)  # action_name, source

    def __init__(self, source: str = "Distraction Rule", level: str = "reminder",
                 reason: str = "Focus intervention active.",
                 is_fullscreen: bool = True, countdown_sec: int = 15,
                 pause_video: bool = False, is_rest_mode: bool = False,
                 parent=None):
        super().__init__(parent)
        self.source = source
        self.level = level
        self.reason = reason
        self.is_fullscreen = is_fullscreen
        self.remaining_countdown = countdown_sec
        self.pause_video = pause_video
        self.is_rest_mode = is_rest_mode
        self.rest_seconds_left: int = 300  # 5 minutes break
        self.theme_mgr = ThemeManager.get_instance()

        self.setWindowTitle("NEXI - Rest & Attention Check")
        self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)

        if self.is_fullscreen:
            self.setWindowState(Qt.WindowState.WindowFullScreen)
        else:
            self.setFixedSize(620, 400)

        self._apply_style()
        self._init_ui()

        # Grace countdown timer
        if not self.is_rest_mode and self.remaining_countdown > 0:
            self._timer = QTimer(self)
            self._timer.timeout.connect(self._on_countdown_tick)
            self._timer.start(1000)

    def _apply_style(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        bg = c["bg_main"] if self.is_fullscreen else c["bg_card"]
        border_col = c["success"] if self.is_rest_mode else c["warning"]

        self.setStyleSheet(f"""
            QDialog {{
                background-color: {bg};
                border: {3 if self.is_fullscreen else 2}px solid {border_col};
                border-radius: {0 if self.is_fullscreen else cr}px;
            }}
        """)

    def _init_ui(self):
        # Clear existing layout if switching to rest mode dynamically
        if self.layout():
            QWidget().setLayout(self.layout())

        main_layout = QVBoxLayout(self)
        margins = 50 if self.is_fullscreen else 24
        main_layout.setContentsMargins(margins, margins, margins, margins)
        main_layout.setSpacing(18)

        c = self.theme_mgr.colors

        # Centered container for fullscreen layout
        self.content_card = QFrame()
        card_bg = adjust_color(c["bg_panel"], 1.08 if c.get("mode") == "dark" else 0.98)
        self.content_card.setStyleSheet(f"""
            QFrame {{
                background-color: {card_bg};
                border: 1px solid {c["border"]};
                border-radius: 14px;
                padding: 16px;
            }}
        """)
        content_box = QVBoxLayout(self.content_card)
        content_box.setSpacing(16)

        if self.is_rest_mode:
            # -------------------------------------------------------------
            # REST / RECHARGE SCREEN
            # -------------------------------------------------------------
            top_box = QVBoxLayout()
            top_box.setSpacing(6)
            top_box.setAlignment(Qt.AlignmentFlag.AlignCenter)

            rest_title = QLabel("RELAX & RECHARGE")
            rest_title.setStyleSheet(f"color: {c['success']}; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; border: none; background: transparent;")
            rest_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
            top_box.addWidget(rest_title)

            rest_sub = QLabel("Look 20 feet away, stretch your posture, and take slow, deep breaths.")
            rest_sub.setStyleSheet(f"color: {c['text_secondary']}; font-size: 13px; border: none; background: transparent;")
            rest_sub.setAlignment(Qt.AlignmentFlag.AlignCenter)
            top_box.addWidget(rest_sub)

            content_box.addLayout(top_box)

            # Center Breathing Circle
            self.breathing_widget = RestBreathingWidget()
            content_box.addWidget(self.breathing_widget, 0, Qt.AlignmentFlag.AlignCenter)

            # Rest timer label
            mins = self.rest_seconds_left // 60
            secs = self.rest_seconds_left % 60
            self.rest_timer_lbl = QLabel(f"Break Remaining: {mins:02d}:{secs:02d}")
            self.rest_timer_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 18px; font-weight: 800; font-family: monospace; border: none; background: transparent;")
            self.rest_timer_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            content_box.addWidget(self.rest_timer_lbl)

            # Rest Action Buttons
            btn_row = QHBoxLayout()
            btn_row.setSpacing(12)
            btn_row.setAlignment(Qt.AlignmentFlag.AlignCenter)

            resume_btn = QPushButton("Resume Focus Now")
            resume_btn.setObjectName("primaryBtn")
            resume_btn.setMinimumWidth(160)
            resume_btn.setFixedHeight(38)
            resume_btn.clicked.connect(lambda: self._select("return"))
            btn_row.addWidget(resume_btn)

            extend_btn = QPushButton("+2 Minutes More")
            extend_btn.setFixedHeight(38)
            extend_btn.clicked.connect(self._extend_break)
            btn_row.addWidget(extend_btn)

            close_btn = QPushButton("Close Rest Screen")
            close_btn.setFixedHeight(38)
            close_btn.clicked.connect(self.accept)
            btn_row.addWidget(close_btn)

            content_box.addLayout(btn_row)

            # Start break countdown timer
            self._break_timer = QTimer(self)
            self._break_timer.timeout.connect(self._on_break_tick)
            self._break_timer.start(1000)

        else:
            # -------------------------------------------------------------
            # DISTRACTION ALERT SCREEN (WITH "TEST REST SCREEN" ACTION)
            # -------------------------------------------------------------
            top_row = QHBoxLayout()
            top_row.setSpacing(20)

            mascot_size = 90 if self.is_fullscreen else 64
            self.mascot = MascotWidget(size=mascot_size)
            self.mascot.set_mood(MascotWidget.WARNING)
            top_row.addWidget(self.mascot)

            text_layout = QVBoxLayout()
            text_layout.setSpacing(6)

            title = QLabel(f"Distraction Alert: {self.source}")
            title.setStyleSheet(f"color: {c['accent']}; font-size: {'22px' if self.is_fullscreen else '17px'}; font-weight: 800; border: none; background: transparent;")
            text_layout.addWidget(title)

            reason_lbl = QLabel(self.reason)
            reason_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 13px; line-height: 1.4; border: none; background: transparent;")
            reason_lbl.setWordWrap(True)
            text_layout.addWidget(reason_lbl)

            # Video pause status
            if self.pause_video:
                pause_lbl = QLabel("Auto-pause: Video playback pause signal broadcast to Chromium extension.")
                pause_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; font-style: italic; border: none; background: transparent;")
                text_layout.addWidget(pause_lbl)

            # Countdown label
            self.countdown_lbl = QLabel(f"Grace countdown before strict intervention: {self.remaining_countdown}s")
            self.countdown_lbl.setStyleSheet(f"color: {c['warning']}; font-weight: 700; font-size: 12px; border: none; background: transparent;")
            text_layout.addWidget(self.countdown_lbl)

            top_row.addLayout(text_layout, 1)
            content_box.addLayout(top_row)

            # Action Buttons Row
            btn_row = QHBoxLayout()
            btn_row.setSpacing(10)

            return_btn = QPushButton("Return to Focus")
            return_btn.setObjectName("primaryBtn")
            return_btn.setFixedHeight(36)
            return_btn.clicked.connect(lambda: self._select("return"))
            btn_row.addWidget(return_btn)

            break_btn = QPushButton("Take 5m Break")
            break_btn.setFixedHeight(36)
            break_btn.clicked.connect(self.show_rest_screen)
            btn_row.addWidget(break_btn)

            snooze_btn = QPushButton("Give Me More (Snooze)")
            snooze_btn.setFixedHeight(36)
            snooze_btn.clicked.connect(lambda: self._select("snooze"))
            btn_row.addWidget(snooze_btn)

            important_btn = QPushButton("It's for something important")
            important_btn.setFixedHeight(36)
            important_btn.setToolTip("Exempts reminders for the next 60 minutes while continuing activity tracking")
            important_btn.clicked.connect(lambda: self._select("important"))
            btn_row.addWidget(important_btn)

            # The Test Button requested by user to preview the Rest Screen
            test_rest_btn = QPushButton("Test Rest Screen")
            test_rest_btn.setFixedHeight(36)
            test_rest_btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {adjust_color(c['bg_panel'], 1.25 if c.get('mode') == 'dark' else 0.92)};
                    border: 1.5px solid {c['success']};
                    color: {c['success']};
                    font-weight: 700;
                    padding: 6px 12px;
                }}
                QPushButton:hover {{
                    background-color: {c['success']};
                    color: #FFFFFF;
                }}
            """)
            test_rest_btn.clicked.connect(self.show_rest_screen)
            btn_row.addWidget(test_rest_btn)

            content_box.addLayout(btn_row)

        if self.is_fullscreen:
            main_layout.addStretch(1)
            main_layout.addWidget(self.content_card, 0, Qt.AlignmentFlag.AlignCenter)
            main_layout.addStretch(1)
        else:
            main_layout.addWidget(self.content_card)

    def show_rest_screen(self):
        """Switches the fullscreen overlay into the soothing Rest / Break Screen."""
        if hasattr(self, "_timer"):
            self._timer.stop()
        self.is_rest_mode = True
        self.rest_seconds_left = 300  # 5 minutes
        self._apply_style()
        self._init_ui()

    def _extend_break(self):
        self.rest_seconds_left += 120
        mins = self.rest_seconds_left // 60
        secs = self.rest_seconds_left % 60
        self.rest_timer_lbl.setText(f"Break Remaining: {mins:02d}:{secs:02d}")

    def _on_break_tick(self):
        self.rest_seconds_left -= 1
        if self.rest_seconds_left > 0:
            mins = self.rest_seconds_left // 60
            secs = self.rest_seconds_left % 60
            self.rest_timer_lbl.setText(f"Break Remaining: {mins:02d}:{secs:02d}")
        else:
            self.rest_timer_lbl.setText("Break Completed! Ready to return to work.")
            if hasattr(self, "_break_timer"):
                self._break_timer.stop()

    def _on_countdown_tick(self):
        self.remaining_countdown -= 1
        if self.remaining_countdown > 0:
            self.countdown_lbl.setText(f"Grace countdown before strict intervention: {self.remaining_countdown}s")
        else:
            self.countdown_lbl.setText("Lockdown countdown expired. Action required.")
            if hasattr(self, "_timer"):
                self._timer.stop()

    def _select(self, action: str):
        if hasattr(self, "_timer"):
            self._timer.stop()
        if hasattr(self, "_break_timer"):
            self._break_timer.stop()
        self.action_selected.emit(action, self.source)
        self.accept()
