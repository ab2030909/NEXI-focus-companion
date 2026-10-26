"""
NEXI Mascot Widget - "Your Focus Companion"
An original cute futuristic floating robot:
- Smooth aerodynamic white shell with subtle shading
- Glossy dark oval visor
- Glowing neon-orange digital expressive eyes
- Levitating small lower body / hover thruster
- Distinctive glowing orange halo floating above the head
- Anti-aliased vector rendering via QPainter with lightweight frame-based bobbing and eye expressions.
"""

import math
from PySide6.QtWidgets import QWidget
from PySide6.QtCore import Qt, QTimer, QRectF, QPointF
from PySide6.QtGui import (
    QPainter, QColor, QBrush, QPen, QRadialGradient, QLinearGradient, QPainterPath
)


from focus_companion.app.ui.components.theme import ThemeManager, adjust_color


class MascotWidget(QWidget):
    # Expression / Mood States
    IDLE = "Idle"
    MONITORING = "Monitoring"
    FOCUSED = "Focused"
    DISTRACTED = "Distracted"
    WARNING = "Warning"
    CELEBRATING = "Celebrating"
    SLEEPING = "Sleeping"
    HAPPY = "Happy"
    CONFUSED = "Confused"

    def __init__(self, size: int = 120, parent=None):
        super().__init__(parent)
        self.setFixedSize(size, size)
        self._mood = self.IDLE
        self._tick = 0
        self._blink = False
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self.update())

        # 30 fps smooth hover animation timer
        self.anim_timer = QTimer(self)
        self.anim_timer.timeout.connect(self._on_anim_tick)
        self.anim_timer.start(33)

    def set_mood(self, mood: str):
        if self._mood != mood:
            self._mood = mood
            self.update()

    def get_mood(self) -> str:
        return self._mood

    def _on_anim_tick(self):
        if self.theme_mgr.reduced_animations:
            self._tick = 0
            self._blink = False
            return
        self._tick = (self._tick + 1) % 360
        # Blink every ~120 frames (approx 4 seconds)
        self._blink = (100 <= (self._tick % 120) <= 106) and (self._mood not in [self.SLEEPING, self.FOCUSED])
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        w = float(self.width())
        h = float(self.height())
        scale = min(w, h) / 120.0

        # Gentle floating hover oscillation (sine wave)
        hover_amp = (1.0 if self.theme_mgr.reduced_animations else 3.0) * scale
        if self._mood == self.SLEEPING:
            hover_offset = math.sin(self._tick * 0.03) * (hover_amp * 0.5)
        elif self._mood == self.CELEBRATING:
            hover_offset = math.sin(self._tick * 0.25) * (hover_amp * 1.8)
        else:
            hover_offset = math.sin(self._tick * 0.08) * hover_amp

        center_x = w / 2.0
        center_y = (h / 2.0) + hover_offset

        # Color Palette linked to ThemeManager
        accent_hex = self.theme_mgr.colors.get("accent", "#FF6B35")
        warn_hex = self.theme_mgr.colors.get("warning", "#FF9800")
        c_orange = QColor(accent_hex)
        c_orange_glow = QColor(c_orange.red(), c_orange.green(), c_orange.blue(), 90)
        c_orange_bright = QColor(adjust_color(accent_hex, 1.25))
        c_white_shell = QColor("#F4F4F6")
        c_shell_shadow = QColor("#D3D3DA")
        c_shell_highlight = QColor("#FFFFFF")
        c_visor = QColor("#121214")
        c_accent_dark = QColor("#222226")

        # 1. Glowing Orange Halo floating above head
        halo_y = center_y - (38.0 * scale)
        halo_w = 42.0 * scale
        halo_h = 10.0 * scale
        
        # Halo pulse
        pulse = 1.0 + 0.08 * math.sin(self._tick * 0.12)
        if self._mood in [self.CELEBRATING, self.FOCUSED]:
            halo_pen_color = c_orange_bright
            halo_glow_color = QColor(255, 120, 60, 160)
        elif self._mood == self.WARNING:
            halo_pen_color = QColor(warn_hex)
            halo_glow_color = QColor(halo_pen_color.red(), halo_pen_color.green(), halo_pen_color.blue(), 140)
        else:
            halo_pen_color = c_orange
            halo_glow_color = c_orange_glow

        # Halo soft glow blur
        halo_glow_pen = QPen(halo_glow_color, 6.0 * scale * pulse)
        painter.setPen(halo_glow_pen)
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.drawEllipse(QPointF(center_x, halo_y), halo_w / 2.0, halo_h / 2.0)

        # Core crisp halo ring
        halo_core_pen = QPen(halo_pen_color, 2.8 * scale)
        painter.setPen(halo_core_pen)
        painter.drawEllipse(QPointF(center_x, halo_y), halo_w / 2.0, halo_h / 2.0)

        # 2. Lower Floating Body / Thruster
        body_y = center_y + (22.0 * scale)
        body_w = 26.0 * scale
        body_h = 14.0 * scale

        # Small hover energy glow underneath
        thrust_glow_grad = QRadialGradient(center_x, body_y + (8.0 * scale), 14.0 * scale)
        thrust_glow_grad.setColorAt(0.0, c_orange)
        thrust_glow_grad.setColorAt(1.0, QColor(255, 107, 53, 0))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(thrust_glow_grad))
        painter.drawEllipse(QPointF(center_x, body_y + (7.0 * scale)), 12.0 * scale, 6.0 * scale)

        # Body pod
        body_grad = QLinearGradient(center_x, body_y, center_x, body_y + body_h)
        body_grad.setColorAt(0.0, c_white_shell)
        body_grad.setColorAt(1.0, c_shell_shadow)
        painter.setBrush(QBrush(body_grad))
        painter.setPen(QPen(c_shell_shadow, 1.0 * scale))
        painter.drawRoundedRect(
            QRectF(center_x - (body_w / 2.0), body_y, body_w, body_h),
            6.0 * scale, 6.0 * scale
        )

        # Body core accent line
        painter.setPen(QPen(c_orange, 1.8 * scale))
        painter.drawLine(
            QPointF(center_x - (7.0 * scale), body_y + (body_h * 0.45)),
            QPointF(center_x + (7.0 * scale), body_y + (body_h * 0.45))
        )

        # 3. Main Head Shell (Smooth White Aerodynamic Capsule)
        head_w = 64.0 * scale
        head_h = 52.0 * scale
        head_top = center_y - (26.0 * scale)
        head_rect = QRectF(center_x - (head_w / 2.0), head_top, head_w, head_h)

        head_grad = QRadialGradient(center_x - (10.0 * scale), head_top + (12.0 * scale), head_w * 0.7)
        head_grad.setColorAt(0.0, c_shell_highlight)
        head_grad.setColorAt(0.7, c_white_shell)
        head_grad.setColorAt(1.0, c_shell_shadow)
        painter.setPen(QPen(QColor("#C8C8D0"), 1.2 * scale))
        painter.setBrush(QBrush(head_grad))
        painter.drawRoundedRect(head_rect, 26.0 * scale, 24.0 * scale)

        # Side antenna audio nodes (left & right subtle white/orange caps)
        ear_h = 14.0 * scale
        ear_w = 5.0 * scale
        painter.setBrush(QBrush(c_shell_shadow))
        painter.setPen(Qt.PenStyle.NoPen)
        # Left ear
        painter.drawRoundedRect(QRectF(head_rect.left() - (ear_w * 0.6), center_y - (ear_h / 2.0), ear_w, ear_h), 2.0 * scale, 2.0 * scale)
        # Right ear
        painter.drawRoundedRect(QRectF(head_rect.right() - (ear_w * 0.4), center_y - (ear_h / 2.0), ear_w, ear_h), 2.0 * scale, 2.0 * scale)

        # 4. Glossy Dark Visor Screen (Face)
        visor_w = 48.0 * scale
        visor_h = 32.0 * scale
        visor_rect = QRectF(center_x - (visor_w / 2.0), center_y - (visor_h / 2.0) - (1.0 * scale), visor_w, visor_h)

        visor_grad = QLinearGradient(visor_rect.topLeft(), visor_rect.bottomLeft())
        visor_grad.setColorAt(0.0, QColor("#1D1D22"))
        visor_grad.setColorAt(0.5, c_visor)
        visor_grad.setColorAt(1.0, QColor("#0A0A0C"))

        painter.setBrush(QBrush(visor_grad))
        painter.setPen(QPen(QColor("#2C2C34"), 1.0 * scale))
        painter.drawRoundedRect(visor_rect, 15.0 * scale, 15.0 * scale)

        # Glass Glare Reflection on Visor
        glare_path = QPainterPath()
        glare_path.moveTo(visor_rect.left() + (6.0 * scale), visor_rect.top() + (3.0 * scale))
        glare_path.quadTo(
            center_x, visor_rect.top() + (2.0 * scale),
            visor_rect.right() - (6.0 * scale), visor_rect.top() + (7.0 * scale)
        )
        glare_path.lineTo(visor_rect.right() - (10.0 * scale), visor_rect.top() + (9.0 * scale))
        glare_path.quadTo(
            center_x, visor_rect.top() + (5.0 * scale),
            visor_rect.left() + (8.0 * scale), visor_rect.top() + (5.0 * scale)
        )
        glare_path.closeSubpath()
        painter.setBrush(QBrush(QColor(255, 255, 255, 35)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawPath(glare_path)

        # 5. Glowing Orange Eyes / Facial Expressions inside Visor
        eye_y = center_y - (1.5 * scale)
        eye_spacing = 11.0 * scale
        left_eye_x = center_x - eye_spacing
        right_eye_x = center_x + eye_spacing

        eye_color = c_orange_bright
        eye_pen = QPen(eye_color, 2.5 * scale, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap)
        painter.setPen(eye_pen)

        if self._mood == self.SLEEPING:
            # Gentle curved sleeping eyelids (- -)
            painter.drawLine(QPointF(left_eye_x - (4.5 * scale), eye_y), QPointF(left_eye_x + (4.5 * scale), eye_y))
            painter.drawLine(QPointF(right_eye_x - (4.5 * scale), eye_y), QPointF(right_eye_x + (4.5 * scale), eye_y))
            # Little floating 'z'
            z_offset = (self._tick % 40) * 0.4 * scale
            painter.setPen(QPen(QColor(255, 255, 255, max(0, 200 - int(z_offset * 15))), 1.5 * scale))
            painter.drawText(QRectF(center_x + (20.0 * scale), center_y - (18.0 * scale) - z_offset, 20, 20), "z")

        elif self._blink:
            # Quick blink line
            painter.drawLine(QPointF(left_eye_x - (4.0 * scale), eye_y), QPointF(left_eye_x + (4.0 * scale), eye_y))
            painter.drawLine(QPointF(right_eye_x - (4.0 * scale), eye_y), QPointF(right_eye_x + (4.0 * scale), eye_y))

        elif self._mood in [self.HAPPY, self.CELEBRATING]:
            # Joyful curved arcs (^ ^)
            painter.setBrush(Qt.BrushStyle.NoBrush)
            arc_rect_l = QRectF(left_eye_x - (5.0 * scale), eye_y - (4.0 * scale), 10.0 * scale, 8.0 * scale)
            arc_rect_r = QRectF(right_eye_x - (5.0 * scale), eye_y - (4.0 * scale), 10.0 * scale, 8.0 * scale)
            painter.drawArc(arc_rect_l, 25 * 16, 130 * 16)
            painter.drawArc(arc_rect_r, 25 * 16, 130 * 16)

            # Extra celebration sparkles
            if self._mood == self.CELEBRATING:
                sparkle_pulse = math.sin(self._tick * 0.3)
                painter.setPen(QPen(QColor("#FFE478"), 1.8 * scale))
                if sparkle_pulse > 0:
                    painter.drawPoint(QPointF(center_x - (28.0 * scale), center_y - (14.0 * scale)))
                    painter.drawPoint(QPointF(center_x + (26.0 * scale), center_y - (20.0 * scale)))
                else:
                    painter.drawPoint(QPointF(center_x + (27.0 * scale), center_y + (8.0 * scale)))

        elif self._mood == self.FOCUSED:
            # Determined, high-focus horizontal pill eyes with center aperture
            painter.setBrush(QBrush(c_orange))
            painter.setPen(QPen(c_orange_bright, 1.0 * scale))
            painter.drawRoundedRect(QRectF(left_eye_x - (5.5 * scale), eye_y - (3.5 * scale), 11.0 * scale, 7.0 * scale), 3.0 * scale, 3.0 * scale)
            painter.drawRoundedRect(QRectF(right_eye_x - (5.5 * scale), eye_y - (3.5 * scale), 11.0 * scale, 7.0 * scale), 3.0 * scale, 3.0 * scale)
            # Inner white cyber pupil dots
            painter.setBrush(QBrush(QColor("#FFFFFF")))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(left_eye_x, eye_y), 1.6 * scale, 1.6 * scale)
            painter.drawEllipse(QPointF(right_eye_x, eye_y), 1.6 * scale, 1.6 * scale)

        elif self._mood in [self.DISTRACTED, self.WARNING]:
            # Wide alert eyes (O O) with red tint when warning
            alert_color = QColor("#FF4444") if self._mood == self.WARNING else c_orange
            painter.setPen(QPen(alert_color, 2.0 * scale))
            painter.setBrush(QBrush(QColor("#150A0A") if self._mood == self.WARNING else QColor("#191008")))
            r_eye = 5.2 * scale
            painter.drawEllipse(QPointF(left_eye_x, eye_y), r_eye, r_eye)
            painter.drawEllipse(QPointF(right_eye_x, eye_y), r_eye, r_eye)
            # Small pupil dots
            painter.setBrush(QBrush(alert_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(left_eye_x, eye_y), 2.0 * scale, 2.0 * scale)
            painter.drawEllipse(QPointF(right_eye_x, eye_y), 2.0 * scale, 2.0 * scale)

        elif self._mood == self.CONFUSED:
            # Asymmetrical eyes (?_o)
            painter.setBrush(QBrush(c_orange))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(left_eye_x, eye_y - (1.0 * scale)), 4.8 * scale, 4.8 * scale)
            painter.drawEllipse(QPointF(right_eye_x, eye_y + (1.0 * scale)), 2.6 * scale, 2.6 * scale)

        else: # IDLE & MONITORING
            # Classic NEXI friendly oval glowing eyes
            painter.setBrush(QBrush(c_orange))
            painter.setPen(QPen(c_orange_bright, 1.0 * scale))
            eye_w = 7.0 * scale
            eye_h = 9.0 * scale
            painter.drawRoundedRect(
                QRectF(left_eye_x - (eye_w / 2.0), eye_y - (eye_h / 2.0), eye_w, eye_h),
                3.5 * scale, 3.5 * scale
            )
            painter.drawRoundedRect(
                QRectF(right_eye_x - (eye_w / 2.0), eye_y - (eye_h / 2.0), eye_w, eye_h),
                3.5 * scale, 3.5 * scale
            )
            # Specular light highlight in eyes
            painter.setBrush(QBrush(QColor(255, 255, 255, 200)))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(left_eye_x + (1.2 * scale), eye_y - (2.0 * scale)), 1.4 * scale, 1.4 * scale)
            painter.drawEllipse(QPointF(right_eye_x + (1.2 * scale), eye_y - (2.0 * scale)), 1.4 * scale, 1.4 * scale)
