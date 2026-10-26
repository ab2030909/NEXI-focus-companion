"""
Intent Mode Dialog for NEXI.
Allows users to declare a purposeful task or goal (e.g. 'Study Compiler Design', 'Debug authentication API')
and set a time budget (e.g. 45 minutes), with optional target domain or app focus.
Themed via ThemeManager tokens with validation and clear user feedback.
"""

from typing import Optional
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QSpinBox, QPushButton, QMessageBox, QFrame
)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont
from focus_companion.app.database.repository import Repository
from focus_companion.app.core.focus_engine import FocusEngine
from focus_companion.app.ui.components.icons import draw_sidebar_icon
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class IntentDialog(QDialog):
    intent_started = Signal(str, int, str)  # note, budget_min, domain

    def __init__(self, repository: Repository, focus_engine: Optional[FocusEngine] = None, parent=None):
        super().__init__(parent)
        self.repo = repository
        self.focus_engine = focus_engine
        self.theme_mgr = ThemeManager.get_instance(repository)

        self.setWindowTitle("NEXI - Intent Mode")
        self.setFixedSize(460, 360)
        self._init_ui()
        self._apply_style()

    def _apply_style(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        self.setStyleSheet(f"""
            QDialog {{
                background-color: {c["bg_card"]};
                border: 1px solid {c["border"]};
                border-radius: {cr}px;
            }}
            QLineEdit, QSpinBox {{
                background-color: {c["bg_panel"]};
                border: 1px solid {c["border"]};
                border-radius: {max(4, cr - 2)}px;
                color: {c["text_primary"]};
                padding: 8px 12px;
                font-size: 13px;
            }}
            QLineEdit:focus, QSpinBox:focus {{
                border: 1px solid {c["accent"]};
            }}
        """)

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 22, 24, 22)
        layout.setSpacing(14)

        c = self.theme_mgr.colors

        # Header Title with Icon
        header_row = QHBoxLayout()
        header_row.setSpacing(10)
        icon_lbl = QLabel()
        icon_lbl.setPixmap(draw_sidebar_icon("focus", c["accent"], 22).pixmap(22, 22))
        header_row.addWidget(icon_lbl)

        title_box = QVBoxLayout()
        title_box.setSpacing(2)
        title = QLabel("Intent Mode & Task Lock-In")
        title.setStyleSheet(f"color: {c['text_primary']}; font-size: 16px; font-weight: 700; border: none; background: transparent;")
        subtitle = QLabel("Set your singular task objective and dedicated time budget.")
        subtitle.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; border: none; background: transparent;")
        title_box.addWidget(title)
        title_box.addWidget(subtitle)
        header_row.addLayout(title_box)
        header_row.addStretch()
        layout.addLayout(header_row)

        # 1. Task Objective (Primary)
        task_lbl = QLabel("Task / Intention:")
        task_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 12px; font-weight: 600; border: none; background: transparent;")
        layout.addWidget(task_lbl)

        self.note_input = QLineEdit()
        self.note_input.setPlaceholderText("e.g. Study Compiler Design, Fix Auth API bug...")
        self.note_input.setFixedHeight(38)
        layout.addWidget(self.note_input)

        # 2. Time Budget & Target Platform (Split row)
        mid_row = QHBoxLayout()
        mid_row.setSpacing(14)

        # Time Budget Spinbox
        budget_box = QVBoxLayout()
        budget_box.setSpacing(4)
        budget_lbl = QLabel("Time Budget:")
        budget_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 12px; font-weight: 600; border: none; background: transparent;")
        self.budget_spin = QSpinBox()
        self.budget_spin.setRange(1, 240)
        self.budget_spin.setValue(45)
        self.budget_spin.setSuffix(" min")
        self.budget_spin.setFixedHeight(38)
        budget_box.addWidget(budget_lbl)
        budget_box.addWidget(self.budget_spin)
        mid_row.addLayout(budget_box, 1)

        # Optional Target Domain / App
        domain_box = QVBoxLayout()
        domain_box.setSpacing(4)
        domain_lbl = QLabel("Target Platform (Optional):")
        domain_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 12px; font-weight: 600; border: none; background: transparent;")
        self.domain_input = QLineEdit()
        self.domain_input.setPlaceholderText("e.g. youtube.com, vscode...")
        self.domain_input.setFixedHeight(38)
        domain_box.addWidget(domain_lbl)
        domain_box.addWidget(self.domain_input)
        mid_row.addLayout(domain_box, 1)

        layout.addLayout(mid_row)

        # Quick preset chips (15m, 25m, 45m, 60m)
        chip_row = QHBoxLayout()
        chip_row.setSpacing(6)
        chip_lbl = QLabel("Presets:")
        chip_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; border: none; background: transparent;")
        chip_row.addWidget(chip_lbl)

        for duration in (15, 25, 45, 60, 90):
            btn = QPushButton(f"{duration}m")
            btn.setFixedHeight(24)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {c['bg_panel']};
                    border: 1px solid {c['border']};
                    border-radius: 4px;
                    color: {c['text_secondary']};
                    font-size: 11px;
                    padding: 2px 8px;
                }}
                QPushButton:hover {{
                    border-color: {c['accent']};
                    color: {c['accent']};
                }}
            """)
            btn.clicked.connect(lambda checked=False, d=duration: self.budget_spin.setValue(d))
            chip_row.addWidget(btn)

        chip_row.addStretch()
        layout.addLayout(chip_row)

        layout.addStretch()

        # Action Buttons
        btn_row = QHBoxLayout()
        btn_row.setSpacing(10)
        btn_row.addStretch()

        cancel_btn = QPushButton("Cancel")
        cancel_btn.setFixedHeight(36)
        cancel_btn.clicked.connect(self.reject)
        btn_row.addWidget(cancel_btn)

        start_btn = QPushButton("Start Intent Session")
        start_btn.setObjectName("primaryBtn")
        start_btn.setFixedHeight(36)
        start_btn.setIcon(draw_sidebar_icon("play", "#FFFFFF", 14))
        start_btn.clicked.connect(self._validate_and_start)
        btn_row.addWidget(start_btn)

        layout.addLayout(btn_row)

        # Focus note input by default
        self.note_input.setFocus()

    def _validate_and_start(self):
        note = self.note_input.text().strip()
        budget = self.budget_spin.value()
        domain = self.domain_input.text().strip().lower()

        # 1. Validation: Prevent empty task intentions
        if not note:
            QMessageBox.warning(
                self,
                "Intention Required",
                "Please enter a clear task or intention (e.g. 'Study Compiler Design') to keep yourself focused and accountable."
            )
            self.note_input.setFocus()
            return

        # 2. Validation: Prevent invalid budgets
        if budget <= 0 or budget > 240:
            QMessageBox.warning(
                self,
                "Invalid Budget",
                "Please specify a time budget between 1 and 240 minutes."
            )
            return

        # 3. Start session in FocusEngine if available
        if self.focus_engine:
            self.focus_engine.start_intent_session(note=note, budget_min=budget, domain=domain)
        else:
            self.repo.create_intent_session(domain=domain, note=note, budget_min=budget)

        self.intent_started.emit(note, budget, domain)
        self.accept()
