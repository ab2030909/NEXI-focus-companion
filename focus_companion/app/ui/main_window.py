"""
Main Window for Focus Companion.
Handles:
- Sidebar navigation between Home, Timeline, Rules, Radar, Settings
- System Tray Icon integration with context menu
- Real-time UI refresh heartbeat
- Distraction intervention dialog prompts
- Floating desktop mascot sync
- Live theme updates via ThemeManager
"""

from typing import Optional
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QPushButton,
    QStackedWidget, QLabel, QSystemTrayIcon, QMenu, QApplication
)
from PySide6.QtCore import Qt, QTimer, QSize, QPointF, QRectF
from PySide6.QtGui import QIcon, QAction, QPixmap, QPainter, QColor, QBrush, QPen, QFont

from focus_companion.app.database.repository import Repository
from focus_companion.app.core.tracker import ActivityTracker
from focus_companion.app.core.focus_engine import FocusEngine
from focus_companion.app.core.intervention import InterventionManager
from focus_companion.app.core.notifications import ReminderScheduler
from focus_companion.app.ui.pages.home_page import HomePage
from focus_companion.app.ui.pages.timeline_page import TimelinePage
from focus_companion.app.ui.pages.rules_page import RulesPage
from focus_companion.app.ui.pages.radar_page import RadarPage
from focus_companion.app.ui.pages.settings_page import SettingsPage
from focus_companion.app.ui.dialogs.intent_dialog import IntentDialog
from focus_companion.app.ui.dialogs.intervention_dialog import InterventionDialog
from focus_companion.app.ui.components.floating_mascot import FloatingCompanionWindow
from focus_companion.app.ui.components.icons import draw_sidebar_icon
from focus_companion.app.ui.components.theme import (
    ThemeManager, adjust_color
)


def create_tray_icon(accent_hex: str = "#FF6B35") -> QIcon:
    """Generates a high-contrast NEXI brand icon with glowing halo for the Windows system tray."""
    pix = QPixmap(32, 32)
    pix.fill(Qt.GlobalColor.transparent)
    painter = QPainter(pix)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

    accent_col = QColor(accent_hex)
    eye_col = QColor(adjust_color(accent_hex, 1.25))

    # Outer dark badge
    painter.setBrush(QBrush(QColor("#151518")))
    painter.setPen(QPen(QColor("#333339"), 1.0))
    painter.drawRoundedRect(QRectF(1, 1, 30, 30), 8, 8)

    # Glowing Halo matching accent
    painter.setPen(QPen(accent_col, 1.8))
    painter.setBrush(Qt.BrushStyle.NoBrush)
    painter.drawEllipse(QPointF(16, 7), 6, 2.2)

    # White Head Shell
    painter.setBrush(QBrush(QColor("#F0F0F5")))
    painter.setPen(Qt.PenStyle.NoPen)
    painter.drawRoundedRect(QRectF(7, 10, 18, 14), 7, 7)

    # Dark Visor
    painter.setBrush(QBrush(QColor("#111115")))
    painter.drawRoundedRect(QRectF(10, 13, 12, 8), 4, 4)

    # Glowing Eyes
    painter.setBrush(QBrush(eye_col))
    painter.drawEllipse(QPointF(13.5, 17), 1.2, 1.6)
    painter.drawEllipse(QPointF(18.5, 17), 1.2, 1.6)

    painter.end()
    return QIcon(pix)


class WindowControlBtn(QPushButton):
    """
    Subtle, beautifully rendered window control buttons (minimize, maximize/restore, close).
    - Normal state: subtle neutral grey icons.
    - Hover state: soft neutral background for minimize and maximize/restore.
    - Close hover state: restrained red background with crisp white close icon.
    """
    def __init__(self, btn_type: str = "close", parent=None):
        super().__init__(parent)
        self.btn_type = btn_type  # 'min', 'max', 'restore', 'close'
        self.setFixedSize(38, 30)
        self.setCursor(Qt.CursorShape.ArrowCursor)
        self.theme_mgr = ThemeManager.get_instance()
        self.theme_mgr.theme_changed.connect(lambda _: self.update())

    def set_type(self, btn_type: str):
        if self.btn_type != btn_type:
            self.btn_type = btn_type
            self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        c = self.theme_mgr.colors
        is_dark = c.get("mode") == "dark"
        is_hover = self.underMouse()
        is_pressed = self.isDown()

        w, h = self.width(), self.height()
        cx, cy = w / 2.0, h / 2.0

        if is_hover or is_pressed:
            if self.btn_type == "close":
                bg_col = QColor("#D32F2F" if is_pressed else "#E53935")
                icon_col = QColor("#FFFFFF")
            else:
                alpha = 40 if is_pressed else 22
                bg_col = QColor(255, 255, 255, alpha) if is_dark else QColor(0, 0, 0, alpha)
                icon_col = QColor(c["text_primary"])

            painter.setBrush(QBrush(bg_col))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawRoundedRect(QRectF(3, 2, w - 6, h - 4), 6, 6)
        else:
            icon_col = QColor(c["text_secondary"])

        # Draw crisp vector icon geometry
        painter.setPen(QPen(icon_col, 1.35, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin))

        if self.btn_type == "min":
            painter.drawLine(QPointF(cx - 5.0, cy + 3.0), QPointF(cx + 5.0, cy + 3.0))
        elif self.btn_type == "max":
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawRoundedRect(QRectF(cx - 4.5, cy - 4.5, 9.0, 9.0), 1.5, 1.5)
        elif self.btn_type == "restore":
            painter.setBrush(Qt.BrushStyle.NoBrush)
            # Back square
            painter.drawRoundedRect(QRectF(cx - 2.5, cy - 5.5, 7.5, 7.5), 1.0, 1.0)
            # Front square
            painter.setBrush(QBrush(QColor(c["bg_panel"])))
            painter.drawRoundedRect(QRectF(cx - 5.0, cy - 3.0, 7.5, 7.5), 1.0, 1.0)
        elif self.btn_type == "close":
            sz = 4.2
            painter.drawLine(QPointF(cx - sz, cy - sz), QPointF(cx + sz, cy + sz))
            painter.drawLine(QPointF(cx + sz, cy - sz), QPointF(cx - sz, cy + sz))


class MainWindow(QMainWindow):
    def __init__(self, repository: Repository, tracker: ActivityTracker,
                 focus_engine: FocusEngine, intervention_mgr: InterventionManager,
                 reminder_scheduler: ReminderScheduler):
        super().__init__()
        self.repo = repository
        self.tracker = tracker
        self.focus_engine = focus_engine
        self.intervention_mgr = intervention_mgr
        self.reminder_scheduler = reminder_scheduler

        self.theme_mgr = ThemeManager.get_instance(repository)

        # Frameless window configuration with smooth rounded translucent background
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Window)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)

        self.setWindowTitle("NEXI - Your Focus Companion")
        self.resize(1100, 740)
        self.setMinimumSize(940, 620)
        self.setWindowIcon(create_tray_icon(self.theme_mgr.colors.get("accent", "#FF6B35")))

        # Window resizing & dragging state
        self._border_margin = 8
        self._resizing = False
        self._resize_edge = None
        self._drag_pos = None
        self._orig_geom = None
        self._titlebar_dragging = False
        self._titlebar_drag_pos = None

        self._active_dialog: Optional[InterventionDialog] = None

        # Floating Companion Window
        self.floating_mascot = FloatingCompanionWindow()
        self.floating_mascot.open_app_requested.connect(self.show_and_activate)
        self.floating_mascot.toggle_focus_requested.connect(self._toggle_focus_from_outside)
        self.floating_mascot.toggle_tracking_requested.connect(self._toggle_tracking)
        self.floating_mascot.quit_requested.connect(self.quit_app)

        if self.repo.get_setting("floating_mascot_enabled", "true").lower() == "true":
            self.floating_mascot.move(100, 100)
            self.floating_mascot.show()

        self._init_ui()
        self._init_tray()
        self._wire_engine_callbacks()

        # Connect live theme updates
        self.theme_mgr.theme_changed.connect(self._on_theme_changed)
        self._apply_theme(self.theme_mgr.get_theme_dict())

        # UI Refresh timer (every second)
        self.refresh_timer = QTimer(self)
        self.refresh_timer.timeout.connect(self._on_heartbeat)
        self.refresh_timer.start(1000)

        # Initial data refresh
        self.home_page.refresh_data()

    def _init_ui(self):
        # Master rounded container frame that forms the visual window border and corners
        self.window_frame = QWidget(self)
        self.window_frame.setObjectName("mainWindowFrame")
        
        frame_layout = QVBoxLayout(self.window_frame)
        frame_layout.setContentsMargins(0, 0, 0, 0)
        frame_layout.setSpacing(0)

        # -------------------------------------------------------------
        # 1. Custom Minimal Title Bar
        # -------------------------------------------------------------
        self.title_bar = QWidget()
        self.title_bar.setFixedHeight(36)
        self.title_bar.setObjectName("windowTitleBar")
        
        tb_layout = QHBoxLayout(self.title_bar)
        tb_layout.setContentsMargins(16, 0, 10, 0)
        tb_layout.setSpacing(8)

        # Minimal Title Bar brand icon & title
        self.tb_icon = QLabel()
        self.tb_icon.setFixedSize(18, 18)
        self.tb_icon.setPixmap(create_tray_icon(self.theme_mgr.colors.get("accent", "#FF6B35")).pixmap(18, 18))
        self.tb_title = QLabel("NEXI")
        self.tb_title.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))

        tb_layout.addWidget(self.tb_icon)
        tb_layout.addWidget(self.tb_title)
        tb_layout.addStretch()

        # Window Control Buttons (Minimize, Maximize/Restore, Close)
        self.btn_min = WindowControlBtn("min", self)
        self.btn_max = WindowControlBtn("max", self)
        self.btn_close = WindowControlBtn("close", self)

        self.btn_min.clicked.connect(self.showMinimized)
        self.btn_max.clicked.connect(self._toggle_maximize_restore)
        self.btn_close.clicked.connect(self.close)

        tb_layout.addWidget(self.btn_min)
        tb_layout.addWidget(self.btn_max)
        tb_layout.addWidget(self.btn_close)

        frame_layout.addWidget(self.title_bar)

        # -------------------------------------------------------------
        # 2. Main Content Area (Sidebar + Stacked Pages)
        # -------------------------------------------------------------
        content_container = QWidget()
        root_layout = QHBoxLayout(content_container)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # 2a. Sidebar Navigation
        self.sidebar = QWidget()
        self.sidebar.setFixedWidth(220)
        sb_layout = QVBoxLayout(self.sidebar)
        sb_layout.setContentsMargins(14, 16, 14, 18)
        sb_layout.setSpacing(6)

        # App Brand Header in Sidebar
        brand_box = QHBoxLayout()
        brand_box.setSpacing(10)
        self.brand_icon_lbl = QLabel()
        self.brand_icon_lbl.setPixmap(create_tray_icon(self.theme_mgr.colors.get("accent", "#FF6B35")).pixmap(28, 28))

        brand_text_box = QVBoxLayout()
        brand_text_box.setSpacing(1)
        self.brand_title = QLabel("NEXI")
        self.brand_tagline = QLabel("Focus Companion")
        brand_text_box.addWidget(self.brand_title)
        brand_text_box.addWidget(self.brand_tagline)

        brand_box.addWidget(self.brand_icon_lbl)
        brand_box.addLayout(brand_text_box)
        brand_box.addStretch()
        sb_layout.addLayout(brand_box)
        sb_layout.addSpacing(14)

        # Nav Buttons with Vector Icons
        self.nav_btns = []
        self.nav_items_meta = [
            ("Focus Center", 0, "focus"),
            ("Activity Timeline", 1, "timeline"),
            ("Apps & Rules", 2, "rules"),
            ("Focus Radar", 3, "radar"),
            ("Settings", 4, "settings")
        ]

        for text, index, icon_key in self.nav_items_meta:
            btn = QPushButton(f"  {text}")
            btn.setCheckable(True)
            btn.setFixedHeight(38)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.clicked.connect(lambda checked=False, i=index: self._navigate_to(i))
            sb_layout.addWidget(btn)
            self.nav_btns.append(btn)

        sb_layout.addStretch()

        # Mascot widget toggle button in sidebar
        self.mascot_toggle_btn = QPushButton(" Floating Companion")
        self.mascot_toggle_btn.setFixedHeight(36)
        self.mascot_toggle_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.mascot_toggle_btn.clicked.connect(self._toggle_floating_mascot)
        sb_layout.addWidget(self.mascot_toggle_btn)

        root_layout.addWidget(self.sidebar)

        # 2b. Main Stacked Pages
        self.stack = QStackedWidget()
        self.home_page = HomePage(self.repo, self.focus_engine)
        self.home_page.open_intent_dialog_requested.connect(self._open_intent_dialog)
        self.timeline_page = TimelinePage(self.repo)
        self.rules_page = RulesPage(self.repo)
        self.radar_page = RadarPage(self.repo)
        self.settings_page = SettingsPage(
            repository=self.repo,
            tracker=self.tracker,
            intervention_mgr=self.intervention_mgr,
            reminder_scheduler=self.reminder_scheduler
        )

        self.stack.addWidget(self.home_page)
        self.stack.addWidget(self.timeline_page)
        self.stack.addWidget(self.rules_page)
        self.stack.addWidget(self.radar_page)
        self.stack.addWidget(self.settings_page)

        root_layout.addWidget(self.stack, 1)
        frame_layout.addWidget(content_container, 1)

        self.setCentralWidget(self.window_frame)

        # Set default active tab
        self._navigate_to(0)

    def _toggle_maximize_restore(self):
        if self.isMaximized():
            self.showNormal()
            self.btn_max.set_type("max")
        else:
            self.showMaximized()
            self.btn_max.set_type("restore")

    def changeEvent(self, event):
        super().changeEvent(event)
        if event.type() == event.Type.WindowStateChange:
            is_max = self.isMaximized()
            self.btn_max.set_type("restore" if is_max else "max")
            self._update_frame_geometry_style(is_max)

    def _update_frame_geometry_style(self, is_max: bool):
        c = self.theme_mgr.colors
        radius = 0 if is_max else 20
        border_width = 0 if is_max else 1
        bg_color = c.get("bg_main", "#0F0F11")
        panel_color = c.get("bg_panel", "#16161A")
        border_color = c.get("border", "#2B2B33")
        self.window_frame.setStyleSheet(f"""
            QWidget#mainWindowFrame {{
                background-color: {bg_color};
                border: {border_width}px solid {border_color};
                border-radius: {radius}px;
            }}
            QWidget#windowTitleBar {{
                background-color: {panel_color};
                border-top-left-radius: {radius}px;
                border-top-right-radius: {radius}px;
                border-bottom: 1px solid {border_color};
            }}
        """)

    # -------------------------------------------------------------
    # Window Dragging & Edge Resizing Events
    # -------------------------------------------------------------
    def _determine_edge(self, pos):
        rect = self.rect()
        x, y = pos.x(), pos.y()
        bw = self._border_margin
        on_left = x <= bw
        on_right = x >= rect.width() - bw
        on_top = y <= bw
        on_bottom = y >= rect.height() - bw

        if on_top and on_left:
            return "top_left"
        if on_top and on_right:
            return "top_right"
        if on_bottom and on_left:
            return "bottom_left"
        if on_bottom and on_right:
            return "bottom_right"
        if on_left:
            return "left"
        if on_right:
            return "right"
        if on_top:
            return "top"
        if on_bottom:
            return "bottom"
        return None

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            pos = event.position().toPoint()
            if not self.isMaximized():
                edge = self._determine_edge(pos)
                if edge:
                    self._resizing = True
                    self._resize_edge = edge
                    self._drag_pos = event.globalPosition().toPoint()
                    self._orig_geom = self.geometry()
                    event.accept()
                    return

            # Check if dragging title bar
            title_bar_rect = self.title_bar.geometry()
            if title_bar_rect.contains(pos):
                self._titlebar_dragging = True
                self._titlebar_drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
                event.accept()
                return

        super().mousePressEvent(event)

    def mouseDoubleClickEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            pos = event.position().toPoint()
            if self.title_bar.geometry().contains(pos):
                self._toggle_maximize_restore()
                event.accept()
                return
        super().mouseDoubleClickEvent(event)

    def mouseMoveEvent(self, event):
        gpos = event.globalPosition().toPoint()
        pos = event.position().toPoint()

        if self._resizing and self._drag_pos:
            delta = gpos - self._drag_pos
            geom = self._orig_geom
            new_geom = self.geometry()
            edge = self._resize_edge

            if "right" in edge:
                new_w = max(self.minimumWidth(), geom.width() + delta.x())
                new_geom.setWidth(new_w)
            if "bottom" in edge:
                new_h = max(self.minimumHeight(), geom.height() + delta.y())
                new_geom.setHeight(new_h)
            if "left" in edge:
                new_w = max(self.minimumWidth(), geom.width() - delta.x())
                if new_w > self.minimumWidth():
                    new_geom.setLeft(geom.left() + delta.x())
            if "top" in edge:
                new_h = max(self.minimumHeight(), geom.height() - delta.y())
                if new_h > self.minimumHeight():
                    new_geom.setTop(geom.top() + delta.y())

            self.setGeometry(new_geom)
            event.accept()
            return
        elif self._titlebar_dragging and self._titlebar_drag_pos:
            if self.isMaximized():
                # Restore window and reposition under mouse
                self.showNormal()
                self.btn_max.set_type("max")
                self._titlebar_drag_pos = QPointF(self.width() / 2.0, 18).toPoint()
            self.move(gpos - self._titlebar_drag_pos)
            event.accept()
            return
        elif not self.isMaximized():
            edge = self._determine_edge(pos)
            if edge in ("top_left", "bottom_right"):
                self.setCursor(Qt.CursorShape.SizeFDiagCursor)
            elif edge in ("top_right", "bottom_left"):
                self.setCursor(Qt.CursorShape.SizeBDiagCursor)
            elif edge in ("left", "right"):
                self.setCursor(Qt.CursorShape.SizeHorCursor)
            elif edge in ("top", "bottom"):
                self.setCursor(Qt.CursorShape.SizeVerCursor)
            else:
                self.setCursor(Qt.CursorShape.ArrowCursor)

        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        self._resizing = False
        self._resize_edge = None
        self._drag_pos = None
        self._titlebar_dragging = False
        self._titlebar_drag_pos = None
        super().mouseReleaseEvent(event)

    def _apply_theme(self, theme_dict: dict):
        c = self.theme_mgr.colors
        cr = self.theme_mgr.corner_radius
        pad_y = 8 if self.theme_mgr.density == "compact" else 10
        btn_hover_bg = adjust_color(c["bg_panel"], 1.18 if c.get("mode") == "dark" else 0.94)

        # 1. Update Global QSS on App and Window
        qss = self.theme_mgr.generate_stylesheet()
        self.setStyleSheet(qss)
        app = QApplication.instance()
        if app:
            app.setStyleSheet(qss)

        # Update custom rounded frame & titlebar styling
        self._update_frame_geometry_style(self.isMaximized())
        self.tb_icon.setPixmap(create_tray_icon(c["accent"]).pixmap(18, 18))
        self.tb_title.setStyleSheet(f"color: {c['text_secondary']}; font-size: 11px; font-weight: 700; border: none; background: transparent; letter-spacing: 0.5px;")

        # 2. Update Sidebar Styles
        self.sidebar.setStyleSheet(f"""
            QWidget {{
                background-color: {c["bg_panel"]};
                border-right: 1px solid {c["border"]};
            }}
        """)
        self.brand_title.setStyleSheet(f"color: {c['text_primary']}; font-size: 16px; font-weight: 800; letter-spacing: 1.5px; border: none; background: transparent;")
        self.brand_tagline.setStyleSheet(f"color: {c['accent']}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: none; background: transparent;")
        self.brand_icon_lbl.setPixmap(create_tray_icon(c["accent"]).pixmap(30, 30))

        # 3. Update Nav Buttons with theme colors and vector icons
        for idx, btn in enumerate(self.nav_btns):
            icon_key = self.nav_items_meta[idx][2]
            is_active = btn.isChecked()
            icon_color = c['accent'] if is_active else c['text_secondary']
            btn.setIcon(draw_sidebar_icon(icon_key, icon_color, 18))
            btn.setStyleSheet(f"""
                QPushButton {{
                    text-align: left;
                    padding-left: 14px;
                    border: none;
                    background: transparent;
                    color: {c['text_secondary']};
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: {max(5, cr - 2)}px;
                }}
                QPushButton:hover {{
                    background-color: {btn_hover_bg};
                    color: {c['text_primary']};
                }}
                QPushButton:checked {{
                    background-color: {adjust_color(c['bg_panel'], 1.25 if c.get('mode') == 'dark' else 0.9)};
                    color: {c['accent']};
                    border-left: 3px solid {c['accent']};
                    font-weight: 700;
                }}
            """)

        self.mascot_toggle_btn.setIcon(draw_sidebar_icon("mascot", c['accent'], 18))
        self.mascot_toggle_btn.setStyleSheet(f"""
            QPushButton {{
                text-align: left;
                padding-left: 12px;
                background-color: {adjust_color(c['bg_panel'], 1.12 if c.get('mode') == 'dark' else 0.96)};
                border: 1px solid {c['border']};
                border-radius: {max(5, cr - 3)}px;
                color: {c['text_primary']};
                font-size: 12px;
                font-weight: 600;
            }}
            QPushButton:hover {{
                border: 1px solid {c['accent']};
            }}
        """)

        # 4. Update Window and Tray Icon
        tray_icon = create_tray_icon(c["accent"])
        self.setWindowIcon(tray_icon)
        if hasattr(self, "tray"):
            self.tray.setIcon(tray_icon)

    def _on_theme_changed(self, theme_dict: dict):
        self._apply_theme(theme_dict)

    def _init_tray(self):
        self.tray = QSystemTrayIcon(create_tray_icon(self.theme_mgr.colors.get("accent", "#FF6B35")), self)
        self.tray.setToolTip("NEXI - Your Focus Companion")

        c = self.theme_mgr.colors
        menu = QMenu()
        menu.setStyleSheet(f"""
            QMenu {{
                background-color: {c['bg_panel']};
                color: {c['text_primary']};
                border: 1px solid {c['border']};
                padding: 4px;
            }}
            QMenu::item:selected {{
                background-color: {c['accent']};
                color: #FFFFFF;
            }}
        """)

        act_open = menu.addAction("Open NEXI Dashboard")
        act_open.triggered.connect(self.show_and_activate)

        act_focus = menu.addAction("Toggle Focus Session")
        act_focus.triggered.connect(self._toggle_focus_from_outside)

        act_tracking = menu.addAction("Toggle Tracking")
        act_tracking.triggered.connect(self._toggle_tracking)

        menu.addSeparator()

        act_quit = menu.addAction("Quit NEXI")
        act_quit.triggered.connect(self.quit_app)

        self.tray.setContextMenu(menu)
        self.tray.activated.connect(self._on_tray_activated)
        self.tray.show()

    def _navigate_to(self, index: int):
        self.stack.setCurrentIndex(index)
        c = self.theme_mgr.colors
        for i, b in enumerate(self.nav_btns):
            is_active = (i == index)
            b.setChecked(is_active)
            icon_key = self.nav_items_meta[i][2]
            icon_col = c['accent'] if is_active else c['text_secondary']
            b.setIcon(draw_sidebar_icon(icon_key, icon_col, 18))
        # Refresh current page data
        if index == 0:
            self.home_page.refresh_data()
        elif index == 1:
            self.timeline_page.refresh_data()
        elif index == 2:
            self.rules_page.refresh_data()
        elif index == 3:
            self.radar_page.refresh_data()

    def _wire_engine_callbacks(self):
        # Tracker Qt signals (thread-safe)
        self.tracker.tracker_ticked.connect(self._on_tracker_tick)
        self.tracker.activity_changed.connect(self._on_activity_change)

        # Focus engine callbacks
        self.focus_engine.on_second_tick = self.home_page.update_timer_display
        self.focus_engine.on_session_completed = self._on_session_completed

        # Intent mode callbacks
        self.focus_engine.on_intent_tick = self.home_page.update_intent_timer_display
        self.focus_engine.on_intent_state_changed = self.home_page.on_intent_state_changed
        self.focus_engine.on_intent_completed = self._on_intent_completed

        # Intervention callback
        self.intervention_mgr.on_intervention = self._on_intervention_triggered

        # Reminder and Timer callbacks
        self.reminder_scheduler.on_reminder_triggered = self._on_reminder_triggered
        self.reminder_scheduler.on_custom_timer_triggered = self._on_custom_timer_triggered

    def _on_tracker_tick(self, app_name: str, domain: str, classification: int, is_idle: bool):
        self.intervention_mgr.evaluate_activity(app_name, domain, classification, is_idle)
        self.reminder_scheduler.tick(self.tracker._accumulated_sec)

    def _on_activity_change(self, app_name: str, domain: str, classification: int, is_idle: bool):
        self.home_page.update_live_status(app_name, domain, classification, is_idle)
        mood = self.home_page.mascot.get_mood()
        self.floating_mascot.set_mood(mood)
        # When user switches apps, flush has written previous interval to DB; refresh dashboard
        if self.stack.currentIndex() == 0:
            self.home_page.refresh_data()

    def _on_heartbeat(self):
        self.focus_engine.tick_second()
        # Periodic refresh of dashboard stats and usage bars every 10 seconds while on Home page
        if not hasattr(self, "_heartbeat_count"):
            self._heartbeat_count = 0
        self._heartbeat_count += 1
        if self._heartbeat_count % 10 == 0 and self.stack.currentIndex() == 0:
            self.home_page.refresh_data()

    def _on_session_completed(self, summary: dict):
        self.home_page.refresh_data()
        self.tray.showMessage(
            "Focus Session Complete!",
            f"Great job! You focused for {summary['planned_min']} minutes with {summary['distraction_count']} distractions.",
            QSystemTrayIcon.MessageIcon.Information,
            4000
        )
        self.home_page.mascot.set_mood(self.home_page.mascot.CELEBRATING)
        self.floating_mascot.set_mood(self.floating_mascot.mascot.CELEBRATING)

    def _on_intent_completed(self, summary: dict):
        self.home_page.refresh_data()
        self.tray.showMessage(
            "Intent Session Completed!",
            f"You successfully completed your task: \"{summary.get('note', 'Intent Task')}\" ({summary.get('budget_min', 0)}m).",
            QSystemTrayIcon.MessageIcon.Information,
            5000
        )
        self.home_page.mascot.set_mood(self.home_page.mascot.CELEBRATING)
        self.floating_mascot.set_mood(self.floating_mascot.mascot.CELEBRATING)

    def _on_intervention_triggered(self, event: dict):
        # Pause video behind overlay if configured
        if event.get("pause_video", False) and hasattr(self.tracker, "browser_tracker"):
            self.tracker.browser_tracker.pause_video_in_browser()

        # Show prompt if not already showing one
        if self._active_dialog is None:
            fullscreen_pref = self.repo.get_setting("fullscreen_lockdown_enabled", "true").lower() == "true"
            snooze_min = int(self.repo.get_setting("snooze_duration_min", "5"))
            countdown_sec = event.get("countdown_sec", 15)

            self._active_dialog = InterventionDialog(
                source=event["source"],
                level=event["level"],
                reason=event["reason"],
                is_fullscreen=fullscreen_pref,
                countdown_sec=countdown_sec,
                snooze_min=snooze_min,
                parent=self
            )
            self._active_dialog.action_selected.connect(self.intervention_mgr.handle_user_action)
            self._active_dialog.finished.connect(self._clear_active_dialog)
            self._active_dialog.show()

    def _clear_active_dialog(self):
        self._active_dialog = None

    def _on_reminder_triggered(self, reminder: dict):
        # Check if reminders are enabled
        reminders_enabled = self.repo.get_setting("reminders_enabled", "true").lower() == "true"
        if not reminders_enabled:
            return
        self.tray.showMessage(
            reminder.get("title", "NEXI Reminder"),
            reminder.get("message", ""),
            QSystemTrayIcon.MessageIcon.Information,
            5000
        )

    def _on_custom_timer_triggered(self, timer_data: dict):
        title = f"Timer: {timer_data.get('name', 'NEXI Alarm')}"
        msg = f"Scheduled alarm triggered ({timer_data.get('target_time') or (str(timer_data.get('interval_min')) + 'm interval')})."
        self.tray.showMessage(
            title,
            msg,
            QSystemTrayIcon.MessageIcon.Warning,
            7000
        )

    def _open_intent_dialog(self):
        dialog = IntentDialog(self.repo, self.focus_engine, self)
        dialog.exec()

    def _toggle_floating_mascot(self):
        if self.floating_mascot.isVisible():
            self.floating_mascot.hide()
            self.repo.set_setting("floating_mascot_enabled", "false")
        else:
            self.floating_mascot.show()
            self.repo.set_setting("floating_mascot_enabled", "true")

    def _toggle_focus_from_outside(self):
        self.home_page._toggle_focus()

    def _toggle_tracking(self):
        if self.tracker.is_enabled():
            self.tracker.pause()
            self.tray.showMessage("Tracking Paused", "NEXI tracking is temporarily paused.", QSystemTrayIcon.MessageIcon.Information, 2000)
        else:
            self.tracker.resume()
            self.tray.showMessage("Tracking Resumed", "NEXI tracking is active.", QSystemTrayIcon.MessageIcon.Information, 2000)

    def _on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            self.show_and_activate()

    def show_and_activate(self):
        self.show()
        self.setWindowState(self.windowState() & ~Qt.WindowState.WindowMinimized | Qt.WindowState.WindowActive)
        self.raise_()
        self.activateWindow()

    def closeEvent(self, event):
        minimize_pref = self.repo.get_setting("minimize_to_tray", "true").lower() == "true"
        if minimize_pref:
            event.ignore()
            self.hide()
            self.tray.showMessage(
                "NEXI",
                "NEXI minimized to system tray. Click the tray icon anytime to reopen.",
                QSystemTrayIcon.MessageIcon.Information,
                2000
            )
        else:
            self.quit_app()

    def quit_app(self):
        self.tracker.stop()
        self.floating_mascot.close()
        self.tray.hide()
        QApplication.quit()
