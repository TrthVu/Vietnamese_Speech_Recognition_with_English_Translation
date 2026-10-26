const $ = id => document.getElementById(id);

function setStatus(text, kind = "idle") {
  $("msgText").textContent = text;
  $("msg").dataset.kind = kind;
}

function setRunning(running) {
  $("start").disabled = running;
  $("stop").disabled = !running;
  $("system").disabled = running;
}

setRunning(false);
chrome.storage.local.get(["url", "system", "running"], data => {
  if (data.url) $("url").value = data.url;
  if (data.system) $("system").value = data.system;
  if (data.running) {
    setRunning(true);
    setStatus("Đang nghe âm thanh trên tab này.", "running");
  }
});

chrome.runtime.onMessage.addListener(message => {
  if (message.type !== "capture-status") return;
  const running = !["stopped", "error"].includes(message.status);
  setRunning(running);
  const kind = message.status === "warning" ? "warning" : running ? "running" : message.status === "error" ? "error" : "idle";
  setStatus(message.message, kind);
});

$("start").onclick = async () => {
  const url = $("url").value.trim().replace(/\/+$/, "");
  if (!/^https:\/\/[a-z0-9.-]+\.trycloudflare\.com(?::\d+)?$/i.test(url)) {
    setStatus("Nhập URL HTTPS trycloudflare.com hợp lệ.", "error");
    return;
  }
  setStatus("Đang kết nối và bật thu âm…");
  $("start").disabled = true;
  try {
    const healthResponse = await fetch(url + "/health", { signal: AbortSignal.timeout(10000) });
    if (!healthResponse.ok) throw new Error(`Máy chủ kiểm tra sức khỏe trả về HTTP ${healthResponse.status}.`);
    const health = await healthResponse.json();
    if (!health.ok) throw new Error("Máy chủ Colab chưa sẵn sàng.");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("Không tìm thấy tab hiện tại.");
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
    const system = $("system").value;
    const response = await chrome.runtime.sendMessage({ type: "start", streamId, url, system, tabId: tab.id });
    if (!response?.ok) throw new Error(response?.error || "Không thể khởi động thu âm.");
    await chrome.storage.local.set({ url, system, running: true });
    setRunning(true);
    setStatus("Đang nghe âm thanh trên tab này.", "running");
  } catch (error) {
    setRunning(false);
    const detail = error.name === "TimeoutError"
      ? "Máy chủ Colab không phản hồi trong 10 giây. Kiểm tra ô Colab và URL tunnel."
      : error.message.includes("404")
        ? "Máy chủ đang chạy phiên bản cũ. Hãy chạy lại server_cell.py mới nhất trong repo."
        : error instanceof TypeError
          ? "Không kết nối được máy chủ. Kiểm tra ô Colab, URL tunnel và thử chạy server_cell.py mới nhất."
        : "Không thể bắt đầu: " + error.message;
    setStatus(detail, "error");
  }
};

$("stop").onclick = async () => {
  await chrome.runtime.sendMessage({ type: "stop" });
  await chrome.storage.local.set({ running: false });
  setRunning(false);
  setStatus("Đã dừng thu âm.");
};
