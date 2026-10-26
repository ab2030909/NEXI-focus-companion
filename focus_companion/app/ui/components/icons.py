"""
Crisp, vector-drawn icon generator for NEXI UI using QPainter.
Produces clean, modern geometric icons with anti-aliasing and pixel-perfect rendering.
"""

from PySide6.QtGui import QIcon, QPixmap, QPainter, QColor, QPen, QPainterPath
from PySide6.QtCore import Qt, QPointF, QRectF


def draw_sidebar_icon(icon_name: str, color_hex: str, size: int = 18) -> QIcon:
    """Draws a vector icon for navigation and buttons with customizable color and size."""
    pix = QPixmap(size, size)
    pix.fill(Qt.GlobalColor.transparent)

    painter = QPainter(pix)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

    col = QColor(color_hex)
    pen = QPen(col, 1.6, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin)
    painter.setPen(pen)
    painter.setBrush(Qt.BrushStyle.NoBrush)

    s = float(size)
    p = 2.5  # padding

    if icon_name == "focus":
        # Target / Focus reticle: circle with crosshairs
        center = s / 2.0
        r = (s - 2 * p) / 2.0
        painter.drawEllipse(QPointF(center, center), r, r)
        painter.drawEllipse(QPointF(center, center), 2.2, 2.2)
        # 4 tick marks
        painter.drawLine(QPointF(center, p - 1), QPointF(center, p + 2.5))
        painter.drawLine(QPointF(center, s - p - 2.5), QPointF(center, s - p + 1))
        painter.drawLine(QPointF(p - 1, center), QPointF(p + 2.5, center))
        painter.drawLine(QPointF(s - p - 2.5, center), QPointF(s - p + 1, center))

    elif icon_name == "timeline":
        # Clock / Chrono timeline icon
        center = s / 2.0
        r = (s - 2 * p) / 2.0
        painter.drawEllipse(QPointF(center, center), r, r)
        # Clock hands pointing at 10:10
        painter.drawLine(QPointF(center, center), QPointF(center, center - r * 0.55))
        painter.drawLine(QPointF(center, center), QPointF(center + r * 0.45, center))

    elif icon_name == "rules":
        # Sliders / Filters / App rules icon
        # 3 horizontal lines with slider handles
        y1 = s * 0.28
        y2 = s * 0.50
        y3 = s * 0.72
        painter.drawLine(QPointF(p, y1), QPointF(s - p, y1))
        painter.drawLine(QPointF(p, y2), QPointF(s - p, y2))
        painter.drawLine(QPointF(p, y3), QPointF(s - p, y3))

        # Slider knobs
        painter.setBrush(col)
        painter.drawEllipse(QPointF(p + (s - 2*p) * 0.35, y1), 2.0, 2.0)
        painter.drawEllipse(QPointF(p + (s - 2*p) * 0.70, y2), 2.0, 2.0)
        painter.drawEllipse(QPointF(p + (s - 2*p) * 0.25, y3), 2.0, 2.0)

    elif icon_name == "radar":
        # Radar dish / Analytics bar chart icon
        b1_h = s * 0.35
        b2_h = s * 0.70
        b3_h = s * 0.50
        b4_h = s * 0.85
        bw = (s - 2 * p) / 5.0
        by = s - p

        # 4 bars
        painter.drawLine(QPointF(p + bw * 0.5, by), QPointF(p + bw * 0.5, by - b1_h))
        painter.drawLine(QPointF(p + bw * 1.7, by), QPointF(p + bw * 1.7, by - b2_h))
        painter.drawLine(QPointF(p + bw * 2.9, by), QPointF(p + bw * 2.9, by - b3_h))
        painter.drawLine(QPointF(p + bw * 4.1, by), QPointF(p + bw * 4.1, by - b4_h))

    elif icon_name == "settings":
        # Minimalist gear cog
        center = s / 2.0
        r_out = (s - 2 * p) / 2.0
        r_in = r_out * 0.45
        painter.drawEllipse(QPointF(center, center), r_in, r_in)
        painter.drawEllipse(QPointF(center, center), r_out, r_out)

    elif icon_name == "mascot":
        # Friendly bot visor icon
        rect = QRectF(p, p + 1, s - 2 * p, s - 2 * p - 2)
        painter.drawRoundedRect(rect, 4.0, 4.0)
        # Antenna
        painter.drawLine(QPointF(s / 2.0, p + 1), QPointF(s / 2.0, p - 1.5))
        # Eyes
        painter.setBrush(col)
        painter.drawEllipse(QPointF(s * 0.38, s * 0.50), 1.5, 1.5)
        painter.drawEllipse(QPointF(s * 0.62, s * 0.50), 1.5, 1.5)

    elif icon_name == "play":
        # Play triangle
        path = QPainterPath()
        path.moveTo(p + 3, p + 1)
        path.lineTo(s - p - 1, s / 2.0)
        path.lineTo(p + 3, s - p - 1)
        path.closeSubpath()
        painter.setBrush(col)
        painter.drawPath(path)

    elif icon_name == "pause":
        # Pause 2 vertical bars
        bw = 2.5
        painter.setBrush(col)
        painter.drawRoundedRect(QRectF(s * 0.32 - bw/2, p + 1, bw, s - 2*p - 2), 1, 1)
        painter.drawRoundedRect(QRectF(s * 0.68 - bw/2, p + 1, bw, s - 2*p - 2), 1, 1)

    elif icon_name == "stop":
        # Stop square
        painter.setBrush(col)
        painter.drawRoundedRect(QRectF(p + 2, p + 2, s - 2*p - 4, s - 2*p - 4), 2, 2)

    elif icon_name == "coffee":
        # Break / Coffee cup
        cup_w = s - 2*p - 3
        cup_h = (s - 2*p) * 0.65
        painter.drawRoundedRect(QRectF(p, s - p - cup_h, cup_w, cup_h), 2, 2)
        # Handle
        painter.drawArc(QRectF(p + cup_w - 2, s - p - cup_h + 1, 5, cup_h - 2), -90 * 16, 180 * 16)

    elif icon_name == "sparkles":
        # AI Sparkle
        center = s / 2.0
        path = QPainterPath()
        path.moveTo(center, p)
        path.quadTo(center, center, s - p, center)
        path.quadTo(center, center, center, s - p)
        path.quadTo(center, center, p, center)
        path.quadTo(center, center, center, p)
        painter.setBrush(col)
        painter.drawPath(path)

    painter.end()
    return QIcon(pix)
