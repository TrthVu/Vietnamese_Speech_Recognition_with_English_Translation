let captionPanel;
let captionBody;
let captionStatus;
let transcriptSegments = [];
let collapsed = false;

function getCaptionPanel() {
  if (captionPanel?.isConnected) return captionPanel;

  captionPanel = document.createElement("section");
  captionPanel.setAttribute("aria-label", "Phụ đề dịch trực tiếp");
  captionPanel.style.cssText = [
    "position:fixed", "left:50%", "bottom:24px", "transform:translateX(-50%)",
    "z-index:2147483647", "display:flex", "flex-direction:column",
    "width:min(680px,calc(100vw - 28px))", "height:auto",
    "min-width:300px", "min-height:120px", "max-width:calc(100vw - 20px)",
    "max-height:min(70vh,600px)", "resize:both", "overflow:auto", "box-sizing:border-box",
    "border:1px solid rgba(255,255,255,.2)", "border-radius:13px",
    "background:rgba(15,23,42,.96)", "color:#fff",
    "box-shadow:0 12px 40px rgba(0,0,0,.34)",
    "font-family:system-ui,-apple-system,Segoe UI,sans-serif",
    "backdrop-filter:blur(12px)", "pointer-events:auto"
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText = "display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:8px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.12);color:#c7d2fe;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;cursor:grab;touch-action:none;user-select:none";
  const title = document.createElement("span");
  title.textContent = "Phụ đề trực tiếp · Việt → Anh";
  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;gap:7px;align-items:center";
  const buttonStyle = "padding:5px 9px;border:1px solid rgba(255,255,255,.2);border-radius:7px;background:rgba(255,255,255,.08);color:#fff;font:inherit;letter-spacing:normal;text-transform:none;cursor:pointer";
  const download = document.createElement("button");
  download.type = "button";
  download.textContent = "Tải .txt";
  download.disabled = true;
  download.setAttribute("aria-label", "Tải toàn bộ phụ đề thành tệp văn bản");
  download.style.cssText = buttonStyle + ";opacity:.5;cursor:default";
  download.addEventListener("click", downloadTranscript);
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "Thu gọn";
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Thu gọn bảng phụ đề");
  toggle.style.cssText = buttonStyle;
  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    captionBody.hidden = collapsed;
    toggle.textContent = collapsed ? "Mở rộng" : "Thu gọn";
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Mở rộng bảng phụ đề" : "Thu gọn bảng phụ đề");
    captionPanel.style.maxHeight = collapsed ? "none" : "min(70vh,600px)";
  });
  let drag = null;
  header.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const rect = captionPanel.getBoundingClientRect();
    captionPanel.style.left = `${rect.left}px`;
    captionPanel.style.top = `${rect.top}px`;
    captionPanel.style.bottom = "auto";
    captionPanel.style.transform = "none";
    drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    header.style.cursor = "grabbing";
    header.setPointerCapture(event.pointerId);
  });
  header.addEventListener("pointermove", event => {
    if (!drag) return;
    const maxLeft = Math.max(0, window.innerWidth - captionPanel.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - captionPanel.offsetHeight);
    const left = Math.min(maxLeft, Math.max(0, drag.left + event.clientX - drag.x));
    const top = Math.min(maxTop, Math.max(0, drag.top + event.clientY - drag.y));
    captionPanel.style.left = `${left}px`;
    captionPanel.style.top = `${top}px`;
  });
  const stopDragging = () => {
    drag = null;
    header.style.cursor = "grab";
  };
  header.addEventListener("pointerup", stopDragging);
  header.addEventListener("pointercancel", stopDragging);
  controls.append(download, toggle);
  header.append(title, controls);

  captionStatus = document.createElement("div");
  captionStatus.style.cssText = "padding:7px 18px 0;color:#a5b4fc;font-size:12px;line-height:1.4";
  captionBody = document.createElement("div");
  captionBody.setAttribute("aria-live", "polite");
  captionBody.setAttribute("aria-relevant", "additions text");
  captionBody.style.cssText = "display:flex;flex:1 1 auto;flex-direction:column;gap:7px;min-height:0;overflow:auto;padding:8px 12px 24px;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.4";
  captionPanel.append(header, captionStatus, captionBody);
  document.documentElement.appendChild(captionPanel);
  return captionPanel;
}

function makeCaption(message) {
  const item = document.createElement("article");
  item.style.cssText = "padding:7px 10px 9px;border-radius:9px;background:rgba(255,255,255,.055)";
  if (message.vi) {
    const sourceLabel = document.createElement("div");
    sourceLabel.textContent = "VI:";
    sourceLabel.style.cssText = "margin-bottom:3px;color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:.04em";
    const source = document.createElement("div");
    source.textContent = message.vi;
    source.style.cssText = "margin-bottom:8px;color:#dbeafe";
    item.append(sourceLabel, source);
  }

  for (const [system, text] of [["B", message.b], ["C", message.c]]) {
    if (!text) continue;
    const translation = document.createElement("div");
    translation.textContent = "EN: " + text;
    translation.style.cssText = "color:#fff;font-weight:600";
    item.appendChild(translation);
  }
  return item;
}

function downloadTranscript() {
  if (!transcriptSegments.length) return;
  const text = [
    "PHỤ ĐỀ TRỰC TIẾP VIỆT – ANH",
    `Tải xuống: ${new Date().toLocaleString("vi-VN")}`,
    "",
    ...transcriptSegments
  ].join("\n");
  const blob = new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const now = new Date();
  const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("")
    + "_" + [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0")].join("");
  link.href = objectUrl;
  link.download = `phu-de-${stamp}.txt`;
  link.style.display = "none";
  document.documentElement.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

chrome.runtime.onMessage.addListener(message => {
  if (message.type === "caption-status") {
    getCaptionPanel();
    captionStatus.textContent = message.message;
    captionStatus.style.color = message.status === "warning" || message.status === "error" ? "#fda29b" : "#a5b4fc";
    return;
  }
  if (message.type !== "caption") return;
  if (!message.vi && !message.b && !message.c) return;

  const lines = [`[${new Date().toLocaleTimeString("vi-VN")}]`];
  if (message.vi) lines.push(`VI: ${message.vi}`);
  if (message.b) lines.push(`EN (B): ${message.b}`);
  if (message.c) lines.push(`EN (C): ${message.c}`);
  transcriptSegments.push(lines.join("\n"));
  getCaptionPanel();
  const downloadButton = captionPanel?.querySelector("button[aria-label='Tải toàn bộ phụ đề thành tệp văn bản']");
  if (downloadButton) {
    downloadButton.disabled = false;
    downloadButton.style.opacity = "1";
    downloadButton.style.cursor = "pointer";
  }

  captionBody.appendChild(makeCaption(message));
  captionBody.scrollTop = captionBody.scrollHeight;
  captionStatus.textContent = "Phụ đề đã cập nhật";
});
