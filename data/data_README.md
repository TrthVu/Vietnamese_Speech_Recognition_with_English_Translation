# Data

Audio is **not** stored in this repository. This folder holds only metadata files and download instructions.

## Datasets

| Dataset | Use | Source |
|---|---|---|
| VietSpeech (MMLab-UIT) | Training data for the MT fine-tuning (ASR hypotheses + pseudo-translations) | https://huggingface.co/datasets/NhutP/VietSpeech |
| FLEURS, Vietnamese | Evaluation of systems A, B, C | https://huggingface.co/datasets/google/fleurs (`vi_vn`) |

### VietSpeech

- License: Apache-2.0 (per the dataset card).
- Full dataset: 1,026,047 samples, over 1,100 hours, 16 kHz, about 131 GB.
- This project uses only the first 100,000 samples, then a random sample of 55,000 (seed 42): 5,500 for dev and 49,500 for training (61.19 h). Nested training fractions of 25% / 50% / 100% give 12,375 / 24,750 / 49,500 samples.
- English side: pseudo-translations produced by `vinai/vinai-translate-vi2en-v2` (notebook 01), not human references.

### FLEURS (Vietnamese)

- 4,212 recordings, 1,978 unique sentences, 13.27 h (train + validation + test used as one evaluation set).
- Main view: recordings ≤ 30 s (4,199 recordings, 1,974 sentences). All systems process only the first 30 s of each recording.
- Expected Drive layout: `fleurs_vi_en/audio/{train,validation,test}/` plus the metadata file below.

## Files in this folder (public repository)

VietSpeech metadata and the VinAI pseudo-translations are **not** committed, because the terms for redistributing model outputs were not verified (see below). FLEURS-derived files may be committed under CC-BY-4.0 with attribution. To rebuild them:

| Missing file | How to regenerate |
|---|---|
| `metadata_with_en_vinai.csv` (VietSpeech metadata + English pseudo-translations) | Download VietSpeech, then run notebook 01 |
| `fleurs_vi_voice_vi_en.csv` (FLEURS metadata with Vietnamese transcript and English reference) | Build from the FLEURS dataset (`vi_vn`) as in notebook 05 |

## Licenses and attribution

- **VietSpeech:** Apache-2.0 (per the dataset card). Attribution: MMLab-UIT, https://huggingface.co/datasets/NhutP/VietSpeech.
- **FLEURS:** CC-BY-4.0 (per the dataset card, https://huggingface.co/datasets/google/fleurs; license text: https://creativecommons.org/licenses/by/4.0/). Attribution: Google; Conneau et al., "FLEURS: Few-shot Learning Evaluation of Universal Representations of Speech" (arXiv:2205.12446). Files derived from FLEURS in this repository (row-level outputs) were processed by us: filtered to Vietnamese, aligned with English references, and joined with system outputs.
- **Pseudo-translations:** generated with `vinai/vinai-translate-vi2en-v2`; the terms for redistributing model outputs were not checked.

## Expected Drive layout

```
MyDrive/project_DPL/
├── datasets/
│   ├── VietSpeech/        (audio, downloaded separately)
│   └── fleurs_vi_en/audio/{train,validation,test}/
└── results/               (written by the notebooks)
```

The notebooks pack audio into zip parts on first run (reading many small files from Drive directly is slow); these zips are not committed.

## Notes

- The `sampling_rate` column in both metadata files is blank; the notebooks do not rely on it.
- No content-level deduplication check was run on the VietSpeech subset.
