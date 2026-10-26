"""
Applications & Websites Rules Management Screen for NEXI.
Allows user to:
- View all application and domain rules with clear category chips & classification badges
- Add/Update custom rules (pattern, app vs domain, category, classification, limits)
- Delete existing rules
Dynamic ThemeManager styling.
"""

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QHeaderView, QLineEdit,
    QComboBox, QSpinBox, QMessageBox, QFrame
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QColor, QFont
from focus_companion.app.database.repository import Repository
from focus_companion.app.ui.components.cards import SectionCard
from focus_companion.app.ui.components.icons import draw_sidebar_icon
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class RulesPage(QWidget):
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

        # Header
        title_box = QVBoxLayout()
        title_box.setSpacing(3)
        self.title_lbl = QLabel("Applications & Website Rules")
        self.sub_lbl = QLabel("Customize activity classifications, categories, and continuous usage limits")
        title_box.addWidget(self.title_lbl)
        title_box.addWidget(self.sub_lbl)
        layout.addLayout(title_box)

        # Quick Add Rule Card
        add_card = SectionCard("Add or Modify Rule", "Specify executable name (e.g. code.exe) or website domain (e.g. youtube.com)")
        add_row = QHBoxLayout()
        add_row.setSpacing(10)

        self.pattern_input = QLineEdit()
        self.pattern_input.setFixedHeight(34)
        self.pattern_input.setPlaceholderText("Target (e.g. youtube.com or code.exe)")
        add_row.addWidget(self.pattern_input, 2)

        self.type_combo = QComboBox()
        self.type_combo.setFixedHeight(34)
        self.type_combo.addItem("Website Domain", "domain")
        self.type_combo.addItem("Desktop App", "app")
        add_row.addWidget(self.type_combo, 1)

        self.cat_combo = QComboBox()
        self.cat_combo.setFixedHeight(34)
        for cat in self.repo.get_categories():
            self.cat_combo.addItem(cat["name"], cat["name"])
        add_row.addWidget(self.cat_combo, 1)

        self.class_combo = QComboBox()
        self.class_combo.setFixedHeight(34)
        self.class_combo.addItem("Productive (+1)", 1)
        self.class_combo.addItem("Neutral (0)", 0)
        self.class_combo.addItem("Distracting (-1)", -1)
        add_row.addWidget(self.class_combo, 1)

        # Continuous Limit (min)
        limit_box = QHBoxLayout()
        limit_box.setSpacing(4)
        limit_lbl = QLabel("Limit:")
        limit_lbl.setStyleSheet("font-size: 11px; font-weight: 600;")
        self.limit_spin = QSpinBox()
        self.limit_spin.setFixedHeight(34)
        self.limit_spin.setRange(0, 300)
        self.limit_spin.setSuffix(" min")
        self.limit_spin.setValue(15)
        limit_box.addWidget(limit_lbl)
        limit_box.addWidget(self.limit_spin)
        add_row.addLayout(limit_box)

        self.save_rule_btn = QPushButton("+ Save Rule")
        self.save_rule_btn.setObjectName("primaryBtn")
        self.save_rule_btn.setFixedHeight(34)
        self.save_rule_btn.clicked.connect(self._save_rule)
        add_row.addWidget(self.save_rule_btn)

        add_card.add_layout(add_row)
        layout.addWidget(add_card)

        # Rules Table
        table_card = SectionCard("Active Classification Rules", "Used by NEXI's tracking engine to evaluate distraction prompts")
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["Target Pattern", "Type", "Category", "Classification", "Continuous Limit", "Actions"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.horizontalHeader().resizeSection(0, 190)
        self.table.horizontalHeader().resizeSection(1, 100)
        self.table.horizontalHeader().resizeSection(2, 130)
        self.table.horizontalHeader().resizeSection(3, 120)
        self.table.horizontalHeader().resizeSection(4, 130)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setShowGrid(False)
        self.table.setAlternatingRowColors(True)

        table_card.add_widget(self.table)
        layout.addWidget(table_card, 1)

    def _apply_theme(self):
        c = self.theme_mgr.colors
        self.title_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 22px; font-weight: 800; letter-spacing: 0.2px;")
        self.sub_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 12px; font-weight: 400;")

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

    def _save_rule(self):
        pat = self.pattern_input.text().strip().lower()
        if not pat:
            return
        rule_type = self.type_combo.currentData()
        cat = self.cat_combo.currentData()
        classification = int(self.class_combo.currentData())
        limit_min = self.limit_spin.value()

        self.repo.add_or_update_rule(
            pattern=pat,
            rule_type=rule_type,
            category_name=cat,
            classification=classification,
            continuous_limit_min=limit_min
        )
        self.pattern_input.clear()
        self.refresh_data()

    def refresh_data(self):
        rules = self.repo.get_rules()
        self.table.setRowCount(len(rules))
        c = self.theme_mgr.colors

        for row_idx, r in enumerate(rules):
            item_pat = QTableWidgetItem(r["pattern"])
            item_pat.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))

            item_type = QTableWidgetItem("WEBSITE" if r["rule_type"] == "domain" else "APP")
            item_type.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            item_type.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))

            item_cat = QTableWidgetItem(r["category_name"] or "Other")

            cls_val = r["classification"]
            cls_text = "PRODUCTIVE" if cls_val == 1 else ("DISTRACTING" if cls_val == -1 else "NEUTRAL")
            cls_color = c["accent"] if cls_val == 1 else (c["warning"] if cls_val == -1 else c["text_secondary"])
            item_cls = QTableWidgetItem(cls_text)
            item_cls.setForeground(QColor(cls_color))
            item_cls.setFont(QFont("Segoe UI", 8, QFont.Weight.ExtraBold))
            item_cls.setTextAlignment(Qt.AlignmentFlag.AlignCenter)

            lim = r["continuous_limit_min"]
            lim_str = f"{lim} mins" if lim > 0 else "Unlimited"
            item_lim = QTableWidgetItem(lim_str)
            item_lim.setTextAlignment(Qt.AlignmentFlag.AlignCenter)

            del_btn = QPushButton("Delete")
            del_btn.setObjectName("dangerBtn")
            del_btn.setFixedHeight(24)
            pat = r["pattern"]
            del_btn.clicked.connect(lambda checked=False, p=pat: self._delete_rule(p))

            self.table.setItem(row_idx, 0, item_pat)
            self.table.setItem(row_idx, 1, item_type)
            self.table.setItem(row_idx, 2, item_cat)
            self.table.setItem(row_idx, 3, item_cls)
            self.table.setItem(row_idx, 4, item_lim)
            self.table.setCellWidget(row_idx, 5, del_btn)

    def _delete_rule(self, pattern: str):
        self.repo.delete_rule(pattern)
        self.refresh_data()
