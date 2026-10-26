# Vietnamese Speech Recognition with English Translation

Course **DPL302m** – **Group 5**

This repository contains the code, results and report for a project that converts spoken Vietnamese into English text. Three systems are compared on the full Vietnamese portion of FLEURS.

## Systems

| System | Description |
|---|---|
| **A** (baseline) | PhoWhisper-small for ASR, pretrained OPUS-MT vi–en for translation |
| **B** (proposed) | Same ASR; OPUS-MT fine-tuned on PhoWhisper hypotheses paired with VinAI Translate v2 pseudo-translations (V2 adds no-repeat decoding) |
| **C** (baseline) | SeamlessM4T-v2-large, zero-shot speech-to-text translation directly from audio |

## Main results

FLEURS vi→en, recordings ≤ 30 s (4,199 recordings, 1,974 unique sentences). 95% confidence intervals from a bootstrap over unique sentences.

| System | SacreBLEU | chrF++ |
|---|---|---|
| A | 16.33 [15.74, 16.96] | 42.63 |
| B (V1) | 17.24 [16.64, 17.88] | 44.34 |
| B (V2, no-repeat) | 17.38 | – |
| C | 27.75 [27.04, 28.48] | 52.69 |

PhoWhisper-small ASR (beam 3): WER 11.36%, CER 7.62%. On a Tesla T4: ASR RTF 0.046 (2,200 s); Seamless 2,220 s; each OPUS-MT translation pass about 60 s (timings are adjusted estimates, because the first chunk of each stage includes model loading time). Details, ablations and error analysis are in [`report_task2/`](report_task2/).

Notes: no published baseline number was measured on this exact FLEURS setup, so the "paper vs. experiment" table in the report is for reference only. Whether FLEURS is part of Seamless's training data has not been verified.

## Repository layout

```
├── notebooks/   Colab notebooks, numbered in run order
├── results/     Outputs (CSV, JSON, tables, figures); no models or audio
├── data/        Dataset notes and FLEURS metadata
├── report_task2/ LaTeX report (main.tex) and figures
└── ext_demo/     Chrome extension demo for live Vietnamese → English captions
```

## Live captions demo

The `ext_demo/` folder contains a Chrome extension and a Colab server for live captions from the current browser tab. Choose system B (PhoWhisper ASR + OPUS-MT) or system C (SeamlessM4T direct translation) in the popup; the server unloads the previous path before loading the selected one. Start the Colab GPU server, load `ext_demo/extension` as an unpacked Chrome extension, then paste the server's HTTPS tunnel URL into its popup. See [`ext_demo/demo_README.md`](ext_demo/demo_README.md) for setup, usage, troubleshooting and privacy details. This is a demo; end-to-end latency and reliability have not been measured.

## Reproducing

The notebooks are written for **Google Colab (Tesla T4 GPU)** and save outputs to Google Drive. Set `ROOT` in the parameter cell at the top of each notebook (default `/content/drive/MyDrive/project_DPL`). The Drive layout mirrors `results/` and `data/` in this repository.

| # | Notebook | Purpose | Runtime |
|---|---|---|---|
| 01 | `01_translate_vinai_labels` | Generate English pseudo-labels with VinAI Translate v2 | GPU |
| 02 | `02_measure_resources` | Measure resources, derive sample size | GPU |
| 03 | `03_asr_phowhisper` | ASR on 55,000 VietSpeech samples (audio zips built on CPU first) | CPU, then GPU |
| 04 | `04_mt_finetune` | Fine-tune OPUS-MT (four runs) | GPU |
| 05 | `05_fleurs_eval_ABC` | Evaluate A, B, C on FLEURS and compute scores | CPU, then GPU |
| 06 | `06_fleurs_v2_norepeat` | V2: re-translate with no-repeat decoding | GPU |
| 07 | `07_stats_for_report` | Dataset statistics, model sizes, figures | CPU |

Each notebook can be re-run after a session interruption; finished stages are skipped.

## Data and models

Audio and model weights are **not** stored in this repository. See [`data/README.md`](data/README.md) for dataset information and attribution. VietSpeech metadata and ASR hypotheses derived from it are excluded; see the data notes for details. Models are fetched from Hugging Face at run time: `vinai/PhoWhisper-small`, `Helsinki-NLP/opus-mt-vi-en`, `facebook/seamless-m4t-v2-large`, `vinai/vinai-translate-vi2en-v2`.

## Environment

PyTorch, Hugging Face Transformers, SacreBLEU and audio libraries; see [`requirements.txt`](requirements.txt). Package versions are not pinned, and PyTorch installation may need to be selected for the runtime's CUDA version.

## Limitations

Each fine-tuning configuration uses a single seed; V2 was chosen after inspecting FLEURS outputs (including the test split). The full list is in the report's Limitations section in [`report_task2/main.tex`](report_task2/main.tex).
