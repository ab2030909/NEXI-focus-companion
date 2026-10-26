"""
Browser website tracking via Windows UI Automation & optional local loopback HTTP listener.
Extracts ONLY hostnames (e.g. 'youtube.com', 'github.com').
Never records full URLs, paths, queries, passwords, or incognito browsing contents.
"""

import sys
import re
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import urlparse
from typing import Optional, Dict, List

# Supported browser process names
CHROMIUM_PROCESSES = {
    "chrome.exe", "msedge.exe", "brave.exe", "vivaldi.exe", "opera.exe"
}

_latest_extension_domain: Optional[str] = None
_last_extension_ping_time: float = 0.0
_pending_browser_commands: List[str] = []
_latest_extension_lock = threading.Lock()


def extract_clean_domain(raw_url_or_text: str) -> Optional[str]:
    """Extracts base hostname like 'youtube.com' or 'github.com' from URL/address bar string."""
    if not raw_url_or_text:
        return None
    text = raw_url_or_text.strip()
    if not text.startswith("http://") and not text.startswith("https://"):
        text = "https://" + text
    try:
        parsed = urlparse(text)
        netloc = parsed.netloc.lower()
        if not netloc or "." not in netloc or " " in netloc:
            return None
        # Remove port and www prefix
        netloc = netloc.split(":")[0]
        if netloc.startswith("www."):
            netloc = netloc[4:]
        # Basic domain validation
        if len(netloc) > 3 and not netloc.endswith(".exe"):
            return netloc
    except Exception:
        pass
    return None


class ExtensionServerHandler(BaseHTTPRequestHandler):
    """
    Local-only HTTP listener bound strictly to 127.0.0.1 for the optional Chromium extension.
    Accepts JSON: {"domain": "youtube.com", "is_incognito": false}
    """
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        # Allow extension to poll for commands (like pause video)
        if self.path == "/api/commands":
            global _pending_browser_commands
            with _latest_extension_lock:
                cmds = list(_pending_browser_commands)
                _pending_browser_commands.clear()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"commands": cmds}).encode("utf-8"))
            return
        elif self.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"status":"connected","version":"1.0.0"}')
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        global _latest_extension_domain, _last_extension_ping_time
        if self.path != "/api/tab":
            self.send_response(404)
            self.end_headers()
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            # Never persist private/incognito browsing
            if data.get("is_incognito", False):
                with _latest_extension_lock:
                    _latest_extension_domain = None
            else:
                raw_domain = data.get("domain", "")
                clean_domain = extract_clean_domain(raw_domain)
                with _latest_extension_lock:
                    _latest_extension_domain = clean_domain
                    _last_extension_ping_time = time.time()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        except Exception:
            self.send_response(400)
            self.end_headers()

    def log_message(self, format, *args):
        # Silence console log spam
        pass


class BrowserExtensionServer:
    def __init__(self, port: int = 19876):
        self.port = port
        self.server: Optional[HTTPServer] = None
        self.thread: Optional[threading.Thread] = None

    def start(self):
        try:
            self.server = HTTPServer(("127.0.0.1", self.port), ExtensionServerHandler)
            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()
        except Exception:
            self.server = None

    def stop(self):
        if self.server:
            try:
                self.server.shutdown()
                self.server.server_close()
            except Exception:
                pass


class BrowserTracker:
    def __init__(self, port: int = 19876):
        self.ext_server = BrowserExtensionServer(port)
        self.ext_server.start()
        self._uia_available = False
        self._init_uia()

    def _init_uia(self):
        if sys.platform == "win32":
            try:
                import comtypes
                import comtypes.client
                self._uia_available = True
            except Exception:
                self._uia_available = False

    def is_extension_connected(self) -> bool:
        """Returns True if the extension sent a ping/tab report within the last 15 seconds."""
        global _last_extension_ping_time
        with _latest_extension_lock:
            return (time.time() - _last_extension_ping_time) < 15.0

    def queue_command(self, cmd: str):
        """Enqueues a command for the browser extension (e.g. 'pause_video')."""
        global _pending_browser_commands
        with _latest_extension_lock:
            _pending_browser_commands.append(cmd)

    def pause_video_in_browser(self):
        self.queue_command("pause_video")

    def detect_active_domain(self, hwnd: int, process_name: str, window_title: str) -> Optional[str]:
        """
        Attempts to identify active website domain for the foreground window.
        1. Checks extension loopback (fastest and most accurate when installed).
        2. Inspects window title heuristic (e.g. 'YouTube', 'GitHub').
        3. Uses Windows UI Automation to locate address bar edit control if Chromium browser.
        """
        proc = process_name.lower().strip()
        if proc not in CHROMIUM_PROCESSES and proc != "firefox.exe":
            return None

        # Check if browser extension recently reported domain
        global _latest_extension_domain
        with _latest_extension_lock:
            if _latest_extension_domain:
                return _latest_extension_domain

        # Window title heuristic extraction (e.g., "GitHub: Let's build from here - Google Chrome")
        title_domain = self._domain_from_title(window_title)
        if title_domain:
            return title_domain

        # If UI Automation is available and hwnd is valid
        if self._uia_available and hwnd and proc in CHROMIUM_PROCESSES:
            uia_domain = self._domain_from_uia(hwnd)
            if uia_domain:
                return uia_domain

        return None

    def _domain_from_title(self, title: str) -> Optional[str]:
        """Matches well-known sites from window titles if address bar isn't queried yet."""
        if not title:
            return None
        title_lower = title.lower()

        patterns = {
            "youtube.com": ["youtube", "- youtube"],
            "github.com": ["github", "- github"],
            "reddit.com": ["reddit", "r/"],
            "twitter.com": ["twitter", "x.com", "on x"],
            "x.com": ["x.com"],
            "linkedin.com": ["linkedin"],
            "netflix.com": ["netflix"],
            "stackoverflow.com": ["stack overflow"],
            "twitch.tv": ["twitch"],
            "notion.so": ["notion"],
            "figma.com": ["figma"],
            "chatgpt.com": ["chatgpt"]
        }

        for domain, keywords in patterns.items():
            for kw in keywords:
                if kw in title_lower:
                    return domain
        return None

    def _domain_from_uia(self, hwnd: int) -> Optional[str]:
        """Reads Chromium address bar text via UI Automation."""
        try:
            import comtypes.client
            CUIAutomation = comtypes.client.CreateObject("{ff48dba4-60ef-4201-aa87-54103eef594e}")
            element = CUIAutomation.ElementFromHandle(hwnd)
            if not element:
                return None

            # Look for Edit control (address bar)
            # UIA_EditControlTypeId = 50004
            condition = CUIAutomation.CreatePropertyCondition(30003, 50004)
            edit_element = element.FindFirst(4, condition) # TreeScope_Descendants = 4
            if edit_element:
                val = edit_element.CurrentValue
                if val:
                    return extract_clean_domain(val)
        except Exception:
            pass
        return None
