"""
Home / Focus Center Screen for NEXI.
Features:
- Premium Focus Center with hero timer and circular progress ring
- Clear session states: Ready, Active Focus, Break, Paused, Completed
- Action controls: Start, Pause/Resume, End Early, Break, Intent
- Intent & Profile selection with quick duration badges
- Real metrics grid with indicator dots
- Top applications and websites with clean duration tags & category chips
- Mascot integration with emotion reactions
"""

from typing import Optional, Dict, Any
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QComboBox, QScrollArea, QFrame, QSizePolicy
)
from PySide6.QtCore import Qt, Signal, QRectF, QPointF
from PySide6.QtGui import QPainter, QColor, QPen, QBrush, QFont
from focus_companion.app.database.repository import Repository
from focus_companion.app.core.focus_engine import FocusEngine
from focus_companion.app.ui.mascot import MascotWidget
from focus_companion.app.ui.components.cards import MetricCard, SectionCard
from focus_companion.app.ui.components.charts import SegmentedProgressBar
from focus_companion.app.ui.components.icons import draw_sidebar_icon
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class CircularProgressTimer(QWidget):
    """
    Sleek circular progress ring with large digital timer in the center.
    Draws background track, glowing progress arc, and state feedback.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedSize(210, 210)
        self.progress_pct: float = 0.0  # 0.0 to 1.0
        self.time_text: str = "25:00"
        self.status_text: str = "READY"
        self.is_active: bool = False
        self.is_break: bool = False
        self.theme_mgr = ThemeManager.get_instance()

    def set_state(self, time_text: str, progress_pct: float, status_text: str, is_active: bool, is_break: bool):
        self.time_text = time_text
        self.progress_pct = max(0.0, min(1.0, progress_pct))
        self.status_text = status_text
        self.is_active = is_active
        self.is_break = is_break
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        c = self.theme_mgr.colors
        accent_color = QColor(c["accent"])
        break_color = QColor(c["success"])
        track_color = QColor(adjust_color(c["bg_panel"], 1.15 if c.get("mode") == "dark" else 0.94))
        text_primary = QColor(c["text_primary"])
        text_sec = QColor(c["text_secondary"])

        center = self.width() / 2.0
        radius = 88.0
        ring_rect = QRectF(center - radius, center - radius, radius * 2, radius * 2)

        # 1. Background ring track
        track_pen = QPen(track_color, 7.0, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap)
        painter.setPen(track_pen)
        painter.drawEllipse(ring_rect)

        # 2. Progress Arc
        if self.progress_pct > 0.0:
            arc_color = break_color if self.is_break else accent_color
            arc_pen = QPen(arc_color, 7.5, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap)
            painter.setPen(arc_pen)
            # Starts at 12 o'clock (90 degrees in Qt 16ths) and proceeds clockwise (negative)
            span_angle = int(-self.progress_pct * 360 * 16)
            painter.drawArc(ring_rect, 90 * 16, span_angle)

        # 3. Center Text
        # State pill
        state_col = break_color if self.is_break else (accent_color if self.is_active else text_sec)
        painter.setPen(state_col)
        painter.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        painter.drawText(QRectF(0, center - 46, self.width(), 20), Qt.AlignmentFlag.AlignCenter, self.status_text.upper())

        # Main Time readout
        painter.setPen(text_primary)
        timer_font = QFont("Segoe UI Variable Display", 32, QFont.Weight.Bold)
        timer_font.setLetterSpacing(QFont.SpacingType.AbsoluteSpacing, 1.0)
        painter.setFont(timer_font)
        painter.drawText(QRectF(0, center - 22, self.width(), 44), Qt.AlignmentFlag.AlignCenter, self.time_text)

        # Subtle sub-label
        painter.setPen(text_sec)
        painter.setFont(QFont("Segoe UI", 8, QFont.Weight.DemiBold))
        sub_lbl = "FOCUS BLOCK" if not self.is_break else "RECHARGE"
        painter.drawText(QRectF(0, center + 26, self.width(), 16), Qt.AlignmentFlag.AlignCenter, sub_lbl)


class HomePage(QWidget):
    open_intent_dialog_requested = Signal()

    def __init__(self, repository: Repository, focus_engine: FocusEngine, parent=None):
        super().__init__(parent)
        self.repo = repository
        self.focus_engine = focus_engine
        self.theme_mgr = ThemeManager.get_instance(repository)

        self._init_ui()
        self.theme_mgr.theme_changed.connect(self._on_theme_changed)
        self._apply_theme()
        self.refresh_data()

    def _init_ui(self):
        outer_layout = QVBoxLayout(self)
        outer_layout.setContentsMargins(0, 0, 0, 0)
        outer_layout.setSpacing(0)

        # Scrollable container so dashboard scales cleanly across window sizes
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        content_widget = QWidget()
        main_layout = QVBoxLayout(content_widget)
        main_layout.setContentsMargins(26, 20, 26, 22)
        main_layout.setSpacing(18)

        # -------------------------------------------------------------
        # HERO SECTION: Circular Timer + Session Launcher Card
        # -------------------------------------------------------------
        self.hero_frame = QFrame()
        hero_layout = QHBoxLayout(self.hero_frame)
        hero_layout.setContentsMargins(24, 20, 26, 20)
        hero_layout.setSpacing(24)

        # 1. Circular Progress Timer
        self.circle_timer = CircularProgressTimer()
        hero_layout.addWidget(self.circle_timer, 0, Qt.AlignmentFlag.AlignCenter)

        # 2. Focus Controls Center
        ctrl_box = QVBoxLayout()
        ctrl_box.setSpacing(10)

        # Live Activity Status Row
        status_row = QHBoxLayout()
        status_row.setSpacing(8)

        self.live_dot = QLabel("●")
        self.live_dot.setStyleSheet("font-size: 10px; border: none; background: transparent;")
        self.current_app_indicator = QLabel("Monitoring foreground activity...")
        self.current_app_indicator.setStyleSheet("font-size: 12px; font-weight: 600; border: none; background: transparent;")

        status_row.addWidget(self.live_dot)
        status_row.addWidget(self.current_app_indicator)
        status_row.addStretch()
        ctrl_box.addLayout(status_row)

        # Profile Selector and Duration Quick Pills
        profile_row = QHBoxLayout()
        profile_row.setSpacing(10)

        prof_lbl = QLabel("Focus Mode:")
        prof_lbl.setStyleSheet("font-size: 11px; font-weight: 700; border: none; background: transparent;")
        self.profile_combo = QComboBox()
        self.profile_combo.setFixedWidth(200)
        self._load_profiles()
        self.profile_combo.currentIndexChanged.connect(self._on_profile_selected)

        profile_row.addWidget(prof_lbl)
        profile_row.addWidget(self.profile_combo)
        profile_row.addStretch()
        ctrl_box.addLayout(profile_row)

        # Main Action Buttons Row
        action_row = QHBoxLayout()
        action_row.setSpacing(10)

        self.start_btn = QPushButton("Start Focus")
        self.start_btn.setObjectName("primaryBtn")
        self.start_btn.setMinimumWidth(130)
        self.start_btn.setFixedHeight(36)
        self.start_btn.clicked.connect(self._toggle_focus)
        action_row.addWidget(self.start_btn)

        self.break_btn = QPushButton("Take Break")
        self.break_btn.setFixedHeight(36)
        self.break_btn.clicked.connect(self._take_break)
        action_row.addWidget(self.break_btn)

        self.intent_btn = QPushButton("Set Intent")
        self.intent_btn.setFixedHeight(36)
        self.intent_btn.clicked.connect(self._on_intent_btn_clicked)
        action_row.addWidget(self.intent_btn)

        # Secondary Intent controls (Pause/Resume & Cancel)
        self.intent_pause_btn = QPushButton("Pause Intent")
        self.intent_pause_btn.setFixedHeight(36)
        self.intent_pause_btn.clicked.connect(self._toggle_intent_pause)
        self.intent_pause_btn.setVisible(False)
        action_row.addWidget(self.intent_pause_btn)

        self.intent_cancel_btn = QPushButton("Cancel Intent")
        self.intent_cancel_btn.setObjectName("dangerBtn")
        self.intent_cancel_btn.setFixedHeight(36)
        self.intent_cancel_btn.clicked.connect(self._cancel_intent)
        self.intent_cancel_btn.setVisible(False)
        action_row.addWidget(self.intent_cancel_btn)

        action_row.addStretch()
        ctrl_box.addLayout(action_row)

        # Intention display
        self.intent_display = QLabel("Current Intention: None set. Click 'Set Intent' to lock in your goal.")
        self.intent_display.setStyleSheet("font-size: 11px; font-style: italic; border: none; background: transparent;")
        ctrl_box.addWidget(self.intent_display)

        hero_layout.addLayout(ctrl_box, 1)

        # Mascot preview in top hero
        self.mascot = MascotWidget(size=90)
        hero_layout.addWidget(self.mascot, 0, Qt.AlignmentFlag.AlignCenter)

        main_layout.addWidget(self.hero_frame)

        # -------------------------------------------------------------
        # ROW 2: 4 Polished Stat Cards
        # -------------------------------------------------------------
        metrics_row = QHBoxLayout()
        metrics_row.setSpacing(14)

        self.card_total = MetricCard("Screen Time", "0m", "Active user usage")
        self.card_prod = MetricCard("Productive Time", "0m", "0% of screen time")
        self.card_dist = MetricCard("Distractions", "0m", "0 interventions")
        self.card_goal = MetricCard("Daily Goal", "0 / 120m", "0% achieved")

        metrics_row.addWidget(self.card_total)
        metrics_row.addWidget(self.card_prod)
        metrics_row.addWidget(self.card_dist)
        metrics_row.addWidget(self.card_goal)
        main_layout.addLayout(metrics_row)

        # -------------------------------------------------------------
        # ROW 3: Most Used Applications & Top Websites Split Card
        # -------------------------------------------------------------
        split_row = QHBoxLayout()
        split_row.setSpacing(14)

        self.apps_card = SectionCard("Most Used Applications", "Real foreground activity recorded on this PC")
        self.apps_list_layout = QVBoxLayout()
        self.apps_list_layout.setSpacing(8)
        self.apps_card.add_layout(self.apps_list_layout)
        split_row.addWidget(self.apps_card, 1)

        self.sites_card = SectionCard("Top Websites & Domains", "Tracked via browser integration (Chrome, Edge, Brave)")
        self.sites_list_layout = QVBoxLayout()
        self.sites_list_layout.setSpacing(8)
        self.sites_card.add_layout(self.sites_list_layout)
        split_row.addWidget(self.sites_card, 1)

        main_layout.addLayout(split_row, 1)

        scroll.setWidget(content_widget)
        outer_layout.addWidget(scroll)

    def _apply_theme(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius

        self.hero_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {c["bg_card"]};
                border: 1px solid {c["border"]};
                border-radius: {cr}px;
            }}
        """)
        self.live_dot.setStyleSheet(f"color: {c['accent']}; font-size: 10px; border: none; background: transparent;")
        self.current_app_indicator.setStyleSheet(f"color: {c['text_primary']}; font-size: 12px; font-weight: 600; border: none; background: transparent;")
        self.intent_display.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; font-style: italic; border: none; background: transparent;")

        # Update button icons
        c_acc = c["accent"]
        c_txt = c["text_primary"]
        if not self.focus_engine.is_active:
            self.start_btn.setIcon(draw_sidebar_icon("play", "#FFFFFF", 16))
        else:
            self.start_btn.setIcon(draw_sidebar_icon("stop", "#FFFFFF", 16))
        self.break_btn.setIcon(draw_sidebar_icon("coffee", c_txt, 16))
        self.intent_btn.setIcon(draw_sidebar_icon("focus", c_acc, 16))

        self.intent_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {adjust_color(c['bg_panel'], 1.2 if c.get('mode') == 'dark' else 0.95)};
                border: 1px solid {c['accent']};
                color: {c['accent']};
                font-weight: 700;
                border-radius: {max(4, cr - 2)}px;
                padding: 6px 14px;
            }}
            QPushButton:hover {{
                background-color: {c['accent']};
                color: #FFFFFF;
            }}
        """)

        # Mascot visibility
        self.mascot.setVisible(self.theme_mgr.mascot_visible)

        # Update card accent colors
        self.card_prod.accent_override = c["accent"]
        self.card_dist.accent_override = c["warning"]
        self.card_goal.accent_override = c["success"]
        self.card_prod._apply_style()
        self.card_dist._apply_style()
        self.card_goal._apply_style()

        # Update circle timer
        self.circle_timer.update()

    def _on_theme_changed(self, _):
        self._apply_theme()
        self.refresh_data()

    def _load_profiles(self):
        self.profile_combo.blockSignals(True)
        self.profile_combo.clear()
        profiles = self.repo.get_profiles()
        for p in profiles:
            self.profile_combo.addItem(f"{p['name']} ({p['default_duration_min']}m)", p['name'])
        self.profile_combo.blockSignals(False)

    def _on_profile_selected(self, index: int):
        if not self.focus_engine.is_active:
            profile_name = self.profile_combo.currentData() or "Deep Work"
            profile = self.repo.get_profile_by_name(profile_name)
            dur = profile.get("default_duration_min", 25) if profile else 25
            self.circle_timer.set_state(f"{dur:02d}:00", 0.0, "READY", False, False)

    def _toggle_focus(self):
        if not self.focus_engine.is_active:
            profile_name = self.profile_combo.currentData() or "Deep Work"
            profile = self.repo.get_profile_by_name(profile_name)
            dur = profile.get("default_duration_min", 25) if profile else 25
            self.focus_engine.start_session(profile_name=profile_name, duration_min=dur)
            self.start_btn.setText("End Early")
            self.start_btn.setObjectName("dangerBtn")
            self.start_btn.setStyle(self.start_btn.style())
            self.start_btn.setIcon(draw_sidebar_icon("stop", "#FFFFFF", 16))
            self.circle_timer.set_state(f"{dur:02d}:00", 0.0, profile_name.upper(), True, False)
            self.mascot.set_mood(MascotWidget.FOCUSED)
        else:
            self.focus_engine.end_session_early()
            self.start_btn.setText("Start Focus")
            self.start_btn.setObjectName("primaryBtn")
            self.start_btn.setStyle(self.start_btn.style())
            self.start_btn.setIcon(draw_sidebar_icon("play", "#FFFFFF", 16))
            self.circle_timer.set_state("25:00", 0.0, "SESSION ENDED", False, False)
            self.mascot.set_mood(MascotWidget.IDLE)

    def _take_break(self):
        if self.focus_engine.is_active:
            self.focus_engine.start_break(5)
            self.circle_timer.set_state("05:00", 1.0, "BREAK ACTIVE", True, True)
            self.mascot.set_mood(MascotWidget.HAPPY)

    def update_live_status(self, app_name: str, domain: str, classification: int, is_idle: bool):
        c = self.theme_mgr.colors
        if is_idle:
            self.current_app_indicator.setText("Computer Idle (Input paused)")
            self.live_dot.setStyleSheet(f"color: {c['text_secondary']};")
            if not self.focus_engine.is_active:
                self.mascot.set_mood(MascotWidget.SLEEPING)
        else:
            display_name = domain if domain else app_name
            color = c["accent"] if classification == 1 else (c["warning"] if classification == -1 else c["text_secondary"])
            self.current_app_indicator.setText(f"Active foreground: {display_name}")
            self.live_dot.setStyleSheet(f"color: {color};")
            if not self.focus_engine.is_active:
                if classification == -1:
                    self.mascot.set_mood(MascotWidget.CONFUSED)
                elif classification == 1:
                    self.mascot.set_mood(MascotWidget.MONITORING)
                else:
                    self.mascot.set_mood(MascotWidget.IDLE)

    def _on_intent_btn_clicked(self):
        if self.focus_engine.intent_active:
            # Complete early / end active intent
            self.focus_engine.cancel_intent_session()
            self.refresh_data()
        else:
            self.open_intent_dialog_requested.emit()

    def _toggle_intent_pause(self):
        if self.focus_engine.intent_active:
            if self.focus_engine.intent_paused:
                self.focus_engine.resume_intent_session()
            else:
                self.focus_engine.pause_intent_session()

    def _cancel_intent(self):
        if self.focus_engine.intent_active:
            self.focus_engine.cancel_intent_session()
            self.refresh_data()

    def update_intent_timer_display(self, remaining_sec: int, elapsed_sec: int, note: str):
        mins = remaining_sec // 60
        secs = remaining_sec % 60
        time_str = f"{mins:02d}:{secs:02d}"

        total_sec = remaining_sec + elapsed_sec
        progress = (elapsed_sec / total_sec) if total_sec > 0 else 0.0

        # If regular focus sprint isn't overriding the circle timer, reflect intent countdown in hero
        if not self.focus_engine.is_active:
            status_text = "PAUSED" if self.focus_engine.intent_paused else "INTENT ACTIVE"
            self.circle_timer.set_state(time_str, progress, status_text, True, False)

        c = self.theme_mgr.colors
        self.intent_display.setText(f"Active Intention: \"{note}\"  •  {time_str} remaining")
        self.intent_display.setStyleSheet(f"color: {c['accent']}; font-size: 11px; font-weight: 700; border: none; background: transparent;")

    def on_intent_state_changed(self, state: str, intent_data: Optional[dict]):
        self._update_intent_ui_state(state, intent_data)

    def _update_intent_ui_state(self, state: str, intent_data: Optional[dict] = None):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius

        if state == "active":
            note = intent_data.get("note", "Task") if intent_data else "Task"
            rem = intent_data.get("remaining_sec", 0) if intent_data else 0
            m, s = rem // 60, rem % 60
            self.intent_btn.setText("End Intent")
            self.intent_btn.setObjectName("dangerBtn")
            self.intent_btn.setStyle(self.intent_btn.style())
            self.intent_btn.setIcon(draw_sidebar_icon("stop", "#FFFFFF", 16))

            self.intent_pause_btn.setVisible(True)
            self.intent_pause_btn.setText("Pause")
            self.intent_pause_btn.setIcon(draw_sidebar_icon("pause", c["text_primary"], 14))

            self.intent_cancel_btn.setVisible(True)
            self.intent_cancel_btn.setText("Cancel")

            self.intent_display.setText(f"Active Intention: \"{note}\"  •  {m:02d}:{s:02d} remaining")
            self.intent_display.setStyleSheet(f"color: {c['accent']}; font-size: 11px; font-weight: 700; border: none; background: transparent;")
            self.mascot.set_mood(MascotWidget.FOCUSED)

        elif state == "paused":
            note = intent_data.get("note", "Task") if intent_data else "Task"
            self.intent_pause_btn.setVisible(True)
            self.intent_pause_btn.setText("Resume")
            self.intent_pause_btn.setIcon(draw_sidebar_icon("play", c["text_primary"], 14))
            self.intent_cancel_btn.setVisible(True)

            self.intent_display.setText(f"Intention Paused: \"{note}\" (Timer paused)")
            self.intent_display.setStyleSheet(f"color: {c['warning']}; font-size: 11px; font-weight: 700; border: none; background: transparent;")
            self.mascot.set_mood(MascotWidget.IDLE)

        else:  # idle or completed
            self.intent_btn.setText("Set Intent")
            self.intent_btn.setObjectName("")
            self.intent_btn.setIcon(draw_sidebar_icon("focus", c["accent"], 16))
            self.intent_btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {adjust_color(c['bg_panel'], 1.2 if c.get('mode') == 'dark' else 0.95)};
                    border: 1px solid {c['accent']};
                    color: {c['accent']};
                    font-weight: 700;
                    border-radius: {max(4, cr - 2)}px;
                    padding: 6px 14px;
                }}
                QPushButton:hover {{
                    background-color: {c['accent']};
                    color: #FFFFFF;
                }}
            """)
            self.intent_pause_btn.setVisible(False)
            self.intent_cancel_btn.setVisible(False)

            if state == "completed":
                note = intent_data.get("note", "Task") if intent_data else "Task"
                self.intent_display.setText(f"Completed Intention: \"{note}\" [Done]")
                self.intent_display.setStyleSheet(f"color: {c['success']}; font-size: 11px; font-weight: 700; border: none; background: transparent;")
                self.mascot.set_mood(MascotWidget.CELEBRATING)
            else:
                self.intent_display.setText("No active intention locked in. Click 'Set Intent' to stay accountable.")
                self.intent_display.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; font-style: italic; border: none; background: transparent;")

    def update_timer_display(self, remaining_sec: int, elapsed_sec: int, on_break: bool):
        mins = remaining_sec // 60
        secs = remaining_sec % 60
        time_str = f"{mins:02d}:{secs:02d}"

        total_sec = remaining_sec + elapsed_sec
        progress = (elapsed_sec / total_sec) if total_sec > 0 else 0.0

        if on_break:
            self.circle_timer.set_state(time_str, progress, "RELAX / BREAK", True, True)
            self.mascot.set_mood(MascotWidget.HAPPY)
        else:
            p_name = self.focus_engine.profile_name.upper() if self.focus_engine.profile_name else "FOCUS"
            self.circle_timer.set_state(time_str, progress, p_name, True, False)

    def refresh_data(self):
        """Refreshes summary metrics and top lists from real database entries."""
        summary = self.repo.get_today_summary()
        active_sec = summary["active_sec"]
        prod_sec = summary["productive_sec"]
        dist_sec = summary["distracting_sec"]
        focus_sec = summary["focus_sec"]

        # 1. Screen Time
        active_min = active_sec // 60
        self.card_total.set_value(f"{active_min}m", f"Idle time: {summary['idle_sec'] // 60}m")

        # 2. Productive
        prod_min = prod_sec // 60
        pct_prod = int((prod_sec / active_sec * 100)) if active_sec > 0 else 0
        self.card_prod.set_value(f"{prod_min}m", f"{pct_prod}% productive ratio")

        # 3. Distractions
        dist_min = dist_sec // 60
        interventions_count = self.repo.get_today_interventions_count()
        self.card_dist.set_value(f"{dist_min}m", f"{interventions_count} interventions triggered")

        # 4. Daily Goal
        goal_min = int(self.repo.get_setting("daily_focus_goal_min", "120"))
        focus_min = focus_sec // 60
        goal_pct = min(100, int((focus_min / max(goal_min, 1)) * 100))
        self.card_goal.set_value(f"{focus_min} / {goal_min}m", f"{goal_pct}% of daily target")

        # Active intent state sync
        if self.focus_engine.intent_active:
            intent_data = self.focus_engine.get_active_intent_data()
            state = "paused" if self.focus_engine.intent_paused else "active"
            self._update_intent_ui_state(state, intent_data)
        else:
            active_intent = self.repo.get_active_intent()
            if active_intent:
                # Engine might need to restore
                self.focus_engine._restore_active_intent()
                if self.focus_engine.intent_active:
                    intent_data = self.focus_engine.get_active_intent_data()
                    state = "paused" if self.focus_engine.intent_paused else "active"
                    self._update_intent_ui_state(state, intent_data)
                else:
                    self._update_intent_ui_state("idle", None)
            else:
                self._update_intent_ui_state("idle", None)

        if goal_pct >= 100 and not self.focus_engine.is_active:
            self.mascot.set_mood(MascotWidget.CELEBRATING)

        # 5. Top Apps
        self._clear_layout(self.apps_list_layout)
        try:
            top_apps = self.repo.get_top_apps(limit=5)
            # Calculate max/total duration for proportional bars
            max_app_sec = max([a.get("total_sec", 0) for a in top_apps], default=0)
            base_total_sec = active_sec if active_sec > 0 else max_app_sec

            if not top_apps:
                empty_lbl = QLabel("No application activity recorded yet today.")
                empty_lbl.setStyleSheet(f"color: {self.theme_mgr.colors['text_secondary']}; font-style: italic; border: none; background: transparent; padding: 14px 6px;")
                empty_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
                self.apps_list_layout.addWidget(empty_lbl)
            else:
                for app in top_apps:
                    sec = app.get("total_sec", 0)
                    pct = (sec / base_total_sec * 100.0) if base_total_sec > 0 else 0.0
                    row = self._create_usage_item(
                        name=app.get("app_name", "Unknown"),
                        category=app.get("category_name", "General"),
                        total_sec=sec,
                        classification=app.get("classification", 0),
                        percent=pct,
                        item_type="app"
                    )
                    self.apps_list_layout.addWidget(row)
        except Exception as e:
            err_lbl = QLabel(f"Unable to load application activity: {e}")
            err_lbl.setStyleSheet(f"color: {self.theme_mgr.colors['warning']}; font-size: 11px; padding: 10px 0;")
            self.apps_list_layout.addWidget(err_lbl)

        # 6. Top Domains
        self._clear_layout(self.sites_list_layout)
        try:
            top_domains = self.repo.get_top_domains(limit=5)
            max_dom_sec = max([d.get("total_sec", 0) for d in top_domains], default=0)
            base_dom_total = active_sec if active_sec > 0 else max_dom_sec

            if not top_domains:
                empty_lbl = QLabel("No website activity recorded yet today.")
                empty_lbl.setStyleSheet(f"color: {self.theme_mgr.colors['text_secondary']}; font-style: italic; border: none; background: transparent; padding: 14px 6px;")
                empty_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
                self.sites_list_layout.addWidget(empty_lbl)
            else:
                for d in top_domains:
                    sec = d.get("total_sec", 0)
                    pct = (sec / base_dom_total * 100.0) if base_dom_total > 0 else 0.0
                    row = self._create_usage_item(
                        name=d.get("domain", "Unknown"),
                        category=d.get("category_name", "General"),
                        total_sec=sec,
                        classification=d.get("classification", 0),
                        percent=pct,
                        item_type="site"
                    )
                    self.sites_list_layout.addWidget(row)
        except Exception as e:
            err_lbl = QLabel(f"Unable to load website activity: {e}")
            err_lbl.setStyleSheet(f"color: {self.theme_mgr.colors['warning']}; font-size: 11px; padding: 10px 0;")
            self.sites_list_layout.addWidget(err_lbl)

    def _create_usage_item(
        self,
        name: str,
        category: str,
        total_sec: int,
        classification: int,
        percent: float = 0.0,
        item_type: str = "app"
    ) -> QWidget:
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        item = QFrame()
        item.setFixedHeight(48)
        item_bg = adjust_color(c["bg_panel"], 1.08 if c.get("mode") == "dark" else 0.96)
        hover_bg = adjust_color(c["bg_panel"], 1.15 if c.get("mode") == "dark" else 0.92)
        border_col = c["border"]

        item.setStyleSheet(f"""
            QFrame {{
                background-color: {item_bg};
                border: 1px solid {border_col};
                border-radius: {max(4, cr - 2)}px;
            }}
            QFrame:hover {{
                background-color: {hover_bg};
                border-color: {adjust_color(border_col, 1.4 if c.get("mode") == "dark" else 0.85)};
            }}
        """)
        layout = QHBoxLayout(item)
        layout.setContentsMargins(10, 5, 12, 5)
        layout.setSpacing(10)

        # 1. Avatar Badge / Initial Fallback
        initial = (name[0] if name else "?").upper()
        if classification == 1:
            badge_bg = adjust_color(c["accent"], 0.25 if c.get("mode") == "dark" else 1.6)
            badge_fg = c["accent"]
            status_col = c["accent"]
        elif classification == -1:
            badge_bg = adjust_color(c["warning"], 0.25 if c.get("mode") == "dark" else 1.6)
            badge_fg = c["warning"]
            status_col = c["warning"]
        else:
            badge_bg = adjust_color(c["bg_panel"], 1.3 if c.get("mode") == "dark" else 0.88)
            badge_fg = c["text_primary"]
            status_col = c["text_secondary"]

        avatar_lbl = QLabel(initial)
        avatar_lbl.setFixedSize(30, 30)
        avatar_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        avatar_lbl.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        avatar_lbl.setStyleSheet(f"""
            QLabel {{
                background-color: {badge_bg};
                color: {badge_fg};
                border-radius: 6px;
                border: 1px solid {border_col};
            }}
        """)
        layout.addWidget(avatar_lbl)

        # 2. Name & Category Text
        info_layout = QVBoxLayout()
        info_layout.setSpacing(1)
        info_layout.setContentsMargins(0, 2, 0, 2)

        name_lbl = QLabel(name)
        name_lbl.setFont(QFont("Segoe UI", 9, QFont.Weight.DemiBold))
        name_lbl.setStyleSheet(f"color: {c['text_primary']}; border: none; background: transparent;")
        info_layout.addWidget(name_lbl)

        cat_lbl = QLabel((category.upper() if category else "OTHER"))
        cat_lbl.setFont(QFont("Segoe UI", 8))
        cat_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-weight: 600; letter-spacing: 0.5px; border: none; background: transparent;")
        info_layout.addWidget(cat_lbl)
        layout.addLayout(info_layout, 2)

        # 3. Proportional Horizontal Segmented Bar
        seg_bar = SegmentedProgressBar(percent=percent, classification=classification, num_blocks=10)
        seg_bar.setMinimumWidth(80)
        seg_bar.setMaximumWidth(140)
        layout.addWidget(seg_bar, 2)

        # 4. Formatted Active Duration
        mins = total_sec // 60
        secs = total_sec % 60
        if mins >= 60:
            time_str = f"{mins // 60}h {mins % 60}m"
        elif mins > 0:
            time_str = f"{mins}m {secs}s"
        else:
            time_str = f"{secs}s"

        time_lbl = QLabel(time_str)
        time_lbl.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        time_lbl.setStyleSheet(f"color: {status_col}; border: none; background: transparent;")
        time_lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        time_lbl.setFixedWidth(54)
        layout.addWidget(time_lbl)

        # 5. Percentage readout
        pct_lbl = QLabel(f"{percent:.0f}%")
        pct_lbl.setFont(QFont("Segoe UI", 8, QFont.Weight.Medium))
        pct_lbl.setStyleSheet(f"color: {c['text_secondary']}; border: none; background: transparent;")
        pct_lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        pct_lbl.setFixedWidth(32)
        layout.addWidget(pct_lbl)

        return item

    def _clear_layout(self, layout):
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.hide()
                widget.setParent(None)
                widget.deleteLater()
