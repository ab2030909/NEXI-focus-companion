"""
Windows native ctypes and winreg bindings:
- Foreground window inspection
- User idle duration detection
- Per-user Run registry key management for 'Start with Windows'
"""

import ctypes
from ctypes import wintypes
import os
import sys
import winreg
from typing import Tuple, Optional


class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.UINT),
        ("dwTime", wintypes.DWORD),
    ]


def get_idle_duration_sec() -> float:
    """Returns number of seconds since last user input (mouse/keyboard)."""
    if sys.platform != "win32":
        return 0.0
    try:
        lii = LASTINPUTINFO()
        lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
        if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
            millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
            return max(0.0, millis / 1000.0)
    except Exception:
        pass
    return 0.0


def get_foreground_window_info() -> Tuple[int, str, str, str]:
    """
    Returns (hwnd, app_name, process_name, window_title).
    Safely captures window handle, readable application name, process exe, and window title.
    """
    if sys.platform != "win32":
        return 0, "Unknown", "unknown.exe", "Unknown Window"

    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        if not hwnd:
            return 0, "", "", ""

        # Window title
        length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
        title_buffer = ctypes.create_unicode_buffer(length + 1)
        ctypes.windll.user32.GetWindowTextW(hwnd, title_buffer, length + 1)
        window_title = title_buffer.value.strip()

        # Process ID
        pid = wintypes.DWORD()
        ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

        # Process exe name
        process_name = ""
        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        h_process = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
        if h_process:
            try:
                buf_size = wintypes.DWORD(260)
                exe_buffer = ctypes.create_unicode_buffer(buf_size.value)
                if ctypes.windll.kernel32.QueryFullProcessImageNameW(h_process, 0, exe_buffer, ctypes.byref(buf_size)):
                    process_name = os.path.basename(exe_buffer.value)
            finally:
                ctypes.windll.kernel32.CloseHandle(h_process)

        if not process_name:
            process_name = "System"

        # Friendly App name from process name
        app_name = process_name
        if app_name.lower().endswith(".exe"):
            app_name = app_name[:-4]
        app_name = app_name.replace("_", " ").title()

        return hwnd, app_name, process_name, window_title
    except Exception:
        return 0, "Unknown", "unknown.exe", ""


# --- WINDOWS STARTUP (PER-USER REGISTRY) ---
REG_RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
APP_REG_NAME = "NEXIFocusCompanion"


def is_start_with_windows_enabled() -> bool:
    """Checks if NEXI is configured in HKCU Run registry."""
    if sys.platform != "win32":
        return False
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_RUN_KEY, 0, winreg.KEY_READ) as key:
            val, _ = winreg.QueryValueEx(key, APP_REG_NAME)
            return bool(val)
    except FileNotFoundError:
        return False
    except Exception:
        return False


def set_start_with_windows(enable: bool) -> Tuple[bool, str]:
    """
    Enables or disables per-user auto-start with Windows via HKCU Run key.
    Does not require Administrator rights.
    """
    if sys.platform != "win32":
        return False, "Not supported on non-Windows platforms"

    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
            if enable:
                # Target python executable with main.py or compiled executable
                if getattr(sys, 'frozen', False):
                    exe_cmd = f'"{sys.executable}"'
                else:
                    script_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
                    main_py = os.path.join(script_dir, "main.py")
                    exe_cmd = f'"{sys.executable}" "{main_py}"'
                winreg.SetValueEx(key, APP_REG_NAME, 0, winreg.REG_SZ, exe_cmd)
                return True, "Startup entry enabled successfully."
            else:
                try:
                    winreg.DeleteValue(key, APP_REG_NAME)
                except FileNotFoundError:
                    pass
                return True, "Startup entry removed."
    except Exception as e:
        return False, f"Failed to modify startup registry: {str(e)}"
