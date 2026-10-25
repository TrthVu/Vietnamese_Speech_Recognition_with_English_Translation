# Data

Audio is **not** stored in this repository. Dataset metadata and download instructions are provided here; some generated or restricted metadata files are excluded from Git.

## Datasets

| Dataset | Use | Source |
|---|---|---|
| VietSpeech (MMLab-UIT) | Training data for MT fine-tuning (ASR hypotheses + pseudo-translations) | https://huggingface.co/datasets/NhutP/VietSpeech |
| FLEURS, Vietnamese | Evaluation of systems A, B, C | https://huggingface.co/datasets/google/fleurs (`vi_vn`) |

## Repository files and redistribution

- `metadata_with_en_vinai.csv` contains VietSpeech metadata and model-generated English pseudo-translations. It is excluded from Git because redistribution terms for the model outputs have not been verified.
- `fleurs_vi_voice_vi_en.csv` contains FLEURS Vietnamese transcripts and English references. It may be included with the attribution and license information below.
- `results/asr_out/asr_hyp.csv` contains outputs derived from VietSpeech and is also excluded from Git.
- Audio and model weights are not committed.

See [`data_README.md`](data_README.md) for dataset sizes, preprocessing details, regeneration instructions, and attribution.

## Expected Drive layout

```
MyDrive/project_DPL/
├── datasets/
│   ├── VietSpeech/        (audio, downloaded separately)
│   └── fleurs_vi_en/audio/{train,validation,test}/
└── results/               (written by the notebooks)
```

The notebooks pack audio into zip parts on first run (reading many small files from Drive directly is slow); these zips are not committed.
