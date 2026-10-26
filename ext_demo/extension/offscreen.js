const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 6;
let context = null;
let stream = null;
let processor = null;
let requestQueue = Promise.resolve();
let generation = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== "offscreen") return;
  if (message.type === "start") {
    start(message).then(() => sendResponse({ ok: true })).catch(error => {
      stop();
      reportStatus("error", "Không mở được âm thanh: " + error.message);
      sendResponse({ ok: false, error: error.message });
    });
    return true;
  }
  if (message.type === "stop") {
    stop();
    reportStatus("stopped", "Đã dừng thu âm.");
  }
});

async function start({ streamId, url, system = "b", tabId }) {
  stop();
  const thisGeneration = generation;
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } }
  });
  context = new AudioContext({ sampleRate: SAMPLE_RATE });
  if (context.sampleRate !== SAMPLE_RATE) {
    throw new Error(`Trình duyệt đang dùng ${context.sampleRate} Hz; cần ${SAMPLE_RATE} Hz.`);
  }
  await context.audioWorklet.addModule(chrome.runtime.getURL("audio-processor.js"));
  const source = context.createMediaStreamSource(stream);
  processor = new AudioWorkletNode(context, "audio-chunker", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
    channelCountMode: "explicit",
    processorOptions: { chunkSize: SAMPLE_RATE * CHUNK_SECONDS }
  });
  processor.port.onmessage = event => {
    if (thisGeneration !== generation) return;
    flush(url, system, tabId, thisGeneration, event.data);
  };
  processor.onprocessorerror = () => {
    reportStatus("error", "AudioWorklet gặp lỗi. Hãy dừng rồi bắt đầu lại.");
  };
  source.connect(processor);
  // Pass the captured audio through so tab playback remains audible.
  processor.connect(context.destination);
  if (context.state !== "running") await context.resume();
  reportStatus("running", "Đang nghe; chờ âm thanh để tạo phụ đề…", tabId);
}

function flush(url, system, tabId, thisGeneration, samples) {
  reportStatus("processing", "Đã thu âm một đoạn; đang chờ máy chủ xử lý…", tabId);
  requestQueue = requestQueue.then(async () => {
    if (thisGeneration !== generation) return;
    try {
      const response = await fetch(url + "/translate?system=" + encodeURIComponent(system), {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: samples
      });
      if (!response.ok) throw new Error(`Máy chủ trả về HTTP ${response.status}`);
      const result = await response.json();
      if (thisGeneration === generation) {
        if (result.vi || result.b || result.c) {
          chrome.runtime.sendMessage({ type: "result", tabId, ...result });
          reportStatus("running", "Đã cập nhật phụ đề.", tabId);
        } else {
          reportStatus("running", "Chưa nhận được lời nói trong đoạn vừa rồi.", tabId);
        }
      }
    } catch (error) {
      if (thisGeneration === generation) {
        reportStatus("warning", "Lỗi xử lý: " + error.message, tabId);
      }
    }
  });
}

function stop() {
  generation += 1;
  if (processor) {
    processor.port.onmessage = null;
    processor.disconnect();
    processor = null;
  }
  if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
  if (context) { context.close().catch(() => {}); context = null; }
}

function reportStatus(status, message, tabId) {
  chrome.runtime.sendMessage({ type: "capture-status", status, message, tabId }).catch(() => {});
}
