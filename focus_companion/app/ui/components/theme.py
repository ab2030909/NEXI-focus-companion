"""
Centralized Theme Manager & Visual Identity for NEXI.
Provides:
- Token definitions (backgrounds, panels, cards, text, borders, accents, warning, success)
- Preset themes: NEXI Dark, Midnight Orange, OLED Black, Warm Light, Custom
- Appearance tokens: density (compact vs comfortable), corner radius, reduced animations, mascot visibility
- Live theme switching via ThemeManager singleton with Qt signals
- Dynamic QSS stylesheet generation for the entire application
- Hex validation and helper calculations
"""

from typing import Dict, Any, Optional
from PySide6.QtCore import QObject, Signal
from PySide6.QtGui import QColor

# Preset theme definitions
THEME_PRESETS: Dict[str, Dict[str, str]] = {
    "NEXI Dark": {
        "bg_main": "#0F0F11",
        "bg_panel": "#16161A",
        "bg_card": "#1E1E24",
        "text_primary": "#F7F7F8",
        "text_secondary": "#8E8E9B",
        "accent": "#FF6B35",
        "border": "#2B2B33",
        "warning": "#FFB340",
        "success": "#10B981",
        "mode": "dark"
    },
    "Midnight Orange": {
        "bg_main": "#0B0E14",
        "bg_panel": "#111622",
        "bg_card": "#192030",
        "text_primary": "#F1F5F9",
        "text_secondary": "#7E8B9B",
        "accent": "#FF7538",
        "border": "#263245",
        "warning": "#F59E0B",
        "success": "#10B981",
        "mode": "dark"
    },
    "OLED Black": {
        "bg_main": "#000000",
        "bg_panel": "#0A0A0A",
        "bg_card": "#141414",
        "text_primary": "#FFFFFF",
        "text_secondary": "#7A7A7A",
        "accent": "#FF5500",
        "border": "#222222",
        "warning": "#FFA500",
        "success": "#00E676",
        "mode": "dark"
    },
    "Light": {
        "bg_main": "#F8F9FA",
        "bg_panel": "#FFFFFF",
        "bg_card": "#FFFFFF",
        "text_primary": "#18181B",
        "text_secondary": "#71717A",
        "accent": "#EA580C",
        "border": "#E4E4E7",
        "warning": "#D97706",
        "success": "#16A34A",
        "mode": "light"
    },
    "Warm Light": {
        "bg_main": "#FAF8F5",
        "bg_panel": "#FFFFFF",
        "bg_card": "#FFFFFF",
        "text_primary": "#1C1917",
        "text_secondary": "#78716C",
        "accent": "#EA580C",
        "border": "#E7E5E4",
        "warning": "#D97706",
        "success": "#16A34A",
        "mode": "light"
    }
}


def is_valid_hex(hex_str: str) -> bool:
    """Check if string is a valid 6-char or 3-char hex color."""
    if not isinstance(hex_str, str):
        return False
    hex_str = hex_str.strip()
    if not hex_str.startswith("#"):
        return False
    hex_val = hex_str[1:]
    if len(hex_val) not in (3, 6, 8):
        return False
    try:
        int(hex_val, 16)
        return True
    except ValueError:
        return False


def adjust_color(hex_str: str, factor: float) -> str:
    """Lightens (factor > 1) or darkens (factor < 1) a hex color."""
    if not is_valid_hex(hex_str):
        return "#333333"
    c = QColor(hex_str)
    r = min(255, max(0, int(c.red() * factor)))
    g = min(255, max(0, int(c.green() * factor)))
    b = min(255, max(0, int(c.blue() * factor)))
    return f"#{r:02X}{g:02X}{b:02X}"


class ThemeManager(QObject):
    """
    Singleton ThemeManager coordinating live color themes, density, corner styles,
    and reduced-animation states across the NEXI application.
    """
    theme_changed = Signal(dict)
    _instance: Optional['ThemeManager'] = None

    @classmethod
    def get_instance(cls, repository=None) -> 'ThemeManager':
        if cls._instance is None:
            cls._instance = cls(repository)
        elif repository and cls._instance.repo is None:
            cls._instance.repo = repository
            cls._instance.load_persisted_theme()
        return cls._instance

    def __init__(self, repository=None):
        super().__init__()
        self.repo = repository
        self.current_theme_name: str = "NEXI Dark"
        self.colors: Dict[str, str] = dict(THEME_PRESETS["NEXI Dark"])
        self.density: str = "comfortable"  # "comfortable" | "compact"
        self.corner_radius: int = 10
        self.reduced_animations: bool = False
        self.mascot_visible: bool = True

        if self.repo:
            self.load_persisted_theme()

    def load_persisted_theme(self):
        if not self.repo:
            return

        preset = self.repo.get_setting("theme_preset", "NEXI Dark")
        if preset in THEME_PRESETS:
            self.current_theme_name = preset
            self.colors = dict(THEME_PRESETS[preset])
        elif preset == "Custom":
            self.current_theme_name = "Custom"
            for key in ["bg_main", "bg_panel", "bg_card", "text_primary",
                        "text_secondary", "accent", "border", "warning", "success"]:
                val = self.repo.get_setting(f"theme_color_{key}", "")
                if is_valid_hex(val):
                    self.colors[key] = val

        self.density = self.repo.get_setting("theme_density", "comfortable")
        try:
            self.corner_radius = int(self.repo.get_setting("theme_corner_radius", "10"))
        except ValueError:
            self.corner_radius = 10

        self.reduced_animations = self.repo.get_setting("reduced_animations", "false").lower() == "true"
        self.mascot_visible = self.repo.get_setting("mascot_visible", "true").lower() == "true"
        self._sync_backward_compatibility()

    def set_preset(self, preset_name: str, save: bool = True):
        if preset_name in THEME_PRESETS:
            self.current_theme_name = preset_name
            self.colors = dict(THEME_PRESETS[preset_name])
            if save and self.repo:
                self.repo.set_setting("theme_preset", preset_name)
            self._sync_backward_compatibility()
            self.theme_changed.emit(self.get_theme_dict())

    def set_custom_color(self, token: str, hex_val: str, save: bool = True):
        if not is_valid_hex(hex_val):
            return
        self.current_theme_name = "Custom"
        self.colors[token] = hex_val
        if save and self.repo:
            self.repo.set_setting("theme_preset", "Custom")
            self.repo.set_setting(f"theme_color_{token}", hex_val)
        self._sync_backward_compatibility()
        self.theme_changed.emit(self.get_theme_dict())

    def set_density(self, density: str, save: bool = True):
        self.density = density
        if save and self.repo:
            self.repo.set_setting("theme_density", density)
        self.theme_changed.emit(self.get_theme_dict())

    def set_corner_radius(self, radius: int, save: bool = True):
        self.corner_radius = radius
        if save and self.repo:
            self.repo.set_setting("theme_corner_radius", str(radius))
        self.theme_changed.emit(self.get_theme_dict())

    def set_reduced_animations(self, enabled: bool, save: bool = True):
        self.reduced_animations = enabled
        if save and self.repo:
            self.repo.set_setting("reduced_animations", "true" if enabled else "false")
        self.theme_changed.emit(self.get_theme_dict())

    def set_mascot_visible(self, visible: bool, save: bool = True):
        self.mascot_visible = visible
        if save and self.repo:
            self.repo.set_setting("mascot_visible", "true" if visible else "false")
        self.theme_changed.emit(self.get_theme_dict())

    def reset_to_defaults(self):
        """Resets theme to official NEXI Dark default."""
        self.set_preset("NEXI Dark", save=True)
        self.set_density("comfortable", save=True)
        self.set_corner_radius(10, save=True)
        self.set_reduced_animations(False, save=True)
        self.set_mascot_visible(True, save=True)

    def get_theme_dict(self) -> Dict[str, Any]:
        return {
            "name": self.current_theme_name,
            "colors": dict(self.colors),
            "density": self.density,
            "corner_radius": self.corner_radius,
            "reduced_animations": self.reduced_animations,
            "mascot_visible": self.mascot_visible
        }

    def _sync_backward_compatibility(self):
        global BG_MAIN, BG_PANEL, BG_SECONDARY, BG_CARD, TEXT_PRIMARY, TEXT_SECONDARY
        global BORDER, ACCENT_ORANGE, ACCENT_ORANGE_HOVER, ACCENT_ORANGE_PRESSED
        global SUCCESS_GREEN, WARNING_YELLOW, GLOBAL_STYLESHEET

        BG_MAIN = self.colors["bg_main"]
        BG_PANEL = self.colors["bg_panel"]
        BG_CARD = self.colors["bg_card"]
        BG_SECONDARY = adjust_color(self.colors["bg_panel"], 1.15 if self.colors.get("mode") == "dark" else 0.95)
        TEXT_PRIMARY = self.colors["text_primary"]
        TEXT_SECONDARY = self.colors["text_secondary"]
        BORDER = self.colors["border"]
        ACCENT_ORANGE = self.colors["accent"]
        ACCENT_ORANGE_HOVER = adjust_color(self.colors["accent"], 1.15)
        ACCENT_ORANGE_PRESSED = adjust_color(self.colors["accent"], 0.85)
        SUCCESS_GREEN = self.colors["success"]
        WARNING_YELLOW = self.colors["warning"]
        GLOBAL_STYLESHEET = self.generate_stylesheet()

    def generate_stylesheet(self) -> str:
        """Generates dynamic QSS matching all active theme tokens with premium styling."""
        c = self.colors
        cr = self.corner_radius
        pad_y = 6 if self.density == "compact" else 9
        pad_x = 12 if self.density == "compact" else 16
        font_size = 12 if self.density == "compact" else 13

        accent_hover = adjust_color(c["accent"], 1.12)
        accent_pressed = adjust_color(c["accent"], 0.88)
        btn_bg = adjust_color(c["bg_card"], 1.12 if c.get("mode") == "dark" else 0.96)
        btn_hover = adjust_color(btn_bg, 1.20 if c.get("mode") == "dark" else 0.92)
        btn_pressed = adjust_color(btn_bg, 0.85)
        danger_bg = "#381717" if c.get("mode") == "dark" else "#FEE2E2"
        danger_border = "#632020" if c.get("mode") == "dark" else "#FCA5A5"
        danger_text = "#FF7070" if c.get("mode") == "dark" else "#DC2626"
        danger_hover = "#4E1F1F" if c.get("mode") == "dark" else "#FECACA"

        return f"""
QWidget {{
    background-color: {c["bg_main"]};
    color: {c["text_primary"]};
    font-family: 'Segoe UI Variable Display', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: {font_size}px;
}}

QMainWindow {{
    background-color: {c["bg_main"]};
}}

QDialog {{
    background-color: {c["bg_card"]};
    border: 1px solid {c["border"]};
    border-radius: {cr}px;
}}

QScrollArea {{
    background-color: transparent;
    border: none;
}}

QScrollBar:vertical {{
    border: none;
    background: transparent;
    width: 6px;
    margin: 4px 0;
}}
QScrollBar::handle:vertical {{
    background: {c["border"]};
    min-height: 24px;
    border-radius: 3px;
}}
QScrollBar::handle:vertical:hover {{
    background: {c["accent"]};
}}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
    height: 0px;
}}
QScrollBar:horizontal {{
    border: none;
    background: transparent;
    height: 6px;
    margin: 0 4px;
}}
QScrollBar::handle:horizontal {{
    background: {c["border"]};
    min-width: 24px;
    border-radius: 3px;
}}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
    width: 0px;
}}

QLineEdit, QComboBox, QSpinBox, QTextEdit {{
    background-color: {c["bg_panel"]};
    border: 1px solid {c["border"]};
    border-radius: {max(5, cr - 3)}px;
    padding: {pad_y}px {pad_x}px;
    color: {c["text_primary"]};
    selection-background-color: {c["accent"]};
}}
QLineEdit:focus, QComboBox:focus, QSpinBox:focus, QTextEdit:focus {{
    border: 1.5px solid {c["accent"]};
}}

QComboBox::drop-down {{
    border: none;
    padding-right: 8px;
}}

QPushButton {{
    background-color: {btn_bg};
    border: 1px solid {c["border"]};
    border-radius: {max(5, cr - 3)}px;
    padding: {pad_y}px {pad_x}px;
    color: {c["text_primary"]};
    font-weight: 600;
}}
QPushButton:hover {{
    background-color: {btn_hover};
    border: 1px solid {adjust_color(c["border"], 1.35)};
}}
QPushButton:pressed {{
    background-color: {btn_pressed};
}}
QPushButton:disabled {{
    opacity: 0.45;
    background-color: {c["bg_panel"]};
    color: {c["text_secondary"]};
}}

QPushButton#primaryBtn {{
    background-color: {c["accent"]};
    border: 1px solid {adjust_color(c["accent"], 1.15)};
    color: #FFFFFF;
    font-weight: 700;
}}
QPushButton#primaryBtn:hover {{
    background-color: {accent_hover};
}}
QPushButton#primaryBtn:pressed {{
    background-color: {accent_pressed};
}}

QPushButton#dangerBtn {{
    background-color: {danger_bg};
    border: 1px solid {danger_border};
    color: {danger_text};
    font-weight: 600;
}}
QPushButton#dangerBtn:hover {{
    background-color: {danger_hover};
    color: #FFFFFF;
}}

QTableWidget {{
    background-color: {c["bg_panel"]};
    border: 1px solid {c["border"]};
    border-radius: {cr}px;
    gridline-color: {adjust_color(c["border"], 0.85)};
    color: {c["text_primary"]};
    selection-background-color: {adjust_color(c["accent"], 0.35)};
    selection-color: {c["text_primary"]};
}}
QHeaderView::section {{
    background-color: {c["bg_card"]};
    color: {c["text_secondary"]};
    padding: {pad_y + 2}px {pad_x}px;
    border: none;
    border-bottom: 1px solid {c["border"]};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}}

QMenu {{
    background-color: {c["bg_panel"]};
    color: {c["text_primary"]};
    border: 1px solid {c["border"]};
    border-radius: {cr}px;
    padding: 6px;
}}
QMenu::item {{
    padding: 7px 22px 7px 12px;
    border-radius: 5px;
}}
QMenu::item:selected {{
    background-color: {c["accent"]};
    color: #FFFFFF;
}}

QCheckBox {{
    color: {c["text_primary"]};
    spacing: 8px;
}}
QCheckBox::indicator {{
    width: 17px;
    height: 17px;
    border: 1.5px solid {c["border"]};
    border-radius: 4px;
    background-color: {c["bg_panel"]};
}}
QCheckBox::indicator:hover {{
    border: 1.5px solid {c["accent"]};
}}
QCheckBox::indicator:checked {{
    background-color: {c["accent"]};
    border: 1.5px solid {c["accent"]};
}}

QProgressBar {{
    background-color: {c["bg_panel"]};
    border: 1px solid {c["border"]};
    border-radius: 4px;
    text-align: center;
    color: {c["text_primary"]};
    font-size: 10px;
    font-weight: 700;
}}
QProgressBar::chunk {{
    background-color: {c["accent"]};
    border-radius: 3px;
}}
"""

# Global aliases kept for backwards compatibility
BG_MAIN = THEME_PRESETS["NEXI Dark"]["bg_main"]
BG_PANEL = THEME_PRESETS["NEXI Dark"]["bg_panel"]
BG_SECONDARY = adjust_color(THEME_PRESETS["NEXI Dark"]["bg_panel"], 1.15)
BG_CARD = THEME_PRESETS["NEXI Dark"]["bg_card"]
TEXT_PRIMARY = THEME_PRESETS["NEXI Dark"]["text_primary"]
TEXT_SECONDARY = THEME_PRESETS["NEXI Dark"]["text_secondary"]
BORDER = THEME_PRESETS["NEXI Dark"]["border"]
ACCENT_ORANGE = THEME_PRESETS["NEXI Dark"]["accent"]
ACCENT_ORANGE_HOVER = adjust_color(THEME_PRESETS["NEXI Dark"]["accent"], 1.15)
ACCENT_ORANGE_PRESSED = adjust_color(THEME_PRESETS["NEXI Dark"]["accent"], 0.85)
SUCCESS_GREEN = THEME_PRESETS["NEXI Dark"]["success"]
DANGER_RED = "#F44336"
WARNING_YELLOW = THEME_PRESETS["NEXI Dark"]["warning"]
GLOBAL_STYLESHEET = ThemeManager.get_instance().generate_stylesheet()
