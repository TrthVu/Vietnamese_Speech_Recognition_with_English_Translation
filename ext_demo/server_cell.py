# ---- Ô Colab: máy chủ cho tiện ích (cần runtime GPU T4) ----
from huggingface_hub import login
login()   # dán token Hugging Face

!pip -q install fastapi uvicorn nest_asyncio librosa sacremoses
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
!chmod +x cloudflared

import gc, threading, subprocess, re, numpy as np, torch, nest_asyncio, uvicorn
from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from transformers import (pipeline, MarianMTModel, MarianTokenizer,
                          AutoProcessor, SeamlessM4Tv2ForSpeechToText)

if not torch.cuda.is_available():
    raise RuntimeError(
        "Không tìm thấy CUDA GPU. Trong Colab chọn Runtime > Change runtime type > "
        "Hardware accelerator: GPU, lưu lại rồi chạy lại ô này. "
        "Kiểm tra bằng: import torch; print(torch.cuda.is_available())"
    )
print("GPU:", torch.cuda.get_device_name(0))

SR = 16000
SILENCE_RMS = 0.005     # dưới ngưỡng này coi là im lặng, bỏ qua
gk = {"language": "vi", "task": "transcribe", "num_beams": 3}
loaded_system = None
asr = B_tok = B_mod = sproc = smodel = None

def unload_models():
    global loaded_system, asr, B_tok, B_mod, sproc, smodel
    asr = B_tok = B_mod = sproc = smodel = None
    loaded_system = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

def load_system(system):
    """Keep only the selected inference path in memory."""
    global loaded_system, asr, B_tok, B_mod, sproc, smodel
    if loaded_system == system:
        return
    unload_models()
    try:
        if system == "b":
            asr = pipeline("automatic-speech-recognition", model="vinai/PhoWhisper-small",
                           device=0, dtype=torch.float16)
            B_tok = MarianTokenizer.from_pretrained("trthDux/opus-mt-vi-en-asr-ft")
            B_mod = MarianMTModel.from_pretrained("trthDux/opus-mt-vi-en-asr-ft").to("cuda").eval()
        elif system == "c":
            sproc = AutoProcessor.from_pretrained("facebook/seamless-m4t-v2-large")
            smodel = SeamlessM4Tv2ForSpeechToText.from_pretrained(
                "facebook/seamless-m4t-v2-large", dtype=torch.float16).to("cuda").eval()
        else:
            raise ValueError("system phải là 'b' hoặc 'c'")
        loaded_system = system
    except Exception:
        unload_models()
        raise

def mt_b(text):
    x = B_tok(text, return_tensors="pt").to("cuda")
    with torch.no_grad():
        y = B_mod.generate(**x, num_beams=4, max_new_tokens=160)
    return B_tok.decode(y[0], skip_special_tokens=True)

def seamless(wav):
    f = sproc(audio=[wav], sampling_rate=SR, return_tensors="pt", padding=True).to("cuda")
    f["input_features"] = f["input_features"].half()
    with torch.no_grad():
        out = smodel.generate(**f, tgt_lang="eng", num_beams=4, max_new_tokens=160)
    if hasattr(out, "sequences"):
        out = out.sequences
    return sproc.batch_decode(out, skip_special_tokens=True)[0].strip()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"ok": True, "loaded_system": loaded_system}

@app.post("/translate")
async def translate(request: Request, system: str = Query(default="b", pattern="^(b|c)$")):
    raw = await request.body()
    wav = np.frombuffer(raw, dtype=np.float32).copy()
    if len(wav) < SR or float(np.sqrt(np.mean(wav ** 2))) < SILENCE_RMS:
        return {"vi": "", "b": "", "c": ""}

    load_system(system)
    if system == "b":
        vi = asr({"raw": wav, "sampling_rate": SR}, generate_kwargs=gk)["text"].strip()
        return {"vi": vi, "b": mt_b(vi) if vi else "", "c": ""}
    return {"vi": "", "b": "", "c": seamless(wav)}

nest_asyncio.apply()
threading.Thread(target=lambda: uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning"),
                 daemon=True).start()

p = subprocess.Popen(["./cloudflared", "tunnel", "--url", "http://localhost:8000"],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
for line in p.stdout:
    m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
    if m:
        print("DIA CHI MAY CHU (dán vào tiện ích):", m.group(0)); break
