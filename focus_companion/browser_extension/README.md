# Focus Companion - Optional Chromium Extension

This extension provides 100% accurate active tab hostname detection for Chrome, Edge, and Brave.

### How to Install:
1. Open your browser's extension page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `focus_companion/browser_extension` folder.
5. That's it! When browsing, the active website domain is transmitted locally to `127.0.0.1:19876`.

### Privacy Guarantee:
- Only the domain name (e.g., `youtube.com`) is sent.
- URLs, search queries, cookies, passwords, and page content are **never** read or transmitted.
- Incognito/private windows are completely ignored.
