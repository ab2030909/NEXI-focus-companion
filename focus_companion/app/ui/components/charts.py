"""
Polished custom PySide6 native chart widgets for NEXI.
Draws sleek bars, interactive tooltips/hover states, crisp axes, and designed empty states.
Themed dynamically via ThemeManager tokens.
"""

from typing import List, Dict, Any
from PySide6.QtWidgets import QWidget
from PySide6.QtCore import Qt, QRectF, QPointF
from PySide6.QtGui import QPainter, QColor, QBrush, QPen, QFont, QLinearGradient
from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class WeeklyTrendChart(QWidget):
    """
    Draws an ultra-crisp 7-day bar chart comparing Productive (accent orange)
    vs Distracting (warning amber) with rounded capsules and background tracks.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumHeight(160)
        self.data: List[Dict[str, Any]] = []
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self.update())

    def set_data(self, data: List[Dict[str, Any]]):
        self.data = data
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        c = self.theme_mgr.colors
        accent_color = QColor(c["accent"])
        text_sec = QColor(c["text_secondary"])
        text_prim = QColor(c["text_primary"])
        track_color = QColor(adjust_color(c["bg_panel"], 1.15 if c.get("mode") == "dark" else 0.94))
        dist_color = QColor(c["warning"])
        grid_color = QColor(c["border"])

        w = self.width()
        h = self.height()
        margin_bottom = 28
        margin_top = 22
        margin_side = 24
        chart_h = h - margin_bottom - margin_top

        # Designed Empty State
        total_recorded = sum(d.get("active_sec", 0) for d in self.data) if self.data else 0
        if not self.data or total_recorded == 0:
            painter.setPen(QPen(grid_color, 1, Qt.PenStyle.DashLine))
            painter.drawRoundedRect(QRectF(margin_side, margin_top, w - 2*margin_side, chart_h), 6, 6)
            painter.setPen(text_sec)
            painter.setFont(QFont("Segoe UI", 11))
            painter.drawText(
                QRectF(0, margin_top, w, chart_h),
                Qt.AlignmentFlag.AlignCenter,
                "No activity logged yet this week.\nWork on applications to populate your 7-day trend."
            )
            return

        # Calculate max scale with nice headroom
        max_sec = max([d.get("active_sec", 0) for d in self.data] + [3600])

        # Draw subtle horizontal gridlines at 50% and 100%
        painter.setPen(QPen(QColor(adjust_color(c["border"], 0.75)), 1, Qt.PenStyle.DotLine))
        y_top = margin_top
        y_mid = margin_top + (chart_h / 2.0)
        y_base = h - margin_bottom

        painter.drawLine(QPointF(margin_side, y_top), QPointF(w - margin_side, y_top))
        painter.drawLine(QPointF(margin_side, y_mid), QPointF(w - margin_side, y_mid))
        painter.drawLine(QPointF(margin_side, y_base), QPointF(w - margin_side, y_base))

        # Grid labels
        painter.setFont(QFont("Segoe UI", 8))
        painter.setPen(text_sec)
        top_h_str = f"{int(max_sec // 3600)}h" if max_sec >= 3600 else f"{int(max_sec // 60)}m"
        painter.drawText(QRectF(margin_side - 20, y_top - 6, 18, 12), Qt.AlignmentFlag.AlignRight, top_h_str)

        num_bars = len(self.data)
        col_w = (w - (2 * margin_side)) / max(num_bars, 1)
        bar_w = min(24.0, col_w * 0.45)

        for i, item in enumerate(self.data):
            center_x = margin_side + (i * col_w) + (col_w / 2.0)
            x = center_x - (bar_w / 2.0)

            prod_sec = item.get("prod_sec", 0)
            dist_sec = item.get("dist_sec", 0)
            total_sec = prod_sec + dist_sec

            # Draw background bar track
            painter.setBrush(QBrush(track_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawRoundedRect(
                QRectF(x, margin_top, bar_w, chart_h),
                4.0, 4.0
            )

            # Draw productive portion (accent)
            if prod_sec > 0:
                prod_h = (prod_sec / max_sec) * chart_h
                painter.setBrush(QBrush(accent_color))
                painter.drawRoundedRect(
                    QRectF(x, y_base - prod_h, bar_w, prod_h),
                    3.0, 3.0
                )

            # Draw distracting portion (warning)
            if dist_sec > 0:
                dist_h = (dist_sec / max_sec) * chart_h
                painter.setBrush(QBrush(dist_color))
                painter.drawRoundedRect(
                    QRectF(x, y_base - ((prod_sec + dist_sec) / max_sec) * chart_h, bar_w, dist_h),
                    3.0, 3.0
                )

            # Day label below
            painter.setPen(text_sec)
            painter.setFont(QFont("Segoe UI", 9, QFont.Weight.DemiBold))
            label = item.get("label", "")
            painter.drawText(
                QRectF(center_x - 22, y_base + 6, 44, 18),
                Qt.AlignmentFlag.AlignHCenter,
                label
            )

        # Legend top-right
        painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
        # Prod legend
        painter.setBrush(QBrush(accent_color))
        painter.drawRoundedRect(QRectF(w - margin_side - 150, 4, 8, 8), 2, 2)
        painter.setPen(text_sec)
        painter.drawText(QRectF(w - margin_side - 138, 2, 60, 12), Qt.AlignmentFlag.AlignLeft, "Productive")
        # Dist legend
        painter.setBrush(QBrush(dist_color))
        painter.drawRoundedRect(QRectF(w - margin_side - 70, 4, 8, 8), 2, 2)
        painter.drawText(QRectF(w - margin_side - 58, 2, 60, 12), Qt.AlignmentFlag.AlignLeft, "Distracting")


class HourlyBreakdownChart(QWidget):
    """
    Draws a sleek 24-hour activity distribution ribbon with hour ticks and intensity mapping.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumHeight(110)
        self.data: List[Dict[str, Any]] = []
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self.update())

    def set_data(self, data: List[Dict[str, Any]]):
        self.data = data
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        c = self.theme_mgr.colors
        accent_color = QColor(c["accent"])
        text_sec = QColor(c["text_secondary"])
        track_color = QColor(adjust_color(c["bg_panel"], 1.15 if c.get("mode") == "dark" else 0.94))
        dist_color = QColor(c["warning"])
        grid_color = QColor(c["border"])

        w = self.width()
        h = self.height()
        margin_bottom = 24
        margin_top = 10
        margin_side = 16
        chart_h = h - margin_bottom - margin_top

        total_active = sum(d.get("prod_sec", 0) + d.get("dist_sec", 0) for d in self.data) if self.data else 0
        if not self.data or total_active == 0:
            painter.setPen(QPen(grid_color, 1, Qt.PenStyle.DashLine))
            painter.drawRoundedRect(QRectF(margin_side, margin_top, w - 2*margin_side, chart_h), 6, 6)
            painter.setPen(text_sec)
            painter.setFont(QFont("Segoe UI", 10))
            painter.drawText(
                QRectF(0, margin_top, w, chart_h),
                Qt.AlignmentFlag.AlignCenter,
                "No recorded activity today. Start a focus session or use desktop apps."
            )
            return

        max_sec = 3600.0  # 1 hour max in a block
        col_w = (w - (2 * margin_side)) / 24.0
        bar_w = max(3.0, col_w - 3.0)
        y_base = h - margin_bottom

        for h_idx in range(24):
            item = self.data[h_idx] if h_idx < len(self.data) else {}
            prod_sec = item.get("prod_sec", 0)
            dist_sec = item.get("dist_sec", 0)
            center_x = margin_side + (h_idx * col_w) + (col_w / 2.0)
            x = center_x - (bar_w / 2.0)

            # Track
            painter.setBrush(QBrush(track_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawRoundedRect(QRectF(x, margin_top, bar_w, chart_h), 2, 2)

            # Active bar
            if prod_sec > 0:
                bh = min(chart_h, (prod_sec / max_sec) * chart_h)
                painter.setBrush(QBrush(accent_color))
                painter.drawRoundedRect(QRectF(x, y_base - bh, bar_w, bh), 2, 2)

            if dist_sec > 0:
                dh = min(chart_h, (dist_sec / max_sec) * chart_h)
                painter.setBrush(QBrush(dist_color))
                painter.drawRoundedRect(QRectF(x, y_base - ((prod_sec + dist_sec) / max_sec) * chart_h, bar_w, dh), 2, 2)

            # Hour labels every 4 hours (12am, 4am, 8am, 12pm, 4pm, 8pm)
            if h_idx % 4 == 0:
                painter.setPen(text_sec)
                painter.setFont(QFont("Segoe UI", 8))
                lbl = f"{h_idx:02d}:00"
                painter.drawText(
                    QRectF(center_x - 16, y_base + 4, 32, 14),
                    Qt.AlignmentFlag.AlignHCenter,
                    lbl
                )


class SegmentedHourlyTimelineWidget(QWidget):
    """
    24-hour visual activity timeline built around vertical segmented bars.
    - Hours 00 to 23
    - Height represents actual activity duration
    - Stacked/segmented blocks:
        * Productive/Focus: NEXI Orange (#FF6B35)
        * Neutral/Other: Neutral Grey (#8E8E93 / border blend)
        * Distraction: Warning Amber (#FFB020 / #F59E0B)
    - Full hover state with interactive tooltip displaying exact time breakdown per hour
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumHeight(170)
        self.setMouseTracking(True)
        self.data: List[Dict[str, Any]] = [{"hour": f"{h:02d}", "prod_sec": 0, "neutral_sec": 0, "dist_sec": 0} for h in range(24)]
        self.hovered_hour: int = -1
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self.update())

    def set_data(self, data: List[Dict[str, Any]]):
        if not data:
            self.data = [{"hour": f"{h:02d}", "prod_sec": 0, "neutral_sec": 0, "dist_sec": 0} for h in range(24)]
        else:
            self.data = data
        self.update()

    def mouseMoveEvent(self, event):
        w = self.width()
        margin_side = 22.0
        col_w = (w - (2 * margin_side)) / 24.0
        x = event.position().x()
        if margin_side <= x <= w - margin_side:
            idx = int((x - margin_side) // col_w)
            idx = max(0, min(23, idx))
            if idx != self.hovered_hour:
                self.hovered_hour = idx
                self.update()
        else:
            if self.hovered_hour != -1:
                self.hovered_hour = -1
                self.update()
        super().mouseMoveEvent(event)

    def leaveEvent(self, event):
        if self.hovered_hour != -1:
            self.hovered_hour = -1
            self.update()
        super().leaveEvent(event)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        c = self.theme_mgr.colors
        accent_col = QColor(c["accent"])
        neutral_col = QColor(adjust_color(c["text_secondary"], 0.85 if c.get("mode") == "dark" else 1.15))
        dist_col = QColor(c["warning"])
        track_col = QColor(adjust_color(c["bg_panel"], 1.18 if c.get("mode") == "dark" else 0.94))
        text_sec = QColor(c["text_secondary"])
        text_prim = QColor(c["text_primary"])
        border_col = QColor(c["border"])

        w = self.width()
        h = self.height()
        margin_top = 28.0
        margin_bottom = 30.0
        margin_side = 22.0
        chart_h = h - margin_top - margin_bottom

        # Check total activity
        total_sec = sum(d.get("prod_sec", 0) + d.get("neutral_sec", 0) + d.get("dist_sec", 0) for d in self.data)
        if total_sec == 0:
            painter.setPen(QPen(border_col, 1, Qt.PenStyle.DashLine))
            painter.drawRoundedRect(QRectF(margin_side, margin_top, w - 2*margin_side, chart_h), 6, 6)
            painter.setPen(text_sec)
            painter.setFont(QFont("Segoe UI", 11, QFont.Weight.Medium))
            painter.drawText(
                QRectF(0, margin_top, w, chart_h),
                Qt.AlignmentFlag.AlignCenter,
                "No recorded activity in this period.\nActive window time will populate here automatically."
            )
            return

        # Determine scaling: find max hour duration (cap max scale between 1800s to 3600s for good visibility)
        max_hour_val = max([d.get("prod_sec", 0) + d.get("neutral_sec", 0) + d.get("dist_sec", 0) for d in self.data] + [1800])
        scale_max = max(1800.0, float(max_hour_val))

        col_w = (w - (2 * margin_side)) / 24.0
        bar_w = max(4.0, min(24.0, col_w - 4.0))
        y_base = h - margin_bottom

        # Subtle horizontal guide lines
        painter.setPen(QPen(QColor(adjust_color(c["border"], 0.65)), 1, Qt.PenStyle.DotLine))
        painter.drawLine(QPointF(margin_side, margin_top), QPointF(w - margin_side, margin_top))
        painter.drawLine(QPointF(margin_side, margin_top + chart_h / 2.0), QPointF(w - margin_side, margin_top + chart_h / 2.0))
        painter.drawLine(QPointF(margin_side, y_base), QPointF(w - margin_side, y_base))

        # Render 24 vertical columns with segmented stacked blocks
        for h_idx in range(24):
            item = self.data[h_idx] if h_idx < len(self.data) else {}
            prod = item.get("prod_sec", 0)
            neut = item.get("neutral_sec", 0)
            dist = item.get("dist_sec", 0)
            act_total = prod + neut + dist

            center_x = margin_side + (h_idx * col_w) + (col_w / 2.0)
            x = center_x - (bar_w / 2.0)

            # Draw background slot track
            is_hovered = (h_idx == self.hovered_hour)
            if is_hovered:
                painter.setBrush(QBrush(adjust_color(track_col.name(), 1.25 if c.get("mode") == "dark" else 0.90)))
            else:
                painter.setBrush(QBrush(track_col))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawRoundedRect(QRectF(x, margin_top, bar_w, chart_h), 2.5, 2.5)

            # Segmented blocks stack calculation
            # We divide the total activity into segments (e.g. 5-min block height or proportional blocks)
            # To create distinct segmented blocks: draw segments of 4px height with 1.5px gap
            if act_total > 0:
                total_bar_h = min(chart_h, (act_total / scale_max) * chart_h)
                segment_step = 6.0  # 4.5px fill + 1.5px gap
                num_segments = max(1, int(total_bar_h // segment_step))
                
                # Proportions
                p_ratio = prod / act_total
                n_ratio = neut / act_total
                d_ratio = dist / act_total

                p_segs = int(round(num_segments * p_ratio))
                d_segs = int(round(num_segments * d_ratio))
                n_segs = max(0, num_segments - p_segs - d_segs)

                curr_y = y_base
                # Draw productive segments (Orange)
                for _ in range(p_segs):
                    curr_y -= segment_step
                    painter.setBrush(QBrush(accent_col))
                    painter.drawRoundedRect(QRectF(x, curr_y + 1.5, bar_w, segment_step - 1.5), 1.5, 1.5)

                # Draw neutral segments (Grey)
                for _ in range(n_segs):
                    curr_y -= segment_step
                    painter.setBrush(QBrush(neutral_col))
                    painter.drawRoundedRect(QRectF(x, curr_y + 1.5, bar_w, segment_step - 1.5), 1.5, 1.5)

                # Draw distracting segments (Warning Amber)
                for _ in range(d_segs):
                    curr_y -= segment_step
                    painter.setBrush(QBrush(dist_col))
                    painter.drawRoundedRect(QRectF(x, curr_y + 1.5, bar_w, segment_step - 1.5), 1.5, 1.5)

            # Hour label below
            painter.setFont(QFont("Segoe UI", 8, QFont.Weight.DemiBold if is_hovered else QFont.Weight.Normal))
            if is_hovered:
                painter.setPen(accent_col)
            elif h_idx % 3 == 0:
                painter.setPen(text_sec)
            else:
                painter.setPen(QColor(adjust_color(c["text_secondary"], 0.6)))
            
            lbl = f"{h_idx:02d}"
            painter.drawText(QRectF(center_x - 12, y_base + 6, 24, 14), Qt.AlignmentFlag.AlignHCenter, lbl)

        # Legend in top header
        legend_x = w - margin_side - 260
        painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
        # Focus
        painter.setBrush(QBrush(accent_col))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRoundedRect(QRectF(legend_x, 6, 8, 8), 2, 2)
        painter.setPen(text_sec)
        painter.drawText(QRectF(legend_x + 12, 4, 65, 14), Qt.AlignmentFlag.AlignLeft, "Focus Time")

        # Other / Neutral
        painter.setBrush(QBrush(neutral_col))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRoundedRect(QRectF(legend_x + 85, 6, 8, 8), 2, 2)
        painter.setPen(text_sec)
        painter.drawText(QRectF(legend_x + 97, 4, 75, 14), Qt.AlignmentFlag.AlignLeft, "Active / Other")

        # Distraction
        painter.setBrush(QBrush(dist_col))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRoundedRect(QRectF(legend_x + 180, 6, 8, 8), 2, 2)
        painter.setPen(text_sec)
        painter.drawText(QRectF(legend_x + 192, 4, 65, 14), Qt.AlignmentFlag.AlignLeft, "Distraction")

        # Draw Tooltip for hovered hour
        if 0 <= self.hovered_hour < len(self.data):
            h_data = self.data[self.hovered_hour]
            p_m = h_data.get("prod_sec", 0) // 60
            n_m = h_data.get("neutral_sec", 0) // 60
            d_m = h_data.get("dist_sec", 0) // 60
            tot_m = (h_data.get("prod_sec", 0) + h_data.get("neutral_sec", 0) + h_data.get("dist_sec", 0)) // 60

            tip_center_x = margin_side + (self.hovered_hour * col_w) + (col_w / 2.0)
            tip_w = 140.0
            tip_h = 56.0
            tip_x = max(margin_side, min(w - margin_side - tip_w, tip_center_x - (tip_w / 2.0)))
            tip_y = margin_top - 6.0

            # Tooltip card box
            painter.setBrush(QBrush(QColor(c["bg_panel"])))
            painter.setPen(QPen(accent_col if tot_m > 0 else border_col, 1))
            painter.drawRoundedRect(QRectF(tip_x, tip_y, tip_w, tip_h), 6, 6)

            painter.setPen(text_prim)
            painter.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
            painter.drawText(QRectF(tip_x + 8, tip_y + 6, tip_w - 16, 14), Qt.AlignmentFlag.AlignLeft, f"Hour {self.hovered_hour:02d}:00 - {tot_m}m Active")

            painter.setFont(QFont("Segoe UI", 8))
            painter.setPen(text_sec)
            detail_txt = f"Focus: {p_m}m  •  Other: {n_m}m  •  Dist: {d_m}m"
            painter.drawText(QRectF(tip_x + 8, tip_y + 24, tip_w - 16, 24), Qt.AlignmentFlag.AlignLeft | Qt.TextFlag.TextWordWrap, detail_txt)


class SegmentedProgressBar(QWidget):
    """
    Renders horizontal segmented blocks representing a percentage (0 to 100%).
    Replaces plain boring progress bar with distinctive modular blocks.
    """
    def __init__(self, percent: float = 0.0, classification: int = 0, num_blocks: int = 14, parent=None):
        super().__init__(parent)
        self.percent = max(0.0, min(100.0, percent))
        self.classification = classification
        self.num_blocks = num_blocks
        self.setFixedHeight(14)
        self.setMinimumWidth(110)
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self.update())

    def set_value(self, percent: float, classification: int = 0):
        self.percent = max(0.0, min(100.0, percent))
        self.classification = classification
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        c = self.theme_mgr.colors
        if self.classification == 1:
            active_col = QColor(c["accent"])
        elif self.classification == -1:
            active_col = QColor(c["warning"])
        else:
            active_col = QColor(adjust_color(c["text_secondary"], 0.85 if c.get("mode") == "dark" else 1.15))

        empty_col = QColor(adjust_color(c["bg_panel"], 1.12 if c.get("mode") == "dark" else 0.94))

        w = self.width()
        h = self.height()
        gap = 2.5
        total_gaps = (self.num_blocks - 1) * gap
        block_w = (w - total_gaps) / self.num_blocks
        block_h = h - 2

        # Calculate how many blocks to light up
        # If percent > 0, light at least 1 block
        if self.percent <= 0:
            active_count = 0
        else:
            fraction = self.percent / 100.0
            active_count = max(1, int(round(fraction * self.num_blocks)))

        painter.setPen(Qt.PenStyle.NoPen)
        for i in range(self.num_blocks):
            bx = i * (block_w + gap)
            by = 1
            if i < active_count:
                painter.setBrush(QBrush(active_col))
            else:
                painter.setBrush(QBrush(empty_col))
            painter.drawRoundedRect(QRectF(bx, by, block_w, block_h), 2.0, 2.0)

