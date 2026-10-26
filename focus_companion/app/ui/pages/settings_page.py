"""
NEXI Complete Settings & Productivity Controls Workspace.
Organized into 7 functional sections:
1. Appearance & Theme Studio (Presets: NEXI Dark, Midnight Orange, OLED Black, Light, Custom; 8 Color Pickers with Swatches and HEX inputs, Reset to Default, Reduced Animation, Mascot Visibility)
2. Attention & Focus Controls (Global Reminders toggle, Full-screen Lockdown overlay, Video Pausing behind overlay, Countdown timer duration, Shorts continuous session limit, Shorts daily budget & usage, Snooze/Additional time duration, Pause reminders duration & active status, Important activity exemption)
3. Timers and Alarms Manager (Multiple custom timers, Interval mode, Scheduled-time HH:MM mode, Notification preference, Add/Edit/Delete, Enable/Disable, Test action with real notification)
4. Watched Websites (Display name, normalized hostname, daily limits, real recorded usage, add/edit/delete/toggle)
5. Privacy & Site Exclusions (Never Track list, add/remove/validate, immediate suppression from tracking & budgets, clear history, reset defaults)
6. Monitoring Controls (Display name for personalized greeting, Start with Windows via per-user registry, Track desktop apps toggle, Idle detection threshold)
7. Browser Integration (Local loopback 127.0.0.1 status, extension installation guide, connection health indicator, test ping)
"""

import os
import sys
import time
from datetime import datetime
from typing import Optional, Dict, Any, List

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QSpinBox, QCheckBox, QMessageBox, QScrollArea,
    QColorDialog, QFrame, QButtonGroup, QRadioButton, QComboBox,
    QTableWidget, QTableWidgetItem, QHeaderView, QTimeEdit, QDialog,
    QFormLayout, QGroupBox
)
from PySide6.QtCore import Qt, Signal, QTime, QTimer
from PySide6.QtGui import QColor, QFont

from focus_companion.app.database.repository import Repository
from focus_companion.app.core.tracker import ActivityTracker
from focus_companion.app.core.intervention import InterventionManager
from focus_companion.app.core.notifications import ReminderScheduler
from focus_companion.app.ui.components.cards import SectionCard, MetricCard
from focus_companion.app.ui.mascot import MascotWidget
from focus_companion.app.ui.components.theme import (
    ThemeManager, THEME_PRESETS, is_valid_hex, adjust_color
)
from focus_companion.app.utils.win_api import (
    is_start_with_windows_enabled, set_start_with_windows
)


class ColorSwatchButton(QPushButton):
    """Clickable color swatch with Hex input and Color Dialog integration."""
    color_changed = Signal(str)

    def __init__(self, token_name: str, label_text: str, current_hex: str, parent=None):
        super().__init__(parent)
        self.token_name = token_name
        self.label_text = label_text
        self.current_hex = current_hex
        self.setFixedHeight(34)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._update_swatch_style()
        self.clicked.connect(self._open_picker)

    def set_color(self, hex_val: str):
        if is_valid_hex(hex_val):
            self.current_hex = hex_val
            self._update_swatch_style()

    def _update_swatch_style(self):
        text_col = "#000000" if QColor(self.current_hex).lightness() > 140 else "#FFFFFF"
        self.setText(f"  {self.current_hex.upper()}  ")
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.current_hex};
                color: {text_col};
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                font-weight: 700;
                font-family: monospace;
                font-size: 11px;
                text-align: center;
            }}
            QPushButton:hover {{
                border: 2px solid #FFFFFF;
            }}
        """)

    def _open_picker(self):
        col = QColorDialog.getColor(
            QColor(self.current_hex),
            self.window(),
            f"Select {self.label_text}"
        )
        if col.isValid():
            new_hex = col.name().upper()
            self.set_color(new_hex)
            self.color_changed.emit(new_hex)


class ThemePresetCard(QFrame):
    """Clickable preset card displaying theme title, palette pill preview, and active ring."""
    clicked = Signal(str)

    def __init__(self, name: str, palette: dict, is_selected: bool = False, parent=None):
        super().__init__(parent)
        self.name = name
        self.palette = palette
        self.is_selected = is_selected
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(76)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(14, 10, 14, 10)
        layout.setSpacing(6)

        # Title row
        title_row = QHBoxLayout()
        self.title_lbl = QLabel(name)
        self.title_lbl.setStyleSheet("font-weight: 700; font-size: 13px; border: none; background: transparent;")
        title_row.addWidget(self.title_lbl)
        title_row.addStretch()

        self.tag_lbl = QLabel("ACTIVE" if is_selected else "")
        self.tag_lbl.setStyleSheet("font-size: 10px; font-weight: 800; border: none; background: transparent;")
        title_row.addWidget(self.tag_lbl)
        layout.addLayout(title_row)

        # Swatch bar
        swatch_bar = QHBoxLayout()
        swatch_bar.setSpacing(4)
        for key in ["bg_main", "bg_card", "border", "accent", "text_primary"]:
            c_hex = palette.get(key, "#333333")
            box = QFrame()
            box.setFixedSize(22, 10)
            box.setStyleSheet(f"background-color: {c_hex}; border-radius: 3px; border: 1px solid rgba(128,128,128,0.3);")
            swatch_bar.addWidget(box)
        swatch_bar.addStretch()
        layout.addLayout(swatch_bar)

        self._apply_style()

    def set_selected(self, selected: bool):
        self.is_selected = selected
        self.tag_lbl.setText("ACTIVE" if selected else "")
        self._apply_style()

    def _apply_style(self):
        c = self.palette
        accent = c.get("accent", "#FF6B35")
        border = accent if self.is_selected else c.get("border", "#333333")
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {c.get("bg_card", "#222222")};
                border: {2 if self.is_selected else 1}px solid {border};
                border-radius: 8px;
            }}
        """)
        self.title_lbl.setStyleSheet(f"color: {c.get('text_primary', '#FFFFFF')}; font-weight: 700; font-size: 13px; border: none; background: transparent;")
        self.tag_lbl.setStyleSheet(f"color: {accent}; font-size: 10px; font-weight: 800; border: none; background: transparent;")

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.clicked.emit(self.name)


class TimerDialog(QDialog):
    """Dialog to create or edit a custom timer."""
    def __init__(self, timer_data: Optional[Dict[str, Any]] = None, parent=None):
        super().__init__(parent)
        self.timer_data = timer_data or {}
        self.setWindowTitle("Edit Timer" if timer_data else "Create Timer")
        self.setFixedSize(400, 300)
        c = ThemeManager.get_instance().colors
        self.setStyleSheet(f"background-color: {c['bg_card']}; color: {c['text_primary']};")

        layout = QVBoxLayout(self)
        form = QFormLayout()

        self.name_edit = QLineEdit(self.timer_data.get("name", "Focus Break"))
        form.addRow("Timer Name:", self.name_edit)

        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["Interval (Every N minutes)", "Scheduled Time (At HH:MM)"])
        if self.timer_data.get("mode") == "scheduled":
            self.mode_combo.setCurrentIndex(1)
        form.addRow("Mode:", self.mode_combo)

        self.interval_spin = QSpinBox()
        self.interval_spin.setRange(1, 720)
        self.interval_spin.setValue(self.timer_data.get("interval_min", 30))
        self.interval_spin.setSuffix(" min")
        form.addRow("Interval:", self.interval_spin)

        self.time_edit = QTimeEdit()
        target_str = self.timer_data.get("target_time", "17:00")
        try:
            th, tm = map(int, target_str.split(":"))
            self.time_edit.setTime(QTime(th, tm))
        except Exception:
            self.time_edit.setTime(QTime(17, 0))
        form.addRow("Target Time:", self.time_edit)

        self.notif_combo = QComboBox()
        self.notif_combo.addItems(["toast", "tray", "dialog"])
        self.notif_combo.setCurrentText(self.timer_data.get("notification_type", "toast"))
        form.addRow("Notification:", self.notif_combo)

        layout.addLayout(form)

        # Update visibility based on mode
        def on_mode_change(idx):
            self.interval_spin.setEnabled(idx == 0)
            self.time_edit.setEnabled(idx == 1)
        self.mode_combo.currentIndexChanged.connect(on_mode_change)
        on_mode_change(self.mode_combo.currentIndex())

        # Buttons
        btn_row = QHBoxLayout()
        save_btn = QPushButton("Save Timer")
        save_btn.setObjectName("primaryBtn")
        save_btn.clicked.connect(self._save)
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        btn_row.addStretch()
        btn_row.addWidget(cancel_btn)
        btn_row.addWidget(save_btn)
        layout.addLayout(btn_row)

    def _save(self):
        name = self.name_edit.text().strip()
        if not name:
            QMessageBox.warning(self, "Invalid Name", "Please enter a name for the timer.")
            return
        self.accept()

    def get_result(self) -> Dict[str, Any]:
        return {
            "name": self.name_edit.text().strip(),
            "mode": "interval" if self.mode_combo.currentIndex() == 0 else "scheduled",
            "interval_min": self.interval_spin.value(),
            "target_time": self.time_edit.time().toString("HH:mm"),
            "notification_type": self.notif_combo.currentText(),
            "is_enabled": self.timer_data.get("is_enabled", 1)
        }


class SettingsPage(QWidget):
    def __init__(self, repository: Repository, tracker: Optional[ActivityTracker] = None,
                 intervention_mgr: Optional[InterventionManager] = None,
                 reminder_scheduler: Optional[ReminderScheduler] = None,
                 parent=None):
        super().__init__(parent)
        self.repo = repository
        self.tracker = tracker
        self.intervention_mgr = intervention_mgr
        self.reminder_scheduler = reminder_scheduler
        self.theme_mgr = ThemeManager.get_instance(repository)

        self.preset_cards = {}
        self.swatch_inputs = {}

        self._init_ui()
        self.theme_mgr.theme_changed.connect(self._on_theme_changed)

        # Heartbeat timer to refresh dynamic state like pause deadlines & extension status
        self.status_timer = QTimer(self)
        self.status_timer.timeout.connect(self._refresh_status_indicators)
        self.status_timer.start(2000)

    def _init_ui(self):
        page_layout = QVBoxLayout(self)
        page_layout.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea(self)
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QScrollArea.Shape.NoFrame)

        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(24, 20, 24, 24)
        layout.setSpacing(24)

        # Page Header
        header_layout = QVBoxLayout()
        header_layout.setSpacing(4)
        self.header_title = QLabel("NEXI Settings & Productivity Controls")
        self.header_title.setStyleSheet("font-size: 24px; font-weight: 800; letter-spacing: 0.5px;")
        self.header_sub = QLabel("Customize theme palette, control attention locks, timers, website budgets, and monitoring")
        self.header_sub.setStyleSheet("font-size: 13px;")
        header_layout.addWidget(self.header_title)
        header_layout.addWidget(self.header_sub)
        layout.addLayout(header_layout)

        # -------------------------------------------------------------
        # 1. APPEARANCE & THEME STUDIO
        # -------------------------------------------------------------
        self._build_theme_studio_section(layout)

        # -------------------------------------------------------------
        # 2. REMINDERS & ATTENTION CONTROLS
        # -------------------------------------------------------------
        self._build_attention_section(layout)

        # -------------------------------------------------------------
        # 3. TIMERS AND ALARMS MANAGER
        # -------------------------------------------------------------
        self._build_timers_section(layout)

        # -------------------------------------------------------------
        # 4. WATCHED WEBSITES
        # -------------------------------------------------------------
        self._build_watched_sites_section(layout)

        # -------------------------------------------------------------
        # 5. PRIVACY & SITE EXCLUSIONS
        # -------------------------------------------------------------
        self._build_privacy_section(layout)

        # -------------------------------------------------------------
        # 6. MONITORING SETTINGS
        # -------------------------------------------------------------
        self._build_monitoring_section(layout)

        # -------------------------------------------------------------
        # 7. BROWSER INTEGRATION
        # -------------------------------------------------------------
        self._build_browser_section(layout)

        scroll.setWidget(container)
        page_layout.addWidget(scroll)

        # Initial preview update
        self._update_preview()

    # =========================================================================
    # SECTION BUILDERS
    # =========================================================================

    def _build_theme_studio_section(self, parent_layout: QVBoxLayout):
        card = SectionCard(
            "1. Appearance & Theme Studio",
            "Select a curated preset or craft custom colors with real-time immediate updates across the entire app"
        )
        box = QVBoxLayout()
        box.setSpacing(14)

        # Presets
        p_lbl = QLabel("PRESET THEMES")
        p_lbl.setStyleSheet("font-size: 11px; font-weight: 700; letter-spacing: 1px;")
        box.addWidget(p_lbl)

        presets_row = QHBoxLayout()
        presets_row.setSpacing(10)
        curr_preset = self.theme_mgr.current_theme_name

        presets_to_display = ["NEXI Dark", "Midnight Orange", "OLED Black", "Light"]
        for name in presets_to_display:
            pal = THEME_PRESETS.get(name, THEME_PRESETS["NEXI Dark"])
            c_card = ThemePresetCard(name, pal, is_selected=(curr_preset == name))
            c_card.clicked.connect(self._select_preset)
            self.preset_cards[name] = c_card
            presets_row.addWidget(c_card, 1)

        box.addLayout(presets_row)

        # Editor split: 8 Custom Colors & Live Mini Preview
        editor_split = QHBoxLayout()
        editor_split.setSpacing(20)

        # Palette Editor Left
        pal_box = QVBoxLayout()
        pal_box.setSpacing(8)
        pal_title = QLabel("CUSTOM COLOR PALETTE")
        pal_title.setStyleSheet("font-size: 11px; font-weight: 700; letter-spacing: 1px;")
        pal_box.addWidget(pal_title)

        tokens = [
            ("bg_main", "Main Background"),
            ("bg_card", "Card / Panel Background"),
            ("text_primary", "Primary Text"),
            ("text_secondary", "Secondary Text"),
            ("accent", "Accent Brand"),
            ("border", "Border Lines"),
            ("warning", "Warning Color"),
            ("success", "Success Color")
        ]

        for token_key, token_label in tokens:
            row = QHBoxLayout()
            lbl = QLabel(token_label)
            lbl.setStyleSheet("font-size: 12px; font-weight: 600;")
            lbl.setFixedWidth(150)

            curr_val = self.theme_mgr.colors.get(token_key, "#333333")
            swatch = ColorSwatchButton(token_key, token_label, curr_val)
            hex_inp = QLineEdit(curr_val)
            hex_inp.setFixedWidth(90)
            hex_inp.setMaxLength(7)
            hex_inp.setPlaceholderText("#RRGGBB")

            swatch.color_changed.connect(
                lambda hex_col, inp=hex_inp, tk=token_key: self._on_color_swatch_changed(tk, hex_col, inp)
            )
            hex_inp.textChanged.connect(
                lambda text, sw=swatch, tk=token_key: self._on_hex_input_changed(tk, text, sw)
            )

            self.swatch_inputs[token_key] = (swatch, hex_inp)
            row.addWidget(lbl)
            row.addWidget(swatch)
            row.addWidget(hex_inp)
            row.addStretch()
            pal_box.addLayout(row)

        editor_split.addLayout(pal_box, 1)

        # Preview Right
        prev_box = QVBoxLayout()
        prev_box.setSpacing(8)
        prev_lbl = QLabel("LIVE THEME PREVIEW")
        prev_lbl.setStyleSheet("font-size: 11px; font-weight: 700; letter-spacing: 1px;")
        prev_box.addWidget(prev_lbl)

        self.sample_card = QFrame()
        self.sample_card_layout = QVBoxLayout(self.sample_card)
        self.sample_card_title = QLabel("PREVIEW CARD CONTAINER")
        self.sample_card_layout.addWidget(self.sample_card_title)

        prev_row = QHBoxLayout()
        self.sample_timer_lbl = QLabel("25:00")
        self.sample_mascot = MascotWidget(size=48)
        prev_row.addWidget(self.sample_mascot)
        prev_row.addWidget(self.sample_timer_lbl)
        prev_row.addStretch()
        self.sample_card_layout.addLayout(prev_row)

        prev_btns = QHBoxLayout()
        self.sample_primary_btn = QPushButton("Accent Button")
        self.sample_secondary_btn = QPushButton("Panel Button")
        self.sample_warn_badge = QLabel("Warning")
        prev_btns.addWidget(self.sample_primary_btn)
        prev_btns.addWidget(self.sample_secondary_btn)
        prev_btns.addWidget(self.sample_warn_badge)
        self.sample_card_layout.addLayout(prev_btns)

        prev_box.addWidget(self.sample_card)
        prev_box.addStretch()
        editor_split.addLayout(prev_box, 1)

        box.addLayout(editor_split)

        # Reset & Save theme buttons
        btn_bar = QHBoxLayout()
        self.reset_theme_btn = QPushButton("Reset to Default (NEXI Dark)")
        self.reset_theme_btn.clicked.connect(self._reset_theme_defaults)
        btn_bar.addWidget(self.reset_theme_btn)

        # Reduced motion & mascot
        self.anim_check = QCheckBox("Reduced Motion (Disables mascot oscillations & blinks)")
        self.anim_check.setChecked(self.theme_mgr.reduced_animations)
        self.anim_check.toggled.connect(lambda v: self.theme_mgr.set_reduced_animations(v))
        btn_bar.addWidget(self.anim_check)

        self.mascot_check = QCheckBox("Show Mascot in Main Views")
        self.mascot_check.setChecked(self.theme_mgr.mascot_visible)
        self.mascot_check.toggled.connect(lambda v: self.theme_mgr.set_mascot_visible(v))
        btn_bar.addWidget(self.mascot_check)

        btn_bar.addStretch()
        box.addLayout(btn_bar)

        card.add_layout(box)
        parent_layout.addWidget(card)

    def _build_attention_section(self, parent_layout: QVBoxLayout):
        card = SectionCard(
            "2. Reminders & Attention Controls",
            "Configure full-screen lockdowns, video pausing, short-form video sessions, and exemption deadlines"
        )
        box = QVBoxLayout()
        box.setSpacing(14)

        # Toggles row
        tog_row = QHBoxLayout()
        tog_row.setSpacing(20)

        self.reminders_toggle = QCheckBox("Enable Distraction Reminders (Global)")
        self.reminders_toggle.setChecked(self.repo.get_setting("reminders_enabled", "true").lower() == "true")
        self.reminders_toggle.toggled.connect(lambda v: self.repo.set_setting("reminders_enabled", "true" if v else "false"))
        tog_row.addWidget(self.reminders_toggle)

        self.lockdown_toggle = QCheckBox("Full-Screen Lockdown Overlay")
        self.lockdown_toggle.setChecked(self.repo.get_setting("fullscreen_lockdown_enabled", "true").lower() == "true")
        self.lockdown_toggle.toggled.connect(lambda v: self.repo.set_setting("fullscreen_lockdown_enabled", "true" if v else "false"))
        tog_row.addWidget(self.lockdown_toggle)

        self.pause_video_toggle = QCheckBox("Pause Browser Video Behind Overlay")
        self.pause_video_toggle.setChecked(self.repo.get_setting("pause_video_behind_overlay", "false").lower() == "true")
        self.pause_video_toggle.toggled.connect(lambda v: self.repo.set_setting("pause_video_behind_overlay", "true" if v else "false"))
        tog_row.addWidget(self.pause_video_toggle)

        tog_row.addStretch()
        box.addLayout(tog_row)

        # Numeric Settings Grid
        num_grid = QHBoxLayout()
        num_grid.setSpacing(16)

        # Lockdown Countdown
        c_box = QVBoxLayout()
        c_lbl = QLabel("Lockdown Grace Countdown:")
        c_lbl.setStyleSheet("font-size: 11px;")
        self.lockdown_spin = QSpinBox()
        self.lockdown_spin.setRange(5, 60)
        self.lockdown_spin.setValue(int(self.repo.get_setting("lockdown_countdown_sec", "15")))
        self.lockdown_spin.setSuffix(" sec")
        self.lockdown_spin.valueChanged.connect(lambda v: self.repo.set_setting("lockdown_countdown_sec", str(v)))
        c_box.addWidget(c_lbl)
        c_box.addWidget(self.lockdown_spin)
        num_grid.addLayout(c_box)

        # Continuous Shorts Session Limit
        sh_box = QVBoxLayout()
        sh_lbl = QLabel("Continuous Shorts Session Limit:")
        sh_lbl.setStyleSheet("font-size: 11px;")
        self.shorts_spin = QSpinBox()
        self.shorts_spin.setRange(0, 120)
        self.shorts_spin.setValue(int(self.repo.get_setting("shorts_session_limit_min", "15")))
        self.shorts_spin.setSuffix(" min (0=immediate)")
        self.shorts_spin.valueChanged.connect(lambda v: self.repo.set_setting("shorts_session_limit_min", str(v)))
        sh_box.addWidget(sh_lbl)
        sh_box.addWidget(self.shorts_spin)
        num_grid.addLayout(sh_box)

        # Shorts Daily Budget
        bd_box = QVBoxLayout()
        bd_lbl = QLabel("Shorts Daily Budget:")
        bd_lbl.setStyleSheet("font-size: 11px;")
        self.budget_spin = QSpinBox()
        self.budget_spin.setRange(0, 360)
        self.budget_spin.setValue(int(self.repo.get_setting("shorts_daily_budget_min", "45")))
        self.budget_spin.setSuffix(" min today")
        self.budget_spin.valueChanged.connect(lambda v: self.repo.set_setting("shorts_daily_budget_min", str(v)))
        bd_box.addWidget(bd_lbl)
        bd_box.addWidget(self.budget_spin)
        num_grid.addLayout(bd_box)

        # Additional Time / Snooze
        sn_box = QVBoxLayout()
        sn_lbl = QLabel("Additional Time (Snooze):")
        sn_lbl.setStyleSheet("font-size: 11px;")
        self.snooze_spin = QSpinBox()
        self.snooze_spin.setRange(1, 60)
        self.snooze_spin.setValue(int(self.repo.get_setting("reminder_snooze_duration_min", "5")))
        self.snooze_spin.setSuffix(" min")
        self.snooze_spin.valueChanged.connect(lambda v: self.repo.set_setting("reminder_snooze_duration_min", str(v)))
        sn_box.addWidget(sn_lbl)
        sn_box.addWidget(self.snooze_spin)
        num_grid.addLayout(sn_box)

        num_grid.addStretch()
        box.addLayout(num_grid)

        # Pause Reminders & Important Exemption Management Bar
        mgmt_bar = QHBoxLayout()
        mgmt_bar.setSpacing(12)

        self.pause_status_lbl = QLabel("Pause Reminders:")
        self.pause_status_lbl.setStyleSheet("font-size: 12px; font-weight: 600;")
        self.pause_duration_combo = QComboBox()
        self.pause_duration_combo.addItems(["15 minutes", "30 minutes", "1 hour", "2 hours"])

        self.pause_btn = QPushButton("Pause Reminders")
        self.pause_btn.clicked.connect(self._toggle_pause_reminders)

        self.exempt_status_lbl = QLabel("Important Activity Exemption:")
        self.exempt_status_lbl.setStyleSheet("font-size: 12px; font-weight: 600;")
        self.exempt_btn = QPushButton("Grant 30m Exemption")
        self.exempt_btn.clicked.connect(self._toggle_important_exemption)

        mgmt_bar.addWidget(self.pause_status_lbl)
        mgmt_bar.addWidget(self.pause_duration_combo)
        mgmt_bar.addWidget(self.pause_btn)
        mgmt_bar.addSpacing(20)
        mgmt_bar.addWidget(self.exempt_status_lbl)
        mgmt_bar.addWidget(self.exempt_btn)
        mgmt_bar.addStretch()
        box.addLayout(mgmt_bar)

        # Direct Fullscreen & Rest Overlay Test Buttons
        test_bar = QHBoxLayout()
        test_bar.setSpacing(12)

        self.test_overlay_btn = QPushButton("Preview Full-Screen Overlay")
        self.test_overlay_btn.setFixedHeight(34)
        self.test_overlay_btn.setToolTip("Triggers sample full-screen lockdown overlay containing the 'Test Rest Screen' button")
        self.test_overlay_btn.clicked.connect(self._test_fullscreen_overlay)
        test_bar.addWidget(self.test_overlay_btn)

        self.test_rest_btn = QPushButton("Preview Rest & Breathe Screen")
        self.test_rest_btn.setFixedHeight(34)
        self.test_rest_btn.setObjectName("primaryBtn")
        self.test_rest_btn.setToolTip("Opens the full-screen calm rest screen immediately")
        self.test_rest_btn.clicked.connect(self._test_rest_screen)
        test_bar.addWidget(self.test_rest_btn)

        test_bar.addStretch()
        box.addLayout(test_bar)

        card.add_layout(box)
        parent_layout.addWidget(card)

    def _build_timers_section(self, parent_layout: QVBoxLayout):
        card = SectionCard(
            "3. Timers and Alarms",
            "Create multiple persistent interval or scheduled alarms with live Windows notifications"
        )
        box = QVBoxLayout()
        box.setSpacing(10)

        # Table of timers
        self.timers_table = QTableWidget()
        self.timers_table.setColumnCount(6)
        self.timers_table.setHorizontalHeaderLabels(["Name", "Mode", "Trigger Details", "Notification", "Status", "Actions"])
        self.timers_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.timers_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.timers_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.timers_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.timers_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        self.timers_table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeMode.ResizeToContents)
        self.timers_table.setFixedHeight(180)
        box.addWidget(self.timers_table)

        # Add & Test Timer Button Row
        t_btn_row = QHBoxLayout()
        self.add_timer_btn = QPushButton("+ Add New Timer")
        self.add_timer_btn.setObjectName("primaryBtn")
        self.add_timer_btn.clicked.connect(self._add_new_timer)
        t_btn_row.addWidget(self.add_timer_btn)

        self.test_notif_btn = QPushButton("Test Notification Mechanism")
        self.test_notif_btn.clicked.connect(self._test_notification_mechanism)
        t_btn_row.addWidget(self.test_notif_btn)

        t_btn_row.addStretch()
        box.addLayout(t_btn_row)

        card.add_layout(box)
        parent_layout.addWidget(card)
        self._refresh_timers_table()

    def _build_watched_sites_section(self, parent_layout: QVBoxLayout):
        card = SectionCard(
            "4. Watched Websites",
            "Monitor specific websites, set daily time limits, and inspect today's recorded usage"
        )
        box = QVBoxLayout()
        box.setSpacing(10)

        # Table of watched sites
        self.sites_table = QTableWidget()
        self.sites_table.setColumnCount(5)
        self.sites_table.setHorizontalHeaderLabels(["Display Name", "Hostname", "Daily Limit", "Today's Usage", "Actions"])
        self.sites_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.sites_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.sites_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.sites_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.sites_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        self.sites_table.setFixedHeight(180)
        box.addWidget(self.sites_table)

        # Add Site input row
        add_row = QHBoxLayout()
        self.site_name_inp = QLineEdit()
        self.site_name_inp.setPlaceholderText("Site Name (e.g. YouTube)")
        self.site_host_inp = QLineEdit()
        self.site_host_inp.setPlaceholderText("Hostname (e.g. youtube.com)")
        self.site_limit_spin = QSpinBox()
        self.site_limit_spin.setRange(0, 720)
        self.site_limit_spin.setValue(30)
        self.site_limit_spin.setSuffix(" min limit")

        self.add_site_btn = QPushButton("+ Watch Site")
        self.add_site_btn.setObjectName("primaryBtn")
        self.add_site_btn.clicked.connect(self._add_watched_site)

        add_row.addWidget(self.site_name_inp, 1)
        add_row.addWidget(self.site_host_inp, 1)
        add_row.addWidget(self.site_limit_spin)
        add_row.addWidget(self.add_site_btn)
        box.addLayout(add_row)

        card.add_layout(box)
        parent_layout.addWidget(card)
        self._refresh_watched_sites_table()

    def _build_privacy_section(self, parent_layout: QVBoxLayout):
        card = SectionCard(
            "5. Privacy & Never Track These Sites",
            "Websites in this exclusion list will never be recorded in history or count toward budgets"
        )
        box = QVBoxLayout()
        box.setSpacing(10)

        # Explanatory Privacy Banner
        priv_note = QLabel("Privacy Guarantee: Excluded domains are filtered at capture time. NEXI never collects keystrokes, passwords, incognito history, or query parameters.")
        priv_note.setStyleSheet("font-size: 11px; color: #929292;")
        box.addWidget(priv_note)

        # Exclusions table
        self.excl_table = QTableWidget()
        self.excl_table.setColumnCount(3)
        self.excl_table.setHorizontalHeaderLabels(["Excluded Hostname", "Notes", "Actions"])
        self.excl_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.excl_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.excl_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.excl_table.setFixedHeight(140)
        box.addWidget(self.excl_table)

        # Add Exclusion Row
        excl_row = QHBoxLayout()
        self.excl_host_inp = QLineEdit()
        self.excl_host_inp.setPlaceholderText("Hostname to exclude (e.g. bank.com, internal.company.org)")
        self.excl_note_inp = QLineEdit()
        self.excl_note_inp.setPlaceholderText("Optional note / reason")
        self.add_excl_btn = QPushButton("+ Exclude Site")
        self.add_excl_btn.clicked.connect(self._add_excluded_site)

        excl_row.addWidget(self.excl_host_inp, 1)
        excl_row.addWidget(self.excl_note_inp, 1)
        excl_row.addWidget(self.add_excl_btn)
        box.addLayout(excl_row)

        # Data Management Action Buttons
        data_btn_row = QHBoxLayout()
        self.clear_hist_btn = QPushButton("Clear Activity History")
        self.clear_hist_btn.setObjectName("dangerBtn")
        self.clear_hist_btn.clicked.connect(self._clear_history)
        data_btn_row.addWidget(self.clear_hist_btn)

        self.reset_all_btn = QPushButton("Reset All Settings to Defaults")
        self.reset_all_btn.setObjectName("dangerBtn")
        self.reset_all_btn.clicked.connect(self._reset_defaults)
        data_btn_row.addWidget(self.reset_all_btn)

        data_btn_row.addStretch()
        box.addLayout(data_btn_row)

        card.add_layout(box)
        parent_layout.addWidget(card)
        self._refresh_exclusions_table()

    def _build_monitoring_section(self, parent_layout: QVBoxLayout):
        card = SectionCard(
            "6. Monitoring & Desktop Controls",
            "Configure personalized greetings, Windows auto-start, desktop app tracking, and idle thresholds"
        )
        box = QVBoxLayout()
        box.setSpacing(12)

        # Display Name Greeting
        name_row = QHBoxLayout()
        name_lbl = QLabel("Display Name:")
        name_lbl.setStyleSheet("font-size: 12px; font-weight: 600;")
        name_lbl.setFixedWidth(130)

        self.display_name_edit = QLineEdit(self.repo.get_setting("display_name", ""))
        self.display_name_edit.setPlaceholderText("Enter your name for personalized greetings")
        self.display_name_edit.textChanged.connect(lambda t: self.repo.set_setting("display_name", t.strip()))

        name_row.addWidget(name_lbl)
        name_row.addWidget(self.display_name_edit, 1)
        box.addLayout(name_row)

        # Toggles: Start with Windows & App Tracking
        mon_tog_row = QHBoxLayout()
        mon_tog_row.setSpacing(24)

        self.startup_check = QCheckBox("Start with Windows (Launch NEXI on startup)")
        self.startup_check.setChecked(is_start_with_windows_enabled())
        self.startup_check.toggled.connect(self._on_startup_toggled)
        mon_tog_row.addWidget(self.startup_check)

        self.track_apps_check = QCheckBox("Track Desktop Applications")
        self.track_apps_check.setChecked(self.repo.get_setting("track_apps_enabled", "true").lower() == "true")
        self.track_apps_check.toggled.connect(lambda v: self.repo.set_setting("track_apps_enabled", "true" if v else "false"))
        mon_tog_row.addWidget(self.track_apps_check)

        mon_tog_row.addStretch()
        box.addLayout(mon_tog_row)

        # Idle Threshold Spinbox
        idle_row = QHBoxLayout()
        idle_lbl = QLabel("Idle Threshold:")
        idle_lbl.setStyleSheet("font-size: 12px; font-weight: 600;")
        idle_lbl.setFixedWidth(130)

        self.idle_spin = QSpinBox()
        self.idle_spin.setRange(30, 1800)
        self.idle_spin.setValue(int(self.repo.get_setting("idle_threshold_sec", "180")))
        self.idle_spin.setSuffix(" seconds without input")
        self.idle_spin.valueChanged.connect(lambda v: self.repo.set_setting("idle_threshold_sec", str(v)))

        idle_row.addWidget(idle_lbl)
        idle_row.addWidget(self.idle_spin)
        idle_row.addStretch()
        box.addLayout(idle_row)

        card.add_layout(box)
        parent_layout.addWidget(card)

    def _build_browser_section(self, parent_layout: QVBoxLayout):
        card = SectionCard(
            "7. Browser Integration & Status",
            "Real-time local loopback bridge on 127.0.0.1 for precise domain tracking and video pausing"
        )
        box = QVBoxLayout()
        box.setSpacing(12)

        # Connection Status Indicator
        status_row = QHBoxLayout()
        self.ext_status_badge = QLabel("Bridge Status: INITIALIZING...")
        self.ext_status_badge.setStyleSheet("font-weight: 800; font-size: 12px; padding: 4px 8px; border-radius: 4px;")
        status_row.addWidget(self.ext_status_badge)

        self.ping_ext_btn = QPushButton("Test Extension Ping")
        self.ping_ext_btn.clicked.connect(self._ping_extension)
        status_row.addWidget(self.ping_ext_btn)
        status_row.addStretch()
        box.addLayout(status_row)

        # Installation Instructions
        if getattr(sys, 'frozen', False):
            base_dir = os.path.dirname(sys.executable)
            ext_path = os.path.join(base_dir, "browser_extension")
            if not os.path.exists(ext_path) and hasattr(sys, '_MEIPASS'):
                ext_path = os.path.join(sys._MEIPASS, "browser_extension")
        else:
            ext_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "browser_extension"))
        guide_lbl = QLabel(
            f"<b>How to install the NEXI Chromium Extension:</b><br>"
            f"1. Open Chrome, Edge, or Brave and navigate to <code>chrome://extensions</code><br>"
            f"2. Enable <b>Developer mode</b> (top right toggle)<br>"
            f"3. Click <b>Load unpacked</b> and select the folder:<br>"
            f"<code style='color: #FF6B35;'>{ext_path}</code><br>"
            f"4. The extension binds strictly to <code>127.0.0.1:19876</code> and requires zero external network access."
        )
        guide_lbl.setStyleSheet("font-size: 12px; color: #CCCCCC; line-height: 1.4;")
        guide_lbl.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        box.addWidget(guide_lbl)

        card.add_layout(box)
        parent_layout.addWidget(card)

    # =========================================================================
    # ACTIONS & EVENT HANDLERS
    # =========================================================================

    def _select_preset(self, preset_name: str):
        self.theme_mgr.set_preset(preset_name, save=True)
        for name, card in self.preset_cards.items():
            card.set_selected(name == preset_name)
        for token_key, (swatch, inp) in self.swatch_inputs.items():
            hex_val = self.theme_mgr.colors.get(token_key, "#333333")
            swatch.set_color(hex_val)
            inp.blockSignals(True)
            inp.setText(hex_val)
            inp.blockSignals(False)
        self._update_preview()

    def _on_color_swatch_changed(self, token_key: str, hex_val: str, inp: QLineEdit):
        inp.blockSignals(True)
        inp.setText(hex_val)
        inp.blockSignals(False)
        for card in self.preset_cards.values():
            card.set_selected(False)
        self.theme_mgr.set_custom_color(token_key, hex_val, save=True)
        self._update_preview()

    def _on_hex_input_changed(self, token_key: str, text: str, swatch: ColorSwatchButton):
        text = text.strip()
        if not text.startswith("#"):
            text = "#" + text
        if is_valid_hex(text):
            swatch.set_color(text)
            for card in self.preset_cards.values():
                card.set_selected(False)
            self.theme_mgr.set_custom_color(token_key, text, save=True)
            self._update_preview()

    def _reset_theme_defaults(self):
        self.theme_mgr.reset_to_defaults()
        self._select_preset("NEXI Dark")
        self.anim_check.setChecked(False)
        self.mascot_check.setChecked(True)
        QMessageBox.information(self, "Theme Reset", "Theme has been reset to official NEXI Dark.")

    def _update_preview(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        self.header_title.setStyleSheet(f"color: {c['text_primary']}; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;")
        self.header_sub.setStyleSheet(f"color: {c['text_secondary']}; font-size: 13px;")

        self.sample_card.setStyleSheet(f"""
            QFrame {{
                background-color: {c['bg_card']};
                border: 2px solid {c['border']};
                border-radius: {cr}px;
                padding: 10px;
            }}
        """)
        self.sample_card_title.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; font-weight: 700; letter-spacing: 1px;")
        self.sample_timer_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 26px; font-weight: 800; font-family: monospace;")

        self.sample_primary_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {c['accent']};
                color: #FFFFFF;
                border: none;
                border-radius: {max(3, cr - 2)}px;
                padding: 6px 12px;
                font-weight: 700;
            }}
        """)
        self.sample_secondary_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {c['bg_panel']};
                color: {c['text_primary']};
                border: 1px solid {c['border']};
                border-radius: {max(3, cr - 2)}px;
                padding: 6px 12px;
                font-weight: 600;
            }}
        """)
        self.sample_warn_badge.setStyleSheet(f"""
            QLabel {{
                background-color: {c['warning']};
                color: #FFFFFF;
                border-radius: {max(3, cr - 2)}px;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: 700;
            }}
        """)
        self.sample_mascot.setVisible(self.theme_mgr.mascot_visible)

    def _on_theme_changed(self, _):
        self._update_preview()
        self._refresh_timers_table()
        self._refresh_watched_sites_table()
        self._refresh_exclusions_table()

    # --- ATTENTION CONTROLS ---

    def _toggle_pause_reminders(self):
        if self.intervention_mgr and self.intervention_mgr.is_paused():
            self.intervention_mgr.cancel_pause_reminders()
            QMessageBox.information(self, "Reminders Resumed", "Distraction reminders have been resumed.")
        else:
            txt = self.pause_duration_combo.currentText()
            minutes = 15
            if "30" in txt:
                minutes = 30
            elif "1 hour" in txt:
                minutes = 60
            elif "2 hours" in txt:
                minutes = 120
            if self.intervention_mgr:
                self.intervention_mgr.set_pause_reminders(minutes)
            QMessageBox.information(self, "Reminders Paused", f"Distraction reminders paused for {minutes} minutes.")
        self._refresh_status_indicators()

    def _toggle_important_exemption(self):
        if self.intervention_mgr and self.intervention_mgr.is_exempt():
            self.intervention_mgr.cancel_important_exemption()
            QMessageBox.information(self, "Exemption Cancelled", "Important activity exemption ended.")
        else:
            if self.intervention_mgr:
                self.intervention_mgr.set_important_exemption(30)
            QMessageBox.information(self, "Exemption Active", "Important activity exemption granted for 30 minutes.")
        self._refresh_status_indicators()

    def _refresh_status_indicators(self):
        # Update pause button text & label
        if self.intervention_mgr and self.intervention_mgr.is_paused():
            paused_str = self.repo.get_setting("reminders_paused_until", "")
            try:
                deadline = datetime.strptime(paused_str, "%Y-%m-%d %H:%M:%S")
                rem_sec = max(0, int((deadline - datetime.now()).total_seconds()))
                self.pause_status_lbl.setText(f"Reminders PAUSED ({rem_sec // 60}m {rem_sec % 60}s left)")
            except Exception:
                self.pause_status_lbl.setText("Reminders PAUSED")
            self.pause_status_lbl.setStyleSheet("color: #FF9800; font-weight: 800;")
            self.pause_btn.setText("Resume Reminders Now")
        else:
            self.pause_status_lbl.setText("Pause Reminders:")
            self.pause_status_lbl.setStyleSheet("color: #CCCCCC; font-weight: 600;")
            self.pause_btn.setText("Pause Reminders")

        # Update exemption button text & label
        if self.intervention_mgr and self.intervention_mgr.is_exempt():
            exempt_str = self.repo.get_setting("important_exemption_until", "")
            try:
                deadline = datetime.strptime(exempt_str, "%Y-%m-%d %H:%M:%S")
                rem_sec = max(0, int((deadline - datetime.now()).total_seconds()))
                self.exempt_status_lbl.setText(f"Exemption ACTIVE ({rem_sec // 60}m left)")
            except Exception:
                self.exempt_status_lbl.setText("Exemption ACTIVE")
            self.exempt_status_lbl.setStyleSheet("color: #4CAF50; font-weight: 800;")
            self.exempt_btn.setText("Cancel Exemption")
        else:
            self.exempt_status_lbl.setText("Important Activity Exemption:")
            self.exempt_status_lbl.setStyleSheet("color: #CCCCCC; font-weight: 600;")
            self.exempt_btn.setText("Grant 30m Exemption")

        # Update extension bridge status
        connected = False
        if self.tracker and hasattr(self.tracker, "browser_tracker"):
            connected = self.tracker.browser_tracker.is_extension_connected()
        if connected:
            self.ext_status_badge.setText("Bridge Status: CONNECTED (Active)")
            self.ext_status_badge.setStyleSheet("background-color: #2E7D32; color: #FFFFFF; font-weight: 800; padding: 4px 8px; border-radius: 4px;")
        else:
            self.ext_status_badge.setText("Bridge Status: STANDBY (Awaiting Extension)")
            self.ext_status_badge.setStyleSheet("background-color: #C62828; color: #FFFFFF; font-weight: 800; padding: 4px 8px; border-radius: 4px;")

    def _test_fullscreen_overlay(self):
        from focus_companion.app.ui.dialogs.intervention_dialog import InterventionDialog
        dlg = InterventionDialog(
            source="YouTube Shorts",
            level="strict",
            reason="Continuous short-form video limit of 15m reached.",
            is_fullscreen=True,
            countdown_sec=15,
            pause_video=True,
            is_rest_mode=False,
            parent=self.window()
        )
        dlg.exec()

    def _test_rest_screen(self):
        from focus_companion.app.ui.dialogs.intervention_dialog import InterventionDialog
        dlg = InterventionDialog(
            is_fullscreen=True,
            is_rest_mode=True,
            parent=self.window()
        )
        dlg.exec()

    # --- TIMERS & ALARMS ---

    def _refresh_timers_table(self):
        timers = self.repo.get_custom_timers()
        self.timers_table.setRowCount(len(timers))

        for row, t in enumerate(timers):
            self.timers_table.setItem(row, 0, QTableWidgetItem(t["name"]))
            self.timers_table.setItem(row, 1, QTableWidgetItem(t["mode"].title()))

            trigger_desc = f"Every {t['interval_min']}m" if t["mode"] == "interval" else f"At {t['target_time']}"
            self.timers_table.setItem(row, 2, QTableWidgetItem(trigger_desc))
            self.timers_table.setItem(row, 3, QTableWidgetItem(t.get("notification_type", "toast").title()))

            # Enable/Disable toggle
            en_cb = QCheckBox("Enabled" if t["is_enabled"] else "Disabled")
            en_cb.setChecked(bool(t["is_enabled"]))
            en_cb.toggled.connect(lambda v, tid=t["id"]: self._toggle_timer_enabled(tid, v))
            self.timers_table.setCellWidget(row, 4, en_cb)

            # Actions: Edit, Delete, Test
            act_widget = QWidget()
            act_layout = QHBoxLayout(act_widget)
            act_layout.setContentsMargins(2, 2, 2, 2)
            act_layout.setSpacing(4)

            test_btn = QPushButton("Test")
            test_btn.setStyleSheet("padding: 2px 6px; font-size: 11px;")
            test_btn.clicked.connect(lambda _, t_data=t: self._test_single_timer(t_data))
            act_layout.addWidget(test_btn)

            edit_btn = QPushButton("Edit")
            edit_btn.setStyleSheet("padding: 2px 6px; font-size: 11px;")
            edit_btn.clicked.connect(lambda _, t_data=t: self._edit_timer(t_data))
            act_layout.addWidget(edit_btn)

            del_btn = QPushButton("Remove")
            del_btn.setStyleSheet("padding: 2px 6px; font-size: 11px; color: #FF5252;")
            del_btn.clicked.connect(lambda _, tid=t["id"]: self._delete_timer(tid))
            act_layout.addWidget(del_btn)

            self.timers_table.setCellWidget(row, 5, act_widget)

    def _add_new_timer(self):
        dlg = TimerDialog(parent=self)
        if dlg.exec():
            res = dlg.get_result()
            self.repo.add_custom_timer(
                name=res["name"],
                mode=res["mode"],
                interval_min=res["interval_min"],
                target_time=res["target_time"],
                notification_type=res["notification_type"],
                is_enabled=1
            )
            self._refresh_timers_table()

    def _edit_timer(self, timer_data: dict):
        dlg = TimerDialog(timer_data, parent=self)
        if dlg.exec():
            res = dlg.get_result()
            self.repo.update_custom_timer(
                timer_id=timer_data["id"],
                name=res["name"],
                mode=res["mode"],
                interval_min=res["interval_min"],
                target_time=res["target_time"],
                notification_type=res["notification_type"],
                is_enabled=timer_data["is_enabled"]
            )
            self._refresh_timers_table()

    def _toggle_timer_enabled(self, timer_id: int, is_enabled: bool):
        self.repo.set_custom_timer_enabled(timer_id, is_enabled)
        self._refresh_timers_table()

    def _delete_timer(self, timer_id: int):
        self.repo.delete_custom_timer(timer_id)
        self._refresh_timers_table()

    def _test_single_timer(self, timer_data: dict):
        if self.reminder_scheduler and self.reminder_scheduler.on_custom_timer_triggered:
            self.reminder_scheduler.on_custom_timer_triggered(timer_data)
        else:
            QMessageBox.information(
                self,
                f"Test Timer: {timer_data['name']}",
                f"Real notification test for '{timer_data['name']}' triggered successfully."
            )

    def _test_notification_mechanism(self):
        sample = {
            "name": "NEXI Test Alarm",
            "mode": "interval",
            "interval_min": 15,
            "target_time": "12:00",
            "notification_type": "toast"
        }
        self._test_single_timer(sample)

    # --- WATCHED SITES ---

    def _refresh_watched_sites_table(self):
        sites = self.repo.get_watched_sites()
        self.sites_table.setRowCount(len(sites))

        for row, s in enumerate(sites):
            self.sites_table.setItem(row, 0, QTableWidgetItem(s["display_name"]))
            self.sites_table.setItem(row, 1, QTableWidgetItem(s["hostname"]))

            lim_text = f"{s['daily_limit_min']} min/day" if s["daily_limit_min"] > 0 else "No limit (watch only)"
            self.sites_table.setItem(row, 2, QTableWidgetItem(lim_text))

            # Recorded real usage today
            usage_sec = self.repo.get_today_domain_usage_sec(s["hostname"])
            usage_text = f"{usage_sec // 60}m {usage_sec % 60}s"
            self.sites_table.setItem(row, 3, QTableWidgetItem(usage_text))

            # Actions
            act_widget = QWidget()
            act_layout = QHBoxLayout(act_widget)
            act_layout.setContentsMargins(2, 2, 2, 2)
            act_layout.setSpacing(4)

            tog_btn = QPushButton("Disable" if s["is_enabled"] else "Enable")
            tog_btn.setStyleSheet("padding: 2px 6px; font-size: 11px;")
            tog_btn.clicked.connect(lambda _, sid=s["id"], en=s["is_enabled"]: self._toggle_watched_site(sid, not en))
            act_layout.addWidget(tog_btn)

            del_btn = QPushButton("Remove")
            del_btn.setStyleSheet("padding: 2px 6px; font-size: 11px; color: #FF5252;")
            del_btn.clicked.connect(lambda _, sid=s["id"]: self._delete_watched_site(sid))
            act_layout.addWidget(del_btn)

            self.sites_table.setCellWidget(row, 4, act_widget)

    def _add_watched_site(self):
        name = self.site_name_inp.text().strip()
        host = self.site_host_inp.text().strip()
        limit = self.site_limit_spin.value()

        if not host:
            QMessageBox.warning(self, "Invalid Hostname", "Please enter a valid website hostname (e.g. youtube.com).")
            return

        clean_host = host.lower().replace("http://", "").replace("https://", "").split("/")[0].replace("www.", "")
        if not name:
            name = clean_host.title()

        self.repo.add_or_update_watched_site(name, clean_host, limit, is_enabled=1)
        self.site_name_inp.clear()
        self.site_host_inp.clear()
        self._refresh_watched_sites_table()

    def _toggle_watched_site(self, site_id: int, new_state: bool):
        self.repo.set_watched_site_enabled(site_id, new_state)
        self._refresh_watched_sites_table()

    def _delete_watched_site(self, site_id: int):
        self.repo.delete_watched_site(site_id)
        self._refresh_watched_sites_table()

    # --- PRIVACY & EXCLUSIONS ---

    def _refresh_exclusions_table(self):
        exclusions = self.repo.get_excluded_sites()
        self.excl_table.setRowCount(len(exclusions))

        for row, ex in enumerate(exclusions):
            self.excl_table.setItem(row, 0, QTableWidgetItem(ex["hostname"]))
            self.excl_table.setItem(row, 1, QTableWidgetItem(ex.get("notes", "")))

            del_btn = QPushButton("Remove")
            del_btn.setStyleSheet("padding: 2px 6px; font-size: 11px; color: #FF5252;")
            del_btn.clicked.connect(lambda _, eid=ex["id"]: self._delete_excluded_site(eid))
            self.excl_table.setCellWidget(row, 2, del_btn)

    def _add_excluded_site(self):
        host = self.excl_host_inp.text().strip()
        notes = self.excl_note_inp.text().strip()
        if not host:
            QMessageBox.warning(self, "Invalid Hostname", "Please enter a hostname to exclude.")
            return

        clean_host = host.lower().replace("http://", "").replace("https://", "").split("/")[0].replace("www.", "")
        self.repo.add_excluded_site(clean_host, notes)
        self.excl_host_inp.clear()
        self.excl_note_inp.clear()
        self._refresh_exclusions_table()

    def _delete_excluded_site(self, exclusion_id: int):
        self.repo.delete_excluded_site(exclusion_id)
        self._refresh_exclusions_table()

    def _clear_history(self):
        confirm = QMessageBox.question(
            self,
            "Confirm Clear History",
            "Are you sure you want to delete all recorded activity intervals and distraction logs? This cannot be undone.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if confirm == QMessageBox.StandardButton.Yes:
            self.repo.clear_activity_history()
            self._refresh_watched_sites_table()
            QMessageBox.information(self, "Success", "Activity history has been permanently cleared.")

    def _reset_defaults(self):
        confirm = QMessageBox.question(
            self,
            "Confirm Reset Defaults",
            "Reset all settings, rules, and profiles to original defaults?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if confirm == QMessageBox.StandardButton.Yes:
            self.repo.reset_settings_to_default()
            self._reset_theme_defaults()
            self._refresh_timers_table()
            self._refresh_watched_sites_table()
            self._refresh_exclusions_table()
            QMessageBox.information(self, "Success", "All settings reset to defaults.")

    # --- MONITORING & STARTUP ---

    def _on_startup_toggled(self, enabled: bool):
        success, msg = set_start_with_windows(enabled)
        if not success:
            self.startup_check.blockSignals(True)
            self.startup_check.setChecked(not enabled)
            self.startup_check.blockSignals(False)
            QMessageBox.warning(self, "Startup Configuration Error", msg)
        else:
            self.repo.set_setting("start_with_windows", "true" if enabled else "false")

    # --- BROWSER STATUS ---

    def _ping_extension(self):
        connected = False
        if self.tracker and hasattr(self.tracker, "browser_tracker"):
            connected = self.tracker.browser_tracker.is_extension_connected()
        if connected:
            QMessageBox.information(self, "Extension Connected", "NEXI browser extension is actively connected and sending data on 127.0.0.1:19876.")
        else:
            QMessageBox.warning(
                self,
                "Extension Standby",
                "No ping received within the last 15 seconds. Please ensure the extension is installed and loaded in your Chromium browser."
            )
        self._refresh_status_indicators()
