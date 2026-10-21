#!/usr/bin/env bash
# One-time setup for forecast.py on macOS / Linux (Windows: see README.md).
#
# Follows the official Kronos README (https://github.com/shiyu-coder/Kronos):
#   clone the repo, then `pip install -r requirements.txt`.
# The only extras are the two free market-data libraries forecast.py needs:
#   yfinance (stocks / ETFs / indices) and ccxt (crypto, public data only).
set -euo pipefail
cd "$(dirname "$0")"

KRONOS_REPO="https://github.com/shiyu-coder/Kronos.git"
KRONOS_COMMIT="67b630e67f6a18c9e9be918d9b4337c960db1e9a"  # version forecast.py was tested against

echo "== Your machine =="
echo "OS:     $(uname -s) $(uname -m)"

# Kronos pins pandas==2.2.2, which ships wheels for Python 3.10-3.12 only.
PY=""
for c in python3.12 python3.11 python3.10 python3; do
  if command -v "$c" >/dev/null 2>&1 &&
     "$c" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info[:2] <= (3, 12) else 1)'; then
    PY="$c"; break
  fi
done
if [ -z "$PY" ]; then
  echo "Python 3.10, 3.11 or 3.12 is required (found: $(python3 --version 2>&1 || echo none))."
  exit 1
fi
echo "Python: $("$PY" --version) ($PY)"

GPU="none"
if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L >/dev/null 2>&1; then
  GPU="nvidia"; echo "GPU:    $(nvidia-smi -L | head -1)"
elif [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
  GPU="apple"; echo "GPU:    Apple Silicon (PyTorch 'mps' backend)"
else
  echo "GPU:    none found -> Kronos will run on the CPU"
fi

echo "== Kronos source =="
[ -d Kronos/.git ] || git clone "$KRONOS_REPO" Kronos
git -C Kronos checkout -q "$KRONOS_COMMIT"
echo "Kronos @ $(git -C Kronos rev-parse --short HEAD)"

echo "== Python environment (.venv) =="
[ -d .venv ] || "$PY" -m venv .venv
.venv/bin/python -m pip install -q --upgrade pip
if [ "$GPU" = "none" ] && [ "$(uname -s)" = "Linux" ]; then
  # No GPU on Linux: the CPU-only PyTorch build (official PyTorch index) is the
  # same library without ~3 GB of CUDA files. requirements.txt then sees torch as installed.
  .venv/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
fi
.venv/bin/pip install -r Kronos/requirements.txt
.venv/bin/pip install yfinance ccxt

.venv/bin/python - <<'EOF'
import torch
mps = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
print(f"torch {torch.__version__} | CUDA: {torch.cuda.is_available()} | Apple MPS: {mps}")
EOF
echo "Setup done. Try:  .venv/bin/python forecast.py NVDA"
