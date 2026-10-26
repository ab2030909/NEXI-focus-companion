"""
Activity Timeline Screen for NEXI.
Shows real recorded activity events grouped chronologically:
- Application name, detected website hostname, category, classification badge
- Duration and exact start/end timestamps
- Category filter and Refresh controls
Subscribes to ThemeManager for live theme coloring with modern data table styling.
"""

from datetime import date
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QHeaderView, QComboBox, QFrame
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QColor, QFont
from focus_companion.app.database.repository import Repository
from focus_companion.app.ui.components.cards import SectionCard
from focus_companion.app.ui.components.icons import draw_sidebar_icon
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class TimelinePage(QWidget):
    def __init__(self, repository: Repository, parent=None):
        super().__init__(parent)
        self.repo = repository
        self.theme_mgr = ThemeManager.get_instance(repository)
        self._init_ui()
        self.theme_mgr.theme_changed.connect(self._on_theme_changed)
        self._apply_theme()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(26, 20, 26, 22)
        layout.setSpacing(16)

        # Header bar
        header_row = QHBoxLayout()
        header_row.setSpacing(14)

        title_box = QVBoxLayout()
        title_box.setSpacing(3)
        self.title_lbl = QLabel("Activity Timeline")
        self.sub_lbl = QLabel("Chronological log of verified foreground window and website intervals")
        title_box.addWidget(self.title_lbl)
        title_box.addWidget(self.sub_lbl)
        header_row.addLayout(title_box)

        header_row.addStretch()

        # Category Filter
        self.cat_filter = QComboBox()
        self.cat_filter.setMinimumWidth(160)
        self.cat_filter.addItem("All Categories", "All")
        cats = self.repo.get_categories()
        for c in cats:
            self.cat_filter.addItem(c["name"], c["name"])
        self.cat_filter.currentIndexChanged.connect(self.refresh_data)
        header_row.addWidget(self.cat_filter)

        self.refresh_btn = QPushButton("Refresh")
        self.refresh_btn.setFixedHeight(34)
        self.refresh_btn.setIcon(draw_sidebar_icon("timeline", self.theme_mgr.colors.get("text_primary", "#FFFFFF"), 14))
        self.refresh_btn.clicked.connect(self.refresh_data)
        header_row.addWidget(self.refresh_btn)

        layout.addLayout(header_row)

        # Table Section Card
        card = SectionCard("Today's Foreground Log", "Real-time records from actual Windows active applications")
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["Start Time", "Application / Process", "Domain / URL", "Category", "Active Duration", "Productivity"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.horizontalHeader().resizeSection(0, 95)
        self.table.horizontalHeader().resizeSection(1, 160)
        self.table.horizontalHeader().resizeSection(2, 170)
        self.table.horizontalHeader().resizeSection(3, 120)
        self.table.horizontalHeader().resizeSection(4, 115)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setShowGrid(False)
        self.table.setAlternatingRowColors(True)

        card.add_widget(self.table)
        layout.addWidget(card, 1)

    def _apply_theme(self):
        c = self.theme_mgr.colors
        self.title_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 22px; font-weight: 800; letter-spacing: 0.2px;")
        self.sub_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 12px; font-weight: 400;")
        self.refresh_btn.setIcon(draw_sidebar_icon("timeline", c["text_primary"], 14))

        alt_row = adjust_color(c["bg_panel"], 1.08 if c.get("mode") == "dark" else 0.98)
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background-color: {c["bg_panel"]};
                alternate-background-color: {alt_row};
                border: 1px solid {c["border"]};
                border-radius: {self.theme_mgr.corner_radius}px;
                color: {c["text_primary"]};
                selection-background-color: {adjust_color(c['accent'], 0.35)};
                selection-color: {c["text_primary"]};
                padding: 4px;
            }}
            QTableWidget::item {{
                padding: 6px 10px;
                border: none;
            }}
        """)

    def _on_theme_changed(self, _):
        self._apply_theme()
        self.refresh_data()

    def refresh_data(self):
        category = self.cat_filter.currentData() or "All"
        activities = self.repo.get_activities_by_date(date.today(), category)

        c = self.theme_mgr.colors
        self.table.setRowCount(len(activities))
        for row_idx, act in enumerate(activities):
            start_str = act["start_time"].split(" ")[-1] if " " in act["start_time"] else act["start_time"]
            item_time = QTableWidgetItem(start_str)
            item_time.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            item_time.setFont(QFont("Segoe UI", 9, QFont.Weight.DemiBold))

            app_name = act["app_name"]
            if act["is_idle"]:
                app_name = "System Idle"
            item_app = QTableWidgetItem(app_name)
            item_app.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))

            domain = act["domain"] or "-"
            item_domain = QTableWidgetItem(domain)

            item_cat = QTableWidgetItem(act["category_name"] or "Uncategorized")

            dur_sec = act["duration_sec"]
            if dur_sec < 60:
                dur_str = f"{dur_sec}s"
            else:
                dur_str = f"{dur_sec // 60}m {dur_sec % 60}s"
            item_dur = QTableWidgetItem(dur_str)
            item_dur.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            item_dur.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))

            classification = act["classification"]
            if act["is_idle"]:
                type_str = "IDLE"
                type_color = c["text_secondary"]
            elif classification == 1:
                type_str = "PRODUCTIVE"
                type_color = c["accent"]
            elif classification == -1:
                type_str = "DISTRACTING"
                type_color = c["warning"]
            else:
                type_str = "NEUTRAL"
                type_color = c["text_secondary"]

            item_type = QTableWidgetItem(type_str)
            item_type.setForeground(QColor(type_color))
            item_type.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            item_type.setFont(QFont("Segoe UI", 8, QFont.Weight.ExtraBold))

            self.table.setItem(row_idx, 0, item_time)
            self.table.setItem(row_idx, 1, item_app)
            self.table.setItem(row_idx, 2, item_domain)
            self.table.setItem(row_idx, 3, item_cat)
            self.table.setItem(row_idx, 4, item_dur)
            self.table.setItem(row_idx, 5, item_type)
