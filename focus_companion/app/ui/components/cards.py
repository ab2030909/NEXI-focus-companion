"""
Reusable UI card widgets, metric displays, and progress indicators for NEXI.
Dynamically subscribes to ThemeManager so all cards, text colors, and borders
update live across all pages with a sleek, premium design.
"""

from PySide6.QtWidgets import QFrame, QVBoxLayout, QHBoxLayout, QLabel, QWidget
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class MetricCard(QFrame):
    """
    Polished metric card showing an uppercase kicker label, large bold stat value,
    and a helpful contextual status/subtitle.
    """
    def __init__(self, title: str, initial_value: str = "0m", subtitle: str = "", accent_override: str = "", parent=None):
        super().__init__(parent)
        self.accent_override = accent_override
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(self._on_theme_changed)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(18, 16, 18, 16)
        layout.setSpacing(6)

        # Header kicker row
        header_row = QHBoxLayout()
        header_row.setSpacing(6)
        self.indicator_dot = QLabel("●")
        self.title_label = QLabel(title.upper())
        header_row.addWidget(self.indicator_dot)
        header_row.addWidget(self.title_label)
        header_row.addStretch()

        self.value_label = QLabel(initial_value)
        self.subtitle_label = QLabel(subtitle)

        layout.addLayout(header_row)
        layout.addWidget(self.value_label)
        if subtitle:
            layout.addWidget(self.subtitle_label)
        layout.addStretch()

        self._apply_style()

    def _apply_style(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        accent_col = self.accent_override if self.accent_override else c["accent"]
        val_color = self.accent_override if self.accent_override else c["text_primary"]
        bg_hover = adjust_color(c["bg_card"], 1.08 if c.get("mode") == "dark" else 0.98)

        self.setStyleSheet(f"""
            QFrame {{
                background-color: {c["bg_card"]};
                border: 1px solid {c["border"]};
                border-radius: {cr}px;
            }}
            QFrame:hover {{
                border: 1px solid {adjust_color(c["border"], 1.4 if c.get("mode") == "dark" else 0.85)};
            }}
        """)
        self.indicator_dot.setStyleSheet(
            f"color: {accent_col}; font-size: 8px; border: none; background: transparent;"
        )
        self.title_label.setStyleSheet(
            f"color: {c['text_secondary']}; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; border: none; background: transparent;"
        )
        self.value_label.setStyleSheet(
            f"color: {val_color}; font-size: 24px; font-weight: 800; font-family: 'Segoe UI Variable Display', 'Segoe UI', system-ui; border: none; background: transparent;"
        )
        self.subtitle_label.setStyleSheet(
            f"color: {c['text_secondary']}; font-size: 11px; font-weight: 500; border: none; background: transparent;"
        )

    def _on_theme_changed(self, _):
        self._apply_style()

    def set_value(self, value: str, subtitle: str = ""):
        self.value_label.setText(value)
        if subtitle:
            self.subtitle_label.setText(subtitle)


class SectionCard(QFrame):
    """
    Titled container card for tables, timelines, or charts with refined header styling.
    """
    def __init__(self, title: str, subtitle: str = "", parent=None):
        super().__init__(parent)
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(self._on_theme_changed)

        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(18, 16, 18, 18)
        self.main_layout.setSpacing(12)

        header_layout = QVBoxLayout()
        header_layout.setSpacing(3)

        self.title_label = QLabel(title)
        header_layout.addWidget(self.title_label)

        self.sub_label = None
        if subtitle:
            self.sub_label = QLabel(subtitle)
            header_layout.addWidget(self.sub_label)

        self.main_layout.addLayout(header_layout)
        self._apply_style()

    def _apply_style(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {c["bg_card"]};
                border: 1px solid {c["border"]};
                border-radius: {cr}px;
            }}
        """)
        self.title_label.setStyleSheet(
            f"color: {c['text_primary']}; font-size: 15px; font-weight: 700; letter-spacing: 0.2px; border: none; background: transparent;"
        )
        if self.sub_label:
            self.sub_label.setStyleSheet(
                f"color: {c['text_secondary']}; font-size: 12px; font-weight: 400; border: none; background: transparent;"
            )

    def _on_theme_changed(self, _):
        self._apply_style()

    def add_widget(self, widget: QWidget):
        self.main_layout.addWidget(widget)

    def add_layout(self, layout):
        self.main_layout.addLayout(layout)
