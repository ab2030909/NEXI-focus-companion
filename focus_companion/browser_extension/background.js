// Focus Companion Manifest V3 Background Script
// Sends ONLY active tab hostname to local loopback (127.0.0.1:19876).
// Ignores incognito tabs by default to respect privacy.

const APP_ENDPOINT = "http://127.0.0.1:19876/api/tab";
const COMMANDS_ENDPOINT = "http://127.0.0.1:19876/api/commands";

function extractHostname(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.hostname.replace(/^www\./, "");
    }
  } catch (e) {
    // ignore non-urls
  }
  return null;
}

async function reportActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !tab.url) return;

    if (tab.incognito) {
      await fetch(APP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_incognito: true })
      });
      return;
    }

    const domain = extractHostname(tab.url);
    if (!domain) return;

    await fetch(APP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: domain,
        is_incognito: false
      })
    });
  } catch (err) {
    // App might not be open or endpoint not reachable
  }
}

// Poll commands from NEXI desktop app (e.g. pause video during focus lockdown)
async function checkCommands() {
  try {
    const resp = await fetch(COMMANDS_ENDPOINT);
    if (resp.ok) {
      const data = await resp.json();
      const cmds = data.commands || [];
      for (const cmd of cmds) {
        if (cmd === "pause_video") {
          await pauseActiveTabVideos();
        }
      }
    }
  } catch (e) {}
}

async function pauseActiveTabVideos() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !tab.id) return;
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const videos = document.querySelectorAll("video");
        videos.forEach(v => {
          if (!v.paused) v.pause();
        });
      }
    });
  } catch (e) {}
}

// Check commands periodically every 2 seconds
setInterval(checkCommands, 2000);

// Listen to tab activation and URL updates
chrome.tabs.onActivated.addListener(reportActiveTab);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    reportActiveTab();
  }
});
chrome.windows.onFocusChanged.addListener(reportActiveTab);

