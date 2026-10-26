"""
Focus Radar — Visual Analytics Dashboard for NEXI.
Segmented bars, 24-hour activity timeline, ranked app/website breakdowns,
multi-period aggregation (Today, 7 Days, 30 Days), and ground-truth SQLite data.
"""

from typing import Dict, Any, List
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QFrame, QTextEdit, QMessageBox, QButtonGroup,
    QGridLayout, QSizePolicy
)
from PySide6.QtCore import Qt, QThread, Signal, QRectF
from PySide6.QtGui import QFont, QColor, QPainter, QBrush, QPen
from focus_companion.app.database.repository import Repository
from focus_companion.app.integrations.groq_client import GroqCoach
from focus_companion.app.ui.components.cards import SectionCard, MetricCard
from focus_companion.app.ui.components.charts import (
    SegmentedHourlyTimelineWidget, SegmentedProgressBar
)
from focus_companion.app.ui.components.icons import draw_sidebar_icon
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class AIWorkerThread(QThread):
    finished = Signal(str)

    def __init__(self, coach: GroqCoach, metrics: dict):
        super().__init__()
        self.coach = coach
        self.metrics = metrics

    def run(self):
        result = self.coach.generate_weekly_insights(self.metrics)
        self.finished.emit(result)


class AppSiteRowWidget(QFrame):
    """
    Ranked item row showing initial icon/badge, title, category,
    segmented horizontal usage bar, duration, and percentage.
    """
    def __init__(self, item: Dict[str, Any], parent=None):
        super().__init__(parent)
        self.item = item
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self._apply_style())

        self.setFixedHeight(50)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(14, 6, 14, 6)
        layout.setSpacing(14)

        # 1. Initial Icon Avatar Badge
        name = item.get("name", "Unknown")
        initial = (name[0] if name else "?").upper()
        item_type = item.get("type", "app")
        classification = item.get("classification", 0)

        self.avatar_lbl = QLabel(initial)
        self.avatar_lbl.setFixedSize(34, 34)
        self.avatar_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.avatar_lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        layout.addWidget(self.avatar_lbl)

        # 2. Name & Category Box
        info_box = QVBoxLayout()
        info_box.setSpacing(2)
        info_box.setContentsMargins(0, 2, 0, 2)

        self.name_lbl = QLabel(name)
        self.name_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.DemiBold))
        self.name_lbl.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Preferred)

        cat_text = f"{item.get('category_name', 'General')}  •  {'Website' if item_type == 'site' else 'Application'}"
        self.cat_lbl = QLabel(cat_text)
        self.cat_lbl.setFont(QFont("Segoe UI", 8))

        info_box.addWidget(self.name_lbl)
        info_box.addWidget(self.cat_lbl)
        layout.addLayout(info_box, 2)

        # 3. Segmented Usage Bar
        percent = item.get("percent", 0.0)
        self.seg_bar = SegmentedProgressBar(percent=percent, classification=classification, num_blocks=16)
        self.seg_bar.setMinimumWidth(120)
        layout.addWidget(self.seg_bar, 3)

        # 4. Duration text
        total_sec = item.get("total_sec", 0)
        h = total_sec // 3600
        m = (total_sec % 3600) // 60
        s = total_sec % 60
        if h > 0:
            dur_str = f"{h}h {m}m"
        elif m > 0:
            dur_str = f"{m}m {s}s"
        else:
            dur_str = f"{s}s"

        self.dur_lbl = QLabel(dur_str)
        self.dur_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.dur_lbl.setFixedWidth(68)
        self.dur_lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        layout.addWidget(self.dur_lbl)

        # 5. Percentage Label
        self.pct_lbl = QLabel(f"{percent:.1f}%")
        self.pct_lbl.setFont(QFont("Segoe UI", 9, QFont.Weight.Medium))
        self.pct_lbl.setFixedWidth(50)
        self.pct_lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        layout.addWidget(self.pct_lbl)

        self._apply_style()

    def _apply_style(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        classification = self.item.get("classification", 0)

        if classification == 1:
            badge_bg = adjust_color(c["accent"], 0.25 if c.get("mode") == "dark" else 1.6)
            badge_fg = c["accent"]
        elif classification == -1:
            badge_bg = adjust_color(c["warning"], 0.25 if c.get("mode") == "dark" else 1.6)
            badge_fg = c["warning"]
        else:
            badge_bg = adjust_color(c["bg_panel"], 1.25 if c.get("mode") == "dark" else 0.90)
            badge_fg = c["text_primary"]

        self.setStyleSheet(f"""
            QFrame {{
                background-color: {c["bg_panel"]};
                border: 1px solid {c["border"]};
                border-radius: {max(4, cr - 2)}px;
            }}
            QFrame:hover {{
                border-color: {adjust_color(c["border"], 1.5 if c.get("mode") == "dark" else 0.8)};
                background-color: {adjust_color(c["bg_panel"], 1.08 if c.get("mode") == "dark" else 0.98)};
            }}
        """)
        self.avatar_lbl.setStyleSheet(f"""
            background-color: {badge_bg};
            color: {badge_fg};
            border-radius: 6px;
            border: 1px solid {c["border"]};
        """)
        self.name_lbl.setStyleSheet(f"color: {c['text_primary']}; border: none; background: transparent;")
        self.cat_lbl.setStyleSheet(f"color: {c['text_secondary']}; border: none; background: transparent;")
        self.dur_lbl.setStyleSheet(f"color: {c['text_primary']}; border: none; background: transparent;")
        self.pct_lbl.setStyleSheet(f"color: {c['text_secondary']}; border: none; background: transparent;")


class AnalyticsStatBadge(QFrame):
    """
    Compact secondary analytics badge for peak hour, distracting site, etc.
    """
    def __init__(self, title: str, value: str = "—", icon_name: str = "sparkles", parent=None):
        super().__init__(parent)
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self._apply_style())

        self.title_text = title
        self.value_text = value
        self.icon_name = icon_name

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(10)

        self.icon_lbl = QLabel()
        self.icon_lbl.setFixedSize(24, 24)
        layout.addWidget(self.icon_lbl)

        text_layout = QVBoxLayout()
        text_layout.setSpacing(2)
        self.title_lbl = QLabel(title.upper())
        self.val_lbl = QLabel(value)
        text_layout.addWidget(self.title_lbl)
        text_layout.addWidget(self.val_lbl)
        layout.addLayout(text_layout)
        layout.addStretch()

        self._apply_style()

    def set_value(self, value: str):
        self.val_lbl.setText(value)

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
        self.title_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 10px; font-weight: 700; border: none; background: transparent; letter-spacing: 0.5px;")
        self.val_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 13px; font-weight: 700; border: none; background: transparent;")
        self.icon_lbl.setPixmap(draw_sidebar_icon(self.icon_name, c["accent"], 18).pixmap(18, 18))


class RadarPage(QWidget):
    """
    Redesigned Focus Radar visual analytics dashboard with:
    1. Header & Period Selector (Today, 7 Days, 30 Days)
    2. Summary Metric Cards (Total Active, Focus Time, Distraction, Top App)
    3. 4 Compact Analytics Badges (Most-used App, Distracting Site, Peak Hour, Focus Trend)
    4. 24-Hour Segmented Activity Timeline Chart with hover inspection
    5. Ranked App and Website Breakdown with Segmented Horizontal Bars & All/Apps/Sites filters
    6. Ground-truth SQLite database connection with graceful empty states
    7. AI Habit Coach (Groq) optional integration
    """
    def __init__(self, repository: Repository, parent=None):
        super().__init__(parent)
        self.repo = repository
        self.theme_mgr = ThemeManager.get_instance(repository)
        self.ai_worker = None

        self.current_period_days = 1  # 1 = Today, 7 = 7 Days, 30 = 30 Days
        self.current_breakdown_filter = "all"  # 'all', 'apps', 'sites'

        self._init_ui()
        self.theme_mgr.theme_changed.connect(self._on_theme_changed)
        self._apply_theme()
        self.refresh_data()

    def _init_ui(self):
        outer_layout = QVBoxLayout(self)
        outer_layout.setContentsMargins(0, 0, 0, 0)
        outer_layout.setSpacing(0)

        # Scrollable container so dashboard scales cleanly across resolutions
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        content_widget = QWidget()
        self.content_layout = QVBoxLayout(content_widget)
        self.content_layout.setContentsMargins(28, 22, 28, 26)
        self.content_layout.setSpacing(18)

        # -------------------------------------------------------------
        # 1. HEADER & PERIOD SELECTOR
        # -------------------------------------------------------------
        header_row = QHBoxLayout()
        header_row.setSpacing(16)

        title_box = QVBoxLayout()
        title_box.setSpacing(3)
        self.title_lbl = QLabel("Focus Radar")
        self.sub_lbl = QLabel("Understand where your time goes.")
        title_box.addWidget(self.title_lbl)
        title_box.addWidget(self.sub_lbl)
        header_row.addLayout(title_box)
        header_row.addStretch()

        # Period Segmented Selector (Today / 7 Days / 30 Days)
        self.period_container = QFrame()
        self.period_container.setObjectName("segmentedFilter")
        period_layout = QHBoxLayout(self.period_container)
        period_layout.setContentsMargins(4, 4, 4, 4)
        period_layout.setSpacing(4)

        self.btn_period_today = QPushButton("Today")
        self.btn_period_7d = QPushButton("7 Days")
        self.btn_period_30d = QPushButton("30 Days")

        self.btn_period_today.setCheckable(True)
        self.btn_period_7d.setCheckable(True)
        self.btn_period_30d.setCheckable(True)
        self.btn_period_today.setChecked(True)

        self.btn_period_today.setFixedHeight(30)
        self.btn_period_7d.setFixedHeight(30)
        self.btn_period_30d.setFixedHeight(30)

        self.period_group = QButtonGroup(self)
        self.period_group.setExclusive(True)
        self.period_group.addButton(self.btn_period_today, 1)
        self.period_group.addButton(self.btn_period_7d, 7)
        self.period_group.addButton(self.btn_period_30d, 30)
        self.period_group.idClicked.connect(self._on_period_changed)

        period_layout.addWidget(self.btn_period_today)
        period_layout.addWidget(self.btn_period_7d)
        period_layout.addWidget(self.btn_period_30d)
        header_row.addWidget(self.period_container)

        self.content_layout.addLayout(header_row)

        # -------------------------------------------------------------
        # 2. SUMMARY METRIC CARDS
        # -------------------------------------------------------------
        metrics_grid = QGridLayout()
        metrics_grid.setSpacing(14)

        self.card_active = MetricCard("Total Active Time", "0m", "Recorded desktop usage")
        self.card_focus = MetricCard("Focus Time", "0m", "Productive apps & sessions", accent_override="#FF6B35")
        self.card_distraction = MetricCard("Distraction Time", "0m", "Websites & entertainment", accent_override="#FFB020")
        self.card_top_app = MetricCard("Top App", "—", "Highest continuous time")

        metrics_grid.addWidget(self.card_active, 0, 0)
        metrics_grid.addWidget(self.card_focus, 0, 1)
        metrics_grid.addWidget(self.card_distraction, 0, 2)
        metrics_grid.addWidget(self.card_top_app, 0, 3)

        self.content_layout.addLayout(metrics_grid)

        # -------------------------------------------------------------
        # 3. COMPACT ANALYTICS BADGES
        # -------------------------------------------------------------
        badge_row = QHBoxLayout()
        badge_row.setSpacing(12)

        self.badge_most_used = AnalyticsStatBadge("Most-Used App", "—", "clock")
        self.badge_dist_site = AnalyticsStatBadge("Most Distracting Site", "None", "sparkles")
        self.badge_peak_hour = AnalyticsStatBadge("Peak Activity Hour", "—", "calendar")
        self.badge_focus_trend = AnalyticsStatBadge("Daily Focus Trend", "Stable", "target")

        badge_row.addWidget(self.badge_most_used)
        badge_row.addWidget(self.badge_dist_site)
        badge_row.addWidget(self.badge_peak_hour)
        badge_row.addWidget(self.badge_focus_trend)

        self.content_layout.addLayout(badge_row)

        # -------------------------------------------------------------
        # 4. ACTIVITY TIMELINE CARD (24-Hour Segmented Chart)
        # -------------------------------------------------------------
        self.timeline_card = SectionCard(
            "24-Hour Activity Timeline",
            "Segmented activity blocks by hour. Hover over any bar to inspect exact minutes."
        )
        self.segmented_timeline = SegmentedHourlyTimelineWidget()
        self.timeline_card.add_widget(self.segmented_timeline)
        self.content_layout.addWidget(self.timeline_card)

        # -------------------------------------------------------------
        # 5. APP AND WEBSITE BREAKDOWN CARD
        # -------------------------------------------------------------
        self.breakdown_card = SectionCard(
            "App & Website Breakdown",
            "Applications and websites ranked by actual active time with segmented blocks."
        )

        # Filter buttons row (All / Apps / Sites)
        filter_row = QHBoxLayout()
        filter_row.setSpacing(8)

        self.breakdown_filter_container = QFrame()
        self.breakdown_filter_container.setObjectName("segmentedFilter")
        b_filter_layout = QHBoxLayout(self.breakdown_filter_container)
        b_filter_layout.setContentsMargins(3, 3, 3, 3)
        b_filter_layout.setSpacing(4)

        self.btn_filter_all = QPushButton("All")
        self.btn_filter_apps = QPushButton("Apps")
        self.btn_filter_sites = QPushButton("Sites")

        self.btn_filter_all.setCheckable(True)
        self.btn_filter_apps.setCheckable(True)
        self.btn_filter_sites.setCheckable(True)
        self.btn_filter_all.setChecked(True)

        self.btn_filter_all.setFixedHeight(28)
        self.btn_filter_apps.setFixedHeight(28)
        self.btn_filter_sites.setFixedHeight(28)

        self.breakdown_btn_group = QButtonGroup(self)
        self.breakdown_btn_group.setExclusive(True)
        self.breakdown_btn_group.addButton(self.btn_filter_all)
        self.breakdown_btn_group.addButton(self.btn_filter_apps)
        self.breakdown_btn_group.addButton(self.btn_filter_sites)

        self.btn_filter_all.clicked.connect(lambda: self._on_breakdown_filter_changed("all"))
        self.btn_filter_apps.clicked.connect(lambda: self._on_breakdown_filter_changed("apps"))
        self.btn_filter_sites.clicked.connect(lambda: self._on_breakdown_filter_changed("sites"))

        b_filter_layout.addWidget(self.btn_filter_all)
        b_filter_layout.addWidget(self.btn_filter_apps)
        b_filter_layout.addWidget(self.btn_filter_sites)

        filter_row.addWidget(self.breakdown_filter_container)
        filter_row.addStretch()

        self.items_count_lbl = QLabel("0 items tracked")
        self.items_count_lbl.setFont(QFont("Segoe UI", 9))
        filter_row.addWidget(self.items_count_lbl)

        self.breakdown_card.add_layout(filter_row)

        # Ranked items container
        self.items_list_layout = QVBoxLayout()
        self.items_list_layout.setSpacing(8)
        self.breakdown_card.add_layout(self.items_list_layout)

        # Empty state label for breakdown
        self.breakdown_empty_lbl = QLabel(
            "No recorded application or website activity for the selected period.\n"
            "Use desktop apps or browse websites to see usage analytics."
        )
        self.breakdown_empty_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.breakdown_empty_lbl.setMinimumHeight(100)
        self.breakdown_empty_lbl.setFont(QFont("Segoe UI", 10))
        self.breakdown_card.add_widget(self.breakdown_empty_lbl)

        self.content_layout.addWidget(self.breakdown_card)

        # -------------------------------------------------------------
        # 6. OPTIONAL GROQ AI HABIT COACH
        # -------------------------------------------------------------
        self.ai_card = SectionCard(
            "NEXI AI Habit Coach",
            "Synthesize your productivity patterns using your local metrics and Groq LLM."
        )
        ai_layout = QVBoxLayout()
        ai_layout.setSpacing(10)

        self.ai_status_row = QHBoxLayout()
        self.ai_status_dot = QLabel("●")
        self.ai_status_lbl = QLabel("Coach Status: Ready to analyze")
        self.ai_status_row.addWidget(self.ai_status_dot)
        self.ai_status_row.addWidget(self.ai_status_lbl)
        self.ai_status_row.addStretch()
        ai_layout.addLayout(self.ai_status_row)

        self.ai_text = QTextEdit()
        self.ai_text.setReadOnly(True)
        self.ai_text.setMinimumHeight(100)
        self.ai_text.setPlaceholderText(
            "Click 'Generate AI Habit Insights' below to analyze your focus trends and top distractions.\n"
            "All visual analytics above work 100% offline without requiring any API key."
        )
        ai_layout.addWidget(self.ai_text)

        ai_btn_row = QHBoxLayout()
        self.generate_ai_btn = QPushButton("Generate AI Habit Insights")
        self.generate_ai_btn.setObjectName("primaryBtn")
        self.generate_ai_btn.setFixedHeight(34)
        self.generate_ai_btn.setIcon(draw_sidebar_icon("sparkles", "#FFFFFF", 16))
        self.generate_ai_btn.clicked.connect(self._run_ai_analysis)
        ai_btn_row.addWidget(self.generate_ai_btn)
        ai_btn_row.addStretch()
        ai_layout.addLayout(ai_btn_row)

        self.ai_card.add_layout(ai_layout)
        self.content_layout.addWidget(self.ai_card)

        scroll.setWidget(content_widget)
        outer_layout.addWidget(scroll)

    def _apply_theme(self):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius

        self.title_lbl.setStyleSheet(f"color: {c['text_primary']}; font-size: 22px; font-weight: 800; letter-spacing: 0.2px;")
        self.sub_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 13px; font-weight: 400;")
        self.items_count_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px;")
        self.breakdown_empty_lbl.setStyleSheet(f"color: {c['text_secondary']}; border: 1px dashed {c['border']}; border-radius: 8px; padding: 24px;")

        # Period buttons styling
        seg_style = f"""
            QFrame#segmentedFilter {{
                background-color: {c['bg_panel']};
                border: 1px solid {c['border']};
                border-radius: {cr}px;
            }}
            QPushButton {{
                background-color: transparent;
                border: none;
                border-radius: {max(2, cr - 4)}px;
                color: {c['text_secondary']};
                font-size: 11px;
                font-weight: 600;
                padding: 4px 14px;
            }}
            QPushButton:hover {{
                color: {c['text_primary']};
                background-color: {adjust_color(c['bg_panel'], 1.15 if c.get('mode') == 'dark' else 0.92)};
            }}
            QPushButton:checked {{
                background-color: {c['accent']};
                color: #FFFFFF;
                font-weight: 700;
            }}
        """
        self.period_container.setStyleSheet(seg_style)
        self.breakdown_filter_container.setStyleSheet(seg_style)

        # AI card text styling
        self.ai_status_dot.setStyleSheet(f"color: {c['accent']}; font-size: 10px; border: none; background: transparent;")
        self.ai_status_lbl.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; font-weight: 700; border: none; background: transparent;")
        self.ai_text.setStyleSheet(f"""
            QTextEdit {{
                background-color: {c['bg_panel']};
                border: 1px solid {c['border']};
                border-radius: {cr}px;
                color: {c['text_primary']};
                padding: 10px 14px;
                font-size: 12px;
                line-height: 1.4;
            }}
        """)

    def _on_theme_changed(self, _):
        self._apply_theme()
        self.refresh_data()

    def _on_period_changed(self, days: int):
        self.current_period_days = days
        self.refresh_data()

    def _on_breakdown_filter_changed(self, filter_type: str):
        self.current_breakdown_filter = filter_type
        self._refresh_breakdown()

    def refresh_data(self):
        """
        Fetches ground-truth data from SQLite for the selected period
        and updates metrics, timeline, and breakdown.
        """
        days = self.current_period_days

        # 1. Summary Metrics
        summary = self.repo.get_period_summary(days=days)

        active_sec = summary.get("active_sec", 0)
        prod_sec = summary.get("productive_sec", 0)
        dist_sec = summary.get("distracting_sec", 0)
        top_app = summary.get("top_app", "—")

        self.card_active.set_value(self._format_duration(active_sec), f"Total active in last {days}d" if days > 1 else "Total active today")
        self.card_focus.set_value(self._format_duration(prod_sec), f"{int((prod_sec/active_sec*100)) if active_sec > 0 else 0}% productive ratio")
        self.card_distraction.set_value(self._format_duration(dist_sec), f"{int((dist_sec/active_sec*100)) if active_sec > 0 else 0}% of active time")
        self.card_top_app.set_value(top_app, "Most active app")

        # 2. Compact Analytics Badges
        self.badge_most_used.set_value(top_app)
        self.badge_dist_site.set_value(summary.get("most_distracting_site", "None"))
        self.badge_peak_hour.set_value(summary.get("peak_hour", "—"))
        self.badge_focus_trend.set_value(summary.get("daily_focus_trend", "Stable"))

        # 3. 24-Hour Segmented Timeline
        hourly_data = self.repo.get_period_hourly(days=days)
        self.segmented_timeline.set_data(hourly_data)

        # 4. App & Website Breakdown
        self._refresh_breakdown()

    def _refresh_breakdown(self):
        # Clear existing rows
        while self.items_list_layout.count() > 0:
            item = self.items_list_layout.takeAt(0)
            w = item.widget()
            if w:
                w.deleteLater()

        items = self.repo.get_period_breakdown(days=self.current_period_days, filter_type=self.current_breakdown_filter)

        if not items:
            self.breakdown_empty_lbl.setVisible(True)
            self.items_count_lbl.setText("0 items tracked")
            return

        self.breakdown_empty_lbl.setVisible(False)
        self.items_count_lbl.setText(f"{len(items)} items tracked")

        # Display top items (limit to 30 for snappy rendering in scroll area)
        for it in items[:30]:
            row = AppSiteRowWidget(it)
            self.items_list_layout.addWidget(row)

    def _format_duration(self, total_sec: int) -> str:
        h = total_sec // 3600
        m = (total_sec % 3600) // 60
        s = total_sec % 60
        if h > 0:
            return f"{h}h {m}m"
        if m > 0:
            return f"{m}m"
        return f"{s}s"

    def _run_ai_analysis(self):
        api_key = self.repo.get_setting("groq_api_key", "")
        model = self.repo.get_setting("groq_model", "openai/gpt-oss-120b")
        coach = GroqCoach(api_key, model)

        c = self.theme_mgr.colors
        if not coach.is_configured():
            self.ai_status_dot.setStyleSheet(f"color: {c['warning']}; font-size: 10px;")
            self.ai_status_lbl.setText("Coach Status: Groq API Key Missing (Go to Settings > Monitoring to configure)")
            QMessageBox.information(
                self,
                "Groq API Key Required",
                "To generate personalized AI coaching insights, add your free GROQ_API_KEY in Settings > Monitoring.\n\n"
                "All visual analytics and charts above work 100% offline without any API key."
            )
            return

        # Prepare actual aggregated local metrics for chosen period
        summary = self.repo.get_period_summary(days=self.current_period_days)
        breakdown = self.repo.get_period_breakdown(days=self.current_period_days, filter_type="all")

        top_apps = [b["name"] for b in breakdown if b["type"] == "app"][:3]
        top_sites = [b["name"] for b in breakdown if b["type"] == "site"][:3]

        metrics = {
            "period_days": self.current_period_days,
            "active_min": summary["active_sec"] // 60,
            "productive_min": summary["productive_sec"] // 60,
            "distracting_min": summary["distracting_sec"] // 60,
            "focus_sessions_count": summary["focus_count"],
            "top_apps": ", ".join(top_apps) or "None",
            "top_distractions": ", ".join(top_sites) or "None"
        }

        self.generate_ai_btn.setEnabled(False)
        self.ai_status_dot.setStyleSheet(f"color: {c['accent']}; font-size: 10px;")
        self.ai_status_lbl.setText("Coach Status: Analyzing local metrics with Groq...")
        self.ai_text.setPlainText("Consulting Groq AI coach with your aggregated statistics...")

        self.ai_worker = AIWorkerThread(coach, metrics)
        self.ai_worker.finished.connect(self._on_ai_finished)
        self.ai_worker.start()

    def _on_ai_finished(self, result: str):
        c = self.theme_mgr.colors
        self.generate_ai_btn.setEnabled(True)
        self.ai_text.setPlainText(result)
        if "error" in result.lower() or "failed" in result.lower():
            self.ai_status_dot.setStyleSheet(f"color: {c['warning']}; font-size: 10px;")
            self.ai_status_lbl.setText("Coach Status: Request encountered an error")
        else:
            self.ai_status_dot.setStyleSheet(f"color: {c['success']}; font-size: 10px;")
            self.ai_status_lbl.setText("Coach Status: Insights generated successfully")
