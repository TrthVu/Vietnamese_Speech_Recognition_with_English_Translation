async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Bắt âm thanh tab để tạo phụ đề dịch"
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "start" && !message.target) {
    (async () => {
      try {
        await ensureOffscreen();
        const result = await chrome.runtime.sendMessage({ ...message, target: "offscreen" });
        if (!result?.ok) throw new Error(result?.error || "Không mở được luồng âm thanh.");
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === "stop" && !message.target) {
    chrome.runtime.sendMessage({ type: "stop", target: "offscreen" }).catch(() => {});
    chrome.storage.local.set({ running: false });
    chrome.runtime.sendMessage({ type: "capture-status", status: "stopped", message: "Đã dừng thu âm." }).catch(() => {});
  } else if (message.type === "result") {
    // Keep the content-script event type; spreading `message` afterward would
    // overwrite it with "result" and the caption UI would ignore the payload.
    chrome.tabs.sendMessage(message.tabId, { ...message, type: "caption" }).catch(() => {});
  } else if (message.type === "capture-status") {
    chrome.storage.local.set({ running: !["stopped", "error"].includes(message.status) });
    if (message.tabId) {
      chrome.tabs.sendMessage(message.tabId, {
        type: "caption-status", status: message.status, message: message.message
      }).catch(() => {});
    }
  }
});
